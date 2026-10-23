import type { AppAuthorization } from '@nocobase/app-plugin-authorization';

/**
 * The contract between this plugin and the demo dataset an application registers. The plugin owns the lifecycle —
 * claiming, progress, clearing and accounts; the environment owns the simulated model — and the application owns what the
 * data says and how its own records are written and removed.
 */

/** A sign-in the dataset creates, as the application's demo page lists it. */
export interface DemoAccountSummary {
  readonly username: string;
  readonly name: string;
  /** What the account does in the story, in the dataset's language, such as its job title or role. */
  readonly role: string;
  readonly password: string;
}

/** An account to create through the users plugin. */
export interface DemoAccountSpec {
  readonly username: string;
  readonly name: string;
  /** A fictional address, such as one at `example.com`; an existing account with another address is never reused. */
  readonly email: string;
  /** The username followed by `123` when absent; the users plugin requires at least eight characters. */
  readonly password?: string;
  /** Permission Sets the account is given; each assignment goes with the demo. */
  readonly permissionSets?: readonly string[];
  /**
   * Values for the users plugin's role scopes, by scope key, such as an application role scope marked
   * `requiredOnCreate`. Given when the account is created and applied again when an import reuses it; clearing drops
   * the account's Permission Set assignments as for `permissionSets`.
   */
  readonly roleScopes?: Readonly<Record<string, string | readonly string[]>>;
}

/** A Permission Set the dataset defines, removed with the demo. */
export interface DemoPermissionSetSpec {
  readonly key: string;
  readonly title: string;
  readonly grants: Parameters<
    AppAuthorization['permissionSets']['create']
  >[0]['grants'];
}

/** Calendar helpers relative to the moment the import started, so a demo always reads as recent. */
export interface DemoClock {
  /** When the import started. */
  readonly now: Date;
  /** Stable for dataset, language and local import day. */
  readonly seed: string;
  /** Stable [0, 1) sample per business key; independent of step ordering. */
  sample(key: string): number;
  /** The time zone the helpers place office hours in. */
  readonly timeZone: string;
  /** `days` before today (negative: after) at the given local time. */
  daysAgo(days: number, hour?: number, minute?: number): Date;
  /** The `YYYY-MM-DD` of `days` before today in the time zone. */
  dateAgo(days: number): string;
  /** The ISO instant of `daysAgo`. */
  isoAgo(days: number, hour?: number, minute?: number): string;
}

/** How a step records import membership for counts and application lookups. */
export interface DemoTrackOptions {
  /** The key field of the Collection; `id` when absent. */
  readonly key?: string;
}

export interface DemoImportContext {
  readonly datasetId: string;
  readonly language: string;
  /** The account that imports the demo, normally an administrator. */
  readonly actorId: string;
  readonly clock: DemoClock;
  /** What the dataset recorded about this import so far, for later steps and for `clear`. */
  readonly data: Readonly<Record<string, unknown>>;
  /** Merges into `data` and persists it, so a clear after a failed import knows what to undo. */
  setData(patch: Record<string, unknown>): Promise<void>;
  /** Records rows the step created, by Collection; the application clear hook removes business rows. */
  track(
    collection: string,
    ids: string | readonly string[],
    options?: DemoTrackOptions,
  ): Promise<void>;
  /** Creates an account and its Permission Set assignments; the id of the account. */
  createAccount(spec: DemoAccountSpec): Promise<string>;
  /** Creates a Permission Set the demo owns. */
  createPermissionSet(spec: DemoPermissionSetSpec): Promise<void>;
  /** Assigns a Permission Set to an existing account, such as the importer; the assignment goes with the demo. */
  assignPermissionSet(userId: string, permissionSet: string): Promise<void>;
  /** The step's own progress, 0 to 1, for the progress bar. */
  progress(fraction: number): Promise<void>;
}

export interface DemoClearContext {
  readonly datasetId: string;
  /** The language the demo was imported in; null when the import failed before it was recorded. */
  readonly language: string | null;
  readonly actorId: string;
  readonly data: Readonly<Record<string, unknown>>;
  /** Import membership for application lookups; the application owns deletion of business rows. */
  readonly records: readonly DemoTrackedRecord[];
  /** How far the cleanup has got, 0 to 1, for the progress bar; optional to call. */
  progress(fraction: number): Promise<void>;
}

export interface DemoTrackedRecord {
  readonly collection: string;
  readonly recordId: string;
}

export interface DemoStep {
  /** Stable and unique within the dataset; logged while it runs. */
  readonly key: string;
  /** Its share of the progress bar; 1 when absent. */
  readonly weight?: number;
  run(context: DemoImportContext): Promise<void>;
}

export interface DemoDataset {
  readonly id: string;
  /** The languages its content is written in; the first is the default. */
  readonly languages: readonly string[];
  /** The time zone of the dataset's office hours; UTC when absent. */
  timeZone?(language: string): string;
  /** The accounts an import in `language` creates, as the demo page lists them before and after the import. */
  accounts(language: string): readonly DemoAccountSummary[];
  /** Run in order; a failing step triggers full-business cleanup, not transaction rollback or restoration of prior data. */
  steps?(language: string): readonly DemoStep[];
  /**
   * Calls the application's shared sample-data generator directly. Supply either generate or steps.
   * This does not run the core sample registry or read/write its seed history.
   */
  generate?(context: DemoImportContext): Promise<void>;
  /**
   * Clears ALL application business data, including visitor-created records and files. Used for explicit clear,
   * reset and failed/interrupted imports alike. Must be retry-safe, accept empty context, and preserve system
   * identities, permissions and environment configuration. Mixed production/demo data is not supported.
   */
  clear(context: DemoClearContext): Promise<void>;
  /** Counts shown on the demo page; the tracked rows per Collection when absent. */
  counts?(context: DemoClearContext): Promise<Record<string, number>>;
  /** What the simulated model answers; tried in order before the plugin's own fallback. */
  readonly answers?: readonly DemoAnswer[];
}

/** One message of a model call, as the OpenAI-compatible protocol carries it. */
export interface DemoModelMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  readonly content: string;
  readonly toolCalls?: readonly DemoToolCall[];
  readonly toolCallId?: string;
}

export interface DemoToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: Record<string, unknown>;
}

export interface DemoModelTool {
  readonly name: string;
  readonly description?: string;
  readonly parameters?: unknown;
}

/** A call to the simulated model, decoded. */
export interface DemoModelRequest {
  readonly model: string;
  readonly system: string;
  readonly messages: readonly DemoModelMessage[];
  /** The last user message. */
  readonly prompt: string;
  readonly tools: readonly DemoModelTool[];
  /** The results of tools called since the last user message, with the tool each came from. */
  readonly toolResults: readonly {
    readonly name: string;
    readonly content: string;
  }[];
  /** `zh` when the prompt is Chinese, else `en`. */
  readonly language: 'zh' | 'en';
  /** What an application asked in-process (`DemoModels.complete`), such as the business operation; absent over HTTP. */
  readonly tag?: string;
}

export type DemoModelReply =
  | string
  | { readonly text: string }
  | {
      readonly toolCalls: readonly {
        readonly name: string;
        readonly arguments?: Record<string, unknown>;
      }[];
    };

export interface DemoAnswer {
  readonly id: string;
  match(request: DemoModelRequest): boolean;
  reply(request: DemoModelRequest): DemoModelReply | Promise<DemoModelReply>;
}

export type DemoDataState = 'importing' | 'ready' | 'clearing' | 'failed';

/** What an import or clear under way was started as; a reset clears, then imports. */
export type DemoDataOperation = 'import' | 'clear' | 'reset';

export interface DemoDataStatus {
  /** Whether an application registered a dataset. */
  readonly available: boolean;
  readonly datasetId: string | null;
  readonly languages: readonly string[];
  /** Whether the demo data is imported and complete. */
  readonly present: boolean;
  readonly state: DemoDataState | null;
  readonly language: string | null;
  readonly createdAt: string | null;
  readonly finishedAt: string | null;
  /** Records the demo created, accounts included. */
  readonly records: number;
  readonly counts: Readonly<Record<string, number>>;
  readonly accounts: readonly DemoAccountSummary[];
  readonly accountsByLanguage: Readonly<
    Record<string, readonly DemoAccountSummary[]>
  >;
  /** What the import or clear under way was started as; null when none runs. */
  readonly operation: DemoDataOperation | null;
  /** An import or clear under way: how far it has got, 0 to 100, across both phases of a reset. */
  readonly importing: { readonly percent: number } | null;
  /** Why the last import stopped, when it did. */
  readonly failure: { readonly code?: string; readonly message: string } | null;
  /** Whether Demo Mode is enabled; application-wide clear/reset require it. */
  readonly enabled: boolean;
  /** The environment model service, independent of whether business data is imported. */
  readonly model: {
    readonly enabled: boolean;
    readonly service: string | null;
  };
}
