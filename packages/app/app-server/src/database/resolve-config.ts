import type { DatabaseDriverRegistration } from '@nocobase/db';
import { resolveDatabaseDriver } from '@nocobase/db';
import type { AppDatabaseConfig } from './types.js';

/** A dialect this runtime loads a driver for without the application registering one. */
export type OfficialDialect =
  'sqlite' | 'mysql' | 'postgres' | 'mssql' | 'oracle';

const officialDriverLoaders = {
  sqlite: () => import('@nocobase/db-sqlite'),
  mysql: () => import('@nocobase/db-mysql'),
  postgres: () => import('@nocobase/db-postgres'),
  mssql: () => import('@nocobase/db-mssql'),
  oracle: () => import('@nocobase/db-oracle'),
  // Keyed by the exported union rather than by `string`, so a dialect added to one and not the other fails to compile
  // instead of producing a list the runtime cannot load from.
} satisfies Record<
  OfficialDialect,
  () => Promise<{ default?: DatabaseDriverRegistration }>
>;

/**
 * The dialects above, as a list tooling can name them from.
 *
 * Anything that has to present the choice to a person — `nocobase config init`, the documentation it prints —
 * reads this rather than keeping its own copy. A separate list is one that silently stops matching the loaders the
 * day a dialect is added, and the mismatch only shows up as a dialect the CLI offers and the runtime cannot load.
 */
export const OFFICIAL_DIALECTS: readonly OfficialDialect[] = Object.freeze(
  Object.keys(officialDriverLoaders) as OfficialDialect[],
);

/** A connection whose official driver package is not installed. */
export interface MissingDatabaseDriver {
  readonly connection: string;
  readonly dialect: OfficialDialect;
  readonly packageName: string;
}

/**
 * Every configured connection whose driver is missing, reported at once.
 *
 * Stopping at the first one turned a configuration with two missing drivers — the Examples template on PostgreSQL
 * still needs SQLite for its analytics connection — into two failed starts, each naming half the problem. The
 * connections are listed so tooling can point at each one, and the message carries the single command that installs
 * all of them.
 *
 * The remedy names the application rather than "here" on purpose: in a deployment this runs from a built `dist`, where
 * installing a driver is undone by the next build. The driver has to reach the application's dependencies, and a
 * deployment has to be built again afterwards.
 */
export class MissingDatabaseDriversError extends Error {
  public readonly missing: readonly MissingDatabaseDriver[];

  public constructor(missing: readonly MissingDatabaseDriver[]) {
    const packages = [...new Set(missing.map((entry) => entry.packageName))];
    const subject =
      missing.length === 1
        ? `Database connection "${missing[0].connection}" requires "${missing[0].packageName}".`
        : `Database connections ${missing
            .map((entry) => `"${entry.connection}" (${entry.packageName})`)
            .join(', ')} require drivers that are not installed.`;
    super(
      `${subject} Add ${packages.length === 1 ? 'it' : 'them'} to the application's dependencies with "pnpm add ${packages.join(' ')}"; a deployment needs to be built again afterwards.`,
    );
    this.name = 'MissingDatabaseDriversError';
    this.missing = missing;
  }
}

/** Configuration properties needed for driver loading; other properties are preserved. */
export type DatabaseConfigInput = Pick<
  AppDatabaseConfig,
  'default' | 'drivers' | 'connections'
>;

export type ResolvedDatabaseConfig<TConfig extends DatabaseConfigInput> = Omit<
  TConfig,
  'drivers'
> & {
  drivers: Record<string, DatabaseDriverRegistration>;
};

/** Load only configured official dialects before constructing a synchronous manager. */
export async function resolveDatabaseConfig<
  TConfig extends DatabaseConfigInput,
>(config: TConfig): Promise<ResolvedDatabaseConfig<TConfig>> {
  const drivers = { ...config.drivers };
  const connections = { ...config.connections };
  if (config.default === 'none') return { ...config, drivers };

  // Per-connection drivers must not conflict with an automatically registered
  // default for another connection using the same dialect.
  const suppliedDialects = new Set(
    Object.values(connections)
      .filter((connection) => connection.databaseDriver)
      .map((connection) => connection.dialect),
  );
  const loaded = new Map<string, DatabaseDriverRegistration>();
  const missing: MissingDatabaseDriver[] = [];
  for (const [name, connection] of Object.entries(connections)) {
    if (
      resolveDatabaseDriver(
        {
          dialect: connection.dialect,
          databaseDriver: connection.databaseDriver,
        },
        config.drivers,
        name,
      )
    )
      continue;
    const dialect = connection.dialect;
    const loader = Object.hasOwn(officialDriverLoaders, dialect)
      ? officialDriverLoaders[dialect as keyof typeof officialDriverLoaders]
      : undefined;
    if (!loader) {
      throw new Error(
        `Database connection "${name}" uses unregistered dialect "${dialect}". Register a custom driver in database.drivers.`,
      );
    }
    let driver = loaded.get(dialect);
    if (!driver) {
      const packageName = `@nocobase/db-${dialect}`;
      let module: { default?: DatabaseDriverRegistration };
      try {
        module = await loader();
      } catch (cause) {
        const error = cause as NodeJS.ErrnoException;
        if (
          error?.code === 'ERR_MODULE_NOT_FOUND' &&
          error.message.startsWith(
            `Cannot find package '${packageName}' imported from `,
          )
        ) {
          // Collected rather than thrown, so every connection missing its driver is reported in one run.
          missing.push({
            connection: name,
            dialect: dialect as OfficialDialect,
            packageName,
          });
          continue;
        }
        throw new Error(
          `Failed to load database driver "${packageName}" for connection "${name}".`,
          { cause },
        );
      }
      if (!module.default)
        throw new Error(
          `Database driver "${packageName}" must have a default export.`,
        );
      driver = module.default;
      resolveDatabaseDriver(
        {
          dialect: connection.dialect,
          databaseDriver: connection.databaseDriver,
        },
        { [dialect]: driver },
        name,
      );
      loaded.set(dialect, driver);
    }
    if (suppliedDialects.has(dialect)) {
      connections[name] = {
        ...connection,
        databaseDriver: resolveDatabaseDriver(
          { dialect: connection.dialect },
          { [dialect]: driver },
          name,
        ),
      } satisfies typeof connection;
    } else {
      drivers[dialect] = driver;
    }
  }
  if (missing.length > 0) throw new MissingDatabaseDriversError(missing);
  return { ...config, drivers, connections };
}
