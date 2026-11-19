/** What the configuration inspector returns. Every value is a display string that has already been redacted. */

/** Shown instead of a value that may be a credential. */
export const REDACTED = '[redacted]';

/** Where a running value came from; `default` is the code default, `unknown` another source the application loaded. */
export type SettingSource = 'file' | 'environment' | 'default' | 'unknown';

export interface InspectedSetting {
  /** The dotted leaf path, such as `logging.level`. */
  readonly path: string;
  /** The running value as text: a scalar as written, a list or map as JSON, {@link REDACTED} for a credential. */
  readonly value: string;
  readonly source: SettingSource;
  /** Treated as a credential: the value is {@link REDACTED} whenever one is set. */
  readonly secret: boolean;
  /** Differs from `config.example.yml`, or was set where the example has nothing. */
  readonly customized: boolean;
  /** The environment variable declared for this path. */
  readonly variable?: string;
  /** The value `config.yml` holds when the environment overrides it. */
  readonly fileValue?: string;
  /** Read only when the application is installed for the first time. */
  readonly firstStartOnly?: boolean;
}

export interface InspectedVariable {
  readonly name: string;
  readonly path: string;
  readonly description?: string;
  readonly secret: boolean;
  readonly firstStartOnly: boolean;
  /** Whether the running value at its path came from this variable. */
  readonly set: boolean;
  /** The running value when set, redacted like settings; `null` otherwise. */
  readonly value: string | null;
}

/** A top-level section of the configuration, with the comment `config.example.yml` gives it. */
export interface InspectedSection {
  readonly key: string;
  readonly comment?: string;
  /** Present in `config.example.yml`, commented out or not. */
  readonly inExample: boolean;
}

export interface ConfigInspectorSnapshot {
  readonly file: {
    /** The configuration file the application reads; `null` when it loads none. */
    readonly path: string | null;
    readonly exists: boolean;
    /** The file's text with every credential replaced by {@link MASK}. Empty when it does not exist. */
    readonly text: string;
  };
  /** `config.example.yml` beside the deployment, masked the same way; `null` when the application ships none. */
  readonly example: string | null;
  readonly loadedAt: string | null;
  readonly reloads: number;
  readonly settings: readonly InspectedSetting[];
  readonly variables: readonly InspectedVariable[];
  readonly sections: readonly InspectedSection[];
}

/** What a masked credential reads as in the file views. */
export const MASK = '••••••';
