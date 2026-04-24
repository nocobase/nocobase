/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
} from '../lib/app-runtime.js';
import { removeEnv } from '../lib/auth-store.js';
import { commandSucceeds, run } from '../lib/run-npm.js';
import {
  confirmAction,
  failTask,
  isInteractiveTerminal,
  printInfo,
  startTask,
  succeedTask,
} from '../lib/ui.js';

function resolveConfiguredPath(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  if (!text) {
    return undefined;
  }
  return path.isAbsolute(text) ? text : path.resolve(process.cwd(), text);
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

function builtinDbContainerName(runtime: Exclude<ManagedAppRuntime, { kind: 'remote' }>): string | undefined {
  if (!runtime.env.config.builtinDb) {
    return undefined;
  }

  const dbDialect = String(runtime.env.config.dbDialect ?? 'postgres').trim() || 'postgres';
  const workspaceName = runtime.workspaceName;
  return buildDockerDbContainerName(runtime.envName, dbDialect, workspaceName);
}

async function confirmRemoveData(envName: string, yes: boolean): Promise<boolean> {
  if (yes) {
    return true;
  }

  if (!isInteractiveTerminal()) {
    throw new Error(
      `Refusing to remove user data for "${envName}" without confirmation. Re-run with --yes only if you are sure.`,
    );
  }

  return await confirmAction(
    `Delete storage and managed database data for "${envName}"? This cannot be undone.`,
    { defaultValue: false },
  );
}

function formatDownFailure(envName: string, message: string): string {
  return [
    `Couldn't bring down NocoBase for "${envName}".`,
    'Some local runtime resources may still exist. Check Docker or the local app process, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class Down extends Command {
  static override description =
    'Stop NocoBase and remove local runtime containers for the selected env. Data, source files, and env config are kept unless explicitly requested.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --remove-data',
    '<%= config.bin %> <%= command.id %> --env app1 --remove-source --remove-env',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to bring down. Defaults to the current env when omitted',
    }),
    'remove-data': Flags.boolean({
      description: 'Delete storage and managed database data after confirmation',
      default: false,
    }),
    'remove-source': Flags.boolean({
      description: 'Delete the npm/git source directory for local installs',
      default: false,
    }),
    'remove-env': Flags.boolean({
      description: 'Remove the CLI env config after local resources are removed',
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
    const { flags } = await this.parse(Down);
    const requestedEnv = flags.env?.trim() || undefined;

    const runtime = await resolveManagedAppRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'remote') {
      this.error(
        [
          `Can't bring down "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app, Docker app, or managed database to remove here.',
          'Use `nb env remove` if you only want to remove the CLI connection config.',
        ].join('\n'),
      );
    }

    if (flags['remove-data']) {
      let confirmed = false;
      try {
        confirmed = await confirmRemoveData(runtime.envName, flags.yes);
      } catch (error: unknown) {
        this.error(error instanceof Error ? error.message : String(error));
      }
      if (!confirmed) {
        this.log('Canceled.');
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

      if (flags['remove-data']) {
        const storagePath = resolveConfiguredPath(runtime.env.config.storagePath);
        if (storagePath) {
          startTask(`Deleting storage and managed database data for "${runtime.envName}"...`);
          await removePathIfExists(storagePath, 'storage data');
          succeedTask(`Storage and managed database data deleted for "${runtime.envName}".`);
        } else {
          printInfo(`No storage path is configured for "${runtime.envName}".`);
        }
      }

      if (flags['remove-source']) {
        if (runtime.kind === 'local') {
          startTask(`Deleting source files for "${runtime.envName}"...`);
          await removePathIfExists(runtime.projectRoot, 'source files');
          succeedTask(`Source files deleted for "${runtime.envName}".`);
        } else {
          printInfo(`No npm/git source directory is configured for "${runtime.envName}".`);
        }
      }

      if (flags['remove-env']) {
        startTask(`Removing CLI env config for "${runtime.envName}"...`);
        await removeEnv(runtime.envName);
        succeedTask(`CLI env config removed for "${runtime.envName}".`);
      }

      printInfo(`NocoBase is down for "${runtime.envName}".`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      failTask(`Failed to bring down NocoBase for "${runtime.envName}".`);
      this.error(formatDownFailure(runtime.envName, message));
    }
  }
}
