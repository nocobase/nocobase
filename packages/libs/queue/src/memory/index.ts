import type {
  QueueImplementation,
  QueueRuntime,
  QueueRuntimeContext,
} from '../runtime.js';
import { MemoryQueueRuntime } from './runtime.js';

/**
 * The in-process implementation, selected by `adapter: inMemory`. It
 * serves one process: its queues are never shared with another service,
 * process or instance, and a state file persists their unfinished jobs
 * between a clean shutdown and the next start.
 */
export class InMemoryQueueService implements QueueImplementation {
  public createRuntime(context: QueueRuntimeContext): QueueRuntime {
    return new MemoryQueueRuntime(context);
  }
}
