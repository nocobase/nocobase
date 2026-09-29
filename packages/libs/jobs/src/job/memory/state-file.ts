import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import type { ResolvedMemoryJobsConfig } from '../../config.js';
import { assertJobName, copyJobPayload } from '../validation.js';

export interface PendingJobState {
  readonly jobId: string;
  readonly jobName: string;
  readonly payload: unknown;
  readonly enqueuedAt: number;
  readonly attempts: number;
  started: number;
  failures: number;
}

/**
 * Like Schedule, the file is named by namespace and scope only, so renaming
 * the configuration key keeps reading the same pending tasks.
 */
export function jobStateFilePath(
  config: Pick<
    ResolvedMemoryJobsConfig,
    'persistencePath' | 'namespace' | 'scope'
  >,
): string {
  const identity = Buffer.from(
    JSON.stringify([config.namespace, config.scope]),
  ).toString('base64url');
  return path.join(config.persistencePath, `jobs.${identity}.state.json`);
}

export class JobStateFile {
  public readonly filePath: string;
  public constructor(private readonly config: ResolvedMemoryJobsConfig) {
    this.filePath = jobStateFilePath(config);
  }

  public async read(): Promise<PendingJobState[]> {
    let text: string;
    try {
      text = await readFile(this.filePath, 'utf8');
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return [];
      throw error;
    }
    try {
      const data: unknown = JSON.parse(text);
      if (
        !record(data) ||
        data.version !== 1 ||
        data.namespace !== this.config.namespace ||
        data.scope !== this.config.scope ||
        !Array.isArray(data.jobs)
      ) {
        throw new Error('Invalid state version, identity or jobs.');
      }
      const ids = new Set<string>();
      return data.jobs.map((value: unknown) => {
        if (
          !record(value) ||
          typeof value.jobId !== 'string' ||
          !value.jobId ||
          ids.has(value.jobId) ||
          !integer(value.enqueuedAt) ||
          !Number.isFinite(new Date(value.enqueuedAt).getTime()) ||
          !integer(value.attempts) ||
          value.attempts < 1 ||
          !integer(value.started) ||
          !integer(value.failures) ||
          value.failures >= value.attempts ||
          value.failures > value.started
        ) {
          throw new Error('Invalid pending job metadata.');
        }
        assertJobName(value.jobName);
        ids.add(value.jobId);
        return {
          jobId: value.jobId,
          jobName: value.jobName,
          payload: copyJobPayload(value.payload),
          enqueuedAt: value.enqueuedAt,
          attempts: value.attempts,
          started: value.started,
          failures: value.failures,
        };
      });
    } catch (error) {
      throw new Error(`Invalid job state file ${this.filePath}.`, {
        cause: error,
      });
    }
  }

  public async write(jobs: readonly PendingJobState[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${randomUUID()}.tmp`;
    const data = {
      version: 1,
      namespace: this.config.namespace,
      scope: this.config.scope,
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
          if (
            attempt >= 9 ||
            !(error instanceof Error) ||
            !('code' in error) ||
            !['EPERM', 'EBUSY', 'EACCES'].includes(String(error.code))
          )
            throw error;
          await sleep((attempt + 1) * 5);
        }
      }
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      throw new Error(`Failed to write job state file ${this.filePath}.`, {
        cause: error,
      });
    }
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
