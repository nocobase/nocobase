import { isDeepStrictEqual } from 'node:util';
import { LifecycleError } from './errors.js';
import {
  recordCondition,
  ownedFields,
  triggerDueAt,
  stateOf,
  versionOf,
} from './plan.js';
import type { EffectRun, LifecycleStore, TransitionEntry } from './store.js';
import type { EffectDefinition, Lifecycle } from './definition.js';
import type { LifecycleRecordChange, LifecycleTransaction } from './runtime.js';
import type {
  RecordId,
  LifecycleActor,
  LifecycleRecord,
  LifecycleTypes,
  ParametersOf,
  ServicesOf,
} from './types.js';

export type ManagementCommand = 'suspend' | 'resume' | 'reset' | 'restartAt';

export interface ManagementResult {
  readonly recordId: string;
  readonly lifecycle: string;
  readonly definitionVersion: number;
  readonly state: string;
  readonly suspended: boolean;
  readonly round: number;
  readonly version: string;
}

export interface ManagementEvent {
  readonly command: ManagementCommand;
  readonly reason: string;
  readonly revision: number;
  readonly previousRound: number;
  readonly expectedVersion: string;
  readonly result: ManagementResult;
}

export interface ManagementAccessContext {
  readonly actor: LifecycleActor;
  readonly record: LifecycleRecord;
  readonly lifecycle: string;
  readonly command: ManagementCommand;
  readonly transactionHandle: unknown;
}

export type ManagementAuthorization = (
  context: ManagementAccessContext,
) => boolean | Promise<boolean>;

export interface ManagementOptions {
  readonly actor: LifecycleActor;
  readonly authorize: ManagementAuthorization;
  readonly reason: string;
  readonly expectedVersion: string;
  readonly requestId: string;
  readonly transaction?: unknown;
  /** A caller-owned stay check, after authorization and idempotent replay. */
  readonly expectCurrent?: (
    context: ManagementAccessContext,
  ) => boolean | Promise<boolean>;
}

export interface ManagementReentryContext<T extends LifecycleTypes> {
  readonly previous: T['record'];
  readonly from: T['state'];
  readonly to: T['state'];
  readonly command: 'reset' | 'restartAt';
  readonly actor: LifecycleActor;
  readonly reason: string;
  readonly parameters: ParametersOf<T>;
  readonly services: ServicesOf<T>;
  readonly tx: LifecycleTransaction;
  readonly now: Date;
}

export interface ManagementResumeContext<T extends LifecycleTypes> {
  readonly previous: T['record'];
  readonly record: T['record'];
  /** The stored ISO timestamp at which this suspension began. */
  readonly suspendedAt: string;
  readonly now: Date;
  /** The duration of this suspension, before it is added to pausedMs. */
  readonly pausedForMs: number;
  readonly actor: LifecycleActor;
  readonly event: ManagementEvent;
  readonly entry: TransitionEntry;
  readonly services: ServicesOf<T>;
  readonly tx: LifecycleTransaction;
}

export interface ManagementPolicy<T extends LifecycleTypes> {
  /** Nullable JSON field, paired with a nullable integer field named `<field>Revision`. */
  readonly field: string;
  /** Acquire any domain lock that must precede the instance lock. */
  readonly prepare?: (tx: LifecycleTransaction) => void | Promise<void>;
  readonly suspend?: boolean;
  readonly reset?: boolean;
  /** Allow an enabled reset to start a new round from an active record. */
  readonly resetWhileActive?: boolean;
  readonly restartAt?: readonly T['state'][];
  /** Allow a new round at a configured target from an active record. */
  readonly restartWhileActive?: boolean;
  readonly canEnter?: (
    context: ManagementReentryContext<T>,
  ) => boolean | Promise<boolean>;
  readonly set?: (
    context: ManagementReentryContext<T>,
  ) =>
    | Readonly<Record<string, unknown>>
    | Promise<Readonly<Record<string, unknown>>>;
  /**
   * Update domain data in the same transaction as the resume and its journal
   * entry. The instance being resumed must keep its lifecycle-owned fields.
   */
  readonly onResume?: (
    context: ManagementResumeContext<T>,
  ) => void | Promise<void>;
  /** Domain changes such as closing old tasks and creating new ones, in this transaction. */
  readonly onReenter?: (
    context: ManagementReentryContext<T> & {
      readonly record: T['record'];
      readonly event: ManagementEvent;
      readonly entry: import('./store.js').TransitionEntry;
    },
  ) => void | Promise<void>;
  readonly onEnter?: Partial<
    Readonly<Record<T['state'], readonly EffectDefinition<T>[]>>
  >;
}

export interface ManagementDetails extends ManagementResult {
  readonly actions: readonly ManagementCommand[];
  readonly targets: readonly string[];
  readonly initial: string;
  readonly work: readonly {
    readonly id: string;
    readonly effect: string;
    readonly status: 'queued' | 'running' | 'continuation';
  }[];
  readonly history: readonly {
    readonly id: string;
    readonly actorId: string;
    readonly at: string;
    readonly from: string;
    readonly requestId: string;
    readonly event: ManagementEvent;
  }[];
}

export interface ManagementState {
  readonly revision: number;
  readonly round: number;
  readonly roundStartedVersion: number;
  readonly suspendedAt: string | null;
  /** Accumulated paused time within this stay. */
  readonly pausedMs: number;
}

export function managementState(
  field: string | undefined,
  record: LifecycleRecord,
): ManagementState {
  const stored = field ? record[field] : undefined;
  return (
    (stored as ManagementState | null | undefined) ?? {
      revision: 0,
      round: 1,
      roundStartedVersion: 0,
      suspendedAt: null,
      pausedMs: 0,
    }
  );
}

export class InstanceLockConflict extends LifecycleError {
  public constructor() {
    super(
      'CONFLICT',
      'The lifecycle instance changed while acquiring its lock.',
    );
  }
}

type Definition = Lifecycle<LifecycleTypes>;

interface ManagedRegistration {
  readonly lifecycle: Definition;
  services(transactionHandle: unknown): object;
}

interface ManagementServices<R extends ManagedRegistration> {
  store: LifecycleStore;
  clock(): Date;
  scope(store: LifecycleStore, now: Date): LifecycleTransaction;
  checkRequestId(id: string): void;
  managedRecord(
    store: LifecycleStore,
    key: string,
    id: RecordId,
    lock?: boolean,
  ): Promise<{ registered: R; record: LifecycleRecord }>;
  reentryContext(
    store: LifecycleStore,
    registered: R,
    record: LifecycleRecord,
    command: 'reset' | 'restartAt',
    to: string,
    actor: LifecycleActor,
    reason: string,
    now: Date,
  ): Promise<ManagementReentryContext<LifecycleTypes>>;
  owe(
    store: LifecycleStore,
    lifecycle: Definition,
    entry: TransitionEntry,
    effects: readonly EffectDefinition<LifecycleTypes>[],
    stayBound: boolean,
  ): Promise<EffectRun[]>;
  handOver(run: EffectRun, runAfter: string | null): Promise<boolean>;
  changed(change: LifecycleRecordChange): Promise<void>;
  tryContinuation(run: EffectRun, registered: R): Promise<unknown>;
}

export class LifecycleManagement<R extends ManagedRegistration> {
  public constructor(private readonly services: ManagementServices<R>) {}

  public async managementDetails(
    key: string,
    id: RecordId,
    actor: LifecycleActor,
    authorize: ManagementAuthorization,
  ): Promise<ManagementDetails | undefined> {
    return this.services.store.transaction(async (store) => {
      const { registered, record } = await this.services.managedRecord(
        store,
        key,
        id,
      );
      const { lifecycle } = registered;
      const policy = lifecycle.management;
      if (!policy) return undefined;
      const allowed = new Set<ManagementCommand>();
      for (const command of [
        'suspend',
        'resume',
        'reset',
        'restartAt',
      ] as const)
        if (
          await authorize({
            actor,
            command,
            record,
            lifecycle: lifecycle.name,
            transactionHandle: store.transactionHandle,
          })
        )
          allowed.add(command);
      if (allowed.size === 0) return undefined;
      const state = managementState(policy.field, record);
      const result = this.managementResult(lifecycle, record, state);
      const actions: ManagementCommand[] = [];
      const targets: string[] = [];
      const canEnter = async (
        command: 'reset' | 'restartAt',
        to: string,
      ): Promise<boolean> => {
        if (!policy.canEnter) return true;
        return policy.canEnter(
          await this.services.reentryContext(
            store,
            registered,
            record,
            command,
            to,
            actor,
            '',
            this.services.clock(),
          ),
        );
      };
      if (result.suspended) {
        if (allowed.has('resume')) actions.push('resume');
      } else if (policy.suspend && allowed.has('suspend')) {
        actions.push('suspend');
      }
      if (
        policy.reset &&
        (result.suspended || policy.resetWhileActive) &&
        allowed.has('reset') &&
        (await canEnter('reset', lifecycle.initial))
      )
        actions.push('reset');
      if (
        (result.suspended || policy.restartWhileActive) &&
        allowed.has('restartAt')
      ) {
        for (const target of policy.restartAt ?? [])
          if (await canEnter('restartAt', target)) targets.push(target);
        if (targets.length) actions.push('restartAt');
      }
      const runs = await store.listEffectRuns({
        lifecycle: lifecycle.name,
        recordId: String(record.id),
      });
      const history = await store.listTransitions(
        lifecycle.name,
        String(record.id),
      );
      const work: ManagementDetails['work'][number][] = [];
      for (const run of runs) {
        const status =
          run.status === 'running'
            ? 'running'
            : run.status === 'queued'
              ? 'queued'
              : run.continuation
                ? 'continuation'
                : undefined;
        if (
          status &&
          (status === 'running' || (await currentRound(store, state, run)))
        )
          work.push({ id: run.id, effect: run.effect, status });
      }
      return {
        ...result,
        initial: lifecycle.initial,
        actions,
        targets,
        work,
        history: history.flatMap((entry) =>
          entry.management
            ? [
                {
                  id: entry.id,
                  actorId: entry.actorId,
                  at: entry.at,
                  from: entry.from!,
                  requestId: entry.requestId!,
                  event: entry.management,
                },
              ]
            : [],
        ),
      };
    });
  }

  private managementResult(
    lifecycle: Lifecycle<LifecycleTypes>,
    record: LifecycleRecord,
    state: ManagementState,
  ): ManagementResult {
    return {
      lifecycle: lifecycle.name,
      definitionVersion: lifecycle.version,
      recordId: String(record.id),
      state: stateOf(lifecycle, record),
      suspended: state.suspendedAt !== null,
      round: state.round,
      version: JSON.stringify([
        lifecycle.name,
        versionOf(lifecycle, record),
        state.revision,
      ]),
    };
  }

  public async manage(
    key: string,
    id: RecordId,
    command: ManagementCommand,
    options: ManagementOptions,
    target?: string,
  ): Promise<ManagementResult> {
    this.services.checkRequestId(options.requestId);
    if (
      !options.requestId?.trim() ||
      !options.reason?.trim() ||
      !options.expectedVersion
    )
      throw new LifecycleError(
        'INVALID_INPUT',
        'A reason, request id and expected version are required.',
      );
    let resumeHookStarted = false;
    const submit = (): Promise<ManagementResult> =>
      this.services.store.transaction(
        async (store) => {
          const { registered, record } = await this.services.managedRecord(
            store,
            key,
            id,
            true,
          );
          const { lifecycle } = registered;
          const access = {
            actor: options.actor,
            record,
            lifecycle: lifecycle.name,
            command,
            transactionHandle: store.transactionHandle,
          };
          if (!(await options.authorize(access)))
            throw new LifecycleError(
              'MANAGEMENT_FORBIDDEN',
              'You cannot manage this lifecycle instance.',
            );
          const policy = lifecycle.management;
          if (!policy)
            throw new LifecycleError(
              'INVALID_STATE',
              'This definition does not enable lifecycle management.',
            );
          const recordId = String(record.id);
          const reason = options.reason.trim();
          const earlier = await store.findTransitionByRequest(
            lifecycle.name,
            recordId,
            options.requestId,
          );
          if (earlier) {
            const event = earlier.management;
            if (
              event &&
              event.command === command &&
              event.reason === reason &&
              event.expectedVersion === options.expectedVersion &&
              earlier.actorId === options.actor.id &&
              (command !== 'restartAt' || earlier.to === target)
            )
              return event.result;
            throw new LifecycleError(
              'CONFLICT',
              'This request id was already used with different parameters.',
            );
          }
          const previous = managementState(policy.field, record);
          const current = this.managementResult(lifecycle, record, previous);
          if (
            current.version !== options.expectedVersion ||
            (options.expectCurrent && !(await options.expectCurrent(access)))
          )
            throw new LifecycleError(
              'CONFLICT',
              'The lifecycle instance changed since it was read.',
            );
          const to =
            command === 'reset' ? lifecycle.initial : (target ?? current.state);
          const reenter = command === 'reset' || command === 'restartAt';
          if (
            command === 'suspend'
              ? current.suspended || !policy.suspend
              : !current.suspended &&
                !(command === 'reset' && policy.resetWhileActive) &&
                !(command === 'restartAt' && policy.restartWhileActive)
          )
            throw new LifecycleError(
              'INVALID_STATE',
              'This command is unavailable in the current lifecycle state.',
            );
          if (
            (command === 'reset' && !policy.reset) ||
            (command === 'restartAt' &&
              (!target || !policy.restartAt?.includes(target)))
          )
            throw new LifecycleError(
              'INVALID_STATE',
              'This definition does not allow entry to that state by this command.',
            );

          const now = this.services.clock();
          const at = now.toISOString();
          const context = reenter
            ? await this.services.reentryContext(
                store,
                registered,
                record,
                command,
                to,
                options.actor,
                reason,
                now,
              )
            : undefined;
          if (context && policy.canEnter && !(await policy.canEnter(context)))
            throw new LifecycleError(
              'INVALID_STATE',
              'The lifecycle cannot reenter that state for this record.',
            );
          const values = context && policy.set ? await policy.set(context) : {};
          if (
            Object.keys(values).some((field) =>
              ownedFields(lifecycle).includes(field),
            )
          )
            throw new LifecycleError(
              'INVALID_SET',
              'A management policy cannot set lifecycle-owned fields.',
            );
          const version = versionOf(lifecycle, record);
          const nextVersion = (version ?? 0) + 1;
          const pause =
            command === 'resume'
              ? Math.max(0, now.getTime() - Date.parse(previous.suspendedAt!))
              : 0;
          const state: ManagementState = {
            revision: previous.revision + 1,
            round: previous.round + Number(reenter),
            roundStartedVersion: reenter
              ? nextVersion
              : previous.roundStartedVersion,
            suspendedAt: command === 'suspend' ? at : null,
            pausedMs: reenter ? 0 : previous.pausedMs + pause,
          };
          const dueField = lifecycle.dueAtField;
          const originalDue = dueField ? record[dueField] : null;
          const update = {
            ...values,
            [policy.field]: state,
            [`${policy.field}Revision`]: state.revision,
            ...(reenter
              ? {
                  [lifecycle.stateField]: to,
                  [lifecycle.changedAtField]: at,
                  [lifecycle.versionField]: nextVersion,
                }
              : {}),
            ...(dueField && context
              ? {
                  [dueField]: triggerDueAt(
                    lifecycle,
                    to,
                    context.parameters,
                    now,
                  ),
                }
              : dueField && pause && typeof originalDue === 'string'
                ? {
                    [dueField]: new Date(
                      Date.parse(originalDue) + pause,
                    ).toISOString(),
                  }
                : {}),
          };
          if (
            !(await store.updateRecordIf(
              lifecycle.collection,
              id,
              recordCondition(lifecycle, record),
              update,
            ))
          )
            throw new LifecycleError(
              'CONFLICT',
              'The lifecycle instance changed during the command.',
            );
          const written = (await store.findRecord(lifecycle.collection, id))!;
          const result = this.managementResult(lifecycle, written, state);
          const event: ManagementEvent = {
            command,
            reason,
            expectedVersion: options.expectedVersion,
            revision: state.revision,
            previousRound: previous.round,
            result,
          };
          const entry = await store.appendTransition({
            lifecycle: lifecycle.name,
            recordId,
            transition: '$manage',
            from: current.state,
            to,
            actorId: options.actor.id,
            input: {},
            management: event,
            at,
            version: reenter ? nextVersion : (version ?? 0),
            requestId: options.requestId,
          });
          const runs = await store.listEffectRuns({
            lifecycle: lifecycle.name,
            recordId,
          });
          if (context) {
            for (const run of runs) {
              if (run.status === 'queued' || run.continuation)
                await store.updateEffectRun(
                  run.id,
                  { status: run.status, attempts: run.attempts },
                  {
                    ...(run.status === 'queued'
                      ? {
                          status: 'cancelled',
                          error: 'The lifecycle execution restarted.',
                        }
                      : {}),
                    continuation: null,
                    updatedAt: at,
                  },
                );
            }
            await policy.onReenter?.({
              ...context,
              record: written,
              event,
              entry,
            });
            const owed = await this.services.owe(
              store,
              lifecycle,
              entry,
              policy.onEnter?.[to] ?? [],
              true,
            );
            store.afterCommit(async () => {
              for (const run of owed)
                await this.services.handOver(run, run.runAfter);
            });
          }
          if (command === 'resume' && policy.onResume) {
            resumeHookStarted = true;
            const tx = this.services.scope(store, now);
            const mutationError = () =>
              new LifecycleError(
                'INVALID_SET',
                'An onResume hook cannot change the lifecycle fields of the instance being resumed.',
              );
            let blockedFire: LifecycleError | undefined;
            const fields = ownedFields(lifecycle);
            const resumedFields = structuredClone(
              fields.map((field) => written[field]),
            );
            await policy.onResume({
              previous: record,
              record: written,
              suspendedAt: previous.suspendedAt!,
              now,
              pausedForMs: pause,
              actor: options.actor,
              event,
              entry,
              services: registered.services(
                store.transactionHandle,
              ) as ServicesOf<LifecycleTypes>,
              tx: Object.freeze<LifecycleTransaction>({
                ...tx,
                fire: async (name, targetId, transition, fireOptions) => {
                  if (
                    name === lifecycle.name &&
                    (String(targetId) === recordId ||
                      (await store.findRecord(lifecycle.collection, targetId))
                        ?.id === written.id)
                  )
                    throw (blockedFire ??= mutationError());
                  return tx.fire(name, targetId, transition, fireOptions);
                },
              }),
            });
            if (blockedFire) throw blockedFire;
            // Joined runtime calls and direct writes can also change this row.
            const afterHook = await store.findRecord(lifecycle.collection, id);
            if (
              !afterHook ||
              !isDeepStrictEqual(
                fields.map((field) => afterHook[field]),
                resumedFields,
              )
            )
              throw mutationError();
          }
          store.afterCommit(() =>
            this.services.changed({
              lifecycle: lifecycle.name,
              recordId,
              kind: 'management',
            }),
          );
          if (command === 'resume')
            store.afterCommit(async () => {
              for (const run of runs) {
                if (run.status === 'queued')
                  await this.services.handOver(run, run.runAfter);
                if (
                  run.continuation &&
                  !run.continuation.abandonedAt &&
                  run.continuation.dueAt <= at
                )
                  await this.services.tryContinuation(run, registered);
              }
            });
          return result;
        },
        options.transaction === undefined
          ? undefined
          : { within: options.transaction },
      );
    try {
      return await submit();
    } catch (error) {
      // A competing command may have spent the request id while this
      // transaction was waiting for the business row. Propagate failures
      // from the resume hook, including conflicts on its own domain writes.
      if (
        !(error instanceof InstanceLockConflict) ||
        resumeHookStarted ||
        options.transaction !== undefined
      )
        throw error;
      return submit();
    }
  }
}

export async function currentRound(
  store: LifecycleStore,
  state: ManagementState,
  run: EffectRun,
): Promise<boolean> {
  if (state.roundStartedVersion === 0) return true;
  const source = await store.findTransition(run.transitionId);
  return source !== undefined && source.version >= state.roundStartedVersion;
}
