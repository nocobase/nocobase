/**
 * The contract between this plugin and the demo dataset an application registers. The plugin owns the lifecycle —
 * claiming, progress, rollback, clearing, the accounts and the simulated model — and the application owns what the
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
  readonly grants: readonly unknown[];
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

/** How a step tells the plugin what it created; every tracked record is removed when the demo is cleared. */
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
  /** Records rows the step created, by Collection; cleared in reverse order of first tracking. */
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
  /** The rows the import tracked, which the plugin deletes after `clear` returns. */
  readonly records: readonly DemoTrackedRecord[];
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
  /**
   * Disable the demo's accounts on clear instead of deleting them, and enable them again on the next import. The users
   * plugin keeps a deleted account's username and email reserved, so an application whose users plugin allows
   * deleting accounts sets this to import the demo again after clearing it.
   */
  readonly keepAccounts?: boolean;
  /** Run in order; a failing step rolls the whole import back. */
  steps(language: string): readonly DemoStep[];
  /**
   * Removes what the tracked records do not cover, such as everything visitors added inside a demo project. Runs
   * before the plugin deletes the tracked rows, accounts and model service; it must tolerate a partial import.
   */
  clear?(context: DemoClearContext): Promise<void>;
  /**
   * Explicit clear/reset only: removes application business data beyond this import. Requires demo mode.
   * Never called during failed-import rollback or interrupted-import recovery. Must be safe to retry and tolerate
   * an empty import context. System configuration and administrator access remain the application's responsibility.
   */
  clearAll?(context: DemoClearContext): Promise<void>;
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
  /** An import or clear under way: how far it has got, 0 to 100. */
  readonly importing: { readonly percent: number } | null;
  /** Why the last import stopped, when it did. */
  readonly failure: { readonly code?: string; readonly message: string } | null;
  /** Whether normal requests may change data; application-wide clear/reset require a mode other than `off`. */
  readonly mode: 'off' | 'read-only' | 'observe';
  /** The simulated model service an import added, or why there is none. */
  readonly model: {
    readonly enabled: boolean;
    readonly service: string | null;
  };
  /** The reset schedule the deployment configured, if any. */
  readonly reset: { readonly cron: string; readonly timezone?: string } | null;
}
