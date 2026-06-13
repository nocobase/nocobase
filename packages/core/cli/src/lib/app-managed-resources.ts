/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, readdir } from 'node:fs/promises';
import type { ManagedAppRuntime } from './app-runtime.js';
import { resolveAppPublicPath } from './app-public-path.js';
import {
  dockerContainerExists,
  managedAppLifecycleEnvVars,
  runLocalNocoBaseCommand,
  startDockerContainer,
} from './app-runtime.js';
import { deriveBuiltinDbConnection, resolveBuiltinDbConnection } from './builtin-db.js';
import { resolveConfiguredStoragePath } from './env-paths.js';
import { resolveDockerEnvFileArg } from './docker-env-file.ts';
import {
  DEFAULT_DOCKER_REGISTRY,
  DEFAULT_DOCKER_VERSION,
  resolveDockerImageRef,
} from './docker-image.ts';
import { commandSucceeds, ensureDockerDaemonRunning, run } from './run-npm.js';
import Install from '../commands/install.js';
const DOCKER_APP_STORAGE_DESTINATION = '/app/nocobase/storage';
type ManagedDownloadableLocalRuntime = Extract<ManagedAppRuntime, { kind: 'local' }> & {
  source: 'npm' | 'git';
};

function commandStdio(verbose?: boolean): 'inherit' | 'ignore' {
  return verbose ? 'inherit' : 'ignore';
}

async function ensureDockerNetwork(networkName: string): Promise<void> {
  await ensureDockerDaemonRunning('prepare Docker resources for this environment');

  if (await commandSucceeds('docker', ['network', 'inspect', networkName])) {
    return;
  }

  await run('docker', ['network', 'create', networkName], {
    errorName: 'docker network create',
  });
}

function localSourceLabel(source: 'npm' | 'git'): string {
  return source === 'git' ? 'Git checkout' : 'npm app';
}

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function pushOptionalEnvArg(args: string[], key: string, value: string | boolean | undefined) {
  if (typeof value === 'string') {
    if (!value) {
      return;
    }
    args.push('-e', `${key}=${value}`);
    return;
  }

  if (typeof value === 'boolean') {
    args.push('-e', `${key}=${String(value)}`);
  }
}

function resolveDockerClientAssetsExtractEnabled(envValue: unknown): boolean {
  const text = trimValue(envValue).toLowerCase();
  if (!text) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(text)) {
    return false;
  }

  return true;
}

function normalizeDockerPlatform(value: unknown): string | undefined {
  const text = trimValue(value);
  if (!text || text === 'auto') {
    return undefined;
  }

  if (text === 'linux/amd64' || text === 'linux/arm64') {
    return text;
  }

  return undefined;
}

function formatBuiltinDbFailure(envName: string, message: string): string {
  return [
    `Couldn't restore the built-in database for "${envName}".`,
    'Check the saved database settings, local storage path, and Docker runtime, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function formatLocalSourceRestoreFailure(envName: string, source: 'npm' | 'git', message: string): string {
  const sourceLabel = source === 'git' ? 'the saved Git checkout' : 'the saved npm app';
  return [
    `Couldn't restore NocoBase files for "${envName}".`,
    `The CLI was not able to download ${sourceLabel} before starting the app again.`,
    'Check the saved source settings for this env, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function formatLocalPostinstallFailure(envName: string, message: string): string {
  return [
    `Couldn't prepare NocoBase for "${envName}".`,
    'The CLI was not able to run `nocobase-v1 postinstall` before starting the local app.',
    'Check the local dependencies, storage path, and saved env settings, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function formatSavedDockerSettingsIncomplete(envName: string, missing: string[]): string {
  return [
    `Can't start NocoBase for "${envName}" yet.`,
    `The saved Docker settings for this env are incomplete. Missing: ${missing.join(', ')}.`,
    `Re-run \`nb init --ui --env ${envName}\` to refresh this env config, then try again.`,
  ].join('\n');
}

function formatDockerAppRecreateFailure(envName: string, message: string): string {
  return [
    `Couldn't start NocoBase for "${envName}".`,
    'The CLI was not able to recreate the saved Docker app container successfully.',
    'Check the saved Docker image, container settings, and database connection, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

async function localProjectHasFiles(projectRoot: string): Promise<boolean> {
  try {
    const entries = await readdir(projectRoot);
    return entries.length > 0;
  } catch (_error) {
    return false;
  }
}

export async function buildSavedDockerRunArgs(
  runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
  options?: {
    initEnvVars?: Record<string, string>;
  },
): Promise<{
  appPort?: string;
  storagePath: string;
  envFile?: string;
  imageRef: string;
  args: string[];
}> {
  const config = runtime.env.config ?? {};
  const storagePath = trimValue(resolveConfiguredStoragePath(config));
  const envFile = await resolveDockerEnvFileArg(runtime.envName, config);
  const appPort =
    runtime.env.appPort === undefined || runtime.env.appPort === null
      ? ''
      : trimValue(runtime.env.appPort);
  const appKey = trimValue(config.appKey);
  const appPublicPath = trimValue(config.appPublicPath);
  const timeZone = trimValue(config.timezone) || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const builtinDbConnection = config.builtinDb ? deriveBuiltinDbConnection(runtime) : undefined;
  const dbDialect = builtinDbConnection?.dbDialect || trimValue(config.dbDialect);
  const dbHost = builtinDbConnection?.dbHost || trimValue(config.dbHost);
  const dbPort = builtinDbConnection?.dbPort || trimValue(config.dbPort);
  const dbDatabase = trimValue(config.dbDatabase);
  const dbUser = trimValue(config.dbUser);
  const dbPassword = trimValue(config.dbPassword);
  const dbSchema = trimValue(config.dbSchema);
  const dbTablePrefix = trimValue(config.dbTablePrefix);
  const dbUnderscored =
    typeof config.dbUnderscored === 'boolean' ? config.dbUnderscored : undefined;
  const extractClientAssets = resolveDockerClientAssetsExtractEnabled(process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS);
  const dockerRegistry = trimValue(config.dockerRegistry) || DEFAULT_DOCKER_REGISTRY;
  const version = trimValue(config.downloadVersion) || DEFAULT_DOCKER_VERSION;
  const imageRef = resolveDockerImageRef(dockerRegistry, version, {
    defaultRegistry: DEFAULT_DOCKER_REGISTRY,
    defaultVersion: DEFAULT_DOCKER_VERSION,
  });

  const missing: string[] = [];
  if (!storagePath) {
    missing.push('storagePath');
  }
  if (!appKey) {
    missing.push('appKey');
  }
  if (!dbDialect) {
    missing.push('dbDialect');
  }
  if (!dbHost) {
    missing.push('dbHost');
  }
  if (!dbPort) {
    missing.push('dbPort');
  }
  if (!dbDatabase) {
    missing.push('dbDatabase');
  }
  if (!dbUser) {
    missing.push('dbUser');
  }
  if (!dbPassword) {
    missing.push('dbPassword');
  }

  if (missing.length > 0) {
    throw new Error(formatSavedDockerSettingsIncomplete(runtime.envName, missing));
  }

  const args = [
    'run',
    '-d',
    '--name',
    runtime.containerName,
    '--restart',
    'always',
    '--network',
    runtime.workspaceName,
  ];

  const dockerPlatform = normalizeDockerPlatform(config.dockerPlatform);
  if (dockerPlatform) {
    args.push('--platform', dockerPlatform);
  }

  if (appPort) {
    args.push('-p', `${appPort}:80`);
  }

  if (envFile) {
    args.push('--env-file', envFile);
  }

  for (const [key, value] of Object.entries(options?.initEnvVars ?? {})) {
    args.push('-e', `${key}=${value}`);
  }

  const lifecycleEnvVars = managedAppLifecycleEnvVars();
  args.push(
    '-e',
    `APP_ENV=${lifecycleEnvVars.APP_ENV}`,
    '-e',
    `NODE_ENV=${lifecycleEnvVars.NODE_ENV}`,
    '-e',
    `APP_KEY=${appKey}`,
    '-e',
    `DB_DIALECT=${dbDialect}`,
    '-e',
    `DB_HOST=${dbHost}`,
    '-e',
    `DB_PORT=${dbPort}`,
    '-e',
    `DB_DATABASE=${dbDatabase}`,
    '-e',
    `DB_USER=${dbUser}`,
    '-e',
    `DB_PASSWORD=${dbPassword}`,
    '-e',
    `TZ=${timeZone}`,
    '-v',
    `${storagePath}:${DOCKER_APP_STORAGE_DESTINATION}`,
  );
  pushOptionalEnvArg(args, 'APP_PUBLIC_PATH', appPublicPath ? resolveAppPublicPath(appPublicPath) : undefined);
  pushOptionalEnvArg(args, 'DB_SCHEMA', dbSchema || undefined);
  pushOptionalEnvArg(args, 'DB_TABLE_PREFIX', dbTablePrefix || undefined);
  pushOptionalEnvArg(args, 'DB_UNDERSCORED', dbUnderscored);
  pushOptionalEnvArg(args, 'NOCOBASE_EXTRACT_CLIENT_ASSETS', extractClientAssets);
  args.push(imageRef);

  return {
    appPort: appPort || undefined,
    storagePath,
    envFile,
    imageRef,
    args,
  };
}

export async function recreateSavedDockerApp(
  runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
  options?: { verbose?: boolean; initEnvVars?: Record<string, string> },
): Promise<void> {
  const plan = await buildSavedDockerRunArgs(runtime, {
    initEnvVars: options?.initEnvVars,
  });

  try {
    await ensureDockerNetwork(runtime.workspaceName);
    await mkdir(plan.storagePath, { recursive: true });
    await run('docker', plan.args, {
      errorName: 'docker run',
      stdio: commandStdio(options?.verbose),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes(`Can't start NocoBase for "${runtime.envName}" yet.`)
      || message.includes(`Couldn't start NocoBase for "${runtime.envName}".`)
    ) {
      throw error instanceof Error ? error : new Error(message);
    }
    throw new Error(formatDockerAppRecreateFailure(runtime.envName, message));
  }
}

export async function ensureBuiltinDbReady(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: {
    verbose?: boolean;
    onStartTask?: (message: string) => void;
    onSucceedTask?: (message: string) => void;
    onFailTask?: (message: string) => void;
  },
): Promise<void> {
  const config = runtime.env.config ?? {};
  if (!config.builtinDb) {
    return;
  }
  const builtinDbConnection = await resolveBuiltinDbConnection(runtime);

  const plan = Install.buildBuiltinDbPlan({
    envName: runtime.envName,
    workspaceName: runtime.workspaceName,
    dockerContainerPrefix: runtime.dockerContainerPrefix,
    appPath: config.appPath,
    storagePath: config.storagePath,
    source: runtime.source,
    dbDialect: builtinDbConnection.dbDialect,
    dbHost: builtinDbConnection.dbHost,
    dbPort: builtinDbConnection.dbPort,
    dbDatabase: config.dbDatabase,
    dbUser: config.dbUser,
    dbPassword: config.dbPassword,
    builtinDbImage: config.builtinDbImage,
  });

  options?.onStartTask?.(`Restoring the built-in ${plan.dbDialect} database for "${runtime.envName}"...`);
  try {
    await ensureDockerNetwork(plan.networkName);
    if (await dockerContainerExists(plan.containerName)) {
      const state = await startDockerContainer(plan.containerName, {
        stdio: commandStdio(options?.verbose),
      });
      options?.onSucceedTask?.(
        state === 'already-running'
          ? `The built-in ${plan.dbDialect} database is already running for "${runtime.envName}" at ${plan.dbHost}:${plan.dbPort}.`
          : `The built-in ${plan.dbDialect} database is running for "${runtime.envName}" at ${plan.dbHost}:${plan.dbPort}.`,
      );
      return;
    }

    await mkdir(plan.dataDir, { recursive: true });
    await run('docker', plan.args, {
      errorName: 'docker run',
      stdio: commandStdio(options?.verbose),
    });
    options?.onSucceedTask?.(
      `The built-in ${plan.dbDialect} database is running for "${runtime.envName}" at ${plan.dbHost}:${plan.dbPort}.`,
    );
  } catch (error: unknown) {
    options?.onFailTask?.(`Failed to restore the built-in database for "${runtime.envName}".`);
    throw new Error(formatBuiltinDbFailure(runtime.envName, error instanceof Error ? error.message : String(error)));
  }
}

export function buildSavedLocalDownloadArgv(
  runtime: ManagedDownloadableLocalRuntime,
  options?: { verbose?: boolean },
): string[] {
  const config = runtime.env.config ?? {};
  const argv = ['-y', '--no-intro'];
  if (options?.verbose) {
    argv.push('--verbose');
  }
  argv.push('--source', runtime.source, '--replace', '--output-dir', runtime.projectRoot);

  const version = String(config.downloadVersion ?? '').trim();
  const gitUrl = String(config.gitUrl ?? '').trim();
  const npmRegistry = String(config.npmRegistry ?? '').trim();

  if (version) {
    argv.push('--version', version);
  }
  if (gitUrl) {
    argv.push('--git-url', gitUrl);
  }
  if (npmRegistry) {
    argv.push('--npm-registry', npmRegistry);
  }
  if (config.devDependencies === true) {
    argv.push('--dev-dependencies');
  }
  if (config.build === false) {
    argv.push('--no-build');
  }
  if (config.buildDts === true) {
    argv.push('--build-dts');
  }

  return argv;
}

export async function ensureSavedLocalSource(
  runtime: ManagedDownloadableLocalRuntime,
  runCommand: (id: string, argv?: string[]) => Promise<unknown>,
  options?: {
    verbose?: boolean;
    onStartTask?: (message: string) => void;
    onSucceedTask?: (message: string) => void;
    onFailTask?: (message: string) => void;
  },
): Promise<void> {
  if (await localProjectHasFiles(runtime.projectRoot)) {
    return;
  }

  const sourceLabel = localSourceLabel(runtime.source);
  options?.onStartTask?.(`Restoring the saved ${sourceLabel} for "${runtime.envName}"...`);
  try {
    await runCommand('source:download', buildSavedLocalDownloadArgv(runtime, {
      verbose: options?.verbose,
    }));
    options?.onSucceedTask?.(`NocoBase files are ready for "${runtime.envName}".`);
  } catch (error: unknown) {
    options?.onFailTask?.(`Failed to restore NocoBase files for "${runtime.envName}".`);
    throw new Error(
      formatLocalSourceRestoreFailure(
        runtime.envName,
        runtime.source,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}

export async function ensureLocalPostinstall(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' }>,
  options?: {
    verbose?: boolean;
    env?: Record<string, string>;
    onStartTask?: (message: string) => void;
    onSucceedTask?: (message: string) => void;
    onFailTask?: (message: string) => void;
  },
): Promise<void> {
  options?.onStartTask?.(`Running local postinstall for "${runtime.envName}"...`);
  try {
    await runLocalNocoBaseCommand(runtime, ['postinstall'], {
      env: options?.env,
      stdio: commandStdio(options?.verbose),
    });
    options?.onSucceedTask?.(`Local postinstall finished for "${runtime.envName}".`);
  } catch (error: unknown) {
    options?.onFailTask?.(`Failed to run local postinstall for "${runtime.envName}".`);
    throw new Error(formatLocalPostinstallFailure(runtime.envName, error instanceof Error ? error.message : String(error)));
  }
}
