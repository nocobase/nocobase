/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  runDockerNocoBaseCommand,
  runLocalNocoBaseCommand,
} from '../lib/app-runtime.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../lib/env-guard.js';
import { announceTargetEnv } from '../lib/ui.js';

const SILENT_LIKE_PASSTHROUGH_FLAGS = new Set(['--help', '-h', '--silent']);
const SILENT_RUNTIME_ENV_VARS = {
  LOGGER_SILENT: 'true',
  NODE_NO_WARNINGS: '1',
} as const;
const SILENT_STDERR_FILTERS = [
  /^\(node:\d+\) \[DEP0040\] DeprecationWarning: The `punycode` module is deprecated\..*$/,
  /^\(Use `node --trace-deprecation .*$/,
  /^About to overwrite ArrayBuffer\.prototype properties /,
];

type ForwardedRuntimeOptions = Exclude<Parameters<typeof runLocalNocoBaseCommand>[2], undefined>;

function parseBridgeArgv(argv: string[]): {
  requestedEnv?: string;
  yes: boolean;
  passthroughArgs: string[];
} {
  let requestedEnv: string | undefined;
  let yes = false;
  const passthroughArgs: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--') {
      passthroughArgs.push(...argv.slice(index + 1));
      break;
    }

    if (token === '--env') {
      const value = argv[index + 1];
      if (!value || value === '--') {
        throw new Error('Missing value for `--env`.');
      }
      requestedEnv = value.trim() || undefined;
      index += 1;
      continue;
    }

    if (token.startsWith('--env=')) {
      requestedEnv = token.slice('--env='.length).trim() || undefined;
      continue;
    }

    if (token === '-e') {
      const value = argv[index + 1];
      if (!value || value === '--') {
        throw new Error('Missing value for `-e`.');
      }
      requestedEnv = value.trim() || undefined;
      index += 1;
      continue;
    }

    if (token.startsWith('-e') && token.length > 2) {
      requestedEnv = token.slice(2).trim() || undefined;
      continue;
    }

    if (token === '--yes') {
      yes = true;
      continue;
    }

    passthroughArgs.push(...argv.slice(index));
    break;
  }

  return {
    requestedEnv,
    yes,
    passthroughArgs,
  };
}

function formatHttpEnvError(envName: string): string {
  return [
    `Can't run \`nb v1\` for "${envName}" yet.`,
    'This env only has an API connection, so the v1 bridge is not available here.',
    'Use a local or Docker env instead.',
  ].join('\n');
}

function formatSshEnvError(envName: string): string {
  return [
    `Can't run \`nb v1\` for "${envName}" yet.`,
    'SSH env support is reserved but not implemented yet.',
    'Use a local or Docker env right now.',
  ].join('\n');
}

function hasSilentLikePassthrough(args: string[]): boolean {
  return args.some((arg) => SILENT_LIKE_PASSTHROUGH_FLAGS.has(arg));
}

function shouldFilterSilentStderrLine(line: string): boolean {
  const normalized = line.replace(/\r$/, '');
  return SILENT_STDERR_FILTERS.some((pattern) => pattern.test(normalized));
}

function createSilentBridgeOptions(): { commandOptions: ForwardedRuntimeOptions; flush: () => void } {
  let pendingStderr = '';

  const flushBufferedStderr = (force: boolean) => {
    while (true) {
      const newlineIndex = pendingStderr.indexOf('\n');
      if (newlineIndex === -1) {
        break;
      }

      const line = pendingStderr.slice(0, newlineIndex);
      pendingStderr = pendingStderr.slice(newlineIndex + 1);

      if (!shouldFilterSilentStderrLine(line)) {
        process.stderr.write(`${line}\n`);
      }
    }

    if (force && pendingStderr) {
      if (!shouldFilterSilentStderrLine(pendingStderr)) {
        process.stderr.write(pendingStderr);
      }
      pendingStderr = '';
    }
  };

  return {
    commandOptions: {
      stdio: 'pipe',
      env: {
        ...SILENT_RUNTIME_ENV_VARS,
      },
      onStdout: (chunk: string) => {
        process.stdout.write(chunk);
      },
      onStderr: (chunk: string) => {
        pendingStderr += chunk;
        flushBufferedStderr(false);
      },
    },
    flush: () => {
      flushBufferedStderr(true);
    },
  };
}

export default class V1 extends Command {
  static override hidden = true;
  static override strict = false;
  static override summary = 'Forward commands to the selected env through the v1 bridge';
  static override description =
    'Forward v1-compatible commands to the selected env. Defaults to the current env when `--env` is omitted. Local envs run `nocobase-v1`, and Docker envs run inside the saved app container. Bridge flags (`--env`, `--yes`) must appear before the forwarded command. Use `--` when the forwarded command needs the same flag names.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> build',
    '<%= config.bin %> <%= command.id %> --env local pm list',
    '<%= config.bin %> <%= command.id %> --env docker-local -- pm enable @nocobase/plugin-sample --yes',
  ];

  public async run(): Promise<void> {
    const originalArgv = [...this.argv];
    await this.parse({ strict: false, flags: {}, args: {} }, []);
    this.argv = originalArgv;

    let parsed;
    try {
      parsed = parseBridgeArgv(this.argv);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }

    const { requestedEnv, yes, passthroughArgs } = parsed;
    if (passthroughArgs.length === 0) {
      this.error('Pass at least one v1 command to forward.');
    }

    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));
    if (explicitEnvSelection) {
      const confirmed = await ensureCrossEnvConfirmed({
        command: this,
        requestedEnv,
        yes,
      });
      if (!confirmed) {
        return;
      }
    }

    const runtime = await resolveManagedAppRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    const silentLike = hasSilentLikePassthrough(passthroughArgs);
    const silentBridge = silentLike ? createSilentBridgeOptions() : undefined;

    if (!silentLike) {
      announceTargetEnv(runtime.envName);
    }

    if (runtime.kind === 'local') {
      try {
        await runLocalNocoBaseCommand(runtime, passthroughArgs, silentBridge?.commandOptions);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      } finally {
        silentBridge?.flush();
      }
      return;
    }

    if (runtime.kind === 'docker') {
      try {
        await runDockerNocoBaseCommand(runtime.containerName, passthroughArgs, silentBridge?.commandOptions);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      } finally {
        silentBridge?.flush();
      }
      return;
    }

    if (runtime.kind === 'http') {
      this.error(formatHttpEnvError(runtime.envName));
    }

    this.error(formatSshEnvError(runtime.envName));
  }
}
