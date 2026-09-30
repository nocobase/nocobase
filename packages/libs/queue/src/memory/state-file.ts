import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { assertChannel, parseMessage } from '../message.js';
import { queueIdentity } from '../naming.js';
import {
  assertJobId,
  positiveInteger,
  validateBackoff,
  validateRetention,
} from '../options.js';
import type { QueueBackoffOptions, QueueRetentionPolicy } from '../types.js';

const MAX_FILE_NAME_BYTES = 255;

/** An unfinished job as the state file records it. */
export interface MemoryJobState {
  readonly jobId: string;
  readonly channel: string;
  /** The message as JSON text. */
  readonly message: string;
  readonly priority: number;
  readonly attempts: number;
  readonly backoff?: QueueBackoffOptions;
  readonly removeOnComplete: QueueRetentionPolicy;
  readonly removeOnFail: QueueRetentionPolicy;
  readonly started: number;
  readonly failures: number;
  /** Epoch milliseconds a delayed job becomes due. */
  readonly delayedUntil?: number;
}

export interface MemoryStateIdentity {
  readonly persistencePath: string;
  readonly namespace: string;
  readonly queue: string;
}

/**
 * Named by namespace and queue only, so renaming the configuration key or
 * pointing `default` elsewhere keeps reading the same pending jobs.
 */
export function memoryStateFilePath(identity: MemoryStateIdentity): string {
  const encoded = Buffer.from(
    queueIdentity(identity.namespace, identity.queue),
  ).toString('base64url');
  const fileName = `queue.${encoded}.state.json`;
  if (Buffer.byteLength(fileName) > MAX_FILE_NAME_BYTES) {
    throw new Error(
      `The state file name of queue ${JSON.stringify(identity.queue)} in namespace ${JSON.stringify(identity.namespace)} exceeds ${MAX_FILE_NAME_BYTES} bytes; use a shorter namespace or queue name.`,
    );
  }
  return path.join(identity.persistencePath, fileName);
}

/**
 * Read once when the queue opens and written once when it closes. Not
 * locked: one file belongs to one process.
 */
export class MemoryStateFile {
  public readonly filePath: string;

  public constructor(private readonly identity: MemoryStateIdentity) {
    this.filePath = memoryStateFilePath(identity);
  }

  public async read(): Promise<MemoryJobState[]> {
    let text: string;
    try {
      text = await readFile(this.filePath, 'utf8');
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return [];
      }
      throw error;
    }
    try {
      const data: unknown = JSON.parse(text);
      if (
        !isRecord(data) ||
        data.version !== 1 ||
        data.namespace !== this.identity.namespace ||
        data.queue !== this.identity.queue ||
        !Array.isArray(data.jobs)
      ) {
        throw new Error('Invalid state version, identity or jobs.');
      }
      const ids = new Set<string>();
      return data.jobs.map((value: unknown) => {
        const job = readJob(value);
        if (ids.has(job.jobId)) {
          throw new Error(`Duplicate job ID ${JSON.stringify(job.jobId)}.`);
        }
        ids.add(job.jobId);
        return job;
      });
    } catch (error) {
      throw new Error(`Invalid queue state file ${this.filePath}.`, {
        cause: error,
      });
    }
  }

  /** Replaces the file through a synced temporary file, never leaving half of one. */
  public async write(jobs: readonly MemoryJobState[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${randomUUID()}.tmp`;
    const data = {
      version: 1,
      namespace: this.identity.namespace,
      queue: this.identity.queue,
      jobs,
    };
    try {
      const handle = await open(temporary, 'wx');
      try {
        await handle.writeFile(`${JSON.stringify(data, null, 2)}\n`);
        await handle.sync();
      } finally {
        await handle.close();
      }
      for (let attempt = 0; ; attempt += 1) {
        try {
          await rename(temporary, this.filePath);
          break;
        } catch (error) {
          // Windows briefly refuses to replace a file another handle reads.
          if (
            attempt >= 9 ||
            !(error instanceof Error) ||
            !('code' in error) ||
            !['EPERM', 'EBUSY', 'EACCES'].includes(String(error.code))
          ) {
            throw error;
          }
          await sleep((attempt + 1) * 5);
        }
      }
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      throw new Error(`Failed to write queue state file ${this.filePath}.`, {
        cause: error,
      });
    }
  }
}

function readJob(value: unknown): MemoryJobState {
  if (!isRecord(value)) throw new Error('Invalid pending job.');
  assertJobId(value.jobId);
  assertChannel(value.channel);
  if (typeof value.message !== 'string') {
    throw new Error('A pending job message must be JSON text.');
  }
  parseMessage(value.message);
  const attempts = positiveInteger(value.attempts, 'attempts');
  if (
    !counter(value.priority) ||
    !counter(value.started) ||
    !counter(value.failures) ||
    value.failures >= attempts ||
    value.failures > value.started ||
    (value.delayedUntil !== undefined && !counter(value.delayedUntil))
  ) {
    throw new Error(`Invalid metadata of pending job ${value.jobId}.`);
  }
  return {
    jobId: value.jobId,
    channel: value.channel,
    message: value.message,
    priority: value.priority,
    attempts,
    ...(value.backoff !== undefined
      ? { backoff: validateBackoff(value.backoff) }
      : {}),
    removeOnComplete: validateRetention(
      value.removeOnComplete,
      'removeOnComplete',
    ),
    removeOnFail: validateRetention(value.removeOnFail, 'removeOnFail'),
    started: value.started,
    failures: value.failures,
    ...(value.delayedUntil !== undefined
      ? { delayedUntil: value.delayedUntil }
      : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function counter(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
