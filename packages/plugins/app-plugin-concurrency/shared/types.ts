import type { ConcurrentManager } from '@nocobase/concurrency';

export interface ConcurrencyAdapterConnections {
  mutex: never;
}
export interface ConcurrencyConfigCommon {
  readonly namespace?: string;
  /** Renewable lease duration in milliseconds; process-local Mutex ignores it. */
  readonly ttl?: number;
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
  readonly backends?: Readonly<Record<string, ConcurrencyConfigEntry>>;
}
export type ResolvedConcurrencyConfig = ConcurrencyConfigEntry & {
  readonly key: string;
  readonly namespace: string;
};
export interface ConcurrencyInstance {
  readonly manager: ConcurrentManager;
  start(): Promise<void>;
  shutdown(): Promise<void>;
}
export interface ConcurrencyImplementation {
  /**
   * Declared by the implementation: `local` coordinates within this process only, `shared` across every instance.
   * Left out, the backend is reported as `unknown`.
   */
  readonly sharing?: 'local' | 'shared';
  validate(entry: ResolvedConcurrencyConfig): void;
  create(entry: ResolvedConcurrencyConfig): ConcurrencyInstance;
}
export interface ConcurrencyService {
  getManager(configKey?: string): Promise<ConcurrentManager>;
  registerImplementation(
    adapter: string,
    implementation: ConcurrencyImplementation,
  ): void;
  /** Explicit retry belongs to the service's lifecycle owner. */
  shutdown(): Promise<void>;
  /**
   * What the service runs on once booted: configured backends by name and adapter, and the backends other than the
   * default that callers have used. Never includes a backend's options. Optional so that test doubles need not
   * implement it.
   */
  describe?(): ConcurrencyDescription;
}
/**
 * Whether a backend's state is visible to every instance of the application (`shared`) or only to the process that
 * holds it (`local`). An implementation that does not declare it is reported as `unknown`.
 */
export type ConcurrencyBackendSharing = 'local' | 'shared' | 'unknown';
export interface ConcurrencyBackendDescription {
  readonly name: string;
  readonly adapter: string;
  readonly sharing: ConcurrencyBackendSharing;
  readonly registered: boolean;
}
export interface ConcurrencyDescription {
  readonly default: string;
  readonly adapter: string;
  readonly sharing: ConcurrencyBackendSharing;
  readonly registered: boolean;
  readonly backends: readonly ConcurrencyBackendDescription[];
  /** Callers name a configuration key only, so a selection carries no consumer. */
  readonly selections: readonly { readonly backend: string }[];
}
export interface ConcurrencyLogEvent {
  readonly phase:
    'local' | 'reload' | 'initialize' | 'acquire' | 'release' | 'cleanup';
  readonly configKey?: string;
  readonly adapter?: string;
  readonly namespace?: string;
  readonly cause?: unknown;
}
export type ConcurrencyReporter = (
  event: ConcurrencyLogEvent,
) => void | Promise<void>;
export interface ConcurrencyServiceOptions {
  readonly appName: string;
  readonly nodeEnv?: string;
  readonly report?: ConcurrencyReporter;
}
