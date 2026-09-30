import path from 'node:path';

import type { ResolvedMemoryJobsConfig } from '../../config.js';
import {
  ScheduleHandlerNotRegisteredError,
  type ScheduleBackend,
  type ScheduleExecutionSettings,
  type ScheduleRuleWrite,
  type ScheduleRunner,
  type StoredScheduleRule,
} from '../executor.js';
import type { JobsLogger } from '../../types.js';
import type { JobScheduler } from '../types.js';
import {
  memoryStateFileBase,
  MemoryStateFile,
  type MemoryJobState,
} from './state-file.js';
import { firstFiring, nextFiring } from './timing.js';

/** The longest delay `setTimeout` waits; a longer one is waited in steps. */
const MAX_TIMER_DELAY = 2_147_483_647;

interface QueuedFiring {
  readonly name: string;
  readonly scheduledAt: number;
}

/**
 * Schedules in this process, keeping every rule, its next firing and its
 * firing count in memory. The state is read from one file per namespace and
 * scope when the executor is set up, and written back whole when it shuts
 * down; nothing reaches the disk in between, so a process that ends without
 * shutting down loses what changed since it started. Each process holds its
 * own copy: two processes on one file each fire every rule, and the one that
 * shuts down last overwrites the other's.
 *
 * Each planned firing waits on one timer, and `cron-parser` computes the
 * firing after it.
 */
export class InMemoryScheduleBackend implements ScheduleBackend {
  public readonly settings: ScheduleExecutionSettings;
  private readonly file: MemoryStateFile;
  private state = new Map<string, MemoryJobState>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly queue: QueuedFiring[] = [];
  private readonly running = new Set<Promise<void>>();
  private runner: ScheduleRunner | undefined;
  private abort = new AbortController();

  public constructor(
    private readonly config: ResolvedMemoryJobsConfig,
    private readonly logger: JobsLogger | undefined,
  ) {
    this.settings = Object.freeze({ attempts: config.attempts });
    this.file = new MemoryStateFile(
      path.join(
        config.persistencePath,
        `${memoryStateFileBase(config.namespace, config.scope)}.json`,
      ),
      config.namespace,
      config.scope,
    );
  }

  public get statePath(): string {
    return this.file.filePath;
  }

  public async open(): Promise<void> {
    this.state = await this.file.read();
  }

  public read(name: string): Promise<StoredScheduleRule | undefined> {
    const job = this.state.get(name);
    return Promise.resolve(job ? toStoredRule(job) : undefined);
  }

  public write(rule: ScheduleRuleWrite): Promise<Date | undefined> {
    if (rule.options.endDate && rule.options.endDate.getTime() <= Date.now()) {
      // A rule that already ended is not stored, the way the redis adapter
      // (and BullMQ, which refuses it) behaves.
      this.removeRule(rule.name);
      return Promise.resolve(undefined);
    }
    const nextRunAt = firstFiring(rule.options, Date.now(), rule.immediately);
    this.state.set(rule.name, {
      options: rule.options,
      payload: jsonCopy(rule.payload),
      settings: rule.settings,
      nextRunAt,
      fired: 0,
    });
    // The rule replaces the one before it, and with it any firing of the old
    // rule still waiting for a free slot.
    this.dropQueued(rule.name);
    this.arm(rule.name);
    return Promise.resolve(
      nextRunAt === null ? undefined : new Date(nextRunAt),
    );
  }

  public remove(name: string): Promise<boolean> {
    return Promise.resolve(this.removeRule(name));
  }

  public count(): Promise<number> {
    return Promise.resolve(this.state.size);
  }

  public list(start: number, end: number): Promise<JobScheduler[]> {
    const ordered = [...this.state]
      .sort(([leftName, left], [rightName, right]) => {
        const byNext =
          (left.nextRunAt ?? Number.POSITIVE_INFINITY) -
          (right.nextRunAt ?? Number.POSITIVE_INFINITY);
        if (byNext !== 0 && !Number.isNaN(byNext)) return byNext;
        return leftName < rightName ? -1 : leftName > rightName ? 1 : 0;
      })
      .map(([name, job]) => toJobScheduler(name, job));
    const stop = end < 0 ? ordered.length + end + 1 : end + 1;
    return Promise.resolve(ordered.slice(Math.max(start, 0), stop));
  }

  public consume(runner: ScheduleRunner): Promise<void> {
    this.runner = runner;
    this.abort = new AbortController();
    // A firing missed while nothing ran is due now and fires once; the next
    // one is computed from the present when it starts.
    for (const name of this.state.keys()) this.arm(name);
    return Promise.resolve();
  }

  /** Stops firing, waits for running handlers, then writes the whole state back. */
  public async close(): Promise<void> {
    this.runner = undefined;
    for (const name of [...this.timers.keys()]) this.disarm(name);
    this.queue.length = 0;
    this.abort.abort(new Error('The schedule executor is shutting down.'));
    await Promise.allSettled([...this.running]);
    await this.file.write(this.state);
  }

  private removeRule(name: string): boolean {
    if (!this.state.delete(name)) return false;
    this.disarm(name);
    this.dropQueued(name);
    return true;
  }

  private arm(name: string): void {
    this.disarm(name);
    const job = this.state.get(name);
    if (!this.runner || !job || job.nextRunAt === null) return;
    this.wait(name, job.nextRunAt);
  }

  /**
   * Waits until the clock reaches `scheduledAt`, then queues the firing. A
   * timer can wake before that: its delay is capped at what `setTimeout`
   * accepts, and it runs on a monotonic clock that can be slightly ahead of
   * `Date.now()`. It then waits again for what remains, so a firing never
   * starts before its planned time.
   */
  private wait(name: string, scheduledAt: number): void {
    const delay = Math.min(
      Math.max(scheduledAt - Date.now(), 0),
      MAX_TIMER_DELAY,
    );
    this.timers.set(
      name,
      setTimeout(() => {
        if (scheduledAt > Date.now()) this.wait(name, scheduledAt);
        else this.enqueue(name, scheduledAt);
      }, delay),
    );
  }

  private disarm(name: string): void {
    const timer = this.timers.get(name);
    this.timers.delete(name);
    if (timer) clearTimeout(timer);
  }

  private dropQueued(name: string): void {
    for (let index = this.queue.length - 1; index >= 0; index -= 1) {
      if (this.queue[index].name === name) this.queue.splice(index, 1);
    }
  }

  private enqueue(name: string, scheduledAt: number): void {
    this.timers.delete(name);
    if (!this.runner) return;
    this.queue.push({ name, scheduledAt });
    this.pump();
  }

  private pump(): void {
    while (
      this.runner &&
      this.running.size < this.config.concurrency &&
      this.queue.length > 0
    ) {
      const firing = this.queue.shift()!;
      const execution = this.start(firing).catch((error: unknown) => {
        this.logger?.error(
          { error, jobName: firing.name },
          'A memory schedule firing failed unexpectedly',
        );
      });
      const tracked = execution.finally(() => {
        this.running.delete(tracked);
        this.pump();
      });
      this.running.add(tracked);
    }
  }

  private async start(firing: QueuedFiring): Promise<void> {
    const job = this.state.get(firing.name);
    // Replaced or removed since this firing was planned.
    if (!job || job.nextRunAt !== firing.scheduledAt || !this.runner) return;
    const fired = job.fired + 1;
    const current: MemoryJobState = {
      ...job,
      fired,
      nextRunAt: nextFiring(job.options, firing.scheduledAt, fired, Date.now()),
    };
    this.state.set(firing.name, current);
    this.arm(firing.name);
    await this.execute(firing, current);
  }

  private async execute(
    firing: QueuedFiring,
    job: MemoryJobState,
  ): Promise<void> {
    const runner = this.runner!;
    const jobId = `${firing.name}:${firing.scheduledAt}`;
    const scheduledAt = new Date(firing.scheduledAt);
    const attempts = Number(job.settings.attempts ?? this.config.attempts);
    const signal = this.abort.signal;
    for (let attempt = 1; ; attempt += 1) {
      const runAt = new Date();
      const nextRunAt = this.nextRunAt(firing.name);
      const base = {
        jobId,
        jobName: firing.name,
        scheduledAt,
        runAt,
        ...(nextRunAt ? { nextRunAt } : {}),
      };
      runner.emit({ name: 'ScheduleStart', ...base });
      try {
        await runner.run({ ...base, signal });
        runner.emit({ name: 'ScheduleEnd', ...base });
        return;
      } catch (caught) {
        const error =
          caught instanceof Error ? caught : new Error(String(caught));
        const notRegistered =
          error instanceof ScheduleHandlerNotRegisteredError;
        runner.emit({
          name: 'ScheduleError',
          ...base,
          reason: notRegistered ? 'handler-not-registered' : 'execute-failed',
          error,
        });
        if (notRegistered || attempt >= attempts || signal.aborted) return;
      }
    }
  }

  private nextRunAt(name: string): Date | undefined {
    const next = this.state.get(name)?.nextRunAt;
    return next === null || next === undefined ? undefined : new Date(next);
  }
}

function toStoredRule(job: MemoryJobState): StoredScheduleRule {
  return {
    options: job.options,
    payload: job.payload,
    settings: job.settings,
    ...(job.nextRunAt !== null ? { nextRunAt: new Date(job.nextRunAt) } : {}),
  };
}

function toJobScheduler(name: string, job: MemoryJobState): JobScheduler {
  return {
    jobName: name,
    options: job.options,
    payload: job.payload,
    ...(job.nextRunAt !== null ? { nextRunAt: new Date(job.nextRunAt) } : {}),
  };
}

function jsonCopy(value: unknown): unknown {
  const text = JSON.stringify(value);
  return text === undefined ? undefined : (JSON.parse(text) as unknown);
}
