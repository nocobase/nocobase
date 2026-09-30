import { Job, type JobExecutor } from '@nocobase/jobs';

import type { WorkflowQueue, WorkflowQueueTask } from './engine/types.js';

/** The handler identity stored with every workflow task: keep it stable. */
export const WORKFLOW_TASK_JOB_NAME: string = 'workflow.task';

export interface WorkflowQueueAdapter extends WorkflowQueue {
  startWorker(): Promise<void>;
  stop(): Promise<void>;
}

export interface WorkflowQueueAdapterOptions {
  executor: JobExecutor;
  dispatch: (task: WorkflowQueueTask) => Promise<unknown>;
}

/**
 * A task is a strict JSON snapshot, which rejects a property that is present
 * but `undefined`. Optional fields are left out instead.
 */
function toPayload(task: WorkflowQueueTask): WorkflowQueueTask {
  const rerun =
    task.rerun === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(task.rerun).filter(([, value]) => value !== undefined),
        );
  return {
    executionId: task.executionId,
    ...(task.nodeRunId === undefined ? {} : { nodeRunId: task.nodeRunId }),
    ...(rerun === undefined ? {} : { rerun }),
  };
}

/**
 * Connects `WorkflowQueue` to a `JobExecutor` from `@nocobase/jobs`.
 *
 * The job class closes over `dispatch` rather than receiving it: a task carries
 * only its payload, and each executor keeps its own registry, so the adapter
 * that registered the class is the one that executes it. A second adapter on
 * the same executor is rejected by `registerJob`, because its class differs.
 *
 * `startWorker()` sets the executor up as a consumer. A process that only
 * publishes sets the executor up with `{ consume: false }` itself before it
 * publishes; until one of the two has happened, `publish()` rejects.
 */
export function createWorkflowQueueAdapter(
  options: WorkflowQueueAdapterOptions,
): WorkflowQueueAdapter {
  const { dispatch, executor } = options;

  class WorkflowTaskJob extends Job<WorkflowQueueTask> {
    public static readonly jobName: string = WORKFLOW_TASK_JOB_NAME;

    public async execute(): Promise<void> {
      await dispatch(this.payload);
    }
  }

  // Registered before any setup(): a task left waiting by an earlier run must
  // find its handler as soon as the executor starts consuming.
  executor.registerJob(WorkflowTaskJob);

  return {
    async publish(task: WorkflowQueueTask): Promise<void> {
      await executor.addJob(new WorkflowTaskJob(toPayload(task)));
    },

    async startWorker(): Promise<void> {
      await executor.setup();
    },

    async stop(): Promise<void> {
      await executor.shutdown();
    },
  };
}
