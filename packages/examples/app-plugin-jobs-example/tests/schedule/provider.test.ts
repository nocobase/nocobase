import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  realtimeServiceToken,
  type RealtimeService,
} from '@nocobase/app-server/realtime';
import {
  createJobExecutorService,
  type ManagedJobExecutorService,
} from '@nocobase/jobs';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import plugin from '../../server/index.js';
import { JobExampleProvider } from '../../server/job/provider.js';
import { ScheduleExampleProvider } from '../../server/schedule/provider.js';
import {
  HEARTBEAT_INTERVAL,
  SCHEDULE_CHANGES_TOPIC,
  ScheduleExampleError,
  scheduleExampleServiceToken,
  type ScheduleRuleView,
} from '../../server/schedule/service.js';
import { JOBS_EXAMPLE_SCOPE } from '../../server/scope.js';

let directory: string;
const services: ManagedJobExecutorService[] = [];

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'jobs-example-schedule-'));
});

afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((each) => each.shutdown()));
  await rm(directory, { recursive: true, force: true });
});

/** One application start: a jobs service over the same storage each time. */
function application() {
  const schedule = createJobExecutorService(undefined, {
    appName: 'main',
    storagePath: directory,
  });
  services.push(schedule);
  const publish = vi.fn();
  const close = vi.fn();
  const defineTopic = vi.fn(() => ({
    name: SCHEDULE_CHANGES_TOPIC,
    audience: 'public' as const,
    publish,
    close,
  }));
  const container = new ServiceContainer();
  container.instance(jobExecutorServiceToken, schedule);
  container.instance(realtimeServiceToken, {
    defineTopic,
  } as unknown as RealtimeService);
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
  return {
    provider,
    schedule,
    service: container.resolve(scheduleExampleServiceToken),
    publish,
    close,
    defineTopic,
  };
}

async function rule(
  service: { status(): Promise<{ rules: readonly ScheduleRuleView[] }> },
  name: string,
): Promise<ScheduleRuleView> {
  const found = (await service.status()).rules.find(
    (each) => each.name === name,
  );
  if (!found) throw new Error(`No rule ${name}`);
  return found;
}

describe('@nocobase/app-plugin-jobs-example schedule', () => {
  it('contributes its providers and routes', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-jobs-example',
      serviceProviders: [ScheduleExampleProvider, JobExampleProvider],
      routes: [expect.objectContaining({ scope: 'api' })],
    });
  });

  it('runs the built-in heartbeat and leaves the other rules stopped', async () => {
    const { provider, service, publish, defineTopic } = application();
    await provider.start();
    expect(defineTopic).toHaveBeenCalledWith(SCHEDULE_CHANGES_TOPIC, {
      audience: 'public',
    });
    await vi.waitFor(async () =>
      expect((await rule(service, 'heartbeat')).runs).toEqual([
        expect.objectContaining({ outcome: 'succeeded' }),
      ]),
    );
    const status = await service.status();
    await provider.shutdown();

    expect(status.scope).toBe(JOBS_EXAMPLE_SCOPE);
    expect(
      status.rules.map(({ name, builtIn, state }) => ({
        name,
        builtIn,
        state,
      })),
    ).toEqual([
      { name: 'heartbeat', builtIn: true, state: 'active' },
      { name: 'interval', builtIn: false, state: 'stopped' },
      { name: 'limited', builtIn: false, state: 'stopped' },
      { name: 'cron', builtIn: false, state: 'stopped' },
    ]);
    const heartbeat = status.rules[0]!;
    expect(heartbeat.options).toEqual({ every: HEARTBEAT_INTERVAL });
    expect(heartbeat.firings).toBe(1);
    expect(Date.parse(heartbeat.nextRunAt!)).toBe(
      Date.parse(heartbeat.runs[0]!.scheduledAt) + HEARTBEAT_INTERVAL,
    );
    // A push names the rule and carries nothing else.
    expect(publish).toHaveBeenCalledWith({ name: 'heartbeat' });
  });

  it('starts, rewrites and stops a rule, announcing each change', async () => {
    const { provider, service, publish } = application();
    await provider.start();

    await service.startRule('interval');
    await vi.waitFor(async () =>
      expect((await rule(service, 'interval')).runs).toEqual([
        expect.objectContaining({ outcome: 'succeeded' }),
      ]),
    );
    expect(await rule(service, 'interval')).toMatchObject({
      state: 'active',
      options: { every: 5_000 },
    });

    publish.mockClear();
    await service.startRule('interval', 10_000);
    expect(publish).toHaveBeenCalledWith({ name: 'interval' });
    expect((await rule(service, 'interval')).options).toEqual({
      every: 10_000,
    });

    await service.stopRule('interval');
    const stopped = await rule(service, 'interval');
    await provider.shutdown();
    expect(stopped.state).toBe('stopped');
    expect(stopped.nextRunAt).toBeUndefined();
    // The history of this instance stays after the rule is gone.
    expect(stopped.firings).toBeGreaterThanOrEqual(1);
  });

  it('keeps a started rule running after a restart, with its handler ready', async () => {
    const first = application();
    await first.provider.start();
    await first.service.startRule('limited');
    await vi.waitFor(async () =>
      expect((await rule(first.service, 'limited')).firings).toBe(1),
    );
    await first.provider.shutdown();

    const second = application();
    await second.provider.start();
    expect((await rule(second.service, 'limited')).state).toBe('active');
    // The next firing reaches the new instance, which registered the handler
    // before setup() even though this start never wrote the rule.
    await vi.waitFor(
      async () =>
        expect((await rule(second.service, 'limited')).runs).toEqual([
          expect.objectContaining({ outcome: 'succeeded' }),
        ]),
      { timeout: 5_000, interval: 100 },
    );
    await second.provider.shutdown();
  });

  it('refuses the built-in rule, unknown rules and other intervals', async () => {
    const { provider, service } = application();
    await provider.start();
    const refused = async (action: Promise<void>) =>
      (await action.then(
        () => undefined,
        (error: unknown) => error,
      )) as ScheduleExampleError;

    expect((await refused(service.stopRule('heartbeat'))).code).toBe(
      'BUILT_IN_RULE',
    );
    expect((await refused(service.startRule('missing'))).code).toBe(
      'UNKNOWN_RULE',
    );
    expect((await refused(service.startRule('interval', 7_000))).code).toBe(
      'INVALID_INTERVAL',
    );
    expect((await refused(service.startRule('limited', 5_000))).code).toBe(
      'INVALID_INTERVAL',
    );
    expect((await rule(service, 'interval')).state).toBe('stopped');
    await provider.shutdown();
  });

  it('removes rules its code no longer defines', async () => {
    const earlier = application();
    const executor = earlier.schedule.getScheduleExecutor(JOBS_EXAMPLE_SCOPE);
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
      .getScheduleExecutor(JOBS_EXAMPLE_SCOPE)
      .listJob(0, -1);
    await provider.shutdown();

    expect(rules.map((each) => each.jobName)).toEqual(['heartbeat']);
  });

  it('shuts its executor and topic down, and shuts down safely when never started', async () => {
    const { provider, schedule, close } = application();
    await provider.shutdown();

    await provider.start();
    await provider.shutdown();
    await provider.shutdown();

    expect(close).toHaveBeenCalledOnce();
    await expect(
      schedule.getScheduleExecutor(JOBS_EXAMPLE_SCOPE).countJob(),
    ).rejects.toThrow(/shut down/u);
  });
});
