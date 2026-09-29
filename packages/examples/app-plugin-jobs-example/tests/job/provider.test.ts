import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createAppPaths } from '@nocobase/app-server/config';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
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

import { JobExampleProvider } from '../../server/job/provider.js';
import {
  JOB_TASKS_TOPIC,
  jobExampleServiceToken,
  type JobTask,
} from '../../server/job/service.js';
import { PROGRESS_STEP_MS } from '../../server/job/progress-job.js';
import { JOBS_EXAMPLE_SCOPE } from '../../server/scope.js';

let directory: string;
const services: ManagedJobExecutorService[] = [];

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'jobs-example-job-'));
  // Only the job's one-second steps run on setTimeout; the memory backend
  // schedules on setImmediate, which keeps running for real.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(async () => {
  vi.useRealTimers();
  await Promise.allSettled(services.splice(0).map((each) => each.shutdown()));
  await rm(directory, { recursive: true, force: true });
});

async function steps(count: number): Promise<void> {
  for (let step = 0; step < count; step += 1)
    await vi.advanceTimersByTimeAsync(PROGRESS_STEP_MS);
}

/** One application start: a jobs service over the same storage each time. */
function application() {
  const jobs = createJobExecutorService(undefined, {
    appName: 'main',
    storagePath: directory,
  });
  services.push(jobs);
  const published: Array<{ userId: string; task: JobTask }> = [];
  const close = vi.fn();
  const defineTopic = vi.fn(() => ({
    name: JOB_TASKS_TOPIC,
    audience: 'user' as const,
    publishFor: (userId: string, task: JobTask) => {
      published.push({ userId, task });
      return { topic: JOB_TASKS_TOPIC, subscriberCount: 1 };
    },
    close,
  }));
  const container = new ServiceContainer();
  container.instance(jobExecutorServiceToken, jobs);
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
  const provider = new JobExampleProvider(app);
  provider.register();
  return {
    provider,
    service: container.resolve(jobExampleServiceToken),
    published,
    defineTopic,
    close,
  };
}

describe('@nocobase/app-plugin-jobs-example job', () => {
  it('runs a task in ten steps and pushes every change to its owner', async () => {
    const { provider, service, published, defineTopic } = application();
    await provider.start();
    expect(defineTopic).toHaveBeenCalledWith(JOB_TASKS_TOPIC, {
      audience: 'user',
    });

    const task = await service.create('user-1');
    expect(task).toMatchObject({ jobId: expect.any(String), progress: 0 });
    await vi.waitFor(() =>
      expect(service.status('user-1').tasks[0]?.status).toBe('running'),
    );
    await steps(10);
    await vi.waitFor(() =>
      expect(service.status('user-1').tasks).toEqual([
        expect.objectContaining({
          jobId: task.jobId,
          status: 'completed',
          progress: 100,
          attempt: 1,
        }),
      ]),
    );
    await provider.shutdown();

    expect(new Set(published.map((each) => each.userId))).toEqual(
      new Set(['user-1']),
    );
    const progress = published
      .filter((each) => each.task.status === 'running')
      .map((each) => each.task.progress);
    expect(progress).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(published.at(-1)?.task.status).toBe('completed');
    expect(service.status('user-1').scope).toBe(JOBS_EXAMPLE_SCOPE);
    // Another user sees none of it.
    expect(service.status('user-2').tasks).toEqual([]);
  });

  it('returns an interrupted task to the queue and closes its topic', async () => {
    const { provider, service, close } = application();
    await provider.start();
    const task = await service.create('user-1');
    await vi.waitFor(() =>
      expect(service.status('user-1').tasks[0]?.status).toBe('running'),
    );
    await steps(3);
    await vi.waitFor(() =>
      expect(service.status('user-1').tasks[0]?.progress).toBe(30),
    );
    await provider.shutdown();
    expect(service.status('user-1').tasks[0]).toMatchObject({
      jobId: task.jobId,
      status: 'queued',
      reason: 'interrupted',
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it('rejects a task before the provider starts', async () => {
    const { service } = application();
    await expect(service.create('user-1')).rejects.toThrow(/not started/u);
  });
});
