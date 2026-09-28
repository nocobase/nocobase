import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import type { ScheduleExecutionSettings } from '../executor.js';
import type { ScheduleRule } from '../validation.js';

/** Bumped whenever the file layout changes; unknown versions are refused, never guessed. */
export const MEMORY_STATE_VERSION = 1;

export interface MemoryJobState {
  readonly options: ScheduleRule;
  /** The payload as JSON reads it back, the same shape a Redis backend returns. */
  readonly payload: unknown;
  readonly settings: ScheduleExecutionSettings;
  /** The next planned firing in epoch milliseconds, `null` when there is none. */
  readonly nextRunAt: number | null;
  /** Firings started since the rule was last written; `limit` counts against it. */
  readonly fired: number;
}

export type MemoryState = ReadonlyMap<string, MemoryJobState>;

/** Windows refuses to replace a file another process has open; that passes quickly. */
const RENAME_RETRIES = 10;
const RETRYABLE_RENAME_ERRORS = new Set(['EPERM', 'EBUSY', 'EACCES']);

interface SerializedRule {
  cron?: string;
  every?: number;
  limit?: number;
  tz?: string;
  startDate?: number;
  endDate?: number;
}

interface SerializedJob {
  options: SerializedRule;
  payload?: unknown;
  settings: ScheduleExecutionSettings;
  nextRunAt: number | null;
  fired: number;
}

interface SerializedState {
  version: number;
  namespace: string;
  scope: string;
  jobs: Record<string, SerializedJob>;
}

/**
 * File names encode both parts with `encodeURIComponent` and additionally
 * encode `.`, so the `.` between them is unambiguous and a scope such as
 * `@nocobase/app-plugin-scheduler` never becomes a path.
 */
export function memoryStateFileBase(namespace: string, scope: string): string {
  return `${encodeFilePart(namespace)}.${encodeFilePart(scope)}`;
}

function encodeFilePart(value: string): string {
  return encodeURIComponent(value)
    .replaceAll('.', '%2E')
    .replaceAll('*', '%2A');
}

export class MemoryStateFile {
  public constructor(
    public readonly filePath: string,
    private readonly namespace: string,
    private readonly scope: string,
  ) {}

  /** Reads the state a previous process wrote, or nothing when there is no file yet. */
  public async read(): Promise<Map<string, MemoryJobState>> {
    let text: string;
    try {
      text = await readFile(this.filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Map();
      throw error;
    }
    let parsed: SerializedState;
    try {
      parsed = JSON.parse(text) as SerializedState;
    } catch (error) {
      throw new Error(
        `Schedule state file ${this.filePath} is not valid JSON.`,
        { cause: error },
      );
    }
    if (parsed?.version !== MEMORY_STATE_VERSION) {
      throw new Error(
        `Schedule state file ${this.filePath} has format version ${JSON.stringify(parsed?.version)}, but this version of @nocobase/jobs reads version ${MEMORY_STATE_VERSION} only.`,
      );
    }
    return new Map(
      Object.entries(parsed.jobs ?? {}).map(([name, job]) => [
        name,
        {
          options: deserializeRule(job.options),
          payload: job.payload,
          settings: job.settings ?? {},
          nextRunAt: job.nextRunAt ?? null,
          fired: job.fired ?? 0,
        },
      ]),
    );
  }

  /**
   * Replaces the whole file with this state. It is written to a temporary
   * file beside the target and renamed over it, so a crash while writing
   * leaves either version whole.
   */
  public async write(state: MemoryState): Promise<void> {
    const serialized: SerializedState = {
      version: MEMORY_STATE_VERSION,
      namespace: this.namespace,
      scope: this.scope,
      jobs: Object.fromEntries(
        [...state].map(([name, job]) => [
          name,
          {
            options: serializeRule(job.options),
            ...(job.payload !== undefined ? { payload: job.payload } : {}),
            settings: job.settings,
            nextRunAt: job.nextRunAt,
            fired: job.fired,
          },
        ]),
      ),
    };
    const directory = path.dirname(this.filePath);
    await mkdir(directory, { recursive: true });
    const temporary = path.join(
      directory,
      `.${path.basename(this.filePath)}.${randomUUID()}.tmp`,
    );
    try {
      const handle = await open(temporary, 'wx');
      try {
        await handle.writeFile(`${JSON.stringify(serialized, null, 2)}\n`);
        await handle.sync();
      } finally {
        await handle.close();
      }
      await replace(temporary, this.filePath);
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      throw new Error(`Failed to write schedule state file ${this.filePath}.`, {
        cause: error,
      });
    }
  }
}

async function replace(source: string, target: string): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await rename(source, target);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? '';
      if (attempt >= RENAME_RETRIES || !RETRYABLE_RENAME_ERRORS.has(code))
        throw error;
      await sleep(attempt * 5);
    }
  }
}

function serializeRule(rule: ScheduleRule): SerializedRule {
  return {
    ...(rule.cron !== undefined ? { cron: rule.cron } : {}),
    ...(rule.every !== undefined ? { every: rule.every } : {}),
    ...(rule.limit !== undefined ? { limit: rule.limit } : {}),
    ...(rule.tz !== undefined ? { tz: rule.tz } : {}),
    ...(rule.startDate ? { startDate: rule.startDate.getTime() } : {}),
    ...(rule.endDate ? { endDate: rule.endDate.getTime() } : {}),
  };
}

function deserializeRule(rule: SerializedRule): ScheduleRule {
  return {
    ...(rule.cron !== undefined ? { cron: rule.cron } : {}),
    ...(rule.every !== undefined ? { every: rule.every } : {}),
    ...(rule.limit !== undefined ? { limit: rule.limit } : {}),
    ...(rule.tz !== undefined ? { tz: rule.tz } : {}),
    ...(rule.startDate !== undefined
      ? { startDate: new Date(rule.startDate) }
      : {}),
    ...(rule.endDate !== undefined ? { endDate: new Date(rule.endDate) } : {}),
  };
}
