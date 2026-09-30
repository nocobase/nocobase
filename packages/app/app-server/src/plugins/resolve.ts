import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { MigrationSource, SeedSource } from '@nocobase/db';

import type { AppDatabaseTaskContributions } from '../database/index.js';
import type {
  AppServerPlugin,
  AppServerPlugins,
  ResolvedAppPlugin,
  ResolvedAppServerPlugins,
} from './types.js';

export interface ResolveAppServerPluginsOptions {
  readonly defaultAppPackageName?: string;
}

export function resolveAppServerPlugins(
  rootDir: string,
  serverPlugins: AppServerPlugins,
  options: ResolveAppServerPluginsOptions = {},
): ResolvedAppServerPlugins {
  const appPackagePath = path.join(rootDir, 'package.json');
  const appPackage = existsSync(appPackagePath) ? readJson(appPackagePath) : {};

  return {
    appPackageName:
      typeof appPackage.name === 'string'
        ? appPackage.name
        : (options.defaultAppPackageName ?? 'app'),
    plugins: serverPlugins.plugins.map((definition) => ({
      definition,
      metadata: resolvePlugin(definition),
    })),
  };
}

/** The application identity and plugin task sources that database planning needs. */
export function createAppDatabaseTaskContributions(
  resolved: ResolvedAppServerPlugins,
): AppDatabaseTaskContributions {
  const plugins = resolved.plugins.map((plugin) => plugin.metadata);
  return {
    appPackageName: resolved.appPackageName,
    migrations: createPluginMigrationSources(plugins),
    seeds: createPluginSeedSources(plugins),
  };
}

export function createPluginMigrationSources(
  plugins: readonly ResolvedAppPlugin[],
): MigrationSource[] {
  return plugins.flatMap((plugin) =>
    plugin.migrationsDirectory
      ? [
          {
            packageName: plugin.packageName,
            directory: plugin.migrationsDirectory,
          },
        ]
      : [],
  );
}

export function createPluginSeedSources(
  plugins: readonly ResolvedAppPlugin[],
): SeedSource[] {
  return plugins.flatMap((plugin) =>
    plugin.seedsDirectory
      ? [
          {
            packageName: plugin.packageName,
            directory: plugin.seedsDirectory,
          },
        ]
      : [],
  );
}

/** @deprecated Always returns an empty list: Job modules are no longer discovered. */
export function createPluginJobLocations(
  plugins: readonly ResolvedAppPlugin[],
): string[] {
  return plugins.flatMap((plugin) => plugin.jobLocations);
}

function resolvePlugin(definition: AppServerPlugin): ResolvedAppPlugin {
  if (
    typeof definition.baseDir !== 'string' ||
    !path.isAbsolute(definition.baseDir)
  ) {
    throw new Error(
      `Server plugin "${definition.packageName}" requires an absolute baseDir.`,
    );
  }
  const packageJsonPath = resolvePackageJson(
    definition.baseDir,
    definition.packageName,
  );
  const packageJson = readJson(packageJsonPath);
  const packageRoot = path.dirname(packageJsonPath);

  return {
    packageName: definition.packageName,
    version:
      typeof packageJson.version === 'string' ? packageJson.version : 'unknown',
    rootDir: packageRoot,
    baseDir: definition.baseDir,
    migrationsDirectory: resolveOptionalDirectoryPath(
      definition.baseDir,
      definition.database?.migrations,
    ),
    seedsDirectory: resolveOptionalDirectoryPath(
      definition.baseDir,
      definition.database?.seeds,
    ),
    jobLocations: Object.freeze([]),
  };
}

function resolveOptionalDirectoryPath(
  baseDir: string,
  configuredPath: string | undefined,
): string | undefined {
  if (!configuredPath) {
    return undefined;
  }
  validatePackagePath(configuredPath);
  const resolvedPath = path.resolve(baseDir, configuredPath);
  return existsSync(resolvedPath) ? resolvedPath : undefined;
}

function validatePackagePath(configuredPath: string): void {
  if (
    !configuredPath.startsWith('./') ||
    configuredPath === './' ||
    configuredPath.includes('//') ||
    configuredPath.includes('\\') ||
    configuredPath.split('/').includes('..')
  ) {
    throw new Error(
      `Server plugin path "${configuredPath}" must be a safe baseDir-relative path beginning with "./".`,
    );
  }
}

function resolvePackageJson(baseDir: string, packageName: string): string {
  let directory = baseDir;
  while (true) {
    const candidate = path.join(directory, 'package.json');
    if (existsSync(candidate) && readJson(candidate).name === packageName) {
      return candidate;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      throw new Error(
        `Server plugin "${packageName}" has no matching package.json above baseDir "${baseDir}".`,
      );
    }
    directory = parent;
  }
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
}
