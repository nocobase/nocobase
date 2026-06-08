/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { resolveManagedAppRuntime, type ManagedAppRuntime } from '../../lib/app-runtime.js';
import { getCurrentEnvName, loadAuthConfig, removeEnv } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { confirm, input } from '../../lib/inquirer.ts';
import { isInteractiveTerminal, printInfo, printVerbose, setVerboseMode } from '../../lib/ui.js';

function formatRemoveForceRequiredMessage(envName: string, purge: boolean): string {
  if (purge) {
    return [
      `Refusing to purge env "${envName}" without confirmation in non-interactive mode.`,
      'Re-run with `--purge --force` to continue.',
    ].join('\n');
  }

  return [
    `Refusing to remove env "${envName}" without confirmation in non-interactive mode.`,
    'Re-run with `--force` to continue.',
  ].join('\n');
}

function buildRemovePrompt(
  runtime: ManagedAppRuntime,
  options: {
    isCurrent: boolean;
    purge: boolean;
  },
): string {
  const subject = options.isCurrent ? `current env "${runtime.envName}"` : `env "${runtime.envName}"`;

  if (options.purge) {
    const lines = [`Purge ${subject}?`];
    if (runtime.kind === 'local' || runtime.kind === 'docker') {
      lines.push('This removes CLI-managed local runtime resources for this env on this machine.');
      lines.push('Storage data will be removed, and downloaded local app files will be removed when applicable.');
      lines.push('External database services are not managed by the CLI and will be left untouched.');
    } else {
      lines.push('This env has no CLI-managed local runtime resources on this machine.');
      lines.push('Only the saved CLI env config will be removed. External services are not touched.');
    }
    lines.push(`Type "${runtime.envName}" to confirm:`);
    return lines.join('\n');
  }

  const lines = [`Remove ${subject}?`];
  if (runtime.kind === 'local' || runtime.kind === 'docker') {
    lines.push('NocoBase and any CLI-managed built-in database for this env will be stopped on this machine.');
    lines.push('The saved CLI env config will then be removed. Storage data and local app files will be kept.');
  } else {
    lines.push('Only the saved CLI env config will be removed.');
  }
  return lines.join('\n');
}

async function confirmEnvRemoval(
  runtime: ManagedAppRuntime,
  options: {
    force: boolean;
    isCurrent: boolean;
    purge: boolean;
  },
): Promise<boolean> {
  if (!isInteractiveTerminal()) {
    if (options.force) {
      return true;
    }
    throw new Error(formatRemoveForceRequiredMessage(runtime.envName, options.purge));
  }

  if (options.force) {
    return true;
  }

  if (options.purge) {
    try {
      await input({
        message: buildRemovePrompt(runtime, options),
        required: true,
        validate: (value) => (value.trim() === runtime.envName ? true : `Type "${runtime.envName}" to confirm.`),
        placeholder: runtime.envName,
      });
      return true;
    } catch {
      return false;
    }
  }

  try {
    return await confirm({
      message: buildRemovePrompt(runtime, options),
      default: false,
    });
  } catch {
    return false;
  }
}

export default class EnvRemove extends Command {
  static override summary = 'Remove a configured environment';
  static override description =
    'Remove a configured env. Local and Docker envs stop CLI-managed runtime resources on this machine first; pass `--purge` to also delete managed local resources, storage data, and downloaded app files when applicable.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> staging',
    '<%= config.bin %> <%= command.id %> staging --force',
    '<%= config.bin %> <%= command.id %> staging --purge --force',
  ];

  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      hidden: true,
      default: false,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation for the selected remove mode',
      default: false,
    }),
    purge: Flags.boolean({
      description:
        'Also remove CLI-managed local runtime resources, storage data, and downloaded app files when applicable. For remote API envs, only the saved CLI env config will be removed.',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed progress output',
      default: false,
    }),
  };

  static override args = {
    name: Args.string({
      description: 'Configured environment name to remove',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvRemove);
    setVerboseMode(flags.verbose);
    const scope = resolveDefaultConfigScope();
    const config = await loadAuthConfig({ scope });
    if (!config.envs[args.name]) {
      this.error(`Env "${args.name}" is not configured`);
    }
    const currentEnv = await getCurrentEnvName({ scope });
    const runtime = await resolveManagedAppRuntime(args.name);
    if (!runtime) {
      this.error(`Env "${args.name}" is not configured`);
    }
    const skipConfirmation = flags.yes || flags.force;
    let confirmed = false;
    try {
      confirmed = await confirmEnvRemoval(runtime, {
        force: skipConfirmation,
        isCurrent: args.name === currentEnv,
        purge: flags.purge,
      });
    } catch (error: unknown) {
      this.error(error instanceof Error ? error.message : String(error));
    }
    if (!confirmed) {
      return;
    }

    const runCommand = this.config.runCommand.bind(this.config) as (id: string, argv?: string[]) => Promise<unknown>;
    const verboseArgv = flags.verbose ? ['--verbose'] : [];

    if (flags.purge) {
      if (runtime.kind === 'local' || runtime.kind === 'docker') {
        await runCommand('app:destroy', ['--env', runtime.envName, '--force', ...verboseArgv]);
        return;
      }

      printInfo(
        `No local CLI-managed resources were found for "${runtime.envName}". Removing the saved CLI env config only.`,
      );
    } else if (runtime.kind === 'local' || runtime.kind === 'docker') {
      printVerbose(`Stopping CLI-managed runtime resources for "${runtime.envName}" before removing the env config.`);
      await runCommand('app:stop', ['--env', runtime.envName, '--with-db', '--yes', ...verboseArgv]);
    }

    printVerbose(`Removing env "${args.name}"`);
    const result = await removeEnv(args.name, { scope });

    if (result.hasEnvs) {
      if (args.name === currentEnv) {
        this.log(`Removed env "${result.removed}". Switched current env to "${await getCurrentEnvName({ scope })}".`);
        return;
      }
      this.log(`Removed env "${result.removed}".`);
      return;
    }

    this.log(`Removed env "${result.removed}". No envs configured.`);
  }
}
