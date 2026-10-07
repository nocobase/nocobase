import { existsSync } from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { Config, type ConfigMap } from '@nocobase/config';
import { jsonParser } from '@nocobase/config/parsers/json';
import { tomlParser } from '@nocobase/config/parsers/toml';
import { yamlParser } from '@nocobase/config/parsers/yaml';
import type { Logger } from '@nocobase/logging';
import { fileProvider } from '@nocobase/config/providers/file';
import {
  environmentProvider,
  type EnvironmentMapping,
} from '@nocobase/config/providers/env';

import type {
  AppConfigChangeListener,
  AppConfigFileOptions,
  AppConfigLayers,
  AppConfigReloadResult,
  AppConfigSource,
} from './app-config-types.js';
import type { AppPaths } from './types.js';
import type { AppConfigRules } from './define-app-config.js';
import {
  AppConfigInvalidError,
  collectPublicConfig,
  listPublicPaths,
  validateConfigSections,
  type ConfigIssue,
} from './validation.js';

export class AppConfig {
  private readonly sources: AppConfigSource[] = [];
  private readonly listeners = new Map<
    string,
    Set<AppConfigChangeListener<unknown>>
  >();
  private current: Config | undefined;
  private defaults = new Config();
  private overrides = new Config();
  private readonly sections = new Map<string, AppConfigRules>();
  private reloadPromise: Promise<AppConfigReloadResult> | undefined;
  private logger?: Pick<Logger, 'debug'>;
  private loadDurationMs?: number;

  /** Attach diagnostics after the logging configuration has been resolved. */
  public setLogger(logger: Pick<Logger, 'debug'>): void {
    this.logger = logger;
    if (this.loadDurationMs !== undefined) {
      logger.debug(
        { durationMs: this.loadDurationMs },
        'App configuration loaded',
      );
      this.loadDurationMs = undefined;
    }
  }

  public load(
    provider: AppConfigSource['provider'],
    parser?: AppConfigSource['parser'],
    options?: AppConfigSource['options'],
  ): this {
    if (this.current) {
      throw new Error('Config sources cannot be added after loading.');
    }
    this.sources.push({ provider, parser, options });
    return this;
  }

  public loadFile(filePath: string, options: AppConfigFileOptions = {}): this {
    const resolvedPath = resolveConfigFilePath(filePath);
    const extension = path.extname(resolvedPath).toLowerCase();
    const parser =
      extension === '.toml'
        ? tomlParser()
        : extension === '.yml' || extension === '.yaml'
          ? yamlParser()
          : extension === '.json'
            ? jsonParser()
            : undefined;
    if (!parser) {
      throw new Error(
        `Unsupported application config file extension "${extension || '(none)'}". Expected .toml, .yml, .yaml, or .json.`,
      );
    }
    return this.load(fileProvider(resolvedPath, options), parser);
  }

  public async loadAll(): Promise<void> {
    const startedAt = Date.now();
    const next = await this.loadConfig();
    this.current = next;
    this.loadDurationMs = Date.now() - startedAt;
    if (this.logger) this.setLogger(this.logger);
  }

  public get<TValue = unknown>(key: string): TValue | undefined {
    return this.requireCurrent().get(key) as TValue | undefined;
  }

  public mergeDefaults(values: ConfigMap): void {
    this.requireCurrent();
    const defaults = this.defaults.copy();
    defaults.merge(new Config({}, values));
    const next = defaults.copy();
    next.merge(this.overrides);
    this.defaults = defaults;
    this.current = next;
  }

  /**
   * Registers the validators and public paths sections declare, as collected by `defaultAppConfigs`. A section
   * registered twice keeps both sets: every validator runs and the public paths are combined.
   */
  public defineSections(sections: ReadonlyMap<string, AppConfigRules>): void {
    for (const [section, rules] of sections) {
      const existing = this.sections.get(section);
      this.sections.set(
        section,
        existing
          ? {
              validators: [...existing.validators, ...rules.validators],
              public: [...new Set([...existing.public, ...rules.public])],
              env: { ...existing.env, ...rules.env },
            }
          : rules,
      );
    }
  }

  /**
   * Adds the environment variables sections declare, as one more source above everything already loaded, and
   * recomputes the configuration. Called once the sections are known, which is after the application's own sources
   * were loaded; a variable an application also maps itself to the same field is harmless.
   */
  public async loadSectionEnvironment(
    environment: Readonly<Record<string, string | undefined>>,
  ): Promise<void> {
    const mappings: Record<string, EnvironmentMapping> = {};
    for (const [section, rules] of this.sections) {
      for (const [variable, mapping] of Object.entries(rules.env ?? {})) {
        const absolute = { ...mapping, path: `${section}.${mapping.path}` };
        const existing = mappings[variable];
        if (existing && existing.path !== absolute.path) {
          throw new Error(
            `Environment variable ${variable} is declared for both ${existing.path} and ${absolute.path}.`,
          );
        }
        mappings[variable] = absolute;
      }
    }
    if (Object.keys(mappings).length === 0) return;
    this.sources.push({
      provider: environmentProvider(environment, {
        name: 'section-environment',
        mappings,
      }),
    });
    this.current = await this.loadConfig();
  }

  /** Every environment variable the sections declare, with the absolute path it sets, such as `{ AUTH_SECRET: 'auth.secret' }`. */
  public sectionEnvironmentVariables(): Readonly<Record<string, string>> {
    const paths: Record<string, string> = {};
    for (const [variable, mapping] of Object.entries(
      this.environmentVariableMappings(),
    ))
      paths[variable] = mapping.path;
    return paths;
  }

  /**
   * Every environment variable the sections declare, with its mapping and the path made absolute, such as
   * `{ AUTH_SECRET: { path: 'auth.secret', type: 'string', generate: 'secret' } }`.
   */
  public environmentVariableMappings(): Readonly<
    Record<string, EnvironmentMapping>
  > {
    const variables: Record<string, EnvironmentMapping> = {};
    for (const [section, rules] of this.sections) {
      for (const [variable, mapping] of Object.entries(rules.env ?? {})) {
        variables[variable] = {
          ...mapping,
          path: `${section}.${mapping.path}`,
        };
      }
    }
    return variables;
  }

  /** Every issue the declared rules find in the current configuration, warnings included. Throws nothing. */
  public async validate(): Promise<readonly ConfigIssue[]> {
    if (this.sections.size === 0) return [];
    return validateConfigSections(
      this.requireCurrent().raw(),
      this.overrides.raw(),
      this.sections,
    );
  }

  /** The values sections publish to the browser, nested under their section names. */
  public publicValues(): ConfigMap {
    if (this.sections.size === 0) return {};
    return collectPublicConfig(this.requireCurrent().raw(), this.sections);
  }

  /** Every published path in full, such as `auth.emailAndPassword.disableSignUp`. */
  public publicPaths(): readonly string[] {
    return listPublicPaths(this.sections);
  }

  public raw(): ConfigMap {
    return this.requireCurrent().raw();
  }

  /** The defaults and the values the application's own sources supply, kept apart. See {@link AppConfigLayers}. */
  public layers(): AppConfigLayers {
    this.requireCurrent();
    return {
      defaults: this.defaults.copy().raw(),
      overrides: this.overrides.copy().raw(),
    };
  }

  public subscribe<TValue>(
    namespace: string,
    listener: AppConfigChangeListener<TValue>,
  ): () => void {
    const listeners = this.listeners.get(namespace) ?? new Set();
    listeners.add(listener as AppConfigChangeListener<unknown>);
    this.listeners.set(namespace, listeners);
    return (): void => {
      listeners.delete(listener as AppConfigChangeListener<unknown>);
    };
  }

  public reload(): Promise<AppConfigReloadResult> {
    const startedAt = Date.now();
    this.reloadPromise ??= this.performReload()
      .then((result) => {
        this.logger?.debug(
          {
            changedNamespaces: result.changedNamespaces,
            durationMs: Date.now() - startedAt,
          },
          'App configuration reloaded',
        );
        return result;
      })
      .finally(() => {
        this.reloadPromise = undefined;
      });
    return this.reloadPromise;
  }

  private async performReload(): Promise<AppConfigReloadResult> {
    const previous = this.requireCurrent();
    const previousOverrides = this.overrides;
    const next = await this.loadConfig();
    // A reload that breaks a declared rule is refused and the running configuration stays as it was.
    const issues = await validateConfigSections(
      next.raw(),
      this.overrides.raw(),
      this.sections,
    );
    if (issues.some((issue) => issue.level === 'error')) {
      this.overrides = previousOverrides;
      throw new AppConfigInvalidError(issues);
    }
    const namespaces = new Set([...previous.mapKeys(''), ...next.mapKeys('')]);
    const changedNamespaces = [...namespaces]
      .filter(
        (namespace) =>
          !isDeepStrictEqual(previous.get(namespace), next.get(namespace)),
      )
      .sort();
    if (changedNamespaces.length === 0) {
      return { changedNamespaces };
    }

    this.current = next;

    for (const namespace of changedNamespaces) {
      const listeners = this.listeners.get(namespace);
      if (!listeners) continue;
      for (const listener of listeners) {
        await listener({
          previous: previous.get(namespace),
          current: next.get(namespace),
        });
      }
    }

    return { changedNamespaces };
  }

  private async loadConfig(): Promise<Config> {
    const overrides = new Config();
    for (const source of this.sources) {
      await overrides.load(source.provider, source.parser, source.options);
    }
    const next = this.defaults.copy();
    next.merge(overrides);
    this.overrides = overrides;
    return next;
  }

  private requireCurrent(): Config {
    if (!this.current) {
      throw new Error('Application config has not been initialized.');
    }
    return this.current;
  }
}

function resolveConfigFilePath(filePath: string): string {
  if (path.extname(filePath)) return filePath;
  const candidates = ['.yml', '.yaml', '.toml', '.json'].map(
    (extension) => `${filePath}${extension}`,
  );
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

/** Resolve deployment configuration independently of the compiled code directory. */
export function resolveDefaultAppConfigFile(
  paths: Pick<AppPaths, 'deploymentRootDir'>,
): string {
  const candidate = path.join(paths.deploymentRootDir, 'config');
  const resolved = resolveConfigFilePath(candidate);
  return existsSync(resolved) ? resolved : candidate;
}
