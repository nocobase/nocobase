import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { dotenvParser } from '@nocobase/config/parsers/dotenv';

import { type EnvMap } from '../config/index.js';
import {
  DEFAULT_APP_BASE_PATH,
  normalizeBasePath,
  resolveAppNameFromBasePath,
} from '../support/index.js';
import { AppScopeLifecycle } from '../runtime/lifecycle.js';
import type { AppPathOptions, AppScope } from '../runtime/types.js';

export interface LoadStandaloneAppEnvOptions {
  readonly rootDir: string;
  readonly files?: readonly string[];
  readonly baseEnv?: EnvMap;
  readonly overrides?: EnvMap;
}

export function loadStandaloneAppEnv(
  options: LoadStandaloneAppEnvOptions,
): EnvMap {
  const baseEnv = options.baseEnv ?? process.env;
  const files = options.files ?? [
    path.join(options.rootDir, '.env'),
    path.join(options.rootDir, '.env.local'),
  ];
  return {
    ...readDotenvFiles(files, baseEnv),
    ...baseEnv,
    ...options.overrides,
  };
}

export interface StandaloneAppScopeOptions {
  readonly id?: string;
  readonly appName: string;
  readonly basePath: string;
  readonly paths: AppPathOptions;
  readonly configPath?: string;
  readonly env: EnvMap;
  readonly abortReason?: unknown;
  readonly consoleLogStream?: 'stdout' | 'stderr';
}

export interface CreateStandaloneScopeOptions {
  readonly rootDir?: string;
  readonly deploymentRootDir?: string;
  readonly paths?: AppPathOptions;
  readonly appName?: string;
  readonly basePath?: string;
  readonly configPath?: string;
  /** Final environment overrides applied after dotenv files and process.env. */
  readonly env?: EnvMap;
  readonly abortReason?: unknown;
  /** See {@link AppScope.consoleLogStream}. */
  readonly consoleLogStream?: 'stdout' | 'stderr';
}

export interface ResolveStandaloneAppPathsOptions {
  readonly rootDir?: string;
  readonly deploymentRootDir?: string;
  readonly paths?: AppPathOptions;
}

export class StandaloneAppScope extends AppScopeLifecycle implements AppScope {
  public readonly mode = 'standalone' as const;
  public readonly id: string;
  public readonly appName: string;
  public readonly basePath: string;
  public readonly paths: AppPathOptions;
  public readonly rootDir: string;
  public readonly dataDir: string | undefined;
  public readonly clientDir: string | undefined;
  public readonly configPath: string | undefined;
  public readonly env: EnvMap;
  public readonly consoleLogStream: 'stdout' | 'stderr' | undefined;

  public constructor(options: StandaloneAppScopeOptions) {
    super({ abortReason: options.abortReason });
    this.id = options.id ?? options.appName;
    this.appName = options.appName;
    this.basePath = options.basePath;
    this.paths = options.paths;
    this.rootDir = options.paths.rootDir;
    this.dataDir = options.paths.storageDir;
    this.clientDir = options.paths.clientDir;
    this.configPath = options.configPath;
    this.env = options.env;
    this.consoleLogStream = options.consoleLogStream;
  }
}

export function createStandaloneScope(
  options: CreateStandaloneScopeOptions,
): StandaloneAppScope {
  const paths = resolveStandaloneAppPaths(options);
  const deploymentRootDir = path.resolve(
    paths.rootDir,
    paths.deploymentRootDir ?? '.',
  );
  const env = loadStandaloneAppEnv({
    rootDir: deploymentRootDir,
    files: [
      ...(path.resolve(paths.rootDir) === deploymentRootDir
        ? []
        : [path.join(paths.rootDir, '.env')]),
      path.join(deploymentRootDir, '.env'),
      path.join(deploymentRootDir, '.env.local'),
    ],
    overrides: options.env,
  });
  const defaultAppName = 'main';
  const basePath = normalizeBasePath(
    options.basePath ?? env.APP_BASE_PATH ?? DEFAULT_APP_BASE_PATH,
  );
  const appName =
    options.appName ?? resolveAppNameFromBasePath(basePath, defaultAppName);

  return new StandaloneAppScope({
    appName,
    basePath,
    paths,
    configPath: options.configPath,
    env,
    abortReason:
      options.abortReason ?? new Error('Standalone application closed.'),
    consoleLogStream: options.consoleLogStream,
  });
}

function readDotenvFiles(
  files: readonly string[],
  baseEnv: EnvMap,
): Record<string, string> {
  const parser = dotenvParser();
  const environment: Record<string, string> = {};

  for (const filePath of files) {
    if (!existsSync(filePath)) continue;
    const parsed = parser.parse(readFileSync(filePath));
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') environment[key] = value;
    }
  }

  const expansionEnvironment = { ...baseEnv, ...environment };
  for (const [key, value] of Object.entries(environment)) {
    environment[key] = expandEnvironmentValue(value, expansionEnvironment);
    expansionEnvironment[key] = environment[key];
  }

  return environment;
}

function expandEnvironmentValue(value: string, env: EnvMap): string {
  return value.replace(
    /\\?\${?([A-Za-z_][A-Za-z0-9_]*)}?/g,
    (match, key: string): string => {
      if (match.startsWith('\\')) return match.slice(1);
      return env[key] ?? '';
    },
  );
}

export function resolveStandaloneAppPaths(
  options: ResolveStandaloneAppPathsOptions,
): AppPathOptions {
  if (options.paths) {
    return options.paths;
  }

  if (!options.rootDir) {
    throw new Error(
      'Standalone scope requires options.rootDir or options.paths.',
    );
  }

  const rootDir = path.resolve(options.rootDir);
  const deploymentRootDir = path.resolve(
    rootDir,
    options.deploymentRootDir ?? '.',
  );
  const built = rootDir !== deploymentRootDir;

  return {
    rootDir,
    serverDir: path.join(rootDir, 'server'),
    databaseDir: path.join(rootDir, 'database'),
    clientDir: path.join(rootDir, built ? 'client' : 'dist/client'),
    deploymentRootDir,
  };
}
