import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

/**
 * Sample data a service builds rather than a seed: what has to go through other plugins' services, such as projects
 * with issues and comments. It runs once the application is ready, under the same condition as a seed declared with
 * `sample: true` — the database was installed by this start and `app.sampleData` is set — and is recorded in the
 * seed history of the default connection as `sample-data:<name>`, so it never runs twice on its own.
 */
export interface SampleDataRegistration {
  /** Unique within the application, such as `acme/demo`. */
  readonly name: string;
  /** The package that registers it, recorded with it. */
  readonly packageName: string;
  run(): Promise<void>;
}

/** A recorded sample, as the ledger returns it. */
export interface SampleDataRecord {
  readonly name: string;
  readonly status: 'executed' | 'skipped';
}

/** Where samples are recorded: the default connection's seed history. The database provider supplies it. */
export interface SampleDataLedger {
  history(): Promise<readonly SampleDataRecord[]>;
  record(entry: {
    readonly packageName: string;
    readonly name: string;
    readonly status: 'executed' | 'skipped';
    readonly durationMs?: number | null;
  }): Promise<void>;
}

export interface SampleDataRunResult {
  /** Registration names that ran. */
  readonly executed: readonly string[];
  /** Registration names recorded as skipped without running. */
  readonly skipped: readonly string[];
  /** Registrations that threw; each is recorded as skipped, so `nocobase db sample` can run it again. */
  readonly failed: readonly {
    readonly name: string;
    readonly error: unknown;
  }[];
}

export interface SampleDataService {
  /** Adds sample data to build. Call it from a service provider's `register()` or `boot()`. */
  register(registration: SampleDataRegistration): void;
  registrations(): readonly SampleDataRegistration[];
  /**
   * Called by the database provider once startup tasks ran: where samples are recorded, and whether this start
   * installed the database with `app.sampleData` set. Without it, a run does nothing.
   */
  prepare(state: {
    readonly ledger: SampleDataLedger;
    readonly enabled: boolean;
  }): void;
  /**
   * Makes the next run build every registration recorded as skipped, or not recorded at all, whatever `prepare` said.
   * `nocobase db sample` uses it.
   */
  rerunSkipped(): void;
  /** Builds or skips what is not recorded yet. The application calls it once every provider is ready. */
  run(): Promise<SampleDataRunResult>;
}

export const sampleDataToken: ServiceToken<SampleDataService> =
  createServiceToken<SampleDataService>('@nocobase/app-server/sample-data');

/** The seed history name a registration is recorded under. */
export function sampleDataRecordName(name: string): string {
  return `sample-data:${name}`;
}
