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
import { dockerContainerExists, startDockerContainer } from './app-runtime.js';
import { resolveConfiguredEnvPath } from './cli-home.js';
import { commandSucceeds, run } from './run-npm.js';
import Install from '../commands/install.js';

const DEFAULT_DOCKER_REGISTRY = 'nocobase/nocobase';
const DEFAULT_DOCKER_VERSION = 'alpha';
const DOCKER_APP_STORAGE_DESTINATION = '/app/nocobase/storage';
type ManagedDownloadableLocalRuntime = Extract<ManagedAppRuntime, { kind: 'local' }> & {
  source: 'npm' | 'git';
};

function commandStdio(verbose?: boolean): 'inherit' | 'ignore' {
  return verbose ? 'inherit' : 'ignore';
}

async function ensureDockerNetwork(networkName: string): Promise<void> {
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

function formatSavedDockerSettingsIncomplete(envName: string, missing: string[]): string {
  return [
    `Can't start NocoBase for "${envName}" yet.`,
    `The saved Docker settings for this env are incomplete. Missing: ${missing.join(', ')}.`,
    'Re-run `nb init` or `nb env add` to refresh this env config, then try again.',
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

export function buildSavedDockerRunArgs(
  runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
): {
  appPort?: string;
  storagePath: string;
  imageRef: string;
  args: string[];
} {
  const config = runtime.env.config ?? {};
  const configuredStoragePath = trimValue(config.storagePath);
  const storagePath = configuredStoragePath
    ? trimValue(resolveConfiguredEnvPath(configuredStoragePath))
    : '';
  const appPort =
    runtime.env.appPort === undefined || runtime.env.appPort === null
      ? ''
      : trimValue(runtime.env.appPort);
  const appKey = trimValue(config.appKey);
  const timeZone = trimValue(config.timezone) || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const dbDialect = trimValue(config.dbDialect);
  const dbHost = trimValue(config.dbHost);
  const dbPort = trimValue(config.dbPort);
  const dbDatabase = trimValue(config.dbDatabase);
  const dbUser = trimValue(config.dbUser);
  const dbPassword = trimValue(config.dbPassword);
  const dockerRegistry = trimValue(config.dockerRegistry) || DEFAULT_DOCKER_REGISTRY;
  const version = trimValue(config.downloadVersion) || DEFAULT_DOCKER_VERSION;
  const imageRef = `${dockerRegistry}:${version}`;

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

  args.push(
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
    imageRef,
  );

  return {
    appPort: appPort || undefined,
    storagePath,
    imageRef,
    args,
  };
}

export async function recreateSavedDockerApp(
  runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
  options?: { verbose?: boolean },
): Promise<void> {
  const plan = buildSavedDockerRunArgs(runtime);

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

  const plan = Install.buildBuiltinDbPlan({
    envName: runtime.envName,
    workspaceName: runtime.workspaceName,
    storagePath: config.storagePath,
    source: runtime.source,
    dbDialect: config.dbDialect,
    dbHost: config.dbHost,
    dbPort: config.dbPort,
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
