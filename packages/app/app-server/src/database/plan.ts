import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

import { validateDatabaseOwnership } from './ownership.js';

import type { AppPaths } from '../config/index.js';
import type { DatabaseDriverRegistration, MigrationSource } from '@nocobase/db';
import type {
  AppDatabaseConfig,
  AppDatabaseMigrationConfig,
  AppDatabaseTaskContributions,
} from './types.js';

export type AppDatabaseTaskKind = 'migrations' | 'seeds';

export interface AppDatabaseTaskSelection {
  connection?: string;
  all?: boolean;
  autoRun?: boolean;
  fresh?: boolean;
  confirmFresh?: (plan: readonly AppDatabaseTask[]) => Promise<boolean>;
}

/**
 * Everything planning needs beyond the configuration itself. `contributions` is
 * required so that a caller which has not been updated fails to compile rather
 * than silently planning without its plugins' migrations.
 */
export interface AppDatabaseTaskPlanOptions extends AppDatabaseTaskSelection {
  readonly migrationSources?: readonly AppDatabaseMigrationSource[];
  readonly contributions: AppDatabaseTaskContributions;
  readonly paths?: AppPaths;
  readonly drivers?: Record<string, DatabaseDriverRegistration>;
}

export interface AppDatabaseMigrationSource {
  readonly connection: string;
  readonly source: MigrationSource;
}

export interface AppDatabaseTask {
  connection: string;
  kind: AppDatabaseTaskKind;
  config: AppDatabaseMigrationConfig;
  skipReason?: 'external' | 'auto-run-disabled';
}

export function defaultConnectionName(
  config: AppDatabaseConfig,
): string | undefined {
  return config.default ?? Object.keys(config.connections)[0];
}

/** Resolve the entire plan before any database is opened or modified. */
export function planAppDatabaseTasks(
  config: AppDatabaseConfig,
  kinds: readonly AppDatabaseTaskKind[],
  planOptions: AppDatabaseTaskPlanOptions,
): AppDatabaseTask[] {
  const { contributions, paths, drivers } = planOptions;
  const selection: AppDatabaseTaskSelection = planOptions;
  if (selection.connection !== undefined && selection.all) {
    throw new Error('--connection and --all are mutually exclusive.');
  }
  const primary = defaultConnectionName(config);
  const migrationTargets = kinds.includes('migrations')
    ? (planOptions.migrationSources ?? [])
    : [];
  for (const target of migrationTargets) {
    if (!Object.hasOwn(config.connections, target.connection)) {
      throw new Error(
        `Unknown migration target database connection "${target.connection}".`,
      );
    }
  }
  if (primary === 'none' || !primary) {
    if (selection.connection !== undefined)
      throw new Error('Database is not configured.');
    return [];
  }
  if (!Object.hasOwn(config.connections, primary)) {
    throw new Error(`Unknown default database connection "${primary}".`);
  }
  validateDatabaseOwnership(config, paths, drivers);
  const names =
    selection.all || selection.autoRun
      ? Object.keys(config.connections).sort((a, b) =>
          a === primary ? -1 : b === primary ? 1 : a < b ? -1 : a > b ? 1 : 0,
        )
      : [selection.connection ?? primary];
  return names.flatMap((name) => {
    if (!Object.hasOwn(config.connections, name)) {
      throw new Error(`Unknown database connection "${name}".`);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error(
        `Database connection "${name}" must use letters, digits, underscores or hyphens.`,
      );
    }
    const connection = config.connections[name];
    const external = connection.schemaManagement === 'external';
    if (external && !selection.all && !selection.autoRun) {
      throw new Error(
        `Database connection "${name}" is external; migrations and seeds are not supported.`,
      );
    }
    return kinds.map((kind) => {
      const local = connection[kind];
      const legacy = name === primary ? config[kind] : undefined;
      // Legacy values (including existing DB_* environment mappings) retain precedence.
      // Source selection is exclusive: different explicit sources must never be merged.
      if (
        legacy?.directory &&
        local?.directory &&
        legacy.directory !== local.directory
      ) {
        throw new Error(
          `Conflicting legacy and connection ${kind} directories for "${name}".`,
        );
      }
      if (legacy?.sources && local?.sources) {
        throw new Error(`Configure ${kind} sources only once for "${name}".`);
      }
      const options = { ...local, ...legacy };
      if (options.directory && options.sources) {
        throw new Error(
          `Configure either ${kind} directory or sources for "${name}", not both.`,
        );
      }
      const root = paths?.database() ?? path.resolve('database');
      const modern = path.join(root, name, kind);
      const old = path.join(root, kind);
      let directory = options.directory;
      if (!directory && !options.sources && !external) {
        if (name === primary && existsSync(old)) {
          if (existsSync(modern)) {
            throw new Error(
              `Both legacy and connection ${kind} directories exist for "${name}". Configure one directory explicitly.`,
            );
          }
          directory = old;
        } else directory = modern;
      }
      const resolvePath = (value: string): string =>
        path.resolve(paths?.root() ?? process.cwd(), value);
      const packageName = options.packageName ?? contributions.appPackageName;
      const appSources = options.sources?.map((source) => ({
        ...source,
        directory: resolvePath(source.directory),
      })) ?? [
        {
          packageName,
          directory: resolvePath(directory ?? modern),
          extensions: options.extensions,
        },
      ];
      // Plugins contribute to the default connection only; they cannot know
      // which additional connections an application happens to define.
      const sources = [
        ...(kind === 'migrations'
          ? migrationTargets
              .filter((target) => target.connection === name)
              .map((target) => target.source)
          : []),
        ...appSources,
        ...(name === primary ? contributions[kind] : []),
      ];
      const autoRun = options.autoRun ?? name === primary;
      if (!external && (!selection.autoRun || autoRun)) {
        for (const source of sources) {
          if (
            existsSync(source.directory) &&
            !statSync(source.directory).isDirectory()
          ) {
            throw new Error(
              `Database ${kind} source is not a directory: ${source.directory}`,
            );
          }
        }
        if (options.directory || options.sources) {
          for (const source of appSources) {
            if (!existsSync(source.directory)) {
              throw new Error(
                `Explicit database ${kind} source is missing for "${name}": ${source.directory}`,
              );
            }
          }
        }
      }
      return {
        connection: name,
        kind,
        config: {
          ...options,
          packageName,
          directory: resolvePath(directory ?? modern),
          sources,
          autoRun,
        },
        skipReason: external
          ? 'external'
          : selection.autoRun && !autoRun
            ? 'auto-run-disabled'
            : undefined,
      };
    });
  });
}
