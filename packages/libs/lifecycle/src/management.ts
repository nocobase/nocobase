import type { EffectDefinition } from './definition.js';
import type { LifecycleTransaction } from './runtime.js';
import type {
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

export interface ManagementPolicy<T extends LifecycleTypes> {
  /** Nullable JSON field, paired with a nullable integer field named `<field>Revision`. */
  readonly field: string;
  /** Acquire any domain lock that must precede the instance lock. */
  readonly prepare?: (tx: LifecycleTransaction) => void | Promise<void>;
  readonly suspend?: boolean;
  readonly reset?: boolean;
  readonly restartAt?: readonly T['state'][];
  readonly canEnter?: (
    context: ManagementReentryContext<T>,
  ) => boolean | Promise<boolean>;
  readonly set?: (
    context: ManagementReentryContext<T>,
  ) =>
    | Readonly<Record<string, unknown>>
    | Promise<Readonly<Record<string, unknown>>>;
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
