// @vitest-environment node
// The installed workflow plugin uses native import() for run modules. Match pnpm dev's loader so .js specifiers resolve adjacent .ts sources.
import 'tsx/esm';

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDatabaseManager, databaseManagerToken } from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';
import { buildApplicationWorkflows } from '@nocobase/app-plugin-workflow/build';
import { workflowServiceToken } from '@nocobase/app-plugin-workflow/server';
import { afterAll, beforeAll, expect, it } from 'vitest';
import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.js';
import { loadMetrics } from '../../server/workflows/example-analytics-report/server/load-metrics.js';
import { calculateReport } from '../../server/workflows/example-analytics-report/server/calculate-report.js';
import { saveReport } from '../../server/workflows/example-analytics-report/server/save-report.js';
import { calculateQuotation } from '../../server/workflows/example-quotation-routing/server/calculate.js';
import { requireDate } from '../../server/workflows/example-analytics-report/server/metrics.js';

const root = path.resolve(import.meta.dirname, '../..');
const temporary = mkdtempSync(path.join(tmpdir(), 'workflow-examples-'));
const artifactRoot = path.join(temporary, 'artifacts');
let server: StandaloneServer;
let cookie = '';
const ids = new Map<string, string>();
interface RunRecord {
  id: string;
  status: number | null;
  nodeRuns: { id: string; nodeKey: string; status: number }[];
}

async function request(
  url: string,
  body?: object,
  eventKey?: string,
): Promise<Response> {
  const target = new URL(
    `http://localhost${server.application.publicBasePath}/api${url}`,
  );
  return server.fetch(
    new Request(target, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        cookie,
        'content-type': 'application/json',
        ...(body === undefined ? {} : { origin: target.origin }),
        ...(eventKey ? { 'event-key': eventKey } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
}
async function data<T>(response: Response): Promise<T> {
  const json = await response.json();
  if (response.status !== 200)
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(json)}`);
  return (json as { data: T }).data;
}
async function invoke(
  key: string,
  input: object,
  eventKey?: string,
): Promise<RunRecord> {
  const started = await data<{ id: string }>(
    await request(`/workflows/${ids.get(key)}/run`, { input }, eventKey),
  );
  let run: RunRecord | undefined;
  await expect
    .poll(
      async () => {
        run = await data<RunRecord>(
          await request(`/workflow-runs/${started.id}`),
        );
        return run.status;
      },
      { timeout: 10000 },
    )
    .not.toBeOneOf([null, 0]);
  return run!;
}

// Each workflow builds a TypeScript program; CI runs this alongside other template suites.
// Keep compilation separate so it cannot consume the server startup timeout.
beforeAll(async function buildExampleArtifacts() {
  await buildApplicationWorkflows({
    sourceRoot: path.join(root, 'server/workflows'),
    distRoot: artifactRoot,
  });
}, 120000);

beforeAll(async function startExampleServer() {
  const configPath = path.join(temporary, 'config.yml');
  writeFileSync(
    configPath,
    JSON.stringify({
      app: { publicOrigin: 'http://localhost' },
      workflow: { distRoot: artifactRoot },
      database: {
        default: 'main',
        connections: {
          main: {
            dialect: 'sqlite',
            database: path.join(temporary, 'main.sqlite'),
            migrations: { autoRun: true },
            seeds: { autoRun: true },
          },
          analytics: {
            dialect: 'sqlite',
            database: path.join(temporary, 'analytics.sqlite'),
            migrations: { autoRun: true },
            seeds: { autoRun: true },
          },
        },
      },
      drive: {
        default: 'local',
        disks: {
          local: {
            driver: 'fs',
            location: path.join(temporary, 'storage'),
            visibility: 'private',
          },
        },
      },
      // The app-server suite starts applications at the same time; the memory jobs adapter allows one
      // process per state directory.
      jobs: {
        default: 'memory',
        memory: {
          adapter: 'memory',
          persistence: { path: path.join(temporary, 'jobs') },
        },
      },
    }),
  );
  server = await createStandaloneServer({
    configPath,
    viteDevUrl: false,
    env: {
      AUTH_SECRET: 'workflow-examples-test-secret-at-least-32-characters',
      DB_DATABASE: path.join(temporary, 'main.sqlite'),
      DB_DIALECT: 'sqlite',
      DB_MIGRATIONS_AUTO_RUN: 'true',
      DB_SEEDS_AUTO_RUN: 'true',
    },
  });
  if ((await request('/workflows')).status !== 401)
    throw new Error('Anonymous workflow access must be rejected.');
  const signIn = await request('/auth/sign-in/username', {
    username: 'nocobase',
    password: 'admin123',
  });
  if (signIn.status !== 200) throw new Error('Test sign-in failed.');
  cookie = signIn.headers.get('set-cookie') ?? '';
  const workflows = await data<{ key: string; hash: string }[]>(
    await request('/workflows'),
  );
  for (const workflow of workflows.filter((item) =>
    item.key.startsWith('example-'),
  )) {
    const enabled = await data<{ id: string }>(
      await request(`/workflows/${workflow.hash}/enable`, {}),
    );
    ids.set(workflow.key, enabled.id);
  }
  if (ids.size !== 3) throw new Error('Expected three workflow examples.');
}, 60000);
afterAll(async () => {
  await server?.close();
  rmSync(temporary, { recursive: true, force: true });
});

it.each([
  [50000, 'standardRouting', 'manualFollowUp'],
  [100000, 'manualFollowUp', 'standardRouting'],
])(
  'routes a quotation of %s cents and rejoins at the summary',
  async (amountCents, expected, absent) => {
    const run = await invoke('example-quotation-routing', {
      quotationId: 'Q-100',
      amountCents,
    });
    expect(run.status).toBe(1);
    expect(run.nodeRuns.map((node) => node.nodeKey)).toEqual(
      expect.arrayContaining([
        'calculate',
        'needsFollowUp',
        expected,
        'summarize',
      ]),
    );
    expect(run.nodeRuns.map((node) => node.nodeKey)).not.toContain(absent);
  },
);
it('saves seeded analytics results once per date across repeated runs', async () => {
  const database = server.application.container.resolve(databaseManagerToken);
  for (let attempt = 0; attempt < 2; attempt++) {
    const run = await invoke('example-analytics-report', {
      date: '2026-09-08',
    });
    expect(run.status).toBe(1);
    expect(run.nodeRuns.map((node) => node.nodeKey)).toContain('saveReport');
  }
  const rows = await database
    .query()
    .selectFrom('exampleDailyReports')
    .selectAll()
    .execute();
  expect(rows).toEqual([
    expect.objectContaining({
      date: '2026-09-08',
      impressions: 96000,
      clicks: 3120,
      conversions: 168,
      spendCents: 93000,
      revenueCents: 672000,
      profitCents: 579000,
    }),
  ]);
});
it('ends successfully without creating a report when the date has no data', async () => {
  const run = await invoke('example-analytics-report', { date: '2000-01-01' });
  expect(run.status).toBe(1);
  expect(run.nodeRuns.map((node) => node.nodeKey)).toEqual(
    expect.arrayContaining(['loadMetrics', 'hasData', 'noData']),
  );
  expect(run.nodeRuns.map((node) => node.nodeKey)).not.toContain('saveReport');
  expect(
    await server.application.container
      .resolve(databaseManagerToken)
      .query()
      .selectFrom('exampleDailyReports')
      .where('date', '=', '2000-01-01')
      .exists(),
  ).toBe(false);
});
it('persists the deliberate failure and never runs its successor', async () => {
  const run = await invoke(
    'example-failure-diagnostics',
    { reference: 'DIAG-100', simulateFailure: true },
    'diagnostic-failure',
  );
  expect(run.status).toBe(-2);
  expect(run.nodeRuns.map((node) => node.nodeKey)).not.toContain('finish');
  const node = run.nodeRuns.find((item) => item.nodeKey === 'execute')!;
  const payload = await data<{ error: string; log: string }>(
    await request(`/workflow-runs/${run.id}/node-runs/${node.id}/payload`),
  );
  expect(payload.error).toContain('Intentional example failure');
  const duplicate = await invoke(
    'example-failure-diagnostics',
    { reference: 'DIAG-100', simulateFailure: true },
    'diagnostic-failure',
  );
  expect(duplicate.id).toBe(run.id);
  const fixed = await invoke('example-failure-diagnostics', {
    reference: 'DIAG-100',
    simulateFailure: false,
  });
  expect(fixed.status).toBe(1);
  expect(fixed.nodeRuns.map((item) => item.nodeKey)).toContain('finish');
});
it('validates invocation inputs and triggers enabled workflows through the public service', async () => {
  expect(
    (
      await request(`/workflows/${ids.get('example-quotation-routing')}/run`, {
        input: { quotationId: 'Q-100', amountCents: -1 },
      })
    ).status,
  ).toBe(400);
  const receipt = await server.application.container
    .resolve(workflowServiceToken)
    .trigger(
      'example-quotation-routing',
      { quotationId: 'Q-200', amountCents: 10 },
      { eventKey: 'quotation-Q-200' },
    );
  expect(receipt).toMatchObject({
    status: 'accepted',
    eventKey: 'quotation-Q-200',
  });
});
it('rejects invalid dates and monetary input in typed business functions', () => {
  expect(() => requireDate('2026-02-30')).toThrow('calendar date');
  expect(() => requireDate('09/08/2026')).toThrow('YYYY-MM-DD');
  expect(() =>
    calculateQuotation({ quotationId: 'Q', amountCents: 0.5 }),
  ).toThrow();
  expect(() => calculateReport({ date: '2026-09-08', count: 0 })).toThrow(
    'without metrics',
  );
});
it('creates report schema and metadata, supports concurrent idempotent writes, and rolls back', async () => {
  const database = createDatabaseManager({
    default: 'main',
    drivers: { sqlite },
    connections: {
      main: { dialect: 'sqlite', filename: ':memory:' },
      analytics: { dialect: 'sqlite', filename: ':memory:' },
    },
  });
  try {
    const migrator = database.createMigrator({
      directory: path.join(root, 'database/main/migrations'),
      packageName: 'workflow-report-test',
    });
    await migrator.latest();
    const physical = await database
      .connection()
      .collections.getPhysical('exampleDailyReports');
    expect(physical?.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          columnName: 'profit_cents',
          dataType: 'integer',
          nullable: false,
        }),
      ]),
    );
    expect(
      await database.connection().collections.get('exampleDailyReports'),
    ).toBeDefined();
    await database
      .createMigrator({
        connection: 'analytics',
        directory: path.join(root, 'database/analytics/migrations'),
        packageName: 'workflow-analytics-test',
      })
      .latest();
    await database
      .createSeeder({
        connection: 'analytics',
        directory: path.join(root, 'database/analytics/seeds'),
        packageName: 'workflow-analytics-test',
      })
      .run();
    const report = calculateReport(await loadMetrics(database, '2026-09-08'));
    await Promise.all([
      saveReport(database, report),
      saveReport(database, report),
    ]);
    expect(
      await database
        .query()
        .selectFrom('exampleDailyReports')
        .selectAll()
        .execute(),
    ).toHaveLength(1);
    await migrator.rollback();
    expect(
      await database
        .connection()
        .collections.getPhysical('exampleDailyReports'),
    ).toBeUndefined();
    expect(
      await database.connection().collections.get('exampleDailyReports'),
    ).toBeUndefined();
  } finally {
    await database.destroy();
  }
});
