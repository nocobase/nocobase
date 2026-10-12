import type { Logger } from '@nocobase/logging';
import type {
  ConfigLoadOptions,
  ConfigMap,
  ConfigParser,
  ConfigProvider,
} from '@nocobase/config';
import type { FileProviderOptions } from '@nocobase/config/providers/file';
import type { ConfigIssue } from './validation.js';

export interface AppConfigSource {
  readonly provider: ConfigProvider;
  readonly parser?: ConfigParser;
  readonly options?: ConfigLoadOptions;
}

export type AppConfigFileOptions = FileProviderOptions;

export interface AppConfigChange<TValue> {
  readonly previous: TValue;
  readonly current: TValue;
}

export type AppConfigChangeListener<TValue> = (
  change: AppConfigChange<TValue>,
) => void | Promise<void>;

export interface AppConfigReloadResult {
  readonly changedNamespaces: readonly string[];
}

export interface AppConfigAccessor {
  setLogger?(logger: Pick<Logger, 'debug'>): void;
  mergeDefaults(values: ConfigMap): void;
  get<TValue = unknown>(key: string): TValue | undefined;
  raw(): ConfigMap;
  reload(): Promise<AppConfigReloadResult>;
  /** Issues the sections' declared rules find; an accessor without declared rules may omit it. */
  validate?(): Promise<readonly ConfigIssue[]>;
  /** Values the sections publish to the browser; an accessor without declared rules may omit it. */
  publicValues?(): ConfigMap;
  contributePublicValue?(path: string, compute: () => boolean): () => void;
  /** Every published path in full, such as `auth.emailAndPassword.disableSignUp`. */
  publicPaths?(): readonly string[];
  subscribe<TValue>(
    namespace: string,
    listener: AppConfigChangeListener<TValue>,
  ): () => void;
}

/**
 * The two layers an application's configuration is merged from, as read-only copies.
 *
 * `defaults` is what the application declares in code; `overrides` is what its own sources — configuration files and
 * the environment — supply over them. The merged result can no longer tell the two apart, which is exactly what a
 * check needs: a key that only ever appears in `overrides` is one the application does not know.
 */
export interface AppConfigLayers {
  readonly defaults: ConfigMap;
  readonly overrides: ConfigMap;
}
