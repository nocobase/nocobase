import type { ConcurrentManager } from '@nocobase/concurrency';
import type {
  ConcurrentBackend,
  Clock,
  Scheduler,
} from '@nocobase/concurrency/backend';

export interface ConcurrencyAdapterConnections {
  mutex: never;
}
export interface ConcurrencyConfigCommon {
  readonly namespace?: string;
  readonly ttl?: number;
  readonly operationTimeoutMs?: number;
  readonly cleanupTimeoutMs?: number;
  readonly shutdownTimeoutMs?: number;
}
export type ConcurrencyConfigEntry = {
  [A in keyof ConcurrencyAdapterConnections]: ConcurrencyConfigCommon & {
    readonly adapter: A;
  } & (A extends 'mutex'
      ? { readonly connection?: never }
      : { readonly connection: ConcurrencyAdapterConnections[A] });
}[keyof ConcurrencyAdapterConnections];
export interface AppConcurrencyConfig {
  readonly default?: string;
  readonly [key: string]: ConcurrencyConfigEntry | string | undefined;
}
export type ResolvedConcurrencyConfig = ConcurrencyConfigEntry &
  Required<ConcurrencyConfigCommon> & { readonly key: string };
export interface OwnedConcurrencyBackend {
  readonly backend: ConcurrentBackend;
  dispose(): Promise<void>;
}
export interface ConcurrencyImplementation {
  validate(entry: ResolvedConcurrencyConfig): void;
  create(entry: ResolvedConcurrencyConfig): Promise<OwnedConcurrencyBackend>;
}
export interface ConcurrencyService {
  getManager(configKey?: string): Promise<ConcurrentManager>;
  registerImplementation(
    adapter: string,
    implementation: ConcurrencyImplementation,
  ): void;
  /** The host may retry this after failed or timed-out cleanup. */
  shutdown(): Promise<void>;
}
export interface ConcurrencyServiceOptions {
  readonly appName: string;
  readonly nodeEnv?: string;
  /** Code-only testing dependencies, never configuration-file fields. */
  readonly clock?: Clock;
  readonly scheduler?: Scheduler;
  readonly report?: (event: ConcurrencyLogEvent) => void;
}
export interface ConcurrencyLogEvent {
  readonly phase:
    | 'local'
    | 'reload'
    | 'initialize'
    | 'acquire'
    | 'release'
    | 'cleanup'
    | 'business';
  readonly configKey?: string;
  readonly adapter?: string;
  readonly namespace?: string;
}
