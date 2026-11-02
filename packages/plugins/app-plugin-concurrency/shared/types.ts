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
  readonly [key: string]: ConcurrencyConfigEntry | string | undefined;
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
