import type { BackendFactory } from 'bullmq';

import type {
  QueueImplementation,
  QueueRuntime,
  QueueRuntimeContext,
} from '../runtime.js';
import { RedisQueueRuntime } from './runtime.js';

/**
 * The BullMQ implementation: every `adapter: redis` configuration runs on it,
 * with the backend factory its `queueBackend` names, or BullMQ's own Redis
 * backend when it names none.
 */
export class RedisQueueImplementation implements QueueImplementation {
  public constructor(
    private readonly backendFactory: (
      name: string | undefined,
    ) => BackendFactory,
  ) {}

  public createRuntime(context: QueueRuntimeContext): QueueRuntime {
    return new RedisQueueRuntime(
      context,
      this.backendFactory(context.config.queueBackend),
    );
  }
}
