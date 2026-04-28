/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as p from '@clack/prompts';
import { Command, Flags } from '@oclif/core';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildDockerDbContainerName,
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  runLocalNocoBaseCommand,
  type ManagedAppRuntime,
} from '../../lib/app-runtime.js';
import { removeEnv } from '../../lib/auth-store.js';
import { resolveConfiguredEnvPath } from '../../lib/cli-home.js';
import { commandOutput, commandSucceeds, run } from '../../lib/run-npm.js';
import {
  failTask,
  isInteractiveTerminal,
  printInfo,
  startTask,
  succeedTask,
} from '../../lib/ui.js';

function resolveConfiguredPath(value: unknown): string | undefined {
  return resolveConfiguredEnvPath(value);
}

function assertSafeRemovalPath(target: string, label: string): void {
  const resolved = path.resolve(target);
  const cwd = path.resolve(process.cwd());
  const home = path.resolve(os.homedir());
  const root = path.parse(resolved).root;

  if (resolved === root || resolved === cwd || resolved === home) {
    throw new Error(
      `Refusing to remove ${label} at "${resolved}" because it is too broad.`,
    );
  }
}

async function removePathIfExists(target: string, label: string): Promise<void> {
  const resolved = path.resolve(target);
  assertSafeRemovalPath(resolved, label);
  await fsp.rm(resolved, { recursive: true, force: true });
}

async function dockerContainerExists(containerName: string): Promise<boolean> {
  return await commandSucceeds('docker', ['container', 'inspect', containerName]);
}

async function removeDockerContainerIfExists(containerName: string): Promise<'removed' | 'missing'> {
  if (!(await dockerContainerExists(containerName))) {
    return 'missing';
  }

  await run('docker', ['rm', '-f', containerName], {
    errorName: 'docker rm',
    stdio: 'ignore',
  });
  return 'removed';
}

async function dockerNetworkExists(networkName: string): Promise<boolean> {
  return await commandSucceeds('docker', ['network', 'inspect', networkName]);
}

async function dockerNetworkHasActiveEndpoints(networkName: string): Promise<boolean> {
  try {
    const output = await commandOutput(
      'docker',
      [
        'network',
        'inspect',
        networkName,
        '--format',
        '{{json .Containers}}',
      ],
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

async function removeDockerNetworkIfUnused(
  networkName: string,
): Promise<'removed' | 'missing' | 'in-use'> {
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
      /has active endpoints|is in use|active endpoints/i.test(message)
      || (await dockerNetworkExists(networkName) && await dockerNetworkHasActiveEndpoints(networkName))
    ) {
      return 'in-use';
    }
    throw error;
  }
}

function builtinDbContainerName(runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>): string | undefined {
  if (!runtime.env.config.builtinDb) {
    return undefined;
  }

  const dbDialect = String(runtime.env.config.dbDialect ?? 'postgres').trim() || 'postgres';
  const workspaceName = runtime.workspaceName;
  return buildDockerDbContainerName(runtime.envName, dbDialect, workspaceName);
}

function managedDockerNetworkName(runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>): string | undefined {
  return runtime.workspaceName?.trim() || undefined;
}

async function confirmDownAll(envName: string, yes: boolean): Promise<boolean> {
  if (yes) {
    return true;
  }

  if (!isInteractiveTerminal()) {
    throw new Error(
      `\`nb app down --all\` needs confirmation. Re-run with --yes to delete everything for "${envName}" in non-interactive mode.`,
    );
  }

  const answer = await p.confirm({
    message:
      `Delete everything for "${envName}"? This removes the app, managed containers, storage data, and the saved CLI env config.`,
    active: 'yes',
    inactive: 'no',
    initialValue: false,
  });

  if (p.isCancel(answer)) {
    p.cancel('Down cancelled.');
    return false;
  }

  return answer;
}

function formatDownFailure(envName: string, message: string): string {
  return [
    `Couldn't bring down NocoBase for "${envName}".`,
    'Some local runtime resources may still exist. Check Docker or the local app process, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class AppDown extends Command {
  static override hidden = false;
  static override description =
    'Bring down the selected env by removing runtime containers and the saved local app files. Storage data and env config are kept unless explicitly requested.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --all --yes',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to bring down. Defaults to the current env when omitted',
    }),
    all: Flags.boolean({
      description: 'Delete everything for this env, including storage data and the saved env config',
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm destructive actions without prompting',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show raw output from shutdown commands',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppDown);
    const requestedEnv = flags.env?.trim() || undefined;
    const removeData = Boolean(flags.all);
    const removeEnvConfig = Boolean(flags.all);

    const runtime = await resolveManagedAppRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        [
          `Can't bring down "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app, Docker app, or managed database to remove here.',
          'Use `nb env remove` if you only want to remove the CLI connection config.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        [
          `Can't bring down "${runtime.envName}" yet.`,
          'SSH env support is reserved but not implemented yet.',
          'Use `nb env remove` if you only want to remove the saved CLI config for now.',
        ].join('\n'),
      );
    }

    if (flags.all) {
      let confirmed = false;
      try {
        confirmed = await confirmDownAll(runtime.envName, flags.yes);
      } catch (error: unknown) {
        this.error(error instanceof Error ? error.message : String(error));
      }
      if (!confirmed) {
        return;
      }
    }

    try {
      if (runtime.kind === 'docker') {
        startTask(`Removing Docker app container for "${runtime.envName}"...`);
        const state = await removeDockerContainerIfExists(runtime.containerName);
        succeedTask(
          state === 'removed'
            ? `Docker app container removed for "${runtime.envName}".`
            : `No Docker app container found for "${runtime.envName}".`,
        );
      } else {
        startTask(`Stopping local NocoBase app for "${runtime.envName}"...`);
        await runLocalNocoBaseCommand(runtime, ['pm2', 'kill'], {
          stdio: flags.verbose ? 'inherit' : 'ignore',
        });
        succeedTask(`Local NocoBase app stopped for "${runtime.envName}".`);
      }

      if (runtime.kind === 'local' || runtime.kind === 'docker') {
        const dbContainerName = builtinDbContainerName(runtime);
        if (dbContainerName) {
          startTask(`Removing built-in database container for "${runtime.envName}"...`);
          const state = await removeDockerContainerIfExists(dbContainerName);
          succeedTask(
            state === 'removed'
              ? `Built-in database container removed for "${runtime.envName}".`
              : `No built-in database container found for "${runtime.envName}".`,
          );
        }

        const networkName = managedDockerNetworkName(runtime);
        if (networkName) {
          startTask(`Removing Docker network for "${runtime.envName}" if unused...`);
          const state = await removeDockerNetworkIfUnused(networkName);
          if (state === 'removed') {
            succeedTask(`Docker network removed for "${runtime.envName}".`);
          } else if (state === 'missing') {
            succeedTask(`No Docker network found for "${runtime.envName}".`);
          } else {
            succeedTask(`Docker network is still in use for "${runtime.envName}". Keeping it.`);
          }
        }
      }

      if (runtime.kind === 'local') {
        const localAppPath = resolveConfiguredPath(runtime.env.config.appRootPath) || runtime.projectRoot;
        if (localAppPath) {
          startTask(`Removing local app files for "${runtime.envName}"...`);
          await removePathIfExists(localAppPath, `app files for "${runtime.envName}"`);
          succeedTask(`Local app files removed for "${runtime.envName}".`);
        } else {
          printInfo(`No saved local app path found for "${runtime.envName}".`);
        }
      }

      if (removeData) {
        const configuredStoragePath = resolveConfiguredPath(runtime.env.config.storagePath);
        if (configuredStoragePath) {
          startTask(`Removing storage data for "${runtime.envName}"...`);
          await removePathIfExists(configuredStoragePath, `storage data for "${runtime.envName}"`);
          succeedTask(`Storage data removed for "${runtime.envName}".`);
        } else {
          printInfo(`No saved storage path found for "${runtime.envName}".`);
        }
      }

      if (removeEnvConfig) {
        startTask(`Removing saved CLI env config for "${runtime.envName}"...`);
        const result = await removeEnv(runtime.envName);
        succeedTask(
          `Saved CLI env config removed for "${runtime.envName}"${result.currentEnv ? ` (current env: ${result.currentEnv})` : ''}.`,
        );
      }
    } catch (error: unknown) {
      failTask(`Failed to bring down NocoBase for "${runtime.envName}".`);
      this.error(formatDownFailure(runtime.envName, error instanceof Error ? error.message : String(error)));
    }
  }
}
