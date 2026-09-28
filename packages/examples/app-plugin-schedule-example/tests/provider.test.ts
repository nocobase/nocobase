import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  createJobExecutorService,
  type ManagedJobExecutorService,
} from '@nocobase/jobs';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import plugin from '../server/index.js';
import { ScheduleExampleProvider } from '../server/providers/schedule-example.js';
import {
  HEARTBEAT_INTERVAL,
  SCHEDULE_EXAMPLE_SCOPE,
  scheduleExampleServiceToken,
} from '../server/service.js';

let directory: string;
const services: ManagedJobExecutorService[] = [];

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'schedule-example-'));
});

afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((each) => each.shutdown()));
  await rm(directory, { recursive: true, force: true });
});

/** One application start: a schedule service over the same storage each time. */
function application() {
  const schedule = createJobExecutorService(undefined, {
    appName: 'main',
    storagePath: directory,
  });
  services.push(schedule);
  const container = new ServiceContainer();
  container.instance(jobExecutorServiceToken, schedule);
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: {} as never,
    paths: createAppPaths({ rootDir: directory }),
    router: new Hono(),
    container,
  };
  const provider = new ScheduleExampleProvider(app);
  provider.register();
  return { provider, container, schedule };
}

describe('@nocobase/app-plugin-schedule-example', () => {
  it('contributes its provider and routes', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-schedule-example',
      serviceProviders: [ScheduleExampleProvider],
      routes: [expect.objectContaining({ scope: 'api' })],
    });
  });

  it('runs the heartbeat on its own scope and reports each run', async () => {
    const { provider, container } = application();

    await provider.start();
    const service = container.resolve(scheduleExampleServiceToken);
    await vi.waitFor(async () =>
      expect((await service.status()).runs).toEqual([
        expect.objectContaining({ outcome: 'succeeded' }),
      ]),
    );
    const status = await service.status();
    await provider.shutdown();

    expect(status).toMatchObject({
      scope: SCHEDULE_EXAMPLE_SCOPE,
      job: 'heartbeat',
      every: HEARTBEAT_INTERVAL,
    });
    const [run] = status.runs;
    expect(run!.jobId).toEqual(expect.any(String));
    expect(Date.parse(run!.runAt)).toBeGreaterThanOrEqual(
      Date.parse(run!.scheduledAt),
    );
    expect(Date.parse(status.nextRunAt!)).toBe(
      Date.parse(run!.scheduledAt) + HEARTBEAT_INTERVAL,
    );
    expect(run!.message).toBe('Heartbeat from the Schedule example plugin');
  });

  it('keeps its rule across restarts instead of firing it again', async () => {
    const first = application();
    await first.provider.start();
    await vi.waitFor(async () =>
      expect(
        (await first.container.resolve(scheduleExampleServiceToken).status())
          .runs,
      ).toHaveLength(1),
    );
    await first.provider.shutdown();
    expect(await readdir(directory)).toHaveLength(1);

    const second = application();
    await second.provider.start();
    await new Promise((resolve) => setTimeout(resolve, 200));
    const status = await second.container
      .resolve(scheduleExampleServiceToken)
      .status();
    await second.provider.shutdown();

    // The next heartbeat is a minute away, and the unchanged rule was kept.
    expect(status.runs).toEqual([]);
    expect(status.nextRunAt).toEqual(expect.any(String));
  });

  it('removes rules its code no longer defines', async () => {
    const earlier = application();
    const executor = earlier.schedule.getScheduleExecutor(
      SCHEDULE_EXAMPLE_SCOPE,
    );
    await executor.setup({ consume: false });
    await executor.addJob({
      name: 'retired',
      options: { every: 3_600_000 },
      payload: {},
      execute: async () => undefined,
    });
    await earlier.schedule.shutdown();

    const { provider, schedule } = application();
    await provider.start();
    const rules = await schedule
      .getScheduleExecutor(SCHEDULE_EXAMPLE_SCOPE)
      .listJob(0, -1);
    await provider.shutdown();

    expect(rules.map((rule) => rule.jobName)).toEqual(['heartbeat']);
  });

  it('shuts its executor down and shuts down safely when never started', async () => {
    const { provider, schedule } = application();
    await provider.shutdown();

    await provider.start();
    await provider.shutdown();
    await provider.shutdown();

    await expect(
      schedule.getScheduleExecutor(SCHEDULE_EXAMPLE_SCOPE).countJob(),
    ).rejects.toThrow(/shut down/u);
  });
});
