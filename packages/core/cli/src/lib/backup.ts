/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Env } from './auth-store.js';
import { getCurrentEnvName, getEnv, listEnvs } from './auth-store.js';
import { updateEnvRuntime } from './bootstrap.js';
import { resolveDefaultConfigScope } from './cli-home.js';
import { commandOutput } from './run-npm.js';
import type { StoredRuntime } from './runtime-store.js';
import { loadRuntimeSync } from './runtime-store.js';
import { failTask, startTask, succeedTask } from './ui.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
const CLI_CONFIG_FILE = path.join(CLI_PACKAGE_ROOT, 'nocobase-ctl.config.json');
const CLI_ENTRY_FILE = path.join(CLI_PACKAGE_ROOT, 'bin', 'run.js');

export const BACKUP_POLL_INTERVAL_MS = 2_000;
export const BACKUP_CREATE_TIMEOUT_MS = 600_000;

export const BACKUP_RUNTIME_COMMANDS = {
  create: 'backup create',
  status: 'backup status',
  download: 'backup download',
  restoreUpload: 'backup restore-upload',
} as const;

function hasRequiredBackupCommands(runtime: StoredRuntime | undefined, commandIds: string[]) {
  if (!runtime) {
    return false;
  }

  const available = new Set(runtime.commands.map((command) => command.commandId));
  return commandIds.every((commandId) => available.has(commandId));
}

function formatMissingBackupRuntimeCommands(envName: string, commandIds: string[]) {
  const missing = commandIds.map((commandId) => `nb api ${commandId}`).join(', ');
  return [
    `The selected env "${envName}" does not expose the backup API commands required by \`nb backup\`.`,
    `Missing commands: ${missing}`,
    'Enable or upgrade the backup/restore capability for that env, then try again.',
  ].join('\n');
}

export function buildBackupEnvArgv(options: {
  requestedEnv?: string;
  explicitEnvSelection: boolean;
  yes?: boolean;
}) {
  const argv: string[] = [];
  if (options.explicitEnvSelection && options.requestedEnv) {
    argv.push('--env', options.requestedEnv);
  }
  if (options.yes || options.explicitEnvSelection) {
    argv.push('--yes');
  }
  return argv;
}

export async function resolveBackupTargetEnv(requestedEnv?: string) {
  const scope = resolveDefaultConfigScope();
  const envName = requestedEnv?.trim() || (await getCurrentEnvName({ scope }));
  const env = await getEnv(envName, { scope });

  if (env) {
    return { scope, envName, env };
  }

  const { envs } = await listEnvs({ scope });
  const configuredEnvNames = Object.keys(envs);

  if (!configuredEnvNames.length) {
    throw new Error('No env is configured. Run `nb init --ui` first.');
  }

  if (requestedEnv?.trim()) {
    throw new Error(`Env "${envName}" is not configured. Run \`nb init --ui --env ${envName}\` first.`);
  }

  throw new Error(
    [
      `Current env "${envName}" is not configured.`,
      `Switch to an existing env with \`nb env use <name>\`, or run \`nb init --ui --env ${envName}\` to create or connect it.`,
    ].join('\n'),
  );
}

export async function ensureBackupRuntimeCommands(params: {
  envName: string;
  env?: Env;
  commandIds: string[];
  quiet?: boolean;
}) {
  const scope = resolveDefaultConfigScope();
  const env = params.env ?? (await getEnv(params.envName, { scope }));
  const currentRuntime = loadRuntimeSync(env?.runtime?.version, { scope });

  if (hasRequiredBackupCommands(currentRuntime, params.commandIds)) {
    return;
  }

  if (!params.quiet) {
    startTask(`Refreshing env runtime for "${params.envName}" to load backup commands...`);
  }
  try {
    const runtime = await updateEnvRuntime({
      envName: params.envName,
      scope,
      configFile: CLI_CONFIG_FILE,
      quiet: params.quiet,
    });

    if (!hasRequiredBackupCommands(runtime, params.commandIds)) {
      throw new Error(formatMissingBackupRuntimeCommands(params.envName, params.commandIds));
    }

    if (!params.quiet) {
      succeedTask(`Env runtime is ready for backup commands in "${params.envName}".`);
    }
  } catch (error) {
    if (!params.quiet) {
      failTask(`Failed to refresh backup commands for "${params.envName}".`);
    }
    throw error;
  }
}

export async function runBackupCliCommand(argv: string[], options?: { errorName?: string }) {
  return await commandOutput(process.execPath, [CLI_ENTRY_FILE, ...argv], {
    errorName: options?.errorName ?? `nb ${argv.join(' ')}`,
    env: {
      NB_SKIP_STARTUP_UPDATE: '1',
      // When the parent CLI already runs in tsx source mode, it sets
      // `_NOCO_CLI_TSX_CHILD=1`. Clear it here so `bin/run.js` can re-exec
      // itself with `--import tsx` again instead of trying to import `.ts`
      // sources without the loader.
      _NOCO_CLI_TSX_CHILD: '',
    },
  });
}

export async function runBackupCliJsonCommand<T>(argv: string[], options?: { errorName?: string }) {
  const output = await runBackupCliCommand([...argv, '--json-output'], options);
  try {
    return JSON.parse(output) as T;
  } catch {
    throw new Error(
      `Unexpected JSON output from ${options?.errorName ?? `nb ${argv.join(' ')}`}: ${output || '(empty output)'}`,
    );
  }
}

export async function resolveBackupCreateOutputPath(output: string | undefined, remoteName: string) {
  const requestedOutput = String(output ?? '').trim();
  if (!requestedOutput) {
    return path.resolve(process.cwd(), remoteName);
  }

  const resolvedOutput = path.resolve(process.cwd(), requestedOutput);
  try {
    const stats = await fs.stat(resolvedOutput);
    if (stats.isDirectory()) {
      return path.join(resolvedOutput, remoteName);
    }
  } catch {
    // Treat non-existing paths as an explicit target file path.
  }

  return resolvedOutput;
}

export async function resolveBackupRestoreFilePath(file: string) {
  const resolvedFile = path.resolve(process.cwd(), file);
  let stats;
  try {
    stats = await fs.stat(resolvedFile);
  } catch {
    throw new Error(`Backup file not found: ${resolvedFile}`);
  }

  if (!stats.isFile()) {
    throw new Error(`Backup restore input must be a file: ${resolvedFile}`);
  }

  return resolvedFile;
}

export function resolveBackupWaitApiBaseUrl(env: Env) {
  const baseUrl = String(env.baseUrl ?? '').trim();
  if (baseUrl) {
    return baseUrl.replace(/\/+$/, '');
  }

  const appPort =
    env.appPort === undefined || env.appPort === null
      ? ''
      : String(env.appPort).trim();
  return appPort ? `http://127.0.0.1:${appPort}/api` : undefined;
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
