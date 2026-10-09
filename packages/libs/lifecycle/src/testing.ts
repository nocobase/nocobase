import type { Lifecycle } from './definition.js';
import { MemoryLifecycleStore } from './memory-store.js';
import {
  LifecycleRuntime,
  type AvailableTransition,
  type EffectDispatcher,
  type TransitionCheck,
} from './runtime.js';
import type { EffectRun, TransitionEntry } from './store.js';
import type {
  JsonObject,
  LifecycleActor,
  LifecycleTypes,
  ParametersOf,
  RecordId,
  ServicesOf,
} from './types.js';

/**
 * When an in-process retry runs. `clock` waits until the clock reaches the
 * run's `runAfter`, as the jobs dispatcher does, so a backoff is part of what
 * a test sees; `immediate` runs every retry at once and only records the
 * backoff, for a test about what the attempts do rather than when.
 */
export type RetryTiming = 'clock' | 'immediate';

export interface InProcessDispatcherOptions {
  /** The clock `runAfter` is compared with: the runtime's own. */
  readonly clock: () => Date;
  /** Defaults to `clock`. */
  readonly retries?: RetryTiming;
}

/** A run an {@link InProcessDispatcher} holds until its backoff has passed. */
export interface WaitingRun {
  readonly runId: string;
  readonly runAfter: string;
}

/**
 * Runs effects in process, as the runtime's default dispatcher does, except
 * that a run handed over with a `runAfter` still ahead of the clock waits for
 * it: `runDue()` runs what the clock has reached since. Attach it to the
 * runtime it serves before the first transition.
 *
 * ```ts
 * const dispatcher = new InProcessDispatcher({ clock: () => new Date(now) });
 * const runtime = new LifecycleRuntime({ store, clock: () => new Date(now), dispatcher });
 * dispatcher.attach(runtime);
 * ```
 */
export class InProcessDispatcher implements EffectDispatcher {
  private runtime: LifecycleRuntime | undefined;
  private readonly clock: () => Date;
  private readonly retries: RetryTiming;
  private readonly held = new Map<string, string>();

  public constructor(options: InProcessDispatcherOptions) {
    this.clock = options.clock;
    this.retries = options.retries ?? 'clock';
  }

  public attach(runtime: LifecycleRuntime): void {
    this.runtime = runtime;
  }

  public async dispatch(
    runId: string,
    options: { readonly runAfter: string | null },
  ): Promise<void> {
    const { runAfter } = options;
    if (
      this.retries === 'clock' &&
      runAfter !== null &&
      runAfter > this.clock().toISOString()
    ) {
      this.held.set(runId, runAfter);
      return;
    }
    this.held.delete(runId);
    await this.attached().runEffect(runId);
  }

  /** The runs waiting out a backoff, the soonest first. */
  public waiting(): WaitingRun[] {
    return [...this.held]
      .map(([runId, runAfter]) => ({ runId, runAfter }))
      .sort((a, b) => (a.runAfter < b.runAfter ? -1 : 1));
  }

  /**
   * Runs every waiting run the clock has reached, the soonest first, and
   * what those runs cause in turn. Returns how many it ran.
   */
  public async runDue(): Promise<number> {
    let ran = 0;
    for (;;) {
      const now = this.clock().toISOString();
      const due = this.waiting().find((run) => run.runAfter <= now);
      if (!due) return ran;
      this.held.delete(due.runId);
      await this.attached().runEffect(due.runId);
      ran += 1;
    }
  }

  private attached(): LifecycleRuntime {
    if (!this.runtime)
      throw new Error(
        'Attach the runtime to the InProcessDispatcher before firing.',
      );
    return this.runtime;
  }
}

export interface LifecycleTestKitOptions<T extends LifecycleTypes> {
  readonly services?: ServicesOf<T>;
  /** Overrides on top of the lifecycle's defaults. */
  readonly parameters?: Partial<ParametersOf<T>>;
  /** Where the fake clock starts. Defaults to 2026-01-01T00:00:00Z. */
  readonly now?: string | Date;
  /**
   * Whether a retry waits for the fake clock to pass its backoff, which
   * `advance()` and then `runDue()` let it do. Defaults to `clock`.
   */
  readonly retries?: RetryTiming;
}

export interface Duration {
  readonly days?: number;
  readonly hours?: number;
  readonly minutes?: number;
  readonly seconds?: number;
}

export interface KitFireOptions {
  /** A user id or an actor. Defaults to `tester`. */
  readonly actor?: string | LifecycleActor;
}

type RecordRef = RecordId | { readonly id: RecordId };

function idOf(record: RecordRef): RecordId {
  return typeof record === 'object' ? record.id : record;
}

function actorOf(actor: string | LifecycleActor | undefined): LifecycleActor {
  if (actor === undefined) return { id: 'tester' };
  return typeof actor === 'string' ? { id: actor } : actor;
}

function millis(duration: Duration): number {
  return (
    (duration.days ?? 0) * 86_400_000 +
    (duration.hours ?? 0) * 3_600_000 +
    (duration.minutes ?? 0) * 60_000 +
    (duration.seconds ?? 0) * 1_000
  );
}

/**
 * One lifecycle on a memory store, a fake clock and an in-process
 * dispatcher, so waiting, retrying and continuing can be tested as plain
 * function calls. `fire()` returns once every effect it caused, and every
 * transition those effects fired, has finished — except a retry waiting out
 * its backoff, which runs on the `runDue()` after `advance()` has passed it.
 */
export class LifecycleTestKit<T extends LifecycleTypes> {
  public readonly store: MemoryLifecycleStore = new MemoryLifecycleStore();
  public readonly runtime: LifecycleRuntime;
  public readonly dispatcher: InProcessDispatcher;
  private clock: number;
  private readonly failures = new Map<string, number>();

  public constructor(
    private readonly lifecycle: Lifecycle<T>,
    options: LifecycleTestKitOptions<T> = {},
  ) {
    this.clock = new Date(options.now ?? '2026-01-01T00:00:00Z').getTime();
    const clock = (): Date => new Date(this.clock);
    this.dispatcher = new InProcessDispatcher({
      clock,
      ...(options.retries === undefined ? {} : { retries: options.retries }),
    });
    this.runtime = new LifecycleRuntime({
      store: this.store,
      clock,
      dispatcher: this.dispatcher,
      beforeEffect: (effect: string): void => {
        const remaining = this.failures.get(effect) ?? 0;
        if (remaining > 0) {
          this.failures.set(effect, remaining - 1);
          throw new Error(`Simulated failure of "${effect}".`);
        }
      },
    });
    this.dispatcher.attach(this.runtime);
    const overrides = options.parameters ?? {};
    this.runtime.register(lifecycle, {
      ...(options.services === undefined ? {} : { services: options.services }),
      parameters: (): Partial<ParametersOf<T>> => overrides,
    });
  }

  public now(): Date {
    return new Date(this.clock);
  }

  /** Moves the fake clock on. Retries it passes run on the next `runDue()`. */
  public advance(duration: Duration): void {
    this.clock += millis(duration);
  }

  /** Runs every retry whose backoff the clock has passed; returns how many. */
  public runDue(): Promise<number> {
    return this.dispatcher.runDue();
  }

  /**
   * Inserts a record in the initial state directly, as a seed would. It
   * bypasses the definition's `create` checks — `validate` and `guard` — and
   * writes no `$create` entry, which suits a test about later transitions;
   * test who may create what with `start()`, which goes through
   * `runtime.create()`.
   */
  public create(values: Readonly<Record<string, unknown>> = {}): T['record'] {
    return this.store.insertRecord(this.lifecycle.collection, {
      ...values,
      [this.lifecycle.stateField]: this.lifecycle.initial,
      [this.lifecycle.changedAtField]: this.now().toISOString(),
      [this.lifecycle.versionField]: 0,
    });
  }

  /**
   * Creates a record through the lifecycle, as `runtime.create()` does: the
   * history starts with the creation, and the initial state's `onEnter`
   * effects run before it returns.
   */
  public async start(
    values: Readonly<Record<string, unknown>> = {},
    options: KitFireOptions & { readonly state?: T['state'] } = {},
  ): Promise<T['record']> {
    const { record } = await this.runtime.create(this.lifecycle.name, values, {
      actor: actorOf(options.actor),
      ...(options.state === undefined ? {} : { state: options.state }),
    });
    return this.get(record);
  }

  public get(record: RecordRef): T['record'] {
    const current = this.store.record(this.lifecycle.collection, idOf(record));
    if (!current)
      throw new Error(
        `No ${this.lifecycle.collection} record "${String(idOf(record))}".`,
      );
    return current;
  }

  /** Changes fields outside any transition, as an edit form would. */
  public update(
    record: RecordRef,
    values: Readonly<Record<string, unknown>>,
  ): T['record'] {
    return this.store.patchRecord(
      this.lifecycle.collection,
      idOf(record),
      values,
    );
  }

  /** Fires a transition and returns the record once everything it caused has settled. */
  public async fire(
    record: RecordRef,
    transition: string,
    input: JsonObject = {},
    options: KitFireOptions = {},
  ): Promise<T['record']> {
    await this.runtime.fire(this.lifecycle.name, idOf(record), transition, {
      actor: actorOf(options.actor),
      input,
    });
    return this.get(record);
  }

  public available(
    record: RecordRef,
    actor?: string | LifecycleActor,
  ): Promise<AvailableTransition[]> {
    return this.runtime.available(
      this.lifecycle.name,
      idOf(record),
      actorOf(actor),
    );
  }

  /** Asks with `input` when the answer depends on it, as `runtime.can()` does. */
  public can(
    record: RecordRef,
    transition: string,
    actor?: string | LifecycleActor,
    input?: JsonObject,
  ): Promise<TransitionCheck> {
    return this.runtime.can(
      this.lifecycle.name,
      idOf(record),
      transition,
      actorOf(actor),
      input === undefined ? {} : { input },
    );
  }

  public runTriggers(): Promise<number> {
    return this.runtime.runTriggers();
  }

  /** Makes the next `times` attempts of `effect` throw. */
  public failEffect(effect: string, options: { readonly times: number }): void {
    this.failures.set(effect, options.times);
  }

  /** The names of the transitions fired on the record, oldest first. */
  public async history(record: RecordRef): Promise<string[]> {
    return (await this.transitions(record)).map((entry) => entry.transition);
  }

  public async transitions(record: RecordRef): Promise<TransitionEntry[]> {
    return [
      ...(await this.runtime.history(this.lifecycle.name, idOf(record)))
        .transitions,
    ];
  }

  /** The names of the effects the record's transitions owed, oldest first. */
  public async effects(record: RecordRef): Promise<string[]> {
    return (await this.effectRuns(record)).map((run) => run.effect);
  }

  public async effectRuns(record: RecordRef): Promise<EffectRun[]> {
    return [
      ...(await this.runtime.history(this.lifecycle.name, idOf(record)))
        .effectRuns,
    ];
  }
}

export function createLifecycleTestKit<T extends LifecycleTypes>(
  lifecycle: Lifecycle<T>,
  options: LifecycleTestKitOptions<T> = {},
): LifecycleTestKit<T> {
  return new LifecycleTestKit(lifecycle, options);
}
