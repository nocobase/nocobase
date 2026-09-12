/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildDockerDbContainerName, type ManagedAppRuntime } from '../../lib/app-runtime.js';
import { resolveConfiguredEnvPath } from '../../lib/cli-home.js';
import { resolveConfiguredAppPath } from '../../lib/env-paths.js';
import { commandOutput, run } from '../../lib/run-npm.js';

type CommandStdio = 'inherit' | 'pipe' | 'ignore';
type RemovePathOptions = {
  retryCommand?: string;
};
type NodeFileSystemError = Error & {
  code?: unknown;
};

export function resolveConfiguredPath(value: unknown): string | undefined {
  return resolveConfiguredEnvPath(value);
}

function assertSafeRemovalPath(target: string, label: string): void {
  const resolved = path.resolve(target);
  const cwd = path.resolve(process.cwd());
  const home = path.resolve(os.homedir());
  const root = path.parse(resolved).root;

  if (resolved === root || resolved === cwd || resolved === home) {
    throw new Error(`Refusing to remove ${label} at "${resolved}" because it is too broad.`);
  }
}

function getErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const { code } = error as NodeFileSystemError;
  return typeof code === 'string' ? code : undefined;
}

function isPermissionDeniedError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 'EACCES' || code === 'EPERM';
}

function formatOriginalError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code = getErrorCode(error);
  return code && !message.includes(code) ? `${code}: ${message}` : message;
}

function quoteShellValue(value: string): string {
  return `"${value.replace(/(["\\$`])/g, '\\$1')}"`;
}

function formatPermissionDeniedRemovalError(
  target: string,
  label: string,
  error: unknown,
  options: RemovePathOptions,
): string {
  const retryLines =
    os.platform() === 'win32' ? [] : [`  sudo chown -R "$(id -u):$(id -g)" ${quoteShellValue(target)}`];
  if (options.retryCommand) {
    retryLines.push(`  ${options.retryCommand}`);
  }

  return [
    `Failed to remove ${label} at "${target}".`,
    'The current user cannot delete one or more files under this path. Files may have been created by a Docker container running as root.',
    '',
    retryLines.length > 0
      ? 'Fix ownership or permissions, then retry:'
      : 'Fix ownership or permissions, then retry the command.',
    ...retryLines,
    '',
    `Original error: ${formatOriginalError(error)}`,
  ].join('\n');
}

export async function removePathIfExists(
  target: string,
  label: string,
  options: RemovePathOptions = {},
): Promise<void> {
  const resolved = path.resolve(target);
  assertSafeRemovalPath(resolved, label);
  try {
    await fsp.rm(resolved, { recursive: true, force: true });
  } catch (error: unknown) {
    if (isPermissionDeniedError(error)) {
      throw new Error(formatPermissionDeniedRemovalError(resolved, label, error, options));
    }
    throw error;
  }
}

function isMissingDockerContainerError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /No such (container|object)/i.test(message);
}

function isMissingDockerNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /No such network|network .* not found/i.test(message);
}

export async function removeDockerContainerIfExists(
  containerName: string,
  options?: { stdio?: CommandStdio },
): Promise<'removed' | 'missing'> {
  try {
    await commandOutput('docker', ['container', 'inspect', containerName], {
      errorName: 'docker container inspect',
    });
  } catch (error) {
    if (isMissingDockerContainerError(error)) {
      return 'missing';
    }
    throw error;
  }

  await run('docker', ['rm', '-f', containerName], {
    errorName: 'docker rm',
    stdio: options?.stdio ?? 'ignore',
  });
  return 'removed';
}

async function dockerNetworkExists(networkName: string): Promise<boolean> {
  try {
    await commandOutput('docker', ['network', 'inspect', networkName], {
      errorName: 'docker network inspect',
    });
    return true;
  } catch (error) {
    if (isMissingDockerNetworkError(error)) {
      return false;
    }
    throw error;
  }
}

async function dockerNetworkHasActiveEndpoints(networkName: string): Promise<boolean> {
  try {
    const output = await commandOutput(
      'docker',
      ['network', 'inspect', networkName, '--format', '{{json .Containers}}'],
      {
        errorName: 'docker network inspect',
      },
    );
    const containers = JSON.parse(output || '{}');
    return Boolean(containers && typeof containers === 'object' && Object.keys(containers).length > 0);
  } catch {
    return false;
  }
}

export async function removeDockerNetworkIfUnused(networkName: string): Promise<'removed' | 'missing' | 'in-use'> {
  if (!(await dockerNetworkExists(networkName))) {
    return 'missing';
  }

  try {
    await run('docker', ['network', 'rm', networkName], {
      errorName: 'docker network rm',
      stdio: 'ignore',
    });
    return 'removed';
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      /has active endpoints|is in use|active endpoints/i.test(message) ||
      ((await dockerNetworkExists(networkName)) && (await dockerNetworkHasActiveEndpoints(networkName)))
    ) {
      return 'in-use';
    }
    if (isMissingDockerNetworkError(error)) {
      return 'missing';
    }
    throw error;
  }
}

export function builtinDbContainerName(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): string | undefined {
  if (!runtime.env.config.builtinDb) {
    return undefined;
  }

  const dbDialect = String(runtime.env.config.dbDialect ?? 'postgres').trim() || 'postgres';
  return buildDockerDbContainerName(runtime.envName, dbDialect, runtime.dockerContainerPrefix || runtime.workspaceName);
}

export function managedDockerNetworkName(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): string | undefined {
  return runtime.dockerNetworkName?.trim() || runtime.workspaceName?.trim() || undefined;
}

export function resolveManagedLocalAppPath(runtime: Extract<ManagedAppRuntime, { kind: 'local' }>): string | undefined {
  return (
    resolveConfiguredAppPath(runtime.env.config) ||
    runtime.projectRoot ||
    resolveConfiguredPath(runtime.env.config.appRootPath)
  );
}

export function shouldRemoveManagedLocalAppFiles(runtime: Extract<ManagedAppRuntime, { kind: 'local' }>): boolean {
  return runtime.source === 'npm' || runtime.source === 'git' || runtime.source === 'local';
}
