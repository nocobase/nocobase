/** A sign-in the dataset creates, as the application's demo page lists it. */
export interface DemoAccountSummary {
  readonly username: string;
  readonly name: string;
  /** What the account does in the story, in the dataset's language, such as its job title or role. */
  readonly role: string;
  readonly password: string;
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
