/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { getCurrentEnvName, upsertEnv, type Env } from '../../lib/auth-store.js';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  type ManagedAppRuntime,
} from '../../lib/app-runtime.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { DEFAULT_DOCKER_REGISTRY } from '../../lib/docker-image.ts';
import { confirm } from '../../lib/inquirer.ts';
import { resolveHookScriptPath } from '../../lib/hook-script.js';
import { announceTargetEnv, isInteractiveTerminal, printInfo, printWarning, succeedTask } from '../../lib/ui.js';
import { resolveAppUrlFromApiBaseUrl } from '../env/shared.js';

type UpgradeParsedFlags = {
  env?: string;
  yes: boolean;
  force: boolean;
  verbose: boolean;
  'skip-download': boolean;
  'skip-code-update'?: boolean;
  version?: string;
};

type ResolvedUpgradeVersion = {
  downloadVersion?: string;
  persistDownloadVersion?: string;
};

type UpgradeManagedRuntime = Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>;
type LocalManagedRuntime = Extract<ManagedAppRuntime, { kind: 'local' }>;
type DownloadableLocalManagedRuntime = LocalManagedRuntime & { source: 'npm' | 'git' };

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeEnvName(value: unknown): string | undefined {
  const text = trimValue(value);
  return text || undefined;
}

function formatAppUrl(port?: string): string | undefined {
  const value = trimValue(port);
  return value ? `http://127.0.0.1:${value}` : undefined;
}

function formatDisplayUrl(apiBaseUrl?: string, appPort?: string): string | undefined {
  const resolvedFromApiBaseUrl = resolveAppUrlFromApiBaseUrl(apiBaseUrl);
  if (resolvedFromApiBaseUrl) {
    return resolvedFromApiBaseUrl;
  }

  const appUrl = formatAppUrl(appPort);
  if (appUrl) {
    return appUrl;
  }

  const value = trimValue(apiBaseUrl);
  return value ? value.replace(/\/api\/?$/, '') : undefined;
}

function readEnvValue(env: Env, key: keyof Env['config']): string {
  return trimValue(env.config[key]);
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

function isDownloadableLocalRuntime(runtime: UpgradeManagedRuntime): runtime is DownloadableLocalManagedRuntime {
  return runtime.kind === 'local' && (runtime.source === 'npm' || runtime.source === 'git');
}

function formatLocalDownloadFailure(envName: string, source: 'npm' | 'git', message: string): string {
  const sourceLabel = source === 'git' ? 'the saved Git checkout' : 'the saved npm app';
  return [
    `Couldn't refresh NocoBase for "${envName}".`,
    `The CLI was not able to update ${sourceLabel} before restarting it.`,
    'Check the saved source settings for this env, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function formatDockerDownloadFailure(envName: string, message: string): string {
  return [
    `Couldn't refresh the Docker image for "${envName}".`,
    'The CLI was not able to pull the latest image for this env.',
    'Check the saved Docker source settings and your Docker network access, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function buildManagedActionArgv(
  envName: string,
  flags: UpgradeParsedFlags,
  options?: { quickstart?: boolean },
): string[] {
  const argv = ['--env', envName, '--yes'];
  if (flags.verbose) {
    argv.push('--verbose');
  }
  if (options?.quickstart) {
    argv.push('--quickstart');
  }
  return argv;
}

function shouldSkipDownload(flags: UpgradeParsedFlags): boolean {
  return Boolean(flags['skip-download'] || flags['skip-code-update']);
}

function buildUpgradeCliArgv(
  envName: string,
  flags: UpgradeParsedFlags,
  options?: {
    yes?: boolean;
    force?: boolean;
  },
): string[] {
  const argv = ['--env', envName];
  if (shouldSkipDownload(flags)) {
    argv.push('--skip-download');
  }

  const version = normalizeEnvName(flags.version);
  if (version) {
    argv.push('--version', version);
  }

  if (flags.verbose) {
    argv.push('--verbose');
  }

  if (options?.yes ?? flags.yes) {
    argv.push('--yes');
  }
  if (options?.force ?? flags.force) {
    argv.push('--force');
  }

  return argv;
}

function buildUpgradeCliCommand(
  envName: string,
  flags: UpgradeParsedFlags,
  options?: {
    yes?: boolean;
    force?: boolean;
  },
): string {
  return ['nb', 'app', 'upgrade', ...buildUpgradeCliArgv(envName, flags, options)].join(' ');
}

function formatUpgradeOperationSummary(runtime: UpgradeManagedRuntime, flags: UpgradeParsedFlags): string {
  const mayRunUpgradeMigrations = 'It may also run upgrade migrations.';

  if (shouldSkipDownload(flags)) {
    const sourceLabel =
      runtime.kind === 'docker'
        ? 'saved Docker image'
        : runtime.source === 'local'
          ? 'saved local app path'
          : runtime.source === 'git'
            ? 'saved Git checkout'
            : 'saved npm app';

    return [
      'This operation will stop the app, skip source download and commercial plugin sync,',
      `and start it again with the ${sourceLabel}.`,
      mayRunUpgradeMigrations,
    ].join(' ');
  }

  if (runtime.kind === 'docker') {
    return [
      'This operation will stop the app, replace the saved Docker image,',
      'sync commercial plugins when applicable, and start the app again.',
      mayRunUpgradeMigrations,
    ].join(' ');
  }

  if (runtime.source === 'local') {
    return [
      'This operation will stop the app, reuse the saved local app path,',
      'sync commercial plugins when applicable, and start the app again.',
      mayRunUpgradeMigrations,
    ].join(' ');
  }

  return [
    'This operation will stop the app, replace the saved source,',
    'sync commercial plugins when applicable, and start the app again.',
    mayRunUpgradeMigrations,
  ].join(' ');
}

function formatUpgradePromptSummary(flags: UpgradeParsedFlags): string {
  if (shouldSkipDownload(flags)) {
    return 'This will stop and restart the app, and may run upgrade migrations.';
  }

  return 'This will stop and restart the app, update the saved source or image, and may run upgrade migrations.';
}

function formatUpgradeForceRequiredMessage(runtime: UpgradeManagedRuntime, flags: UpgradeParsedFlags): string {
  return [
    `\`nb app upgrade\` needs confirmation in non-interactive mode before upgrading "${runtime.envName}".`,
    '',
    formatUpgradeOperationSummary(runtime, flags),
    '',
    'Interactive confirmation is unavailable in the current AI agent session, and the agent will not add `--force` on your behalf.',
    '',
    'To continue:',
    `- re-run \`${buildUpgradeCliCommand(runtime.envName, flags, { force: true })}\``,
    `- or switch to an interactive terminal and re-run \`${buildUpgradeCliCommand(runtime.envName, flags, {
      force: false,
    })}\``,
  ].join('\n');
}

function formatMissingUpgradeFlagList(options: { missingYes: boolean; missingForce: boolean }): string {
  const missingFlags = [
    options.missingYes ? '`--yes`' : undefined,
    options.missingForce ? '`--force`' : undefined,
  ].filter(Boolean) as string[];

  if (missingFlags.length <= 1) {
    return missingFlags[0] ?? '';
  }

  return `${missingFlags[0]} or ${missingFlags[1]}`;
}

function formatUpgradeCrossEnvConfirmationRequiredMessage(
  currentEnv: string,
  runtime: UpgradeManagedRuntime,
  flags: UpgradeParsedFlags,
  options: {
    missingYes: boolean;
    missingForce: boolean;
  },
): string {
  return [
    `Refusing to upgrade env "${runtime.envName}" because the current env is "${currentEnv}" and interactive confirmation is unavailable in the current AI agent session.`,
    '',
    formatUpgradeOperationSummary(runtime, flags),
    '',
    `For safety, the agent will not switch envs automatically and will not add ${formatMissingUpgradeFlagList(
      options,
    )} on your behalf.`,
    '',
    'To continue:',
    `- run \`nb env use ${runtime.envName}\` yourself, then re-run \`${buildUpgradeCliCommand(runtime.envName, flags, {
      yes: false,
      force: true,
    })}\``,
    `- or re-run \`${buildUpgradeCliCommand(runtime.envName, flags, { yes: true, force: true })}\``,
  ].join('\n');
}

function buildLicenseSyncArgv(envName: string, flags: UpgradeParsedFlags, options?: { version?: string }): string[] {
  const argv = ['--env', envName, '--yes', '--skip-if-no-license'];
  if (flags.verbose) {
    argv.push('--verbose');
  }
  if (options?.version) {
    argv.push('--version', options.version);
  }
  return argv;
}

function buildEnvUpdateArgv(envName: string, flags: UpgradeParsedFlags): string[] {
  const argv = [envName];
  if (flags.verbose) {
    argv.push('--verbose');
  }
  return argv;
}

function formatEnvUpdateWarning(envName: string, message: string): string {
  return [
    `NocoBase was upgraded for "${envName}", but the CLI could not refresh the saved env runtime.`,
    `Run \`nb env update ${envName}\` to refresh it manually.`,
    `Details: ${message}`,
  ].join(' ');
}

async function runWithSuppressedTargetEnvLog<T>(task: () => Promise<T>): Promise<T> {
  const previousTargetEnv = process.env.NB_SKIP_TARGET_ENV_LOG;
  process.env.NB_SKIP_TARGET_ENV_LOG = '1';
  try {
    return await task();
  } finally {
    if (previousTargetEnv === undefined) {
      delete process.env.NB_SKIP_TARGET_ENV_LOG;
    } else {
      process.env.NB_SKIP_TARGET_ENV_LOG = previousTargetEnv;
    }
  }
}

async function runWithSuppressedStartSuccessLog<T>(task: () => Promise<T>): Promise<T> {
  const previousStartSuccess = process.env.NB_SKIP_APP_START_SUCCESS_LOG;
  process.env.NB_SKIP_APP_START_SUCCESS_LOG = '1';
  try {
    return await task();
  } finally {
    if (previousStartSuccess === undefined) {
      delete process.env.NB_SKIP_APP_START_SUCCESS_LOG;
    } else {
      process.env.NB_SKIP_APP_START_SUCCESS_LOG = previousStartSuccess;
    }
  }
}

export default class AppUpgrade extends Command {
  static override hidden = false;
  static override description =
    'Upgrade the selected NocoBase app. The CLI stops the current app, optionally replaces the saved source or image, then starts the app again. Use --version to upgrade to a specific saved source version or image tag.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --force',
    '<%= config.bin %> <%= command.id %> --env local',
    '<%= config.bin %> <%= command.id %> --env local --force',
    '<%= config.bin %> <%= command.id %> --env local -s',
    '<%= config.bin %> <%= command.id %> --env local --version beta',
    '<%= config.bin %> <%= command.id %> --env local --verbose',
    '<%= config.bin %> <%= command.id %> --env local-docker -s',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to upgrade. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip the upgrade confirmation prompt',
      default: false,
    }),
    'skip-download': Flags.boolean({
      char: 's',
      description: 'Restart with the saved local source or Docker image without downloading updates first',
      required: false,
    }),
    'skip-code-update': Flags.boolean({
      hidden: true,
      deprecated: true,
      description: 'Deprecated alias for --skip-download',
      required: false,
    }),
    version: Flags.string({
      description:
        'Override the saved downloadVersion for this upgrade. When the upgrade succeeds, the new version is saved back to the env config.',
      required: false,
    }),
    verbose: Flags.boolean({
      description: 'Show raw output from the underlying local or Docker commands',
      default: true,
    }),
  };

  private static resolveUpgradeVersion(
    runtime: UpgradeManagedRuntime,
    flags: UpgradeParsedFlags,
  ): ResolvedUpgradeVersion {
    const requestedVersion = trimValue(flags.version);
    if (runtime.kind === 'local' && runtime.source === 'local') {
      if (requestedVersion) {
        throw new Error(
          [
            `Env "${runtime.envName}" is managed from an existing local app path.`,
            'This source does not support `nb app upgrade --version` because the CLI does not manage that code checkout.',
            'Update the local app path yourself, then run `nb app upgrade` to restart it.',
          ].join('\n'),
        );
      }
      return {};
    }

    if (shouldSkipDownload(flags)) {
      return {
        persistDownloadVersion: requestedVersion || undefined,
      };
    }

    const savedVersion = readEnvValue(runtime.env, 'downloadVersion');
    const downloadVersion = requestedVersion || savedVersion;
    if (!downloadVersion) {
      throw new Error(
        [
          `Env "${runtime.envName}" does not have a saved \`downloadVersion\`.`,
          'This env cannot be upgraded until a source version is explicit.',
          `Re-run \`nb init --ui --env ${runtime.envName}\` for this env, or pass \`--version\` to \`nb app upgrade\`.`,
        ].join('\n'),
      );
    }

    return {
      downloadVersion,
      persistDownloadVersion: requestedVersion || undefined,
    };
  }

  private static buildLocalDownloadArgv(
    runtime: DownloadableLocalManagedRuntime,
    downloadVersion: string,
    options?: { verbose?: boolean },
  ): string[] {
    const argv = ['-y', '--no-intro', '--source', runtime.source, '--replace'];

    if (options?.verbose) {
      argv.push('--verbose');
    }

    argv.push('--version', downloadVersion, '--output-dir', runtime.projectRoot);

    const gitUrl = readEnvValue(runtime.env, 'gitUrl');
    if (gitUrl) {
      argv.push('--git-url', gitUrl);
    }

    const npmRegistry = readEnvValue(runtime.env, 'npmRegistry');
    if (npmRegistry) {
      argv.push('--npm-registry', npmRegistry);
    }

    if (runtime.env.config.devDependencies === true) {
      argv.push('--dev-dependencies');
    }
    if (runtime.env.config.build === false) {
      argv.push('--no-build');
    }
    if (runtime.env.config.buildDts === true) {
      argv.push('--build-dts');
    }
    const hookScriptPath = resolveHookScriptPath({
      appPath: runtime.env.appPath,
      hookScript: runtime.env.config.hookScript,
    });
    if (hookScriptPath) {
      argv.push(
        '--hook-script',
        hookScriptPath,
        '--hook-phase',
        'upgrade',
        '--hook-env-name',
        runtime.envName,
        '--hook-app-path',
        runtime.env.appPath,
        '--hook-storage-path',
        runtime.env.storagePath,
      );
    }

    return argv;
  }

  private static buildDockerDownloadArgv(
    runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
    downloadVersion: string,
    options?: { verbose?: boolean },
  ): string[] {
    const argv = ['-y', '--no-intro'];
    if (options?.verbose) {
      argv.push('--verbose');
    }

    argv.push(
      '--source',
      'docker',
      '--replace',
      '--docker-registry',
      readEnvValue(runtime.env, 'dockerRegistry') || DEFAULT_DOCKER_REGISTRY,
      '--version',
      downloadVersion,
    );

    const dockerPlatform = normalizeDockerPlatform(runtime.env.config.dockerPlatform);
    if (dockerPlatform) {
      argv.push('--docker-platform', dockerPlatform);
    }

    return argv;
  }

  private static async persistDownloadVersion(runtime: UpgradeManagedRuntime, downloadVersion: string): Promise<void> {
    const { name: _name, ...envConfig } = runtime.env.config;
    try {
      await upsertEnv(runtime.envName, {
        ...envConfig,
        downloadVersion,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `NocoBase was upgraded for "${runtime.envName}", but the CLI could not save \`downloadVersion=${downloadVersion}\`. Details: ${message}`,
      );
    }
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppUpgrade);
    const parsed = flags as UpgradeParsedFlags;
    const requestedEnv = normalizeEnvName(parsed.env);
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));

    const runtime = await resolveManagedAppRuntime(requestedEnv);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        [
          `Can't upgrade "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker runtime to upgrade here.',
          'If you want a local NocoBase AI environment that the CLI can upgrade, run `nb init --ui` first.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        [
          `Can't upgrade "${runtime.envName}" yet.`,
          'SSH env support is reserved but not implemented yet.',
          'Use a local or Docker env if you need CLI-managed upgrades right now.',
        ].join('\n'),
      );
    }

    const interactiveTerminal = isInteractiveTerminal();
    if (explicitEnvSelection) {
      if (!interactiveTerminal) {
        const currentEnv = normalizeEnvName(await getCurrentEnvName());
        if (currentEnv && currentEnv !== requestedEnv) {
          const missingYes = !parsed.yes;
          const missingForce = !parsed.force;

          if (missingYes || missingForce) {
            this.error(
              formatUpgradeCrossEnvConfirmationRequiredMessage(currentEnv, runtime, parsed, {
                missingYes,
                missingForce,
              }),
            );
          }
        }
      } else {
        const confirmed = await ensureCrossEnvConfirmed({
          command: this,
          requestedEnv,
          yes: parsed.yes,
        });
        if (!confirmed) {
          return;
        }
      }
    }

    if (!interactiveTerminal) {
      if (!parsed.force) {
        this.error(formatUpgradeForceRequiredMessage(runtime, parsed));
      }
    } else if (!parsed.force) {
      let confirmed = false;
      try {
        confirmed = await confirm({
          message: `Upgrade "${runtime.envName}"? ${formatUpgradePromptSummary(parsed)}`,
          default: false,
        });
      } catch {
        return;
      }
      if (!confirmed) {
        return;
      }
    }

    announceTargetEnv(runtime.envName);

    try {
      const resolvedVersion = AppUpgrade.resolveUpgradeVersion(runtime, parsed);
      const skipDownload = shouldSkipDownload(parsed);
      const runCommand = this.config.runCommand.bind(this.config) as (id: string, argv?: string[]) => Promise<unknown>;

      await runWithSuppressedTargetEnvLog(async () => {
        await runCommand('app:stop', buildManagedActionArgv(runtime.envName, parsed));
      });

      if (skipDownload) {
        printInfo(`Skipping source download for "${runtime.envName}" (--skip-download).`);
        printInfo(`Skipping commercial plugin sync for "${runtime.envName}" (--skip-download).`);
      } else if (runtime.kind === 'local' && runtime.source === 'local') {
        printInfo(
          `Skipping source download for "${runtime.envName}" because this env is managed from an existing local app path.`,
        );
      } else {
        const downloadVersion = resolvedVersion.downloadVersion;
        if (!downloadVersion) {
          throw new Error(`Missing downloadVersion for "${runtime.envName}".`);
        }
        try {
          if (runtime.kind === 'docker') {
            await runCommand(
              'source:download',
              AppUpgrade.buildDockerDownloadArgv(runtime, downloadVersion, {
                verbose: parsed.verbose,
              }),
            );
          } else if (isDownloadableLocalRuntime(runtime)) {
            await runCommand(
              'source:download',
              AppUpgrade.buildLocalDownloadArgv(runtime, downloadVersion, {
                verbose: parsed.verbose,
              }),
            );
          } else {
            throw new Error(
              `Skipping source download for "${runtime.envName}" because this env is managed from an existing local app path.`,
            );
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          if (runtime.kind === 'docker') {
            throw new Error(formatDockerDownloadFailure(runtime.envName, message));
          }
          if (isDownloadableLocalRuntime(runtime)) {
            throw new Error(formatLocalDownloadFailure(runtime.envName, runtime.source, message));
          }
          throw new Error(message);
        }
      }

      if (!skipDownload) {
        await runWithSuppressedTargetEnvLog(async () => {
          await runCommand(
            'license:plugins:sync',
            buildLicenseSyncArgv(runtime.envName, parsed, {
              version: resolvedVersion.persistDownloadVersion,
            }),
          );
        });
      }

      await runWithSuppressedTargetEnvLog(async () => {
        const startArgv = buildManagedActionArgv(runtime.envName, parsed, { quickstart: true });
        startArgv.push('--no-sync-licensed-plugins');
        await runWithSuppressedStartSuccessLog(async () => {
          await runCommand('app:start', startArgv);
        });
      });

      if (resolvedVersion.persistDownloadVersion) {
        await AppUpgrade.persistDownloadVersion(runtime, resolvedVersion.persistDownloadVersion);
      }

      try {
        await runWithSuppressedTargetEnvLog(async () => {
          await runCommand('env:update', buildEnvUpdateArgv(runtime.envName, parsed));
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        printWarning(formatEnvUpdateWarning(runtime.envName, message));
      }

      const displayUrl = formatDisplayUrl(
        runtime.env.baseUrl,
        runtime.env.appPort === undefined || runtime.env.appPort === null ? undefined : String(runtime.env.appPort),
      );
      succeedTask(`NocoBase has been upgraded for "${runtime.envName}"${displayUrl ? ` at ${displayUrl}` : ''}.`);
    } catch (error: unknown) {
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
