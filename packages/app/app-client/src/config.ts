import type { AppRuntimeContext } from './runtime/index.js';
import type { RefineProps } from '@refinedev/core';
import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import type { PublicConfigPath, PublicConfigValue } from './public-config.js';

const FORBIDDEN_CONFIG_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'prototype',
  'constructor',
]);

export type AppClientConfigPrimitive = string | number | boolean | null;

export type AppClientConfigValue =
  | AppClientConfigPrimitive
  | undefined
  | object
  | ((...args: never[]) => unknown);

export interface AppClientConfigMap {
  readonly [key: string]: AppClientConfigValue;
}

/**
 * The values the server publishes through `public` in its configuration sections, read at the same path they have on
 * the server, such as `auth.emailAndPassword.disableSignUp`. Read-only, and kept apart from the client's own
 * configuration so that handing a whole section to a library never passes them along.
 */
export interface AppClientPublicConfig {
  get<P extends PublicConfigPath>(path: P): PublicConfigValue<P> | undefined;
  get<P extends PublicConfigPath>(
    path: P,
    defaultValue: PublicConfigValue<P>,
  ): PublicConfigValue<P>;
  has(path: PublicConfigPath): boolean;
  raw(): AppClientConfigMap;
}

export interface AppClientConfig {
  /** Client defaults and the `client` section of the configuration file. Server-published values are in `public`. */
  get<T>(path: string): T | undefined;
  get<T>(path: string, defaultValue: T): T;
  has(path: string): boolean;
  raw(): AppClientConfigMap;
  mergeDefaults(values: AppClientConfigMap): void;
  /** Values the server publishes. `get` never returns them. */
  readonly public: AppClientPublicConfig;
}

export interface AppClientConfigContext {
  readonly rawConfig: unknown;
  /** The server's published values; an empty object when omitted. */
  readonly rawPublicConfig?: unknown;
}

export type AppClientConfigFactory = (
  context: AppClientConfigContext,
) => AppClientConfig | Promise<AppClientConfig>;

export type AppClientReactProvider = ComponentType<PropsWithChildren>;

export type AppClientRefineConfig = Omit<RefineProps, 'accessControlProvider'>;

export interface AppClientRenderConfig {
  readonly basename?: string;
  readonly reactProviders?: readonly AppClientReactProvider[];
  readonly routes: ReactNode;
}

export function createAppClientConfig(
  context: AppClientConfigContext,
): AppClientConfig {
  const rawConfig = assertConfigMap(context.rawConfig, 'Client config');
  const rawPublicConfig = assertConfigMap(
    context.rawPublicConfig ?? {},
    'Public client config',
  );
  return new ResolvedAppClientConfig(
    rawConfig,
    new ResolvedAppClientPublicConfig(rawPublicConfig),
  );
}

export function defineAppClientRenderConfig(
  config: AppClientRenderConfig,
): AppClientRenderConfig {
  return Object.freeze({
    ...config,
    reactProviders:
      config.reactProviders === undefined
        ? undefined
        : Object.freeze([...config.reactProviders]),
  });
}

export function normalizeAppClientBasename(
  basename: string | undefined,
): string | undefined {
  const normalized = basename?.trim();
  if (!normalized || normalized === '/') {
    return undefined;
  }
  return `/${normalized.replace(/^\/+|\/+$/g, '')}`;
}

/**
 * `import.meta.env` is read through a local type and an optional access, as in `plugins.ts`: consumers compile
 * this module without bundler ambient types, and Vitest runs it where `import.meta.env` is undefined — a development
 * context, which is where these checks are meant to speak up.
 */
interface ImportMetaWithBundlerEnv {
  readonly env?: { readonly PROD?: boolean };
}

function isDevelopment(): boolean {
  return !(import.meta as ImportMetaWithBundlerEnv).env?.PROD;
}

class ResolvedAppClientPublicConfig implements AppClientPublicConfig {
  private readonly value: AppClientConfigMap;

  public constructor(value: AppClientConfigMap) {
    this.value = freezeConfigMap(cloneConfigMap(value));
  }

  public get<P extends PublicConfigPath>(
    path: P,
  ): PublicConfigValue<P> | undefined;
  public get<P extends PublicConfigPath>(
    path: P,
    defaultValue: PublicConfigValue<P>,
  ): PublicConfigValue<P>;
  public get<P extends PublicConfigPath>(
    path: P,
    defaultValue?: PublicConfigValue<P>,
  ): PublicConfigValue<P> | undefined {
    const value = readConfigValue(this.value, path);
    if (value === undefined) {
      if (isDevelopment()) {
        const published = listLeafPaths(this.value);
        console.warn(
          `${path} is not published by the server.${
            published.length > 0
              ? ` Published paths: ${published.join(', ')}.`
              : ''
          } Add it to public in the section's defineAppConfig on the server if the browser needs it.`,
        );
      }
      return defaultValue;
    }
    return cloneConfigValue(value) as PublicConfigValue<P>;
  }

  public has(path: PublicConfigPath): boolean {
    return readConfigValue(this.value, path) !== undefined;
  }

  public raw(): AppClientConfigMap {
    return cloneConfigMap(this.value);
  }
}

class ResolvedAppClientConfig implements AppClientConfig {
  public readonly public: AppClientPublicConfig;
  private value: AppClientConfigMap;
  private defaults: AppClientConfigMap;
  private readonly overrides: AppClientConfigMap;

  public constructor(
    overrides: AppClientConfigMap,
    publicConfig: AppClientPublicConfig,
  ) {
    this.public = publicConfig;
    this.defaults = {};
    this.overrides = cloneConfigMap(overrides);
    this.value = freezeConfigMap(cloneConfigMap(overrides));
  }

  public mergeDefaults(values: AppClientConfigMap): void {
    this.defaults = mergeConfigMaps(this.defaults, values);
    this.value = freezeConfigMap(
      mergeConfigMaps(this.defaults, this.overrides),
    );
  }

  public get<T>(path: string): T | undefined;
  public get<T>(path: string, defaultValue: T): T;
  public get<T>(path: string, defaultValue?: T): T | undefined {
    const value = readConfigValue(this.value, path);
    if (value === undefined) {
      // Reading a published value here is the one mistake two entry points invite, and it fails silently.
      if (
        isDevelopment() &&
        readConfigValue(this.public.raw(), path) !== undefined
      ) {
        throw new Error(
          `${path} is published by the server; read it with config.public.get('${path}').`,
        );
      }
      return defaultValue;
    }
    return cloneConfigValue(value) as T;
  }

  public has(path: string): boolean {
    return readConfigValue(this.value, path) !== undefined;
  }

  public raw(): AppClientConfigMap {
    return cloneConfigMap(this.value);
  }
}

function readConfigValue(
  root: AppClientConfigMap,
  path: string,
): AppClientConfigValue | undefined {
  const segments = path ? normalizeConfigPath(path).split('.') : [];
  let value: AppClientConfigValue = root;
  for (const segment of segments) {
    if (isConfigArray(value)) {
      if (!/^\d+$/u.test(segment)) {
        return undefined;
      }
      const item: AppClientConfigValue | undefined = value[Number(segment)];
      if (item === undefined) {
        return undefined;
      }
      value = item;
      continue;
    }
    if (!isConfigMap(value) || !Object.hasOwn(value, segment)) {
      return undefined;
    }
    value = value[segment];
  }
  return value;
}

function listLeafPaths(root: AppClientConfigMap, prefix = ''): string[] {
  return Object.entries(root).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return isConfigMap(value) ? listLeafPaths(value, path) : [path];
  });
}

function normalizeConfigPath(path: string): string {
  const normalized = path.trim();
  if (!normalized) {
    return '';
  }
  const segments = normalized.split('.');
  for (const segment of segments) {
    if (!segment) {
      throw new Error(
        `Client config path "${path}" contains an empty segment.`,
      );
    }
    if (FORBIDDEN_CONFIG_KEYS.has(segment)) {
      throw new Error(
        `Client config path "${path}" contains forbidden segment "${segment}".`,
      );
    }
  }
  return segments.join('.');
}

function assertConfigMap(value: unknown, label: string): AppClientConfigMap {
  assertConfigValue(value, label);
  if (!isConfigMap(value)) {
    throw new Error(`${label} must be a plain object.`);
  }
  return value;
}

function assertConfigValue(value: unknown, path: string): void {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertConfigValue(item, `${path}[${index}]`),
    );
    return;
  }
  if (!isConfigMap(value)) {
    throw new Error(
      `${path} values must be JSON-compatible strings, finite numbers, booleans, null, arrays, or plain objects.`,
    );
  }
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_CONFIG_KEYS.has(key)) {
      throw new Error(`${path} contains forbidden key "${key}".`);
    }
    assertConfigValue(item, `${path}.${key}`);
  }
}

function isConfigMap(value: unknown): value is AppClientConfigMap {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function isConfigArray(
  value: AppClientConfigValue,
): value is readonly AppClientConfigValue[] {
  return Array.isArray(value);
}

function cloneConfigMap(value: AppClientConfigMap): AppClientConfigMap {
  return cloneConfigValue(value) as AppClientConfigMap;
}

function cloneConfigValue(value: AppClientConfigValue): AppClientConfigValue {
  if (isConfigArray(value)) {
    return value.map((item) => cloneConfigValue(item));
  }
  if (isConfigMap(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneConfigValue(item)]),
    );
  }
  return value;
}

function freezeConfigMap(value: AppClientConfigMap): AppClientConfigMap {
  return freezeConfigValue(value) as AppClientConfigMap;
}

function freezeConfigValue(value: AppClientConfigValue): AppClientConfigValue {
  if (isConfigArray(value)) {
    value.forEach((item) => freezeConfigValue(item));
  } else if (isConfigMap(value)) {
    Object.values(value).forEach((item) => freezeConfigValue(item));
  }
  return isConfigMap(value) || isConfigArray(value)
    ? Object.freeze(value)
    : value;
}

function mergeConfigMaps(
  base: AppClientConfigMap,
  override: AppClientConfigMap,
): AppClientConfigMap {
  const merged: Record<string, AppClientConfigValue> = {
    ...cloneConfigMap(base),
  };
  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];
    merged[key] =
      isConfigMap(current) && isConfigMap(value)
        ? mergeConfigMaps(current, value)
        : cloneConfigValue(value);
  }
  return merged;
}

export type AppConfigFactory<T extends object = object> = (
  runtime: AppRuntimeContext,
) => T;

export function defineAppConfig<T extends object>(
  factory: AppConfigFactory<T>,
): AppConfigFactory<T> {
  return factory;
}

export function defaultAppConfigs<T extends Record<string, AppConfigFactory>>(
  configs: T,
): AppConfigFactory<{ [K in keyof T]: ReturnType<T[K]> }> {
  return (runtime) =>
    Object.fromEntries(
      Object.entries(configs).map(([key, configure]) => [
        key,
        configure(runtime),
      ]),
    ) as { [K in keyof T]: ReturnType<T[K]> };
}
