import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { createTestApp } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { expect, it } from 'vitest';
import { demoConfigurationToken, demoDataToken } from '../../server/tokens.js';
import { createStandaloneServer } from '../helpers/minimal-app.js';
import { createDemoDataset } from '../../skills/nocobase-app-plugin-demo-mode/assets/minimal-demo/server/demo/dataset.js';
import { createDemoBusiness } from '../../skills/nocobase-app-plugin-demo-mode/assets/minimal-demo/server/demo/business.js';

// This is an opt-in complete fixture application, including real accounts, sessions, migrations and business data.
it.skipIf(!process.env.DEMO_RESOURCE_OUTPUT)(
  'bounds repeated application resets with large tracking batches',
  async () => {
    expect(process.version).toBe('v24.22.1');
    expect(global.gc).toBeTypeOf('function');
    const app = await createTestApp({
      createServer: createStandaloneServer,
      config: { demoMode: { enabled: true } },
    });
    const rows = 20_000;
    const startup = process.memoryUsage();
    const rounds: Record<string, number>[] = [];
    let activeReset = false;
    let peakHeap = 0;
    let applicationPeakHeap = 0;
    let peakRss = 0;
    let warmHeap: number | null = null;
    let workloadCompleted = false;
    let appCloseState: 'not-started' | 'completed' | 'failed' = 'not-started';
    let appCloseError: string | undefined;
    let maxRssThroughWorkloadKiB: number | null = null;
    let maxRssThroughAppCloseKiB: number | null = null;
    const writeResult = async () => {
      await writeFile(
        process.env.DEMO_RESOURCE_OUTPUT!,
        JSON.stringify(
          {
            schemaVersion: 2,
            node: process.version,
            appPid: process.pid,
            measurementScope: 'reset-to-idle; verification outside',
            maxRssScope:
              'through_workload and through_app_close; not worker exit',
            rows,
            rounds,
            warmHeap,
            afterAppStartup: startup,
            sampledHeapAfterStartupThroughWorkload: applicationPeakHeap,
            maxRssThroughWorkloadKiB,
            maxRssThroughAppCloseKiB,
            workloadCompleted,
            appCloseState,
            appCloseError,
          },
          null,
          2,
        ),
      );
    };
    const sample = () => {
      const memory = process.memoryUsage();
      applicationPeakHeap = Math.max(applicationPeakHeap, memory.heapUsed);
      if (activeReset) {
        peakHeap = Math.max(peakHeap, memory.heapUsed);
        peakRss = Math.max(peakRss, memory.rss);
      }
    };
    const timer = setInterval(sample, 5);
    const closeApp = async () => {
      try {
        await app.close();
        appCloseState = 'completed';
      } catch (error) {
        appCloseState = 'failed';
        appCloseError = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        maxRssThroughAppCloseKiB = process.resourceUsage().maxRSS;
        await writeResult();
      }
    };
    try {
      const container = app.application.container;
      const data = container.resolve(demoDataToken);
      const configuration = container.resolve(demoConfigurationToken);
      configuration.registerMock({
        id: 'resource.fixed',
        title: 'Fixed resource fixture',
        kind: 'model',
        scope: 'resource',
        invoke: async () => 'fixed-result',
      });
      const base = createDemoDataset(
        createDemoBusiness(container.resolve(databaseManagerToken)),
      );
      const generate: NonNullable<typeof base.generate> = async (context) => {
        await base.generate!(context);
        expect(await configuration.invokeMock('resource.fixed', {})).toBe(
          'fixed-result',
        );
        const project = await app.connection.query
          .selectFrom('demoprojects')
          .select(['id', 'ownerId'])
          .executeTakeFirstOrThrow<{ id: string; ownerId: string }>();
        const ids: string[] = [];
        for (let offset = 0; offset < rows; offset += 100) {
          const batch = Array.from({ length: 100 }, (_, index) => {
            const id = `resource-${offset + index}`;
            ids.push(id);
            return {
              id,
              projectId: project.id,
              title: `Historical task ${offset + index}`,
              assigneeId: project.ownerId,
              state: 'completed',
              createdAt: context.clock.daysAgo(((offset + index) % 90) + 1),
            };
          });
          await app.connection.query
            .insertInto('demotasks')
            .values(batch)
            .execute();
        }
        await context.track('demotasks', ids);
        await context.progress(1);
        sample();
      };
      data.register({ ...base, generate });
      await data.importNow('resource-admin');
      const login = await app.request('/auth/sign-in/email', {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'alex@example.com',
          password: 'DemoAlex123!',
        }),
      });
      expect(login.status).toBe(200);
      const cookie = login.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
      const session = async () =>
        await (
          await app.request('/auth/get-session', { headers: { cookie } })
        ).json();
      const initialSession = await session();
      const verify = async () => {
        const status = await data.status();
        expect(status).toMatchObject({
          state: 'ready',
          failure: null,
          counts: { demoprojects: 1, demotasks: rows + 2, accounts: 2 },
        });
        const total = await app.connection.query
          .selectFrom('demotasks')
          .select(({ fn }) => [fn.countAll().as('count')])
          .executeTakeFirstOrThrow<{ count: number }>();
        expect(Number(total.count)).toBe(rows + 2);
        const history = await app.connection.query
          .selectFrom('demotasks')
          .select(({ fn }) => [
            fn.min('createdAt').as('oldest'),
            fn.max('createdAt').as('newest'),
          ])
          .where('id', 'like', 'resource-%')
          .executeTakeFirstOrThrow<{ oldest: Date; newest: Date }>();
        expect(
          new Date(history.newest).getTime() -
            new Date(history.oldest).getTime(),
        ).toBe(89 * 86_400_000);
        expect((await session()).session.id).toBe(initialSession.session.id);
        expect((await session()).user.id).toBe(initialSession.user.id);
      };
      await data.reset(undefined, 'en-US', { wait: true });
      await verify();
      global.gc!();
      warmHeap = process.memoryUsage().heapUsed;
      for (let round = 0; round < 5; round++) {
        // Alternate production generate and steps interfaces at identical data volume.
        data.register(
          round % 2
            ? {
                ...base,
                generate: undefined,
                steps: () => [{ key: 'people-and-projects', run: generate }],
              }
            : { ...base, generate },
        );
        peakHeap = 0;
        peakRss = 0;
        activeReset = true;
        sample();
        const start = performance.now();
        await data.reset(undefined, 'en-US', { wait: true });
        await data.whenIdle();
        sample();
        const elapsedMs = performance.now() - start;
        activeReset = false;
        await verify();
        // Forced GC only after the entire reset and verification have settled; never during the peak window.
        global.gc!();
        const retainedHeap = process.memoryUsage().heapUsed;
        rounds.push({
          round: round + 1,
          elapsedMs,
          peakHeap,
          peakRss,
          retainedHeap,
        });
        maxRssThroughWorkloadKiB = process.resourceUsage().maxRSS;
        await writeResult();
        expect.soft(elapsedMs).toBeLessThan(60_000);
        expect.soft(peakHeap).toBeLessThan(256 * 1024 ** 2);
        expect.soft(peakRss).toBeLessThan(640 * 1024 ** 2);
        expect.soft(retainedHeap - warmHeap).toBeLessThan(32 * 1024 ** 2);
      }
      await data.clear('resource-admin');
      expect((await data.status()).state).toBeNull();
      const empty = await app.connection.query
        .selectFrom('demotasks')
        .select(({ fn }) => [fn.countAll().as('count')])
        .executeTakeFirstOrThrow<{ count: number }>();
      expect(Number(empty.count)).toBe(0);
      maxRssThroughWorkloadKiB = process.resourceUsage().maxRSS;
      workloadCompleted = true;
      await writeResult();
      expect.soft(applicationPeakHeap).toBeLessThan(256 * 1024 ** 2);
      expect.soft(process.resourceUsage().maxRSS).toBeLessThan(640 * 1024);
    } finally {
      clearInterval(timer);
      await closeApp();
    }
  },
  600_000,
);
