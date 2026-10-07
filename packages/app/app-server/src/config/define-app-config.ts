import type { EnvironmentMapping } from '@nocobase/config/providers/env';

import type { AppRuntimeContext } from '../runtime/definition.js';

/** A problem a validator found, with its path relative to the section it validated. */
export interface ConfigValidationContext {
  error(path: string, message: string, options?: ConfigIssueOptions): void;
  warning(path: string, message: string, options?: ConfigIssueOptions): void;
  /** Whether the value at `path` came from a configuration file or the environment rather than code defaults. */
  isUserProvided(path: string): boolean;
}

export interface ConfigIssueOptions {
  /** A command or change that resolves the issue, written so it can be applied as is. */
  readonly fix?: string;
}

/**
 * Checks one section's final value — code defaults merged with the configuration file and the environment.
 *
 * It runs at startup, on every reload and in `config check`, so it may read local files but must not reach the
 * network or write anything. The value is typed as the section, but it came from user input: check it as untrusted.
 */
export type ConfigValidator<T> = (
  value: T,
  context: ConfigValidationContext,
) => void | Promise<void>;

export interface AppConfigDefinition<T extends object> {
  readonly defaults: T | ((runtime: AppRuntimeContext) => T);
  readonly validate?: ConfigValidator<T> | readonly ConfigValidator<T>[];
  /**
   * Leaf paths, relative to the section, that the browser may read through `config.public`. Anything not listed is
   * never sent.
   */
  readonly public?: readonly string[];
  /**
   * Environment variables that set fields of this section, with paths relative to it, such as
   * `{ AUTH_SECRET: envString('secret') }`. The owner of the section declares them here so that whoever reads a
   * setting also maps it. `pnpm nocobase config env` lists every declared variable.
   */
  readonly env?: Readonly<Record<string, EnvironmentMapping>>;
}

/** What a section declares beyond its defaults, as the runtime reads it. */
export interface AppConfigRules {
  readonly validators: readonly ConfigValidator<never>[];
  readonly public: readonly string[];
  readonly env?: Readonly<Record<string, EnvironmentMapping>>;
}

export interface AppConfigFactory<T extends object = object> {
  (runtime: AppRuntimeContext): T;
  /** Present on a factory made by `defineAppConfig` with a validator or public paths. */
  readonly rules?: AppConfigRules;
  /** Present on a factory made by `defaultAppConfigs`: the rules of each section it combines, by section name. */
  readonly sections?: ReadonlyMap<string, AppConfigRules>;
}

/**
 * Declares one configuration section.
 *
 * A function is the shorthand for `{ defaults }`, so an existing `defineAppConfig((runtime) => ({ ... }))` keeps
 * working unchanged.
 */
export function defineAppConfig<T extends object>(
  definition: AppConfigDefinition<T> | ((runtime: AppRuntimeContext) => T),
): AppConfigFactory<T> {
  if (typeof definition === 'function') {
    return (runtime) => definition(runtime);
  }
  const { defaults } = definition;
  // An object is returned as is rather than cloned: defaults may hold functions and instances, such as Better Auth
  // plugins, and merging into the configuration copies what it keeps.
  const factory = (runtime: AppRuntimeContext): T =>
    typeof defaults === 'function' ? defaults(runtime) : defaults;
  const validators = toArray(definition.validate);
  const publicPaths = [...(definition.public ?? [])];
  const env = { ...definition.env };
  if (
    validators.length === 0 &&
    publicPaths.length === 0 &&
    Object.keys(env).length === 0
  ) {
    return factory;
  }
  return Object.assign(factory, {
    rules: Object.freeze({
      validators: Object.freeze(validators),
      public: Object.freeze(publicPaths),
      env: Object.freeze(env),
    }),
  });
}

export function defaultAppConfigs<T extends Record<string, AppConfigFactory>>(
  configs: T,
): AppConfigFactory<{ [K in keyof T]: ReturnType<T[K]> }> {
  const sections = new Map<string, AppConfigRules>();
  for (const [key, configure] of Object.entries(configs)) {
    if (configure.rules) sections.set(key, configure.rules);
  }
  const factory = (
    runtime: AppRuntimeContext,
  ): { [K in keyof T]: ReturnType<T[K]> } =>
    Object.fromEntries(
      Object.entries(configs).map(([key, configure]) => [
        key,
        configure(runtime),
      ]),
    ) as { [K in keyof T]: ReturnType<T[K]> };
  return Object.assign(factory, { sections });
}

function toArray<T>(value: T | readonly T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? [...(value as readonly T[])] : [value as T];
}

export interface AppIdentityConfig {
  readonly name: string;
  readonly publicOrigin?: string;
  readonly publicBasePath: string;
  readonly internalBasePath: string;
  readonly publicApiUrl: string;
  /**
   * Load sample data on the first start: the seeds declared with `sample: true` and what plugins register on
   * `sampleDataToken`. Read only while the application's database is being installed; `APP_SAMPLE_DATA` sets it.
   */
  readonly sampleData?: boolean;
}
