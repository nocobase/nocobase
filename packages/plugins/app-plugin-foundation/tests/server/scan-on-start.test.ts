import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Application } from '@nocobase/app-server/application';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { createJobExecutorService, type JobEvent } from '@nocobase/jobs';
import { afterEach, expect, it, vi } from 'vitest';

import { FoundationProvider } from '../../server/providers/foundation.js';
import { DefaultFoundationService } from '../../server/services/foundation.js';
import { foundationServiceToken } from '../../server/tokens.js';

const cleanups: (() => Promise<void>)[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/** Starts the production provider on a fresh database and the host's memory Jobs, the way a test application does. */
async function startApplication(values: Record<string, unknown> = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'foundation-start-'));
  cleanups.push(() => rm(directory, { recursive: true, force: true }));
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({ name: 'fixture-app' }),
  );
  const paths = createAppPaths({
    rootDir: directory,
    serverDir: path.join(directory, 'server'),
  });
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({ app: { name: 'fixture' }, ...values });
  const app = new Application({ paths, config });
  const database = await createTestDatabase();
  cleanups.push(() => database.destroy());
  await database.migrate([
    {
      packageName: '@nocobase/app-plugin-foundation',
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ]);
  app.container.instance(databaseManagerToken, database.database);
  const jobs = createJobExecutorService(undefined, {
    appName: 'fixture',
    storagePath: paths.storage('jobs'),
  });
  cleanups.push(() => jobs.shutdown());
  app.container.instance(jobExecutorServiceToken, jobs);
  const executor = jobs.getJobExecutor('@nocobase/app-plugin-foundation');
  const submitted = vi.spyOn(executor, 'addJob');
  const events: JobEvent[] = [];
  executor.subscribe((event) => {
    events.push(event);
  });
  const scans = vi.spyOn(DefaultFoundationService.prototype, 'overview');
  app.addServiceProvider(FoundationProvider);
  await app.start();
  let running = true;
  cleanups.push(async () => {
    if (running) await app.shutdown();
  });
  return {
    service: app.container.resolve(foundationServiceToken),
    submitted,
    scans,
    events,
    finished: async (): Promise<void> => {
      await vi.waitFor(
        () => {
          if (
            !events.some(({ name }) => name === 'JobEnd' || name === 'JobError')
          )
            throw new Error('The scan has not finished.');
        },
        { timeout: 30_000 },
      );
      expect(events.map(({ name }) => name)).toEqual(['JobStart', 'JobEnd']);
    },
    shutdown: async (): Promise<number> => {
      const started = performance.now();
      running = false;
      await app.shutdown();
      return performance.now() - started;
    },
  };
}

it('scans a fresh application at start by default', async () => {
  const app = await startApplication();
  expect(app.submitted).toHaveBeenCalledTimes(1);
  await app.finished();
  expect(app.scans).toHaveBeenCalledTimes(1);
  expect(await app.service.scanStatus()).toMatchObject({
    status: 'succeeded',
    needsScan: false,
  });
});

it('submits no scan at start when scanOnStart is false, and closes without waiting', async () => {
  const app = await startApplication({ foundation: { scanOnStart: false } });
  expect(app.submitted).not.toHaveBeenCalled();
  expect(await app.service.scanStatus()).toMatchObject({
    status: 'idle',
    needsScan: true,
  });
  // Nothing is running, so closing only stops the executor; the bound leaves room for a slow CI machine.
  expect(await app.shutdown()).toBeLessThan(1_000);
  expect(app.events).toEqual([]);
  expect(app.scans).not.toHaveBeenCalled();
});

it('still runs an explicit scan request when scanOnStart is false', async () => {
  const app = await startApplication({ foundation: { scanOnStart: false } });
  expect(await app.service.ensureScan()).toMatchObject({ status: 'queued' });
  expect(app.submitted).toHaveBeenCalledTimes(1);
  await app.finished();
  expect(app.scans).toHaveBeenCalledTimes(1);
  expect((await app.service.snapshot()).status).toBe('succeeded');
});
