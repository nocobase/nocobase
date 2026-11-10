import path from 'node:path';

import type { ResolvedAppServerPlugins } from './types.js';

export interface AppServerInspectionIssue {
  readonly code:
    | 'SERVER_MIGRATIONS_DIRECTORY_MISSING'
    | 'SERVER_SEEDS_DIRECTORY_MISSING'
    | 'SERVER_QUEUE_JOBS_DEPRECATED';
  readonly message: string;
  readonly packageName: string;
  /** Only errors make an inspection inconsistent. */
  readonly severity: 'error' | 'warning';
}

export interface AppServerProviderSnapshot {
  readonly order: number;
  readonly pluginOrder: number;
  readonly packageName: string;
  readonly constructorName: string;
}

export interface AppServerRouteSnapshot {
  readonly order: number;
  readonly pluginOrder: number;
  readonly contributionOrder: number;
  readonly packageName: string;
  readonly scope: 'api' | 'root';
}

export interface AppServerLocalesSnapshot {
  readonly order: number;
  readonly pluginOrder: number;
  readonly packageName: string;
}

export interface AppServerDatabaseSnapshot {
  /** Absent for legacy default-connection contributions. */
  readonly connection?: string;
  readonly packageName: string;
  readonly migrations?: {
    readonly configured: string;
    readonly resolved?: string;
  };
  readonly seeds?: {
    readonly configured: string;
    readonly resolved?: string;
  };
}

/** A deprecated `queue.jobs` declaration, reported rather than resolved. */
export interface AppServerJobsSnapshot {
  readonly packageName: string;
  readonly configuredLocations: readonly string[];
}

export interface AppServerPluginSnapshot {
  readonly order: number;
  readonly packageName: string;
  readonly version: string;
  readonly rootDir: string;
  readonly baseDir: string;
  readonly contributions: {
    readonly serviceProviders: number;
    readonly routes: number;
    readonly locales: boolean;
    readonly migrations: boolean;
    readonly seeds: boolean;
    /** Deprecated `queue.jobs` locations the plugin still declares; none is loaded. */
    readonly jobLocations: number;
  };
}

export interface AppServerInspectionSnapshot {
  readonly app: { readonly packageName: string };
  readonly plugins: readonly AppServerPluginSnapshot[];
  readonly serviceProviders: readonly AppServerProviderSnapshot[];
  readonly routes: readonly AppServerRouteSnapshot[];
  readonly locales: readonly AppServerLocalesSnapshot[];
  readonly database: readonly AppServerDatabaseSnapshot[];
  readonly jobs: readonly AppServerJobsSnapshot[];
  readonly consistent: boolean;
  readonly issues: readonly AppServerInspectionIssue[];
  readonly suggestions: readonly string[];
}

/**
 * Describes imported Server plugin declarations and resolved contribution locations without constructing Providers,
 * running lifecycle code, executing Route factories, or loading locale resources.
 * Importing the declarations remains the caller's responsibility and may execute module initialization code.
 */
export function inspectResolvedAppServerPlugins(
  resolved: ResolvedAppServerPlugins,
): AppServerInspectionSnapshot {
  const serviceProviders: AppServerProviderSnapshot[] = [];
  const routes: AppServerRouteSnapshot[] = [];
  const locales: AppServerLocalesSnapshot[] = [];
  const database: AppServerDatabaseSnapshot[] = [];
  const jobs: AppServerJobsSnapshot[] = [];
  const issues: AppServerInspectionIssue[] = [];

  let providerOrder = 0;
  let routeOrder = 0;
  const plugins = resolved.plugins.map((plugin, index) => {
    const pluginOrder = index + 1;
    if (plugin.definition.locales) {
      locales.push({
        order: locales.length + 1,
        pluginOrder,
        packageName: plugin.metadata.packageName,
      });
    }
    plugin.definition.serviceProviders.forEach((Provider) => {
      providerOrder += 1;
      serviceProviders.push({
        order: providerOrder,
        pluginOrder,
        packageName: plugin.metadata.packageName,
        constructorName: Provider.name || '(anonymous)',
      });
    });
    plugin.definition.routes.forEach((route, routeIndex) => {
      routeOrder += 1;
      routes.push({
        order: routeOrder,
        pluginOrder,
        contributionOrder: routeIndex + 1,
        packageName: plugin.metadata.packageName,
        scope: route.scope,
      });
    });

    const databaseEntries = [
      {
        connection: undefined as string | undefined,
        definition: plugin.definition.database,
        metadata: plugin.metadata,
      },
      ...Object.entries(plugin.definition.database?.connections ?? {}).map(
        ([connection, definition]) => ({
          connection,
          definition: {
            migrations:
              definition.migrations ?? `./database/${connection}/migrations`,
            seeds: definition.seeds ?? `./database/${connection}/seeds`,
          },
          metadata: plugin.metadata.connections?.[connection],
        }),
      ),
    ];
    for (const entry of databaseEntries) {
      const configuredMigrations = entry.definition?.migrations;
      const configuredSeeds = entry.definition?.seeds;
      if (configuredMigrations || configuredSeeds) {
        database.push({
          packageName: plugin.metadata.packageName,
          ...(entry.connection ? { connection: entry.connection } : {}),
          ...(configuredMigrations
            ? {
                migrations: {
                  configured: configuredMigrations,
                  ...(entry.metadata?.migrationsDirectory
                    ? { resolved: entry.metadata?.migrationsDirectory }
                    : {}),
                },
              }
            : {}),
          ...(configuredSeeds
            ? {
                seeds: {
                  configured: configuredSeeds,
                  ...(entry.metadata?.seedsDirectory
                    ? { resolved: entry.metadata?.seedsDirectory }
                    : {}),
                },
              }
            : {}),
        });
      }
      if (
        configuredMigrations &&
        !entry.metadata?.migrationsDirectory &&
        (entry.connection === undefined ||
          plugin.definition.database?.connections?.[entry.connection]
            ?.migrations)
      ) {
        issues.push({
          code: 'SERVER_MIGRATIONS_DIRECTORY_MISSING',
          severity: 'error',
          packageName: plugin.metadata.packageName,
          message: `${plugin.metadata.packageName} declares migrations at ${path.resolve(plugin.metadata.baseDir, configuredMigrations)}, but the directory could not be resolved.`,
        });
      }
      if (
        configuredSeeds &&
        !entry.metadata?.seedsDirectory &&
        (entry.connection === undefined ||
          plugin.definition.database?.connections?.[entry.connection]?.seeds)
      ) {
        issues.push({
          code: 'SERVER_SEEDS_DIRECTORY_MISSING',
          severity: 'error',
          packageName: plugin.metadata.packageName,
          message: `${plugin.metadata.packageName} declares seeds at ${path.resolve(plugin.metadata.baseDir, configuredSeeds)}, but the directory could not be resolved.`,
        });
      }
    }

    const configuredJobs = plugin.definition.queue?.jobs ?? [];
    if (plugin.definition.queue) {
      jobs.push({
        packageName: plugin.metadata.packageName,
        configuredLocations: configuredJobs,
      });
      issues.push({
        code: 'SERVER_QUEUE_JOBS_DEPRECATED',
        severity: 'warning',
        packageName: plugin.metadata.packageName,
        message: `${plugin.metadata.packageName} declares queue.jobs, which is deprecated and ignored: Job modules are no longer discovered.`,
      });
    }
    return {
      order: pluginOrder,
      packageName: plugin.metadata.packageName,
      version: plugin.metadata.version,
      rootDir: plugin.metadata.rootDir,
      baseDir: plugin.metadata.baseDir,
      contributions: {
        serviceProviders: plugin.definition.serviceProviders.length,
        routes: plugin.definition.routes.length,
        locales: plugin.definition.locales !== undefined,
        migrations: databaseEntries.some(
          (entry) => entry.definition?.migrations !== undefined,
        ),
        seeds: databaseEntries.some(
          (entry) => entry.definition?.seeds !== undefined,
        ),
        jobLocations: configuredJobs.length,
      },
    };
  });

  return {
    app: { packageName: resolved.appPackageName },
    plugins,
    serviceProviders,
    routes,
    locales,
    database,
    jobs,
    consistent: !issues.some((issue) => issue.severity === 'error'),
    issues,
    suggestions: suggestionsForIssues(issues),
  };
}

function suggestionsForIssues(
  issues: readonly AppServerInspectionIssue[],
): string[] {
  const suggestions = new Set<string>();
  for (const issue of issues) {
    if (
      issue.code === 'SERVER_MIGRATIONS_DIRECTORY_MISSING' ||
      issue.code === 'SERVER_SEEDS_DIRECTORY_MISSING'
    ) {
      suggestions.add(
        'Check the plugin database declaration, package files, and resolved installation contents.',
      );
    } else if (issue.code === 'SERVER_QUEUE_JOBS_DEPRECATED') {
      suggestions.add(
        "Remove queue from the plugin's defineServerPlugin call, and register queue handlers from a service provider's boot() through queueServiceToken, or move the work to @nocobase/jobs.",
      );
    }
  }
  return [...suggestions];
}
