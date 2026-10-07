import {
  resolveDatabaseDriver,
  type ConnectionConfig,
  type DatabaseDriverRegistration,
} from '@nocobase/db';

import type { EnvironmentMapping } from '@nocobase/config/providers/env';

import type {
  AppConfigFactory,
  ConfigValidator,
} from '../config/define-app-config.js';
import type {
  AppDatabaseConfig,
  AppDatabaseConfigFromDrivers,
} from './types.js';

type Drivers = Record<string, DatabaseDriverRegistration>;
type KeysOfUnion<T> = T extends unknown ? keyof T : never;

/** Keep each connection's contextual union separate from its siblings. */
type InferredConfig<
  TConfig extends AppDatabaseConfig,
  TDrivers extends Drivers,
> = TConfig &
  Omit<AppDatabaseConfigFromDrivers<TDrivers>, 'connections'> & {
    connections: {
      [
        K in keyof TConfig['connections']
      ]: AppDatabaseConfigFromDrivers<TDrivers>['connections'][string];
    };
  };

/** Check inferred return fields without changing the callback's contextual type. */
type UnknownFields<
  TConfig extends AppDatabaseConfig,
  TDrivers extends Drivers,
> =
  | Exclude<keyof TConfig, keyof AppDatabaseConfig>
  | {
      [K in keyof TConfig['connections']]: Exclude<
        keyof TConfig['connections'][K],
        KeysOfUnion<
          Extract<
            AppDatabaseConfigFromDrivers<TDrivers>['connections'][string],
            { dialect: TConfig['connections'][K]['dialect'] }
          >
        >
      >;
    }[keyof TConfig['connections']];

type CheckedFactory<
  TConfig extends AppDatabaseConfig,
  TDrivers extends Drivers,
> = [UnknownFields<TConfig, TDrivers>] extends [never]
  ? unknown
  : { unknownDatabaseConfigFields: UnknownFields<TConfig, TDrivers> };

/**
 * What the `database` section declares beyond its defaults. `env` maps environment variables to paths relative to the
 * section, usually `connectionEnvironment('main')`.
 */
export interface AppDatabaseConfigOptions {
  readonly env?: Readonly<Record<string, EnvironmentMapping>>;
  readonly validate?:
    | ConfigValidator<AppDatabaseConfig>
    | readonly ConfigValidator<AppDatabaseConfig>[];
}

/**
 * Declare database defaults; explicit drivers provide dialect-specific inference.
 * The factory runs when application configuration is resolved, not on import.
 * Export the common runtime contract so declarations do not expose native drivers.
 */
export function defineAppDatabaseConfig<
  const TConfig extends AppDatabaseConfig,
>(
  factory: AppConfigFactory<TConfig & { drivers?: never }> &
    (Exclude<keyof TConfig, keyof AppDatabaseConfig> extends never
      ? unknown
      : {
          unknownDatabaseConfigFields: Exclude<
            keyof TConfig,
            keyof AppDatabaseConfig
          >;
        }),
  options?: AppDatabaseConfigOptions,
): AppConfigFactory<AppDatabaseConfig>;
export function defineAppDatabaseConfig<
  const TDrivers extends Drivers,
  const TConfig extends AppDatabaseConfig & { drivers: TDrivers },
>(
  factory: AppConfigFactory<InferredConfig<TConfig, TDrivers>> &
    CheckedFactory<NoInfer<TConfig>, NoInfer<TDrivers>>,
  options?: AppDatabaseConfigOptions,
): AppConfigFactory<AppDatabaseConfig>;
export function defineAppDatabaseConfig(
  factory: AppConfigFactory<AppDatabaseConfig>,
  options: AppDatabaseConfigOptions = {},
): AppConfigFactory<AppDatabaseConfig> {
  const configure = (
    runtime: Parameters<typeof factory>[0],
  ): AppDatabaseConfig => factory(runtime);
  return Object.assign(configure, {
    rules: {
      validators: [
        ...(factory.rules?.validators ?? []),
        validateAppDatabaseConfig,
        ...toArray(options.validate),
      ] as readonly ConfigValidator<never>[],
      public: factory.rules?.public ?? [],
      env: { ...factory.rules?.env, ...options.env },
    },
  });
}

/**
 * What can be said about the `database` section from its value alone. Whether each database can be reached is left to
 * `config check`, which connects; a start connects anyway and reports the driver's own error.
 */
export const validateAppDatabaseConfig: ConfigValidator<AppDatabaseConfig> = (
  database,
  context,
) => {
  const connections = isRecord(database.connections)
    ? database.connections
    : {};
  const names = Object.keys(connections);
  if (
    database.default !== undefined &&
    database.default !== 'none' &&
    !Object.hasOwn(connections, database.default)
  ) {
    context.error(
      'default',
      names.length > 0
        ? `names the connection "${database.default}", which is not configured. Configured connections: ${names.join(', ')}.`
        : `names the connection "${database.default}", but no connection is configured.`,
    );
  }
  for (const [name, connection] of Object.entries(connections)) {
    const dialect = isRecord(connection) ? connection.dialect : undefined;
    if (typeof dialect !== 'string' || dialect.trim() === '') {
      context.error(`connections.${name}.dialect`, 'is not set.');
      continue;
    }
    const message = connectionOptionsProblem(
      name,
      connection as unknown as ConnectionConfig,
      database.drivers,
    );
    if (message) context.error(`connections.${name}`, message);
  }
};

/**
 * Asks the connection's own dialect driver whether it accepts the options, the way a start would when it opens the
 * connection. Both steps are pure — `normalizeConnection` fills in defaults and `resolveConnection` builds the native
 * driver's options, rejecting what that driver cannot take — so the question is answered without connecting.
 *
 * A dialect whose driver is not installed is skipped here; loading the configuration already reports it.
 */
function connectionOptionsProblem(
  name: string,
  connection: ConnectionConfig,
  drivers: AppDatabaseConfig['drivers'],
): string | undefined {
  try {
    const driver = resolveDatabaseDriver(connection, drivers, name);
    if (!driver?.resolveConnection) return undefined;
    const normalized = driver.normalizeConnection
      ? driver.normalizeConnection(connection, {})
      : connection;
    driver.resolveConnection(normalized);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function toArray<T>(value: T | readonly T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? [...(value as readonly T[])] : [value as T];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
