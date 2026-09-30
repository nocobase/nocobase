import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  createJobExecutorService,
  type JobClass,
  type ManagedJobExecutorService,
} from '@nocobase/jobs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createWorkflowQueueAdapter,
  WORKFLOW_TASK_JOB_NAME,
} from '../server/queue.js';
import type { WorkflowQueueTask } from '../server/engine/types.js';

const SCOPE = '@nocobase/app-plugin-workflow';

async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out waiting for the executor');
}

describe('workflow queue adapter', () => {
  let storagePath: string;
  const services: ManagedJobExecutorService[] = [];

  /** One service per simulated process; they share the state directory. */
  function createService(
    appName: string = 'workflow-queue-adapter',
  ): ManagedJobExecutorService {
    const service = createJobExecutorService(undefined, {
      appName,
      storagePath,
    });
    services.push(service);
    return service;
  }

  beforeEach(async () => {
    storagePath = await mkdtemp(path.join(tmpdir(), 'workflow-jobs-'));
  });

  afterEach(async () => {
    await Promise.allSettled(services.map((service) => service.shutdown()));
    services.length = 0;
    await rm(storagePath, { recursive: true, force: true });
  });

  it('carries a task through the executor and back into dispatch', async () => {
    const dispatched: WorkflowQueueTask[] = [];
    const adapter = createWorkflowQueueAdapter({
      executor: createService().getJobExecutor(SCOPE),
      dispatch: async (task) => {
        dispatched.push(task);
      },
    });

    await adapter.startWorker();
    await adapter.publish({
      executionId: 7,
      nodeRunId: 42,
      rerun: { nodeKey: 'check', overwrite: true },
    });
    await waitFor(() => dispatched.length === 1);

    expect(dispatched).toEqual([
      {
        executionId: 7,
        nodeRunId: 42,
        rerun: { nodeKey: 'check', overwrite: true },
      },
    ]);
    await adapter.stop();
  });

  it('leaves out optional fields that are present but undefined', async () => {
    const dispatched: WorkflowQueueTask[] = [];
    const adapter = createWorkflowQueueAdapter({
      executor: createService().getJobExecutor(SCOPE),
      dispatch: async (task) => {
        dispatched.push(task);
      },
    });

    await adapter.startWorker();
    await adapter.publish({
      executionId: 7,
      nodeRunId: undefined,
      rerun: { nodeKey: 'check', nodeId: undefined, overwrite: undefined },
    });
    await waitFor(() => dispatched.length === 1);

    expect(dispatched).toEqual([
      { executionId: 7, rerun: { nodeKey: 'check' } },
    ]);
    expect(dispatched[0]).not.toHaveProperty('nodeRunId');
    await adapter.stop();
  });

  it('refuses to publish before the executor has been set up', async () => {
    const adapter = createWorkflowQueueAdapter({
      executor: createService().getJobExecutor(SCOPE),
      dispatch: async () => undefined,
    });

    await expect(adapter.publish({ executionId: 1 })).rejects.toThrow(
      'Call setup() before addJob()',
    );
  });

  it('picks up a task a publish-only process left behind', async () => {
    const publisherService = createService();
    const publisherExecutor = publisherService.getJobExecutor(SCOPE);
    const publisher = createWorkflowQueueAdapter({
      executor: publisherExecutor,
      dispatch: async () => undefined,
    });
    // Publishing only: nothing consumes, so the task is still pending when the
    // process shuts down and writes its state.
    await publisherExecutor.setup({ consume: false });
    await publisher.publish({ executionId: 1 });
    await publisher.stop();
    await publisherService.shutdown();

    const dispatched: WorkflowQueueTask[] = [];
    const consumer = createWorkflowQueueAdapter({
      executor: createService().getJobExecutor(SCOPE),
      dispatch: async (task) => {
        dispatched.push(task);
      },
    });
    await consumer.startWorker();
    await waitFor(() => dispatched.length === 1);

    expect(dispatched).toEqual([{ executionId: 1 }]);
    await consumer.stop();
  });

  it('refuses a second adapter on the same executor', () => {
    const executor = createService().getJobExecutor(SCOPE);
    createWorkflowQueueAdapter({ executor, dispatch: async () => undefined });

    expect(() =>
      createWorkflowQueueAdapter({ executor, dispatch: async () => undefined }),
    ).toThrow(
      `A different class is already registered for job "${WORKFLOW_TASK_JOB_NAME}".`,
    );
  });

  it('keeps adapters on separate scopes apart', async () => {
    const service = createService();
    const firstTasks: WorkflowQueueTask[] = [];
    const secondTasks: WorkflowQueueTask[] = [];
    const first = createWorkflowQueueAdapter({
      executor: service.getJobExecutor(SCOPE),
      dispatch: async (task) => {
        firstTasks.push(task);
      },
    });
    const second = createWorkflowQueueAdapter({
      executor: service.getJobExecutor(`${SCOPE}-other`),
      dispatch: async (task) => {
        secondTasks.push(task);
      },
    });

    await first.startWorker();
    await second.startWorker();
    await first.publish({ executionId: 1 });
    await second.publish({ executionId: 2 });
    await waitFor(() => firstTasks.length === 1 && secondTasks.length === 1);

    expect(firstTasks).toEqual([{ executionId: 1 }]);
    expect(secondTasks).toEqual([{ executionId: 2 }]);
    await first.stop();
    await second.stop();
  });

  it('binds each application to its own dispatch on the same scope', async () => {
    // What the `workflow:<appName>` queue name used to separate: two
    // applications in one process, each with its own jobs service. The
    // namespace, which defaults to the application name, keeps them apart.
    const firstTasks: WorkflowQueueTask[] = [];
    const secondTasks: WorkflowQueueTask[] = [];
    const first = createWorkflowQueueAdapter({
      executor: createService('first-app').getJobExecutor(SCOPE),
      dispatch: async (task) => {
        firstTasks.push(task);
      },
    });
    const second = createWorkflowQueueAdapter({
      executor: createService('second-app').getJobExecutor(SCOPE),
      dispatch: async (task) => {
        secondTasks.push(task);
      },
    });

    await first.startWorker();
    await second.startWorker();
    await first.publish({ executionId: 1 });
    await second.publish({ executionId: 2 });
    await first.publish({ executionId: 3 });
    await waitFor(() => firstTasks.length === 2 && secondTasks.length === 1);

    expect(firstTasks).toEqual([{ executionId: 1 }, { executionId: 3 }]);
    expect(secondTasks).toEqual([{ executionId: 2 }]);
    await first.stop();
    await second.stop();
  });

  it('names the job class stably so a persisted task keeps resolving', () => {
    const executor = createService().getJobExecutor(SCOPE);
    const registerJob = vi.spyOn(executor, 'registerJob');

    createWorkflowQueueAdapter({ executor, dispatch: async () => undefined });

    const [jobClass] = registerJob.mock.calls[0] as [JobClass];
    expect(jobClass.jobName).toBe(WORKFLOW_TASK_JOB_NAME);
    expect(WORKFLOW_TASK_JOB_NAME).toBe('workflow.task');
  });
});
