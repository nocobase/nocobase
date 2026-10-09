import {
  describeLifecycle,
  type EffectDefinition,
  type EffectRetry,
  type Lifecycle,
  type LifecycleDescription,
  type StateHookContext,
  type TransitionContext,
} from './definition.js';
import {
  EffectFailure,
  LifecycleError,
  type Blocker,
  type InputProblem,
  type LifecycleErrorCode,
} from './errors.js';
import {
  checkCreation,
  guardBlockers,
  inputProblems,
  planTransition,
  stateOf,
  transitionsFrom,
  versionOf,
  type ExtraGuard,
} from './plan.js';
import {
  waitingDueAt,
  type EffectRun,
  type EffectRunChanges,
  type EffectRunCondition,
  type EffectRunQuery,
  type IdleRecordCursor,
  type LifecycleStore,
  type PendingContinuation,
  type TransactionOptions,
  type TransitionEntry,
} from './store.js';
import {
  SYSTEM_ACTOR,
  type JsonObject,
  type JsonValue,
  type LifecycleActor,
  type LifecycleRecord,
  type LifecycleTypes,
  type ParametersOf,
  type RecordId,
  type ServicesOf,
} from './types.js';

/**
 * Hands a queued effect run to whatever executes it. The runtime calls it
 * after a transition commits and when a retry is due; executing means calling
 * {@link LifecycleRuntime.runEffect}. A dispatch that is lost is not fatal:
 * the run stays queued and {@link LifecycleRuntime.recover} hands it over again.
 */
export interface EffectDispatcher {
  dispatch(
    runId: string,
    options: { readonly runAfter: string | null },
  ): Promise<void>;
}

export interface LifecycleLogger {
  warn(message: string, details?: unknown): void;
  error(message: string, details?: unknown): void;
}

export interface LifecycleRuntimeOptions {
  readonly store: LifecycleStore;
  /** Defaults to running each effect in process before `fire()` returns. */
  readonly dispatcher?: EffectDispatcher;
  readonly clock?: () => Date;
  readonly logger?: LifecycleLogger;
  /** How long an attempt may run before `recover()` takes it back. Defaults to 5 minutes. */
  readonly leaseMs?: number;
  /** Called before every attempt; a test throws from it to simulate a failure. */
  readonly beforeEffect?: (
    effect: string,
    attempt: number,
  ) => void | Promise<void>;
  /** How `reclaim()` retries the continuations that wait on their runs. */
  readonly continuations?: ContinuationSweepOptions;
}

/**
 * How the sweep retries waiting continuations. After the n-th refused try a
 * continuation waits `backoffMs × factor^(n-1)`, capped at `maxMs`, before
 * the sweep tries it again, and each sweep tries at most `batchSize` of the
 * due ones, those due longest first. A `CONFLICT` is not counted and is
 * tried again after `backoffMs`. An error that is not a refusal, such as a
 * database failing mid-try, is not counted either, but backs off as a
 * refusal does, each such try taking the delay one step further (see
 * {@link PendingContinuation.errorTries}). After `maxAttempts` counted tries
 * the sweep gives up on it: see {@link PendingContinuation.abandonedAt}. So
 * only refusals lead to giving up: an outage never does, and neither does a
 * bug that throws an ordinary error, which is tried at most hourly and
 * logged on its 1st, 2nd, 4th… try until it is fixed.
 */
export interface ContinuationSweepOptions {
  /** Defaults to 100. */
  readonly batchSize?: number;
  /** Defaults to a minute. */
  readonly backoffMs?: number;
  /** Defaults to 2. */
  readonly factor?: number;
  /** Defaults to an hour. */
  readonly maxMs?: number;
  /** Defaults to 10, which the default backoff reaches after about four hours. */
  readonly maxAttempts?: number;
}

/**
 * Services, or a factory for them. The factory receives the store's
 * `transactionHandle` while a transition is decided, and `undefined`
 * elsewhere, so a guard can read through the transaction it runs in.
 */
export type ServicesSource<T extends LifecycleTypes> =
  ServicesOf<T> | ((transactionHandle: unknown) => ServicesOf<T>);

export interface RegisterOptions<T extends LifecycleTypes> {
  readonly services?: ServicesSource<T>;
  /** Administrator overrides, read on every transition so a change applies at once. */
  readonly parameters?: () => Partial<ParametersOf<T>>;
}

/**
 * What the record must still be when the transition is decided, checked
 * inside its transaction. A page passes the version it showed, so a
 * decision made on a stale screen is refused rather than applied.
 */
export interface FireExpectation {
  readonly version?: number | null;
  /** The record must have been in its state since before this instant. */
  readonly changedBefore?: string;
}

export interface FireOptions {
  /** A human action: refuses system-only transitions with NOT_MANUAL. */
  readonly manual?: boolean;
  readonly actor: LifecycleActor;
  readonly input?: JsonObject;
  readonly expect?: FireExpectation;
  /**
   * The caller's key for this request — a form submission, a webhook
   * delivery. Sent again for the same record and transition, it finds the
   * first request's log entry and changes nothing; sent for another
   * transition, it is refused with `REQUEST_REUSED`. Reuse it for the
   * retries of one action, and take a new one for each new decision. An
   * empty key is refused with `INVALID_REQUEST_ID`, and so is one starting
   * with `$`, which is the library's own, such as the one an effect's
   * continuation is logged under.
   */
  readonly requestId?: string;
  /**
   * A transaction to join instead of opening one: the `transactionHandle`
   * an `onTransition` or a services factory receives, or the
   * `@nocobase/db` connection the caller's own transaction received, on the
   * connection the store writes to. The transition is nested in it, so a
   * refusal undoes only the transition's own writes, and its effects and
   * listeners wait for the outermost commit — a rollback drops them. When
   * `fire()` returns, its effect runs are still queued.
   */
  readonly transaction?: unknown;
}

export interface FireResult {
  /**
   * The record as this transition committed it, or as it is now for a
   * replay. When a hook moved it on through `tx`, the record as that left it.
   */
  readonly record: LifecycleRecord;
  readonly entry: TransitionEntry;
  /**
   * Empty for a replay. When a hook moved the record on through `tx`, only
   * the runs of the transition's own effects, not the entered state's.
   */
  readonly effectRuns: readonly EffectRun[];
  /** True when a request with this `requestId` had already fired this transition. */
  readonly replayed?: boolean;
}

/** An effect run, and whether this process knows the effect it names. */
export interface EffectRunView extends EffectRun {
  /**
   * False for an effect no registered lifecycle declares: renamed or
   * removed, or known only to another process in a rolling deploy. Such a
   * run stays queued rather than being given up on.
   */
  readonly registered: boolean;
}

export interface RetryRunOptions {
  /**
   * Retry even though the run's `onFailure` has already moved the record on,
   * or its continuation still waits to, which is then dropped. Only when it
   * is known that the failed attempts had no effect: a payment the provider
   * confirms was never made. A success then still continues only if the
   * record's state allows `onSuccess`.
   */
  readonly force?: boolean;
  /** Why the retry was forced, for the log. */
  readonly reason?: string;
}

export interface PruneOptions {
  /** Runs last changed before this instant. */
  readonly olderThan: Date | string;
  /** Defaults to succeeded and cancelled runs. */
  readonly statuses?: readonly EffectRun['status'][];
}

export interface AvailableTransition {
  readonly name: string;
  readonly title: string;
  readonly to: readonly string[];
  /**
   * Whether every guard lets this actor fire it now, asked with no input.
   * A transition whose answer depends on its input — approving one line of
   * many — is asked with `can()` and that input instead.
   */
  readonly allowed: boolean;
  /** Why not, when it is not allowed: one entry per guard that refused. */
  readonly blockers: readonly Blocker[];
}

/**
 * The answer of `runtime.can()`: allowed, or the reasons it is not — what is
 * wrong with the input, or who or what refuses.
 */
export interface TransitionCheck {
  readonly allowed: boolean;
  readonly blockers: readonly Blocker[];
  /** What `validate` found wrong with the input; empty when no input was given. */
  readonly problems: readonly InputProblem[];
}

export interface CanOptions {
  /**
   * The input the click would send, such as the line an "approve this line"
   * button names. Given, it is validated first and the guards see it; absent,
   * nothing is validated and the guards see `{}`, as in `available()`.
   */
  readonly input?: JsonObject;
}

export interface CreateOptions {
  readonly actor: LifecycleActor;
  /** One of the lifecycle's initial states; the default one when absent. */
  readonly state?: string;
  /** Kept on the creation's log entry, as a transition's input is. */
  readonly input?: JsonObject;
  /** A transaction to join instead of opening one; see {@link FireOptions.transaction}. */
  readonly transaction?: unknown;
}

/**
 * One store transaction shared by the caller and its hooks. Each fire or
 * create nests through the public API as a savepoint: a caught refusal
 * undoes that call, and an uncaught error rolls back the outer transaction.
 * Events and effects wait for the outermost commit.
 */
export interface LifecycleTransaction {
  /** The store's handle for this transaction, such as a `@nocobase/db` connection: write other rows through it. */
  readonly handle: unknown;
  /** The runtime's clock when the transaction began. */
  readonly now: Date;
  /** The record as this transaction sees it. */
  read(lifecycle: string, id: RecordId): Promise<LifecycleRecord | undefined>;
  fire(
    lifecycle: string,
    id: RecordId,
    transition: string,
    options: FireOptions,
  ): Promise<FireResult>;
  create(
    lifecycle: string,
    values: Readonly<Record<string, unknown>>,
    options: CreateOptions,
  ): Promise<FireResult>;
  /**
   * Runs once the outermost transaction commits: a notification about rows
   * written in it. Callbacks and the events and effect dispatch of each
   * lifecycle call in the transaction run in the order they were
   * registered, so a callback registered before a `tx.fire()` runs before
   * that transition's events, and one that must follow them is registered
   * after the call. Nothing runs on a rollback. Best effort, as listeners
   * are — a callback that throws is logged, and nothing runs it again after
   * a crash.
   */
  afterCommit(callback: () => void | Promise<void>): void;
}

/** What happened, told after it committed. */
export interface LifecycleEvent {
  readonly lifecycle: string;
  /** The transition, or `CREATE_TRANSITION` for a creation. */
  readonly transition: string;
  readonly from: string | null;
  readonly to: string;
  /** The record as the transition committed it. */
  readonly record: LifecycleRecord;
  readonly entry: TransitionEntry;
  readonly actor: LifecycleActor;
}

/** A transition the record's new state now allows, before any guard is asked. */
export interface AnnounceEvent extends LifecycleEvent {
  readonly next: string;
}

/**
 * Which events a listener hears. `transition` matches the transition that
 * committed (for `announce`, the one now allowed); `state` matches the state
 * entered.
 */
export interface EventFilter {
  readonly lifecycle?: string;
  readonly transition?: string;
  readonly state?: string;
}

export type LifecycleListener<E> = (event: E) => void | Promise<void>;

interface Subscription {
  readonly event: 'completed' | 'entered' | 'announce';
  readonly filter: EventFilter;
  readonly listener: LifecycleListener<LifecycleEvent>;
}

/** The log entry `runtime.create()` writes, so a record's history starts at its creation. */
export const CREATE_TRANSITION: string = '$create';

/**
 * Everything a page needs to show one record and its buttons: the record,
 * its state and version, what the actor may do and why not, and its history.
 */
export interface RecordView {
  readonly record: LifecycleRecord;
  readonly state: string;
  /** Pass it back as `expect.version` so a stale screen is refused. */
  readonly version: number | null;
  readonly available: readonly AvailableTransition[];
  readonly history: RecordHistory;
}

export interface RecordHistory {
  readonly transitions: readonly TransitionEntry[];
  readonly effectRuns: readonly EffectRun[];
}

interface Registered {
  readonly lifecycle: Lifecycle<LifecycleTypes>;
  readonly services: (transactionHandle: unknown) => object;
  readonly parameters: () => object;
  /** Guards added with `addGuard()`, by transition name. */
  readonly guards: Map<string, ExtraGuard<LifecycleTypes>[]>;
}

/** A transition or creation decided in a transaction, kept until it commits. */
interface Decision {
  /** What the caller is told. */
  readonly result: FireResult;
  /** The record as this transition wrote it: what its listeners are told. */
  readonly written: LifecycleRecord;
  /**
   * A hook moved the record on through `tx` after this transition wrote it,
   * so the state it entered allows nothing any more.
   */
  readonly movedOn: boolean;
}

/** One hook, or `onTransition`, run in a transition's transaction. */
type Step = () => void | Promise<void>;

const silent: LifecycleLogger = { warn: () => {}, error: () => {} };

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function storable(value: unknown): JsonValue {
  const text = JSON.stringify(value === undefined ? null : value);
  if (text === undefined)
    throw new Error('An effect result must be a JSON value.');
  return JSON.parse(text) as JsonValue;
}

/**
 * The prefix of the request ids the library logs under itself. A caller's
 * request id may not start with it, so no caller can spend the key a
 * continuation will need, or pass for one.
 */
const RESERVED_REQUEST_PREFIX = '$';

function checkRequestId(requestId: string | undefined): void {
  if (requestId === '')
    throw new LifecycleError(
      'INVALID_REQUEST_ID',
      'Request id is empty; send a non-empty one, or none at all.',
    );
  if (requestId?.startsWith(RESERVED_REQUEST_PREFIX))
    throw new LifecycleError(
      'INVALID_REQUEST_ID',
      `Request id "${requestId}" starts with "${RESERVED_REQUEST_PREFIX}", which is reserved for the lifecycle's own entries; send another one.`,
    );
}

/** Refusals that mean the record is no longer where the caller found it. */
const MOVED_ON: ReadonlySet<LifecycleErrorCode> = new Set<LifecycleErrorCode>([
  'RECORD_NOT_FOUND',
  'INVALID_STATE',
  'GUARD_REJECTED',
]);

/**
 * The request id an effect's continuation is logged under. It ties the log
 * entry to the run and the outcome that caused it, so `retryRun()` can tell
 * a run that already moved its record on, and a run continues its record at
 * most once per outcome.
 */
function continuationKey(
  runId: string,
  outcome: 'succeeded' | 'failed',
): string {
  return `$run:${runId}:${outcome}`;
}

const CONFLICTS: ReadonlySet<LifecycleErrorCode> = new Set<LifecycleErrorCode>([
  'CONFLICT',
]);

/** A trigger on a record, as its refusals are counted. */
function triggerKey(lifecycle: string, trigger: string, id: RecordId): string {
  return JSON.stringify([lifecycle, trigger, String(id)]);
}

/** What a sweep expects when another sweep or a person got there first. */
const RACED: ReadonlySet<LifecycleErrorCode> = new Set<LifecycleErrorCode>([
  ...MOVED_ON,
  'CONFLICT',
]);

/**
 * Refusals that escaped a hook or an `onTransition`: raised by a lifecycle
 * call it made, or thrown by it, rather than by the transition it ran in. A
 * trigger is refused this way on every sweep until someone fixes the cause,
 * so the sweep says so, while it passes over its own routine refusals quietly.
 */
const raisedInStep = new WeakSet<LifecycleError>();

/**
 * Whether a refusal of a continuation means its record moved on, so nothing
 * is to follow: only when the continuation's own transition was refused on
 * its own record. A refusal a lifecycle call in its `onTransition` or a hook
 * raised — a parent that will not move yet — leaves the record where it was,
 * so the continuation waits instead.
 */
function recordMovedOn(error: LifecycleError): boolean {
  return MOVED_ON.has(error.code) && !raisedInStep.has(error);
}

/** Whether a run of failed tries has reached a count worth a log line: 1, 2, 4, 8… */
function isLogworthy(attempts: number): boolean {
  return attempts > 0 && (attempts & (attempts - 1)) === 0;
}

/** How one try of a pending continuation ended. */
type ContinuationTry =
  /** It fired, or its log entry shows it already had. */
  | { readonly kind: 'continued' }
  /** The record moved on, or left the stay the run served: the continuation is dropped. */
  | { readonly kind: 'movedOn'; readonly error: LifecycleError }
  /**
   * Refused again for a reason time or a deploy can remove — or undone as a
   * whole by a `CONFLICT` or an error that is not a refusal — and kept as
   * `continuation` says, unless the run changed meanwhile and nothing was
   * `recorded`.
   */
  | {
      readonly kind: 'refused';
      readonly error: unknown;
      readonly previous: PendingContinuation;
      readonly continuation: PendingContinuation;
      readonly recorded: boolean;
    }
  /** The run changed since it was read — retried, or continued elsewhere. */
  | { readonly kind: 'changed' };

/** The code a continuation keeps for an exception that was not a refusal. */
const CONTINUATION_ERROR = 'ERROR';

/** How many trigger refusals raised inside a transition are counted at once, for the log. */
const TRIGGER_REFUSALS_KEPT = 1000;

function isRefusal(
  error: unknown,
  codes: ReadonlySet<LifecycleErrorCode>,
): error is LifecycleError {
  return error instanceof LifecycleError && codes.has(error.code);
}

function isObject(value: unknown): value is object {
  return (
    (typeof value === 'object' && value !== null) || typeof value === 'function'
  );
}

/** A record of a lifecycle, as the transitions a transaction made are noted. */
function moveKey(lifecycle: string, id: RecordId): string {
  return JSON.stringify([lifecycle, String(id)]);
}

function joining(transaction: unknown): TransactionOptions | undefined {
  return transaction === undefined ? undefined : { within: transaction };
}

/** The delay before retrying after `attempt`: grows by `factor`, capped at `maxMs`. */
function backoffMs(retry: EffectRetry | undefined, attempt: number): number {
  const base = retry?.backoffMs ?? 0;
  const delay = base * (retry?.factor ?? 1) ** (attempt - 1);
  return Math.min(delay, retry?.maxMs ?? Number.POSITIVE_INFINITY);
}

class InlineDispatcher implements EffectDispatcher {
  public constructor(private readonly runtime: LifecycleRuntime) {}

  public async dispatch(runId: string): Promise<void> {
    await this.runtime.runEffect(runId);
  }
}

/**
 * Fires transitions, runs their effects and sweeps triggers for every
 * registered lifecycle. It keeps no state of its own: the store holds the
 * records, the transition log and the effect runs, so any process holding a
 * runtime over the same store can continue another one's work.
 */
export class LifecycleRuntime {
  private readonly store: LifecycleStore;
  private readonly dispatcher: EffectDispatcher;
  private readonly clock: () => Date;
  private readonly logger: LifecycleLogger;
  private readonly leaseMs: number;
  private readonly beforeEffect: LifecycleRuntimeOptions['beforeEffect'];
  private readonly continuations: Required<ContinuationSweepOptions>;
  private readonly lifecycles = new Map<string, Registered>();
  private readonly subscriptions: Subscription[] = [];
  /** Attempts running in this process, so `cancelRun()` can abort them. */
  private readonly attempts = new Map<string, AbortController>();
  /**
   * The records each running transition's transaction moved on, by the
   * transaction's handle: what a hook fired through `tx`, or through a
   * lifecycle call given that handle as its `transaction`. See `runSteps()`.
   */
  private readonly moves = new WeakMap<object, Set<string>>();
  /**
   * How many sweeps in a row a trigger was refused on a record by a
   * lifecycle call inside its transition, and with which code, so the log
   * says so on the 1st, 2nd, 4th… sweep. Bounded: the oldest are forgotten.
   */
  private readonly triggerRefusals = new Map<
    string,
    { readonly code: string; readonly count: number }
  >();

  public constructor(options: LifecycleRuntimeOptions) {
    this.store = options.store;
    this.dispatcher = options.dispatcher ?? new InlineDispatcher(this);
    this.clock = options.clock ?? ((): Date => new Date());
    this.logger = options.logger ?? silent;
    this.leaseMs = options.leaseMs ?? 5 * 60_000;
    this.beforeEffect = options.beforeEffect;
    this.continuations = {
      batchSize: options.continuations?.batchSize ?? 100,
      backoffMs: options.continuations?.backoffMs ?? 60_000,
      factor: options.continuations?.factor ?? 2,
      maxMs: options.continuations?.maxMs ?? 3_600_000,
      maxAttempts: options.continuations?.maxAttempts ?? 10,
    };
  }

  public register<T extends LifecycleTypes>(
    lifecycle: Lifecycle<T>,
    options: RegisterOptions<T> = {},
  ): void {
    if (this.lifecycles.has(lifecycle.name))
      throw new LifecycleError(
        'INVALID_DEFINITION',
        `Lifecycle "${lifecycle.name}" is already registered.`,
      );
    const source = options.services;
    this.lifecycles.set(lifecycle.name, {
      lifecycle: lifecycle as unknown as Lifecycle<LifecycleTypes>,
      services:
        typeof source === 'function' ? source : (): object => source ?? {},
      parameters: options.parameters ?? ((): object => ({})),
      guards: new Map(),
    });
  }

  /**
   * Adds a guard to transitions of a registered lifecycle from outside its
   * definition, the way another plugin would veto approvals while a budget
   * is frozen. `'*'` adds it to every transition. Its refusals join the
   * blockers of `available()`, `can()` and `fire()`. Returns a function that
   * removes it again.
   */
  public addGuard<T extends LifecycleTypes>(
    name: string,
    transitions: string | readonly string[],
    guard: ExtraGuard<T>,
  ): () => void {
    const registered = this.get(name);
    const names =
      transitions === '*'
        ? [...registered.lifecycle.transitions.keys()]
        : typeof transitions === 'string'
          ? [transitions]
          : [...transitions];
    for (const transition of names)
      if (!registered.lifecycle.transitions.has(transition))
        throw new LifecycleError(
          'UNKNOWN_TRANSITION',
          `Lifecycle "${name}" has no transition "${transition}".`,
        );
    const added = guard as unknown as ExtraGuard<LifecycleTypes>;
    for (const transition of names) {
      const list = registered.guards.get(transition) ?? [];
      list.push(added);
      registered.guards.set(transition, list);
    }
    return (): void => {
      for (const transition of names) {
        const list = registered.guards.get(transition) ?? [];
        registered.guards.set(
          transition,
          list.filter((other) => other !== added),
        );
      }
    };
  }

  public describe(name: string): LifecycleDescription {
    return describeLifecycle(this.get(name).lifecycle);
  }

  /** The defaults merged with the current overrides. */
  public parameters(name: string): object {
    const registered = this.get(name);
    return { ...registered.lifecycle.parameters, ...registered.parameters() };
  }

  /**
   * Fires one transition. The state check, the record update, the log entry
   * and the effect runs it owes are one transaction; effects are dispatched
   * and listeners told only after it commits. With `transaction`, that is
   * the caller's: the transition is nested in it and its effects wait for
   * its outermost commit.
   */
  public async fire(
    name: string,
    id: RecordId,
    transition: string,
    options: FireOptions,
  ): Promise<FireResult> {
    const registered = this.get(name);
    checkRequestId(options.requestId);
    const now = this.clock();
    const inner: { handle?: unknown } = {};
    const result = await this.store.transaction(async (store) => {
      inner.handle = store.transactionHandle;
      const outcome: { decided?: Decision } = {};
      // Registered before deciding, so after the commit this transition is
      // told about before anything its onTransition started.
      store.afterCommit(() => {
        const { decided } = outcome;
        return decided && !decided.result.replayed
          ? this.settle(registered, decided, options.actor)
          : undefined;
      });
      outcome.decided = await this.decide(
        store,
        registered,
        id,
        transition,
        options,
        now,
      );
      return outcome.decided.result;
    }, joining(options.transaction));
    this.noteMoves(
      options.transaction,
      inner.handle,
      result.replayed ? undefined : moveKey(name, id),
    );
    return result;
  }

  /** Runs work on the store; each tx call nests as a savepoint. */
  public transaction<R>(
    work: (tx: LifecycleTransaction) => Promise<R>,
  ): Promise<R> {
    return this.store.transaction((store) =>
      work(this.scope(store, this.clock())),
    );
  }

  private scope(store: LifecycleStore, now: Date): LifecycleTransaction {
    return Object.freeze({
      handle: store.transactionHandle,
      now,
      read: (name: string, id: RecordId) =>
        store.findRecord(this.get(name).lifecycle.collection, id),
      fire: (
        name: string,
        id: RecordId,
        transition: string,
        options: FireOptions,
      ) =>
        this.fire(name, id, transition, {
          ...options,
          transaction: store.transactionHandle,
        }),
      create: (
        name: string,
        values: Readonly<Record<string, unknown>>,
        options: CreateOptions,
      ) =>
        this.create(name, values, {
          ...options,
          transaction: store.transactionHandle,
        }),
      afterCommit: (callback: () => void | Promise<void>): void => {
        store.afterCommit(async () => {
          try {
            await callback();
          } catch (error) {
            this.logger.error('An afterCommit callback failed', { error });
          }
        });
      },
    });
  }

  /**
   * Runs a transition's hooks in order. A hook has moved the record on once
   * a lifecycle call it made on this transaction — `tx.fire()`, or a call
   * given its handle as `transaction` — completed a transition of this
   * lifecycle on this record, directly or through the calls that one made in
   * turn. Returns the record as it then is, read once, without running the
   * steps after that one; undefined when every step ran without moving it.
   * Only transitions count: a hook that advances the version itself, as a
   * fence or an edit does, or that fires another lifecycle sharing the
   * record's version field, has not moved this lifecycle's record on.
   */
  private async runSteps(
    store: LifecycleStore,
    lifecycle: Lifecycle<LifecycleTypes>,
    id: RecordId,
    steps: readonly Step[],
  ): Promise<LifecycleRecord | undefined> {
    if (!steps.length) return undefined;
    const handle = store.transactionHandle;
    const moved = new Set<string>();
    if (isObject(handle)) this.moves.set(handle, moved);
    const key = moveKey(lifecycle.name, id);
    for (const step of steps) {
      try {
        await step();
      } catch (error) {
        if (error instanceof LifecycleError) raisedInStep.add(error);
        throw error;
      }
      if (moved.has(key)) return store.findRecord(lifecycle.collection, id);
    }
    return undefined;
  }

  /**
   * After a lifecycle call joined `outer` and committed into it: what it
   * moved — `key`, its own record, unless it moved nothing — and what the
   * calls made inside it moved, are told to the transition running on
   * `outer`, if one is. A call refused or rolled back never gets here.
   */
  private noteMoves(
    outer: unknown,
    inner: unknown,
    key: string | undefined,
  ): void {
    if (!isObject(outer)) return;
    const log = this.moves.get(outer);
    if (!log) return;
    if (key !== undefined) log.add(key);
    const nested = isObject(inner) ? this.moves.get(inner) : undefined;
    if (nested) for (const each of nested) log.add(each);
  }

  /**
   * Listens to transitions after they commit: `completed` once per
   * transition (and creation), `entered` once per state entered, and
   * `announce` once per transition the new state allows — what a to-do list
   * needs. Delivery is best effort: a listener that throws is logged and the
   * caller is not told, and nothing is delivered again after a crash, so
   * work that must happen belongs in an effect. Returns a function that
   * stops listening.
   */
  public on(
    event: 'completed' | 'entered',
    filter: EventFilter,
    listener: LifecycleListener<LifecycleEvent>,
  ): () => void;
  public on(
    event: 'announce',
    filter: EventFilter,
    listener: LifecycleListener<AnnounceEvent>,
  ): () => void;
  public on(
    event: 'completed' | 'entered' | 'announce',
    filter: EventFilter,
    listener:
      LifecycleListener<LifecycleEvent> | LifecycleListener<AnnounceEvent>,
  ): () => void {
    const subscription: Subscription = {
      event,
      filter,
      listener: listener as LifecycleListener<LifecycleEvent>,
    };
    this.subscriptions.push(subscription);
    return (): void => {
      const index = this.subscriptions.indexOf(subscription);
      if (index >= 0) this.subscriptions.splice(index, 1);
    };
  }

  /**
   * The transitions the record's state allows, each with whether `actor`
   * may fire it now and, if not, every reason why.
   */
  public async available(
    name: string,
    id: RecordId,
    actor: LifecycleActor,
  ): Promise<AvailableTransition[]> {
    const registered = this.get(name);
    const { lifecycle } = registered;
    const record = await this.require(registered, id);
    const context = this.guardContext(registered, record, actor);
    const result: AvailableTransition[] = [];
    for (const transition of transitionsFrom(
      lifecycle,
      stateOf(lifecycle, record),
    )) {
      if (!transition.manual) continue;
      const blockers = await guardBlockers(
        transition,
        context,
        registered.guards.get(transition.name),
      );
      result.push({
        name: transition.name,
        title: transition.title,
        to: [...transition.to],
        allowed: blockers.length === 0,
        blockers,
      });
    }
    return result;
  }

  /**
   * Whether `actor` may fire `transition` on the record now, with `input`
   * when the answer depends on it. A transition the record's state does not
   * allow is refused with a `state` blocker before anything else is asked;
   * input that `validate` refuses is answered with its problems before any
   * guard is asked, as `fire()` would. It is a preview: `fire()` decides
   * again inside its transaction.
   */
  public async can(
    name: string,
    id: RecordId,
    transition: string,
    actor: LifecycleActor,
    options: CanOptions = {},
  ): Promise<TransitionCheck> {
    const registered = this.get(name);
    const { lifecycle } = registered;
    const declared = lifecycle.transitions.get(transition);
    if (!declared)
      throw new LifecycleError(
        'UNKNOWN_TRANSITION',
        `Lifecycle "${name}" has no transition "${transition}".`,
      );
    if (!declared.manual)
      return {
        allowed: false,
        blockers: [
          {
            source: 'manual',
            kind: 'permission',
            code: 'NOT_MANUAL',
            message: `"${transition}" is fired by the system, not by a person.`,
          },
        ],
        problems: [],
      };
    const record = await this.require(registered, id);
    const state = stateOf(lifecycle, record);
    if (!declared.from.includes(state))
      return {
        allowed: false,
        blockers: [
          {
            source: 'state',
            kind: 'precondition',
            code: 'INVALID_STATE',
            message: `"${transition}" cannot start from "${state}".`,
          },
        ],
        problems: [],
      };
    const { input } = options;
    if (input !== undefined) {
      const problems = inputProblems(declared, input);
      if (problems.length) return { allowed: false, blockers: [], problems };
    }
    const blockers = await guardBlockers(
      declared,
      this.guardContext(registered, record, actor, input ?? {}),
      registered.guards.get(transition),
    );
    return { allowed: blockers.length === 0, blockers, problems: [] };
  }

  /**
   * Creates a record through the lifecycle: in one transaction it checks the
   * definition's `create` — the values, then the guard — and writes the
   * record in an initial state, a log entry from nothing, and the effect runs
   * the state's `onEnter` owes, so a record's history starts where it does.
   * A refusal writes nothing and is a `LifecycleError` as a transition's is.
   * With `transaction`, the creation joins the caller's transaction as
   * `fire()` does, so a parent can create its children in its own.
   */
  public async create(
    name: string,
    values: Readonly<Record<string, unknown>>,
    options: CreateOptions,
  ): Promise<FireResult> {
    const registered = this.get(name);
    const { lifecycle } = registered;
    const state = options.state ?? lifecycle.initial;
    if (!lifecycle.initialStates.includes(state))
      throw new LifecycleError(
        'INVALID_STATE',
        `"${state}" is not an initial state of "${name}".`,
      );
    for (const field of [
      lifecycle.stateField,
      lifecycle.changedAtField,
      lifecycle.versionField,
    ])
      if (field in values)
        throw new LifecycleError(
          'INVALID_SET',
          `Creating a ${name} record may not set "${field}"; the lifecycle owns it.`,
        );
    const now = this.clock();
    const at = now.toISOString();
    const inner: { handle?: unknown } = {};
    const result = await this.store.transaction(async (store) => {
      inner.handle = store.transactionHandle;
      await checkCreation(lifecycle, {
        values,
        state,
        actor: options.actor,
        input: options.input ?? {},
        parameters: this.parameters(name) as ParametersOf<LifecycleTypes>,
        services: registered.services(
          store.transactionHandle,
        ) as ServicesOf<LifecycleTypes>,
        now,
      });
      const record = await store.createRecord(lifecycle.collection, {
        ...values,
        [lifecycle.stateField]: state,
        [lifecycle.changedAtField]: at,
        [lifecycle.versionField]: 1,
      });
      const entry = await store.appendTransition({
        lifecycle: lifecycle.name,
        recordId: String(record.id),
        transition: CREATE_TRANSITION,
        from: null,
        to: state,
        actorId: options.actor.id,
        input: options.input ?? {},
        at,
        version: 1,
        requestId: null,
      });
      const outcome: { created?: Decision } = {};
      store.afterCommit(() =>
        outcome.created
          ? this.settle(registered, outcome.created, options.actor)
          : undefined,
      );
      const hooks = lifecycle.onEnterState.get(state) ?? [];
      const context: StateHookContext<LifecycleTypes> = Object.freeze({
        lifecycle: name,
        record,
        previous: null,
        from: null,
        to: state,
        transition: CREATE_TRANSITION,
        actor: options.actor,
        input: options.input ?? {},
        entry,
        parameters: this.parameters(name) as ParametersOf<LifecycleTypes>,
        services: registered.services(
          store.transactionHandle,
        ) as ServicesOf<LifecycleTypes>,
        tx: this.scope(store, now),
        now,
      });
      // A hook that moves the new record on through tx ends its stay in the
      // initial state: the hooks after it and that state's effects are skipped.
      const moved = await this.runSteps(
        store,
        lifecycle,
        record.id,
        hooks.map(
          (hook): Step =>
            () =>
              hook(context),
        ),
      );
      const created: Decision = moved
        ? {
            result: { record: moved, entry, effectRuns: [] },
            written: record,
            movedOn: true,
          }
        : {
            result: {
              record,
              entry,
              effectRuns: await this.owe(
                store,
                lifecycle,
                entry,
                lifecycle.onEnter.get(state) ?? [],
                true,
              ),
            },
            written: record,
            movedOn: false,
          };
      outcome.created = created;
      return created.result;
    }, joining(options.transaction));
    // A creation moves no record that existed, but its hooks may have.
    this.noteMoves(options.transaction, inner.handle, undefined);
    return result;
  }

  /** The names of the registered lifecycles. */
  public names(): string[] {
    return [...this.lifecycles.keys()];
  }

  /** One record with what a page shows for it; see {@link RecordView}. */
  public async view(
    name: string,
    id: RecordId,
    actor: LifecycleActor,
  ): Promise<RecordView> {
    const registered = this.get(name);
    const { lifecycle } = registered;
    const record = await this.require(registered, id);
    return {
      record,
      state: stateOf(lifecycle, record),
      version: versionOf(lifecycle, record),
      available: await this.available(name, id, actor),
      history: await this.history(name, id),
    };
  }

  public async history(name: string, id: RecordId): Promise<RecordHistory> {
    const { lifecycle } = this.get(name);
    const recordId = String(id);
    return {
      transitions: await this.store.listTransitions(lifecycle.name, recordId),
      effectRuns: await this.store.listEffectRuns({
        lifecycle: lifecycle.name,
        recordId,
      }),
    };
  }

  /**
   * Runs one attempt of a queued effect run. Claiming it is a conditional
   * update, so two workers handed the same run execute it once; every later
   * write names the attempt it belongs to, so an attempt `recover()` took
   * back cannot record a result over the attempt that replaced it.
   */
  public async runEffect(
    runId: string,
    signal: AbortSignal = new AbortController().signal,
  ): Promise<EffectRun | undefined> {
    const run = await this.store.findEffectRun(runId);
    if (!run || run.status !== 'queued') return run;
    const registered = this.lifecycles.get(run.lifecycle);
    const effect = registered?.lifecycle.effects.get(run.effect);
    if (!registered || !effect) {
      this.logger.warn(
        `Effect run "${runId}" names "${run.lifecycle}/${run.effect}", which is not registered; it stays queued.`,
      );
      return run;
    }
    const startedAt = this.clock().toISOString();
    // Every attempt was claimed and none came back: the process running it
    // stopped each time. Running it again could stop this one too.
    if (run.attempts >= run.maxAttempts) {
      await this.store.updateEffectRun(
        runId,
        { status: 'queued', attempts: run.attempts },
        {
          status: 'dead',
          error: `None of its ${run.attempts} attempt(s) recorded an outcome; it needs a person to retry it.`,
          claimedAt: null,
          updatedAt: startedAt,
        },
      );
      this.logger.error(`Effect "${effect.name}" is dead`, { runId });
      return this.store.findEffectRun(runId);
    }
    const attempt = run.attempts + 1;
    const claimed = await this.store.updateEffectRun(
      runId,
      { status: 'queued', attempts: run.attempts },
      {
        status: 'running',
        attempts: attempt,
        claimedAt: startedAt,
        updatedAt: startedAt,
      },
    );
    if (!claimed) return this.store.findEffectRun(runId);

    const { lifecycle } = registered;
    let outcome:
      | { ok: true; result: JsonValue }
      | { ok: false; error: string; cause: unknown };
    // One controller per attempt: the caller's signal, cancelRun() and the
    // timeout all abort it.
    const controller = new AbortController();
    const forward = (): void => controller.abort(signal.reason);
    if (signal.aborted) forward();
    else signal.addEventListener('abort', forward, { once: true });
    this.attempts.set(runId, controller);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const entry = await this.store.findTransition(run.transitionId);
      const record = await this.store.findRecord(
        lifecycle.collection,
        run.recordId,
      );
      if (!entry || !record)
        throw new Error('Its transition or record no longer exists.');
      await this.beforeEffect?.(effect.name, attempt);
      const work = Promise.resolve(
        effect.run({
          record,
          input: entry.input,
          transition: entry.transition,
          from: entry.from,
          to: entry.to,
          attempt,
          idempotencyKey: `${lifecycle.name}:${runId}`,
          parameters: this.parameters(
            lifecycle.name,
          ) as ParametersOf<LifecycleTypes>,
          services: registered.services(
            undefined,
          ) as ServicesOf<LifecycleTypes>,
          signal: controller.signal,
          now: this.clock(),
        }),
      );
      const limit = effect.timeoutMs;
      const value: unknown =
        limit === undefined
          ? await work
          : await Promise.race([
              work,
              new Promise<never>((_, reject) => {
                timer = setTimeout(() => {
                  const error = new Error(`Timed out after ${limit} ms.`);
                  controller.abort(error);
                  reject(error);
                }, limit);
              }),
            ]);
      outcome = { ok: true, result: storable(value) };
    } catch (error) {
      outcome = { ok: false, error: errorText(error), cause: error };
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', forward);
      this.attempts.delete(runId);
    }

    const finishedAt = this.clock().toISOString();
    // An EffectFailure is an answer, not an outage, unless it says otherwise.
    const failure =
      !outcome.ok && outcome.cause instanceof EffectFailure
        ? outcome.cause
        : undefined;
    if (
      !outcome.ok &&
      attempt < run.maxAttempts &&
      (failure ? failure.retry : true) &&
      (effect.retry?.shouldRetry?.(outcome.cause, attempt) ?? true)
    ) {
      const runAfter = new Date(
        this.clock().getTime() + backoffMs(effect.retry, attempt),
      ).toISOString();
      const requeued = await this.store.updateEffectRun(
        runId,
        { status: 'running', attempts: attempt },
        {
          status: 'queued',
          error: outcome.error,
          claimedAt: null,
          runAfter,
          updatedAt: finishedAt,
        },
      );
      if (requeued) await this.handOver(runId, runAfter);
      else this.discarded(effect.name, runId, attempt);
      return this.store.findEffectRun(runId);
    }

    const status: PendingContinuation['outcome'] = outcome.ok
      ? 'succeeded'
      : 'failed';
    const changes: EffectRunChanges = outcome.ok
      ? {
          status: 'succeeded',
          result: outcome.result,
          error: null,
          claimedAt: null,
          updatedAt: finishedAt,
        }
      : {
          status: 'failed',
          error: outcome.error,
          claimedAt: null,
          updatedAt: finishedAt,
        };
    const next = outcome.ok ? effect.onSuccess : effect.onFailure;
    // The next transition receives what the effect returned, or why it
    // failed, so it can record a payment reference or a failure reason.
    const input: JsonObject = outcome.ok
      ? isJsonObject(outcome.result)
        ? outcome.result
        : {}
      : failure
        ? {
            error: outcome.error,
            errorCode: failure.code,
            details: this.failureDetails(effect.name, runId, failure),
          }
        : { error: outcome.error };
    // Recording the outcome and firing what follows it commit together: a
    // stop between the two would otherwise leave a succeeded run whose
    // record never moves on.
    let finished: FireResult | null | undefined;
    try {
      finished = await this.store.transaction(async (store) => {
        const recorded = await store.updateEffectRun(
          runId,
          { status: 'running', attempts: attempt },
          changes,
        );
        if (!recorded) return undefined;
        if (next === undefined) return null;
        const continued: { decided?: Decision } = {};
        // Registered before deciding, as fire() does, so after the commit
        // the continuation is told about before anything its onTransition
        // started.
        store.afterCommit(() => {
          const { decided } = continued;
          return decided && !decided.result.replayed
            ? this.settle(registered, decided, SYSTEM_ACTOR)
            : undefined;
        });
        try {
          // Nested, so a refusal — the continuation's own, or one raised by
          // a lifecycle call its onTransition made — undoes everything the
          // continuation wrote and nothing of the outcome.
          continued.decided = await store.transaction(
            (nested) =>
              this.decide(
                nested,
                registered,
                run.recordId,
                next,
                {
                  actor: SYSTEM_ACTOR,
                  input,
                  requestId: continuationKey(runId, status),
                },
                this.clock(),
                run,
              ),
            { within: store.transactionHandle },
          );
          return continued.decided.result;
        } catch (error) {
          // A conflict, or anything that is not a refusal, may go away: roll
          // the outcome back too, so the attempt runs again rather than
          // losing what should follow. Any other refusal would be the same
          // on every attempt, so the effect does not run again: the outcome
          // is recorded either way.
          if (!(error instanceof LifecycleError) || error.code === 'CONFLICT')
            throw error;
          const message = `Effect "${run.effect}" could not continue with "${next}": ${error.message}`;
          // The record moved on, or its guard refuses: nothing follows.
          if (recordMovedOn(error)) {
            this.logger.warn(message, { runId, code: error.code });
            return null;
          }
          // A lifecycle call the continuation made was refused — a parent
          // not ready to move — or the continuation cannot be fired as this
          // process defines it — an old definition in a rolling deploy, a
          // bug in `set` or `route` — which time or a deploy can change: it
          // waits on the run for reclaim() or continueRun() to try again.
          const nested = raisedInStep.has(error);
          const waits = `${message}. The outcome is recorded and the continuation is tried again by the sweep.`;
          if (nested) this.logger.warn(waits, { runId, code: error.code });
          else this.logger.error(waits, { runId, code: error.code, error });
          const waiting = this.refusedContinuation(
            {
              transition: next,
              outcome: status,
              input,
              error: '',
              code: '',
              attempts: 0,
              errorTries: 0,
              failedAt: finishedAt,
              dueAt: finishedAt,
              abandonedAt: null,
            },
            error,
            finishedAt,
            'refusal',
          );
          await store.updateEffectRun(
            runId,
            { status, attempts: attempt },
            { continuation: waiting },
          );
          if (waiting.abandonedAt) this.gaveUp(runId, waiting);
          return null;
        }
      });
    } catch (error) {
      // Nothing of the outcome stuck. Put the attempt back in the queue now,
      // after a backoff, rather than leaving it claimed until a lease expires
      // and someone calls reclaim(); the run stays claimed only when even
      // this write fails, and then reclaim() takes it back.
      const runAfter = new Date(
        this.clock().getTime() + backoffMs(effect.retry, attempt),
      ).toISOString();
      const requeued = await this.store.updateEffectRun(
        runId,
        { status: 'running', attempts: attempt },
        {
          status: 'queued',
          error: `Its outcome could not be recorded: ${errorText(error)}`,
          claimedAt: null,
          runAfter,
          updatedAt: this.clock().toISOString(),
        },
      );
      if (!requeued) throw error;
      this.logger.warn(
        `Effect "${effect.name}" ran, but its outcome could not be recorded; attempt ${attempt} is queued again.`,
        { runId, error },
      );
      await this.handOver(runId, runAfter);
      return this.store.findEffectRun(runId);
    }
    // The continuation, if any, was settled when the transaction committed.
    if (finished === undefined) this.discarded(effect.name, runId, attempt);
    // A forced retry that failed again: its continuation already ran.
    else if (finished?.replayed) return this.store.findEffectRun(runId);
    if (!outcome.ok)
      this.logger.warn(
        `Effect "${effect.name}" failed after ${attempt} attempt(s)`,
        { runId, error: outcome.error },
      );
    return this.store.findEffectRun(runId);
  }

  /**
   * Effect runs for an operations page: the stuck, the failed, the dead,
   * those whose continuation is pending (`continuationPending: true`) and
   * those whose continuation the sweep gave up on
   * (`continuationAbandoned: true`). Each says whether this process knows
   * its effect.
   */
  public async listEffectRuns(
    query: EffectRunQuery = {},
  ): Promise<EffectRunView[]> {
    const runs = await this.store.listEffectRuns(query);
    return runs.map((run) => ({ ...run, registered: this.knows(run) }));
  }

  /**
   * Runs a failed, dead or cancelled run again, with a fresh budget of
   * attempts — once whatever made it fail is fixed. A run whose `onFailure`
   * already moved the record on is refused with `RUN_SETTLED`: the record
   * has left the state the effect served, and a success now would do its
   * work without the record following, as a payment made while the report
   * waits for reconciliation. Recover through the record's own transitions,
   * or pass `force` when the failed attempts are known to have had no
   * effect. The attempt count goes on from where it was: an earlier attempt
   * still finishing somewhere cannot pass for a new one.
   *
   * A failed run whose `onFailure` is still pending, or was given up on by
   * the sweep, is refused the same way, since its continuation is due to
   * move the record on: continue it with `continueRun()`, or retry it with
   * `force`, which drops it.
   *
   * Those are the only settled runs it refuses; it also refuses a run that
   * is not failed, dead or cancelled with `INVALID_STATE`, and one whose
   * effect this process does not know with `UNKNOWN_EFFECT`. A dead or
   * cancelled run, a run whose effect has no `onFailure`, or one whose
   * continuation was refused because the record moved on is retried without
   * `force` even when the record has since left the state the effect served
   * or entered it again; check the record before retrying such a run, or its
   * success may do the work twice.
   */
  public async retryRun(
    runId: string,
    options: RetryRunOptions = {},
  ): Promise<EffectRun | undefined> {
    const run = await this.store.findEffectRun(runId);
    if (!run) return undefined;
    if (
      run.status !== 'failed' &&
      run.status !== 'dead' &&
      run.status !== 'cancelled'
    )
      throw new LifecycleError(
        'INVALID_STATE',
        `Effect run "${runId}" is ${run.status}; only a failed, dead or cancelled run can be retried.`,
      );
    const effect = this.lifecycles
      .get(run.lifecycle)
      ?.lifecycle.effects.get(run.effect);
    if (!effect)
      throw new LifecycleError(
        'UNKNOWN_EFFECT',
        `Effect run "${runId}" names "${run.lifecycle}/${run.effect}", which is not registered here.`,
      );
    const continued = await this.store.findTransitionByRequest(
      run.lifecycle,
      run.recordId,
      continuationKey(runId, 'failed'),
    );
    if (continued && options.force !== true)
      throw new LifecycleError(
        'RUN_SETTLED',
        `Effect run "${runId}" already moved the record on with "${continued.transition}" to "${continued.to}"; recover through the record's own transitions, or retry with force once its attempts are known to have had no effect.`,
      );
    const { continuation } = run;
    if (continuation && options.force !== true)
      throw new LifecycleError(
        'RUN_SETTLED',
        `Effect run "${runId}" is to move the record on with "${continuation.transition}", which is waiting to be tried again; continue it with continueRun(), or retry with force once its attempts are known to have had no effect.`,
      );
    if (continued)
      this.logger.warn(
        `Effect run "${runId}" is retried by force although "${continued.transition}" already followed from it.`,
        { runId, reason: options.reason ?? null },
      );
    else if (continuation)
      this.logger.warn(
        `Effect run "${runId}" is retried by force; the continuation "${continuation.transition}" it owed had not run and is dropped.`,
        { runId, reason: options.reason ?? null },
      );
    const reset = await this.store.updateEffectRun(
      runId,
      {
        status: run.status,
        attempts: run.attempts,
        // Not if a sweep tried the continuation meanwhile.
        continuationDueAt: waitingDueAt(continuation),
      },
      {
        status: 'queued',
        maxAttempts: run.attempts + (effect.retry?.attempts ?? 1),
        error: null,
        claimedAt: null,
        runAfter: null,
        continuation: null,
        updatedAt: this.clock().toISOString(),
      },
    );
    if (reset) await this.handOver(runId, null);
    return this.store.findEffectRun(runId);
  }

  /**
   * Tries a run's pending continuation once, now, rather than waiting for
   * the next `reclaim()`: once the deploy or the definition fix that it
   * waited for is live, or once the sweep has given up on it. Returns the
   * run as it then is, its continuation cleared, or undefined when there is
   * no such run. The effect never runs again, and the effect need not be
   * known here, only its lifecycle. A refusal is thrown as the error it is:
   * one saying the record moved on (`RECORD_NOT_FOUND`, `INVALID_STATE`,
   * `GUARD_REJECTED`) also drops the continuation, and so does
   * `INVALID_STATE` when the record has left the stay an `onEnter` effect's
   * run was queued for, even to enter the same state again; any other
   * refusal leaves it pending with the new error and counts the try, a
   * `CONFLICT` or an error that is not a refusal without counting it, and a
   * continuation the sweep gave up on stays given up on. A run with nothing pending is refused with
   * `NO_CONTINUATION`, and one whose lifecycle this process does not know
   * with `UNKNOWN_LIFECYCLE`.
   */
  public async continueRun(runId: string): Promise<EffectRun | undefined> {
    const run = await this.store.findEffectRun(runId);
    if (!run) return undefined;
    if (!run.continuation)
      throw new LifecycleError(
        'NO_CONTINUATION',
        `Effect run "${runId}" has no continuation waiting to be tried again.`,
      );
    const registered = this.lifecycles.get(run.lifecycle);
    if (!registered)
      throw new LifecycleError(
        'UNKNOWN_LIFECYCLE',
        `Effect run "${runId}" belongs to lifecycle "${run.lifecycle}", which is not registered here.`,
      );
    const tried = await this.tryContinuation(run, registered);
    if (tried.kind === 'movedOn') {
      this.logger.warn(
        `Effect run "${runId}" no longer continues with "${run.continuation.transition}": ${tried.error.message}`,
        { runId, code: tried.error.code },
      );
      throw tried.error;
    }
    if (tried.kind === 'refused') {
      if (
        tried.recorded &&
        tried.continuation.abandonedAt &&
        !tried.previous.abandonedAt
      )
        this.gaveUp(runId, tried.continuation);
      throw tried.error;
    }
    return this.store.findEffectRun(runId);
  }

  /**
   * Gives up on a queued or running run. A running attempt in this process
   * is aborted; one elsewhere finds the run cancelled when it finishes and
   * its outcome is discarded. Nothing follows from a cancelled run.
   */
  public async cancelRun(runId: string): Promise<EffectRun | undefined> {
    const run = await this.store.findEffectRun(runId);
    if (!run) return undefined;
    if (run.status !== 'queued' && run.status !== 'running')
      throw new LifecycleError(
        'INVALID_STATE',
        `Effect run "${runId}" is ${run.status}; only a queued or running run can be cancelled.`,
      );
    const cancelled = await this.store.updateEffectRun(
      runId,
      { status: run.status, attempts: run.attempts },
      {
        status: 'cancelled',
        error: 'Cancelled.',
        claimedAt: null,
        updatedAt: this.clock().toISOString(),
      },
    );
    if (cancelled)
      this.attempts.get(runId)?.abort(new Error('The run was cancelled.'));
    return this.store.findEffectRun(runId);
  }

  /**
   * Deletes finished runs last changed before `olderThan`; returns how many.
   * A run that holds a continuation is kept, whether it waits or the sweep
   * gave up on it: its outcome never moved the record, and the run is the
   * only record of it — a payment made for a report that never became paid.
   * Once `continueRun()` fires it, or a forced retry drops it, the run is
   * pruned as any other.
   */
  public prune(options: PruneOptions): Promise<number> {
    const olderThan =
      typeof options.olderThan === 'string'
        ? options.olderThan
        : options.olderThan.toISOString();
    return this.store.deleteEffectRuns({
      statuses: options.statuses ?? ['succeeded', 'cancelled'],
      updatedBefore: olderThan,
    });
  }

  /**
   * Fires every trigger whose records have waited long enough. Run it on a
   * schedule; it is safe to run on several instances at once, because each
   * transition is a conditional update and a record moved by one sweep is
   * refused by the other. A trigger fires at most `batchSize` transitions
   * per sweep; records its guard refuses stay idle and are paged past, so
   * they cannot keep the records behind them from being reached.
   */
  public async runTriggers(): Promise<number> {
    let fired = 0;
    const failures: unknown[] = [];
    for (const { lifecycle } of this.lifecycles.values()) {
      const parameters = this.parameters(
        lifecycle.name,
      ) as ParametersOf<LifecycleTypes>;
      for (const trigger of lifecycle.triggers.values()) {
        const changedBefore = new Date(
          this.clock().getTime() - trigger.definition.after(parameters),
        ).toISOString();
        let after: IdleRecordCursor | undefined;
        let firedHere = 0;
        while (firedHere < trigger.batchSize) {
          const records = await this.store.findIdleRecords(
            lifecycle.collection,
            {
              stateField: lifecycle.stateField,
              states: trigger.when,
              changedAtField: lifecycle.changedAtField,
              changedBefore,
              limit: trigger.batchSize,
              ...(after ? { after } : {}),
            },
          );
          for (const record of records) {
            if (firedHere >= trigger.batchSize) break;
            try {
              // The record must still be idle when the transition is
              // decided: another sweep may have moved it since this one read it.
              await this.fire(lifecycle.name, record.id, trigger.transition, {
                actor: SYSTEM_ACTOR,
                expect: { changedBefore },
              });
              this.triggerRefusals.delete(
                triggerKey(lifecycle.name, trigger.name, record.id),
              );
              firedHere += 1;
            } catch (error) {
              // Another sweep or a person got there first, or the guard said
              // no: the record is no longer this trigger's business, and
              // nothing is logged, since a guard may refuse the same record
              // on every sweep by design. A refusal from inside the
              // transition — a lifecycle call its onTransition or a hook made
              // — is said aloud instead, so it does not fail unseen forever,
              // on the 1st, 2nd, 4th… sweep it recurs on.
              if (isRefusal(error, RACED)) {
                if (raisedInStep.has(error)) {
                  const sweeps = this.countTriggerRefusal(
                    triggerKey(lifecycle.name, trigger.name, record.id),
                    error.code,
                  );
                  if (isLogworthy(sweeps))
                    this.logger.warn(
                      `Trigger "${trigger.name}" skipped "${trigger.transition}" on ${lifecycle.name} record "${String(record.id)}": ${error.message}`,
                      {
                        lifecycle: lifecycle.name,
                        recordId: String(record.id),
                        transition: trigger.transition,
                        code: error.code,
                        sweeps,
                      },
                    );
                }
                continue;
              }
              // A broken definition or a failing store: keep sweeping the
              // other records, then report it rather than look idle forever.
              this.logger.error(
                `Trigger "${trigger.name}" could not fire "${trigger.transition}" on ${lifecycle.collection} record "${String(record.id)}"`,
                { error },
              );
              failures.push(error);
            }
          }
          const last = records.at(-1);
          if (records.length < trigger.batchSize || !last) break;
          const next: IdleRecordCursor = {
            changedAt: String(last[lifecycle.changedAtField]),
            id: last.id,
          };
          // A store that ignores the cursor would hand back the same page forever.
          if (
            after &&
            after.changedAt === next.changedAt &&
            after.id === next.id
          )
            break;
          after = next;
        }
        fired += firedHere;
      }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1)
      throw new AggregateError(
        failures,
        `${failures.length} triggered transitions failed.`,
      );
    return fired;
  }

  /**
   * Hands over again what no process is working on, without waiting for a
   * restart: every attempt whose lease has expired — its process stopped, or
   * stalled past `leaseMs` — and every queued run that has been due for
   * longer than a lease, whose dispatch was lost. It then tries again the
   * pending continuations that are due; see {@link ContinuationSweepOptions}
   * and `continueRun()`. Run it on the same
   * schedule as `runTriggers()`. Returns how many runs it handed over or
   * continued.
   */
  public async reclaim(): Promise<number> {
    const taken = await this.takeBackStale();
    for (const run of taken) await this.handOver(run.id, null);
    const stranded = await this.strandedRuns();
    for (const run of stranded) await this.handOver(run.id, null);
    const continued = await this.continuePending();
    return taken.length + stranded.length + continued;
  }

  /**
   * Tries once each pending continuation that is due, at most `batchSize`
   * of them and those due longest first, and returns how many fired. A
   * continuation refused again with the error it was refused with before is
   * logged as a warning on its 2nd, 4th, 8th… try, and one failing again
   * with the same error that is not a refusal on its 2nd, 4th, 8th such try;
   * a different refusal or error is logged as an error, since something has
   * changed, and so is giving up on it. A run whose lifecycle this process does not know — a rolling
   * deploy — is put off by its current backoff without counting a try, so
   * it leaves the batch to the runs behind it.
   */
  private async continuePending(): Promise<number> {
    const pending = await this.store.listEffectRuns({
      continuationDueBy: this.clock().toISOString(),
      limit: this.continuations.batchSize,
    });
    let continued = 0;
    for (const run of pending) {
      const { continuation } = run;
      if (!continuation) continue;
      const registered = this.lifecycles.get(run.lifecycle);
      if (!registered) {
        await this.putOff(run, continuation);
        continue;
      }
      let tried: ContinuationTry;
      try {
        tried = await this.tryContinuation(run, registered);
      } catch (error) {
        // The store failed even to record the failure: the next sweep tries again.
        this.logger.warn(
          `Effect run "${run.id}" could not continue with "${continuation.transition}" on this sweep; it is tried again.`,
          { runId: run.id, error },
        );
        continue;
      }
      if (tried.kind === 'continued') continued += 1;
      else if (tried.kind === 'movedOn')
        this.logger.warn(
          `Effect run "${run.id}" no longer continues with "${continuation.transition}": ${tried.error.message}`,
          { runId: run.id, code: tried.error.code },
        );
      else if (tried.kind === 'refused' && tried.recorded)
        this.reportRefusal(run.id, tried);
    }
    return continued;
  }

  /** Logs a refused try of the sweep, as `continuePending()` describes. */
  private reportRefusal(
    runId: string,
    tried: Extract<ContinuationTry, { kind: 'refused' }>,
  ): void {
    const { previous, continuation } = tried;
    if (continuation.abandonedAt) {
      this.gaveUp(runId, continuation);
      return;
    }
    const details = {
      runId,
      code: continuation.code,
      attempts: continuation.attempts,
      errorTries: continuation.errorTries,
    };
    const message = `Effect run "${runId}" could not continue with "${continuation.transition}": ${continuation.error}`;
    const counted = continuation.attempts !== previous.attempts;
    const errored = continuation.errorTries !== previous.errorTries;
    if (
      continuation.code !== previous.code ||
      continuation.error !== previous.error
    ) {
      // A conflict is a race, not a fault.
      if (counted || errored)
        this.logger.error(message, { ...details, error: tried.error });
      else this.logger.warn(message, details);
    } else if (counted && isLogworthy(continuation.attempts))
      this.logger.warn(message, details);
    // An outage that goes on is said again less and less often.
    else if (errored && isLogworthy(continuation.errorTries))
      this.logger.warn(message, details);
  }

  /** Logs once that the sweep gave up on a run's continuation. */
  private gaveUp(runId: string, continuation: PendingContinuation): void {
    this.logger.error(
      `Effect run "${runId}" gave up on continuing with "${continuation.transition}" after ${String(continuation.attempts)} tries: ${continuation.error}. The sweep no longer tries it; continueRun() still can.`,
      { runId, code: continuation.code, attempts: continuation.attempts },
    );
  }

  /**
   * Puts off a run whose lifecycle this process does not know by the
   * backoff it is at, without counting a try: an unregistered lifecycle
   * says nothing about the continuation, and counting it would give up on
   * continuations a rolling deploy is about to serve.
   */
  private async putOff(
    run: EffectRun,
    continuation: PendingContinuation,
  ): Promise<void> {
    const at = this.clock().toISOString();
    try {
      await this.store.updateEffectRun(
        run.id,
        {
          status: run.status,
          attempts: run.attempts,
          continuationDueAt: continuation.dueAt,
        },
        {
          continuation: {
            ...continuation,
            dueAt: this.continuationDue(at, Math.max(continuation.attempts, 1)),
          },
        },
      );
    } catch (error) {
      this.logger.warn(
        `Effect run "${run.id}" names lifecycle "${run.lifecycle}", which is not registered here, and could not be put off.`,
        { runId: run.id, error },
      );
    }
  }

  /**
   * One try of a run's pending continuation, in a transaction of its own:
   * the continuation is cleared on the condition that the run, and the
   * continuation it holds, are still as they were read, and its transition
   * is decided nested, so a refusal undoes only the transition and what its
   * `onTransition` wrote. It is logged under the request id the run's
   * outcome would have used, so a continuation that already fired replays
   * rather than firing twice, and it is dropped once the record has left
   * the stay an `onEnter` effect's run was queued for. A conflict, or
   * anything that is not a refusal, rolls the whole try back, and is then
   * recorded on the continuation in a write of its own, pushing its due time
   * back without counting toward giving up.
   */
  private async tryContinuation(
    run: EffectRun,
    registered: Registered,
  ): Promise<ContinuationTry> {
    const pending = run.continuation;
    if (!pending) return { kind: 'changed' };
    const requestId = continuationKey(run.id, pending.outcome);
    const now = this.clock();
    const at = now.toISOString();
    const read: EffectRunCondition = {
      status: run.status,
      attempts: run.attempts,
      continuationDueAt: waitingDueAt(pending),
    };
    try {
      return await this.store.transaction(
        async (store): Promise<ContinuationTry> => {
          const cleared = await store.updateEffectRun(run.id, read, {
            continuation: null,
            updatedAt: at,
          });
          if (!cleared) return { kind: 'changed' };
          if (
            await store.findTransitionByRequest(
              run.lifecycle,
              run.recordId,
              requestId,
            )
          )
            return { kind: 'continued' };
          const continued: { decided?: Decision } = {};
          store.afterCommit(() => {
            const { decided } = continued;
            return decided && !decided.result.replayed
              ? this.settle(registered, decided, SYSTEM_ACTOR)
              : undefined;
          });
          try {
            continued.decided = await store.transaction(
              (nested) =>
                this.decide(
                  nested,
                  registered,
                  run.recordId,
                  pending.transition,
                  { actor: SYSTEM_ACTOR, input: pending.input, requestId },
                  now,
                  run,
                ),
              { within: store.transactionHandle },
            );
            return { kind: 'continued' };
          } catch (error) {
            if (!(error instanceof LifecycleError) || error.code === 'CONFLICT')
              throw error;
            if (recordMovedOn(error)) return { kind: 'movedOn', error };
            const continuation = this.refusedContinuation(
              pending,
              error,
              at,
              'refusal',
            );
            // Cleared above, in this transaction: nothing waits now.
            await store.updateEffectRun(
              run.id,
              { ...read, continuationDueAt: null },
              { continuation },
            );
            return {
              kind: 'refused',
              error,
              previous: pending,
              continuation,
              recorded: true,
            };
          }
        },
      );
    } catch (error) {
      // Undone as a whole, the clearing included. Record the try on the
      // continuation as it was read, so the sweep backs off rather than
      // trying it again at once. A conflict is a race, tried again soon; an
      // error that is not a refusal — a deadlock, a lost connection — backs
      // off as a refusal does. Neither counts toward giving up: neither says
      // anything about the continuation itself.
      const continuation = this.refusedContinuation(
        pending,
        error,
        at,
        isRefusal(error, CONFLICTS)
          ? 'conflict'
          : error instanceof LifecycleError
            ? 'refusal'
            : 'error',
      );
      let recorded: boolean;
      try {
        recorded = await this.store.updateEffectRun(run.id, read, {
          continuation,
          updatedAt: at,
        });
      } catch {
        // The store itself is failing: the error that started it is what to report.
        throw error;
      }
      return {
        kind: 'refused',
        error,
        previous: pending,
        continuation,
        recorded,
      };
    }
  }

  /**
   * A continuation after one more failed try at `at`: what failed it, its
   * next due time and, once it has been refused `maxAttempts` times, the
   * instant the sweep gives up on it. A `refusal` counts toward giving up
   * and backs off by the refusals so far; a `conflict` counts nothing and
   * is due again after `backoffMs`; an `error` that is not a refusal counts
   * in `errorTries` only and backs off by every counted try so far, so an
   * outage is tried less and less often, up to `maxMs`, and never given up
   * on. One already given up on stays given up on.
   */
  private refusedContinuation(
    pending: PendingContinuation,
    error: unknown,
    at: string,
    kind: 'refusal' | 'conflict' | 'error',
  ): PendingContinuation {
    const attempts =
      kind === 'refusal' ? pending.attempts + 1 : pending.attempts;
    const errorTries =
      kind === 'error' ? pending.errorTries + 1 : pending.errorTries;
    return {
      ...pending,
      error: errorText(error),
      code: error instanceof LifecycleError ? error.code : CONTINUATION_ERROR,
      attempts,
      errorTries,
      failedAt: at,
      dueAt:
        kind === 'conflict'
          ? new Date(
              Date.parse(at) + this.continuations.backoffMs,
            ).toISOString()
          : this.continuationDue(
              at,
              kind === 'refusal' ? attempts : attempts + errorTries,
            ),
      abandonedAt:
        pending.abandonedAt ??
        (kind === 'refusal' && attempts >= this.continuations.maxAttempts
          ? at
          : null),
    };
  }

  /**
   * Whether the record has left the stay `run` was queued for, when the run
   * serves one: an effect of the entered state's `onEnter` does, while an
   * effect the transition itself declares does not, and its continuation is
   * checked only against the state the record is in, as any transition is.
   * The stay ends with the first transition of its lifecycle logged after
   * the run's own, other than one the run's outcome fired. A self-transition
   * ends it too: it leaves the state and enters it again, queuing the
   * state's onEnter effects anew. An edit that advances the version outside
   * the lifecycle logs nothing and does not end it. The answer is the refusal a continuation gets for it. Only the
   * entries after the run's own are read.
   */
  private async stayEnded(
    store: LifecycleStore,
    registered: Registered,
    run: EffectRun,
  ): Promise<LifecycleError | undefined> {
    const { lifecycle } = registered;
    if (!run.stayBound) return undefined;
    const entry = await store.findTransition(run.transitionId);
    const own = `$run:${run.id}:`;
    // Any later transition ends the stay, a self-transition included: it
    // leaves and enters the state again and queues its onEnter effects anew.
    // Only this run's own continuation does not. The version check keeps a
    // store that ignores `after` from counting the entry that queued the run.
    const left = (
      await store.listTransitions(run.lifecycle, run.recordId, {
        after: run.transitionId,
      })
    ).find(
      (later) =>
        (entry === undefined || later.version > entry.version) &&
        later.requestId?.startsWith(own) !== true,
    );
    if (!left) return undefined;
    return new LifecycleError(
      'INVALID_STATE',
      `The ${lifecycle.collection} record "${run.recordId}" has moved on with "${left.transition}" since the transition effect run "${run.id}" was queued for, so what follows from that run no longer applies to it.`,
    );
  }

  /** When a continuation refused `attempts` times, the last at `at`, is due again. */
  private continuationDue(at: string, attempts: number): string {
    const { backoffMs, factor, maxMs } = this.continuations;
    const delay = Math.min(backoffMs * factor ** (attempts - 1), maxMs);
    return new Date(Date.parse(at) + delay).toISOString();
  }

  /** Counts one more sweep a trigger was refused on a record; see `triggerRefusals`. */
  private countTriggerRefusal(key: string, code: string): number {
    const previous = this.triggerRefusals.get(key);
    const count = previous?.code === code ? previous.count + 1 : 1;
    this.triggerRefusals.delete(key);
    this.triggerRefusals.set(key, { code, count });
    if (this.triggerRefusals.size > TRIGGER_REFUSALS_KEPT) {
      const oldest = this.triggerRefusals.keys().next();
      if (!oldest.done) this.triggerRefusals.delete(oldest.value);
    }
    return count;
  }

  /**
   * Hands over again every queued run, and takes back every attempt whose
   * process stopped answering. Call it once a process starts.
   */
  public async recover(): Promise<number> {
    await this.takeBackStale();
    const queued = await this.store.listEffectRuns({ status: 'queued' });
    for (const run of queued) await this.handOver(run.id, run.runAfter);
    return queued.length;
  }

  /**
   * Queued runs due for longer than a lease. A dispatched run is claimed long
   * before that, so one still queued was never handed over: the dispatch
   * failed, or the timer waiting out its backoff died with its process. A run
   * naming an effect this process does not know stays for one that does.
   */
  private async strandedRuns(): Promise<EffectRun[]> {
    const threshold = new Date(
      this.clock().getTime() - this.leaseMs,
    ).toISOString();
    // updatedAt never comes after runAfter, so the query narrows and the
    // filter decides.
    const queued = await this.store.listEffectRuns({
      status: 'queued',
      updatedBefore: threshold,
    });
    return queued.filter(
      (run) => (run.runAfter ?? run.updatedAt) < threshold && this.knows(run),
    );
  }

  private knows(run: EffectRun): boolean {
    return (
      this.lifecycles.get(run.lifecycle)?.lifecycle.effects.has(run.effect) ===
      true
    );
  }

  private async takeBackStale(): Promise<EffectRun[]> {
    const now = this.clock();
    const stale = await this.store.listEffectRuns({
      status: 'running',
      claimedBefore: new Date(now.getTime() - this.leaseMs).toISOString(),
    });
    const taken: EffectRun[] = [];
    for (const run of stale)
      if (
        await this.store.updateEffectRun(
          run.id,
          { status: 'running', attempts: run.attempts },
          {
            status: 'queued',
            error: 'The attempt was interrupted and will run again.',
            claimedAt: null,
            updatedAt: now.toISOString(),
          },
        )
      )
        taken.push(run);
    return taken;
  }

  private get(name: string): Registered {
    const registered = this.lifecycles.get(name);
    if (!registered)
      throw new LifecycleError(
        'UNKNOWN_LIFECYCLE',
        `No lifecycle "${name}" is registered.`,
      );
    return registered;
  }

  private async handOver(
    runId: string,
    runAfter: string | null,
  ): Promise<void> {
    try {
      await this.dispatcher.dispatch(runId, { runAfter });
    } catch (error) {
      this.logger.error(
        `Effect run "${runId}" could not be dispatched; reclaim() hands it over once it has waited a lease, and recover() at the next start.`,
        { error },
      );
    }
  }

  /**
   * Decides and writes one transition on `store`, which is a transaction.
   * Everything it checks comes before anything it writes, so a refusal
   * leaves the transaction as it found it.
   */
  private async decide(
    store: LifecycleStore,
    registered: Registered,
    id: RecordId,
    transition: string,
    options: FireOptions,
    now: Date,
    continuing?: EffectRun,
  ): Promise<Decision> {
    const { lifecycle } = registered;
    if (
      options.manual &&
      lifecycle.transitions.get(transition)?.manual === false
    )
      throw new LifecycleError(
        'NOT_MANUAL',
        `"${transition}" is fired by the system, not by a person.`,
      );
    const current = await store.findRecord(lifecycle.collection, id);
    if (!current)
      throw new LifecycleError(
        'RECORD_NOT_FOUND',
        `No ${lifecycle.collection} record "${String(id)}".`,
      );
    if (options.requestId !== undefined) {
      const earlier = await store.findTransitionByRequest(
        lifecycle.name,
        String(current.id),
        options.requestId,
      );
      // The same key for another transition is not a repeat but a second
      // decision made under a key already spent: replaying the first would
      // report success for something that never ran.
      if (earlier && earlier.transition !== transition)
        throw new LifecycleError(
          'REQUEST_REUSED',
          `Request "${options.requestId}" was already used for "${earlier.transition}" on this ${lifecycle.collection} record; send "${transition}" under a new request id.`,
        );
      // Nor is the same key sent by someone else: replaying would hand them
      // another actor's success and log entry without asking their guards.
      if (earlier && earlier.actorId !== options.actor.id)
        throw new LifecycleError(
          'REQUEST_REUSED',
          `Request "${options.requestId}" was already used by another actor on this ${lifecycle.collection} record; send "${transition}" under a new request id.`,
        );
      if (earlier)
        return {
          result: {
            record: current,
            entry: earlier,
            effectRuns: [],
            replayed: true,
          },
          written: current,
          movedOn: false,
        };
    }
    // Read the record before checking its stay. The conditional update below
    // uses this same version, so a transition committed during or after the
    // history read cannot make an old outcome apply to a newer stay.
    if (continuing) {
      const ended = await this.stayEnded(store, registered, continuing);
      if (ended) throw ended;
    }
    const expected = options.expect;
    if (
      expected?.version !== undefined &&
      versionOf(lifecycle, current) !== expected.version
    )
      throw new LifecycleError(
        'CONFLICT',
        `The ${lifecycle.collection} record "${String(id)}" changed since it was read.`,
      );
    if (
      expected?.changedBefore !== undefined &&
      !(String(current[lifecycle.changedAtField]) < expected.changedBefore)
    )
      throw new LifecycleError(
        'CONFLICT',
        `The ${lifecycle.collection} record "${String(id)}" changed state after ${expected.changedBefore}.`,
      );
    const plan = await planTransition(lifecycle, current, transition, {
      actor: options.actor,
      ...(options.input === undefined ? {} : { input: options.input }),
      parameters: this.parameters(
        lifecycle.name,
      ) as ParametersOf<LifecycleTypes>,
      services: registered.services(
        store.transactionHandle,
      ) as ServicesOf<LifecycleTypes>,
      now,
      guards: registered.guards.get(transition) ?? [],
    });
    const written = await store.updateRecordIf(
      lifecycle.collection,
      id,
      {
        stateField: lifecycle.stateField,
        state: plan.from,
        versionField: lifecycle.versionField,
        version: plan.version,
      },
      plan.values,
    );
    if (!written)
      throw new LifecycleError(
        'CONFLICT',
        `The ${lifecycle.collection} record "${String(id)}" changed while "${transition}" was being decided.`,
      );
    const at = now.toISOString();
    const entry = await store.appendTransition({
      lifecycle: lifecycle.name,
      recordId: String(current.id),
      transition,
      from: plan.from,
      to: plan.to,
      actorId: options.actor.id,
      input: plan.input,
      at,
      version: plan.nextVersion,
      requestId: options.requestId ?? null,
    });
    const record = Object.freeze({
      ...current,
      ...plan.values,
    }) as LifecycleRecord;
    const hook: StateHookContext<LifecycleTypes> = Object.freeze({
      lifecycle: lifecycle.name,
      record,
      previous: current,
      from: plan.from,
      to: plan.to,
      transition,
      actor: options.actor,
      input: plan.input,
      entry,
      parameters: this.parameters(
        lifecycle.name,
      ) as ParametersOf<LifecycleTypes>,
      services: registered.services(
        store.transactionHandle,
      ) as ServicesOf<LifecycleTypes>,
      tx: this.scope(store, now),
      now,
    });
    const definition = lifecycle.transitions.get(transition)?.definition;
    const steps: Step[] = [
      ...(lifecycle.onLeaveState.get(plan.from) ?? []).map(
        (leave): Step =>
          () =>
            leave(hook),
      ),
      ...(definition?.onTransition
        ? [
            (): void | Promise<void> =>
              definition.onTransition?.(
                Object.freeze({
                  record,
                  previous: current,
                  actor: options.actor,
                  input: plan.input,
                  from: plan.from,
                  to: plan.to,
                  entry,
                  parameters: this.parameters(
                    lifecycle.name,
                  ) as ParametersOf<LifecycleTypes>,
                  services: registered.services(
                    store.transactionHandle,
                  ) as ServicesOf<LifecycleTypes>,
                  transactionHandle: store.transactionHandle,
                  tx: hook.tx,
                  now,
                }),
              ),
          ]
        : []),
      ...(lifecycle.onEnterState.get(plan.to) ?? []).map(
        (enter): Step =>
          () =>
            enter(hook),
      ),
    ];
    // A hook or onTransition that fires this record onward through tx has
    // ended the stay this transition began: what is left of the transition
    // would set up, owe and announce a state the record is no longer in.
    const moved = await this.runSteps(store, lifecycle, id, steps);
    // The transition itself still happened, so its own effects are owed;
    // only the entered state's onEnter effects belong to the stay that ended.
    if (moved)
      return {
        result: {
          record: moved,
          entry,
          effectRuns: await this.owe(
            store,
            lifecycle,
            entry,
            lifecycle.transitions.get(transition)?.effects ?? [],
            false,
          ),
        },
        written: record,
        movedOn: true,
      };
    const effectRuns = [
      ...(await this.owe(
        store,
        lifecycle,
        entry,
        lifecycle.transitions.get(transition)?.effects ?? [],
        false,
      )),
      ...(await this.owe(
        store,
        lifecycle,
        entry,
        lifecycle.onEnter.get(plan.to) ?? [],
        true,
      )),
    ];
    return {
      result: { record, entry, effectRuns },
      written: record,
      movedOn: false,
    };
  }

  /** What follows a commit: listeners hear of it, and its effects are handed over. */
  private async settle(
    registered: Registered,
    committed: Decision,
    actor: LifecycleActor,
  ): Promise<void> {
    await this.emit(registered, committed, actor);
    for (const run of committed.result.effectRuns)
      await this.handOver(run.id, null);
  }

  /**
   * Tells the listeners about a committed transition; a failing listener is
   * logged, never thrown. They hear of the record as this transition wrote
   * it. A transition whose record a hook moved on is still `completed` and
   * `entered`, but announces nothing: its state no longer allows anything,
   * and the transition that moved it on announces what the record's state
   * does.
   */
  private async emit(
    registered: Registered,
    committed: Decision,
    actor: LifecycleActor,
  ): Promise<void> {
    if (!this.subscriptions.length) return;
    const { lifecycle } = registered;
    const { entry } = committed.result;
    const record = committed.written;
    const base: LifecycleEvent = Object.freeze({
      lifecycle: lifecycle.name,
      transition: entry.transition,
      from: entry.from,
      to: entry.to,
      record,
      entry,
      actor,
    });
    const deliveries: [Subscription['event'], LifecycleEvent][] = [
      ['completed', base],
      ['entered', base],
      ...(committed.movedOn ? [] : transitionsFrom(lifecycle, entry.to))
        .filter((next) => next.manual)
        .map((next): [Subscription['event'], LifecycleEvent] => [
          'announce',
          Object.freeze({ ...base, next: next.name }) as AnnounceEvent,
        ]),
    ];
    for (const [event, payload] of deliveries)
      for (const subscription of [...this.subscriptions]) {
        if (subscription.event !== event) continue;
        const { filter } = subscription;
        const transition =
          event === 'announce'
            ? (payload as AnnounceEvent).next
            : payload.transition;
        if (
          (filter.lifecycle !== undefined &&
            filter.lifecycle !== payload.lifecycle) ||
          (filter.transition !== undefined &&
            filter.transition !== transition) ||
          (filter.state !== undefined && filter.state !== payload.to)
        )
          continue;
        try {
          await subscription.listener(payload);
        } catch (error) {
          this.logger.error(
            `A "${event}" listener failed on ${lifecycle.name} record "${entry.recordId}"`,
            { error },
          );
        }
      }
  }

  /** Writes a queued run for each effect a log entry owes. */
  private async owe(
    store: LifecycleStore,
    lifecycle: Lifecycle<LifecycleTypes>,
    entry: TransitionEntry,
    effects: readonly EffectDefinition<LifecycleTypes>[],
    stayBound: boolean,
  ): Promise<EffectRun[]> {
    const runs: EffectRun[] = [];
    for (const effect of effects)
      runs.push(
        await store.createEffectRun({
          transitionId: entry.id,
          lifecycle: lifecycle.name,
          recordId: entry.recordId,
          effect: effect.name,
          stayBound,
          status: 'queued',
          attempts: 0,
          maxAttempts: effect.retry?.attempts ?? 1,
          result: null,
          error: null,
          createdAt: entry.at,
          updatedAt: entry.at,
          claimedAt: null,
          runAfter: null,
        }),
      );
    return runs;
  }

  private async require(
    registered: Registered,
    id: RecordId,
  ): Promise<LifecycleRecord> {
    const { lifecycle } = registered;
    const record = await this.store.findRecord(lifecycle.collection, id);
    if (!record)
      throw new LifecycleError(
        'RECORD_NOT_FOUND',
        `No ${lifecycle.collection} record "${String(id)}".`,
      );
    return record;
  }

  /** What a guard sees outside a transition: the input asked about, if any, and no transaction. */
  private guardContext(
    registered: Registered,
    record: LifecycleRecord,
    actor: LifecycleActor,
    input: JsonObject = {},
  ): TransitionContext<LifecycleTypes> {
    return Object.freeze({
      record,
      actor,
      input,
      parameters: this.parameters(
        registered.lifecycle.name,
      ) as ParametersOf<LifecycleTypes>,
      services: registered.services(undefined) as ServicesOf<LifecycleTypes>,
      now: this.clock(),
    });
  }

  /**
   * An `EffectFailure`'s details as `onFailure` receives them. Details that
   * are not JSON — a BigInt, a cycle — would otherwise stop the outcome from
   * being recorded at all and leave the run claimed; they are dropped
   * instead, and the failure is recorded as any other.
   */
  private failureDetails(
    effect: string,
    runId: string,
    failure: EffectFailure,
  ): JsonValue {
    try {
      return storable(failure.details);
    } catch (error) {
      this.logger.error(
        `Effect "${effect}" failed with details that are not JSON; "${failure.code}" is recorded without them.`,
        { runId, error },
      );
      return {};
    }
  }

  private discarded(effect: string, runId: string, attempt: number): void {
    this.logger.warn(
      `Attempt ${attempt} of effect "${effect}" finished after recover() took it back; its outcome is discarded.`,
      { runId },
    );
  }
}
