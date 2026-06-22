/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { buildDefaultCdnBaseUrl, readDistClientActiveVersion } from '../../lib/app-public-path.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import {
  formatMissingManagedAppEnvMessage,
  managedAppLifecycleEnvVars,
  resolveManagedAppRuntime,
  runLocalNocoBaseCommand,
  type ManagedAppRuntime,
} from '../../lib/app-runtime.js';
import {
  AppHealthCheckError,
  formatAppUrl,
  isAppReady,
  resolveManagedAppApiBaseUrl,
  waitForAppReady,
} from '../../lib/app-health.js';
import {
  ensureBuiltinDbReady,
  ensureLocalPostinstall,
  ensureSavedLocalSource,
  recreateSavedDockerApp,
} from '../../lib/app-managed-resources.js';
import { clearEnvRootSetup, getEnv, upsertEnv } from '../../lib/auth-store.js';
import { buildInitAppEnvVarsFromConfig, isPreparedSetupState } from '../../lib/managed-init-env.js';
import { resolveAppUrlFromApiBaseUrl } from '../env/shared.js';
import { readManagedRuntimeEnvValues } from '../../lib/managed-env-file.js';
import { run } from '../../lib/run-npm.js';
import { announceTargetEnv, failTask, printInfo, printWarning, startTask, succeedTask } from '../../lib/ui.js';
import {
  buildHookContext,
  resolveHookScriptPath,
  runHookScriptHook,
  type HookCommand,
  type HookName,
  type HookPhase,
} from '../../lib/hook-script.js';

function shouldPrintStartSuccess(): boolean {
  return process.env.NB_SKIP_APP_START_SUCCESS_LOG !== '1';
}

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((token) => argv.includes(token));
}

function buildLicenseSyncArgv(
  envName: string,
  options: {
    explicitEnvSelection: boolean;
    yes: boolean;
    verbose: boolean;
  },
): string[] {
  const argv = ['--env', envName, '--skip-if-no-license'];
  if (options.yes || options.explicitEnvSelection) {
    argv.push('--yes');
  }
  if (options.verbose) {
    argv.push('--verbose');
  }
  return argv;
}

function resolveHookCommand(value: unknown): HookCommand {
  const text = String(value ?? '').trim();
  if (text === 'app:restart' || text === 'app:upgrade') {
    return text;
  }
  return 'app:start';
}

function resolveAppStartHookPhase(options: { isPreparedEnv: boolean; command: HookCommand }): HookPhase {
  if (options.isPreparedEnv) {
    return 'init';
  }
  if (options.command === 'app:upgrade') {
    return 'upgrade';
  }
  return 'app-start';
}

async function runRuntimeHookIfNeeded(params: {
  hookName: HookName;
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>;
  phase: HookPhase;
  command: HookCommand;
}): Promise<void> {
  const hookScript = params.runtime.env.config?.hookScript;
  if (!hookScript) {
    return;
  }

  const hookScriptPath = resolveHookScriptPath({
    appPath: params.runtime.env.appPath,
    hookScript,
  });
  if (!hookScriptPath) {
    return;
  }

  const context = buildHookContext({
    phase: params.phase,
    command: params.command,
    envName: params.runtime.envName,
    source: params.runtime.source,
    version: params.runtime.env.config?.downloadVersion,
    appPath: params.runtime.env.appPath,
    sourcePath: params.runtime.env.sourcePath,
    storagePath: params.runtime.env.storagePath,
    hookScript: String(hookScript).trim(),
    envConfig:
      params.hookName === 'afterAppStart' && params.phase === 'init'
        ? { ...params.runtime.env.config, setupState: 'installed' }
        : params.runtime.env.config,
  });
  if (!context) {
    return;
  }

  await runHookScriptHook({
    hookScriptPath,
    hookName: params.hookName,
    context,
  });
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

function formatDockerStartFailure(envName: string, message: string): string {
  return [
    `Couldn't start NocoBase for "${envName}".`,
    'Check that the Docker runtime for this env is still available, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function formatLocalStartFailure(envName: string, options?: { port?: string; source?: string }): string {
  const sourceLabel =
    options?.source === 'git'
      ? 'the local Git checkout'
      : options?.source === 'npm'
        ? 'the local npm app'
        : 'the local app';
  const portHint = options?.port ? ` Expected app port: ${options.port}.` : '';

  return [
    `Couldn't start NocoBase for "${envName}".`,
    `The CLI was not able to start ${sourceLabel} successfully.`,
    `Check that the app dependencies, database connection, and local env settings are ready, then try again.${portHint}`,
  ].join('\n');
}

function formatLocalReadyFailure(
  envName: string,
  message: string,
  options?: { port?: string; source?: string },
): string {
  const sourceLabel =
    options?.source === 'git'
      ? 'the local Git checkout'
      : options?.source === 'npm'
        ? 'the local npm app'
        : 'the local app';
  const portHint = options?.port ? ` Expected app port: ${options.port}.` : '';

  return [
    `NocoBase did not become ready for "${envName}".`,
    `The CLI started ${sourceLabel}, but the app did not pass its health check in time.`,
    `Check the startup logs, database connection, and local env settings, then try again.${portHint}`,
    `Details: ${message}`,
  ].join('\n');
}

function formatLocalClientExtractWarning(envName: string, message: string): string {
  return [
    `Client assets were not extracted for "${envName}".`,
    'NocoBase will keep starting, but versioned client files for CDN or external distribution may be stale or missing.',
    `Details: ${message}`,
  ].join('\n');
}

function resolveDisplayAppUrl(
  apiBaseUrl: string | undefined,
  port?: string,
  appPublicPath?: string,
): string | undefined {
  const resolvedFromApiBaseUrl = resolveAppUrlFromApiBaseUrl(apiBaseUrl);
  if (resolvedFromApiBaseUrl) {
    return resolvedFromApiBaseUrl;
  }

  return formatAppUrl(port, appPublicPath);
}

async function resolveDefaultLocalCdnBaseUrl(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' }>,
): Promise<string | undefined> {
  let envValues: Record<string, string> = {};

  if (runtime.env.config && typeof runtime.env.config === 'object') {
    ({ envValues } = await readManagedRuntimeEnvValues(runtime));
  }

  const explicitProcessCdnBaseUrl = String(process.env.CDN_BASE_URL ?? '').trim();
  const explicitSavedCdnBaseUrl = String(runtime.env.envVars.CDN_BASE_URL ?? '').trim();
  const explicitEnvFileCdnBaseUrl = String(envValues.CDN_BASE_URL ?? '').trim();

  if (explicitProcessCdnBaseUrl || explicitSavedCdnBaseUrl || explicitEnvFileCdnBaseUrl) {
    return undefined;
  }

  const storagePath = String(runtime.env.storagePath ?? runtime.env.config?.storagePath ?? '').trim();
  if (!storagePath) {
    return undefined;
  }

  const activeVersion = await readDistClientActiveVersion(storagePath);
  if (!activeVersion) {
    return undefined;
  }

  return buildDefaultCdnBaseUrl(runtime.env.config?.appPublicPath || envValues.APP_PUBLIC_PATH, activeVersion);
}

async function finalizePreparedEnv(envName: string): Promise<void> {
  const existingEnv = await getEnv(envName);
  await clearEnvRootSetup(envName);
  await upsertEnv(envName, {
    ...(existingEnv?.config.apiBaseUrl ? { apiBaseUrl: existingEnv.config.apiBaseUrl } : {}),
    setupState: 'installed',
  });
}

export default class AppStart extends Command {
  static override hidden = false;
  static override description =
    'Start NocoBase for the selected env. When applicable, the CLI synchronizes licensed commercial plugins first, then prepares and starts the app or recreates the saved Docker container.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env local',
    '<%= config.bin %> <%= command.id %> --env local --verbose',
    '<%= config.bin %> <%= command.id %> --env local-docker',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to start. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    quickstart: Flags.boolean({
      hidden: true,
      description: 'Quickstart the application',
      required: false,
      default: true,
      allowNo: true,
    }),
    'sync-licensed-plugins': Flags.boolean({
      hidden: true,
      description: 'Synchronize licensed commercial plugins before starting the application',
      required: false,
      default: true,
      allowNo: true,
    }),
    daemon: Flags.boolean({
      hidden: true,
      description: 'Run the application as a daemon (default: true; use --no-daemon to stay in the foreground)',
      char: 'd',
      required: false,
      default: true,
      allowNo: true,
    }),
    verbose: Flags.boolean({
      description: 'Show raw startup output from the underlying local or Docker command',
      default: false,
    }),
    'hook-command': Flags.string({
      hidden: true,
      options: ['app:start', 'app:restart', 'app:upgrade'],
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppStart);
    const quickstart = flags.quickstart ?? true;
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));
    const shouldSyncLicensedPlugins = flags['sync-licensed-plugins'] ?? true;
    if (explicitEnvSelection) {
      const confirmed = await ensureCrossEnvConfirmed({
        command: this,
        requestedEnv,
        yes: flags.yes,
      });
      if (!confirmed) {
        return;
      }
    }

    const daemonFlagWasProvided = argvHasToken(this.argv, ['--daemon', '--no-daemon']);
    const runtime = await resolveManagedAppRuntime(requestedEnv);
    const preparedInitEnvVars = buildInitAppEnvVarsFromConfig(runtime?.env.config);
    const isPreparedEnv = isPreparedSetupState(runtime?.env.config?.setupState);
    const hookCommand = resolveHookCommand(flags['hook-command']);
    const hookPhase = resolveAppStartHookPhase({
      isPreparedEnv,
      command: hookCommand,
    });
    const shouldRunBeforeAppInstall = isPreparedEnv || hookCommand === 'app:upgrade';
    const runCommand = this.config.runCommand.bind(this.config) as (id: string, argv?: string[]) => Promise<unknown>;
    const commandStdio = flags.verbose ? 'inherit' : 'ignore';
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        [
          `Can't start "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker runtime to launch here.',
          'Connect it to a local checkout or reinstall it with npm, git, or Docker if you want CLI-managed start and stop.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        [
          `Can't start "${runtime.envName}" yet.`,
          'SSH env support is reserved but not implemented yet.',
          'Use a local or Docker env if you need CLI-managed start and stop right now.',
        ].join('\n'),
      );
    }

    announceTargetEnv(runtime.envName);

    if (runtime.kind === 'docker') {
      const unsupportedFlags = [daemonFlagWasProvided ? (flags.daemon ? '--daemon' : '--no-daemon') : undefined].filter(
        Boolean,
      );

      if (unsupportedFlags.length > 0) {
        this.error(
          [
            `Can't apply ${unsupportedFlags.join(', ')} to "${runtime.envName}".`,
            'This env is managed by Docker, so those options are only available for local npm/git installs.',
            `Run \`nb app start --env ${runtime.envName}\` to recreate the saved container, or recreate the env if you need different runtime settings.`,
          ].join('\n'),
        );
      }

      if (shouldSyncLicensedPlugins) {
        try {
          await runWithSuppressedTargetEnvLog(async () => {
            await runCommand(
              'license:plugins:sync',
              buildLicenseSyncArgv(runtime.envName, {
                explicitEnvSelection,
                yes: flags.yes,
                verbose: flags.verbose,
              }),
            );
          });
        } catch (error: unknown) {
          this.error(error instanceof Error ? error.message : String(error));
        }
      }

      await ensureBuiltinDbReady(runtime, {
        verbose: flags.verbose,
        onStartTask: startTask,
        onSucceedTask: succeedTask,
        onFailTask: failTask,
      });

      const apiBaseUrl = resolveManagedAppApiBaseUrl(runtime);
      const appUrl = resolveDisplayAppUrl(
        apiBaseUrl,
        runtime.env.appPort === undefined || runtime.env.appPort === null ? undefined : String(runtime.env.appPort),
        runtime.env.config?.appPublicPath,
      );
      startTask(`Recreating the Docker app container for "${runtime.envName}"...`);
      try {
        await run('docker', ['rm', '-f', runtime.containerName], {
          errorName: 'docker rm',
          stdio: commandStdio,
        }).catch(() => undefined);
        if (shouldRunBeforeAppInstall) {
          await runRuntimeHookIfNeeded({
            hookName: 'beforeAppInstall',
            runtime,
            phase: hookPhase,
            command: hookCommand,
          });
        }
        await recreateSavedDockerApp(runtime, {
          initEnvVars: isPreparedEnv ? preparedInitEnvVars : undefined,
          verbose: flags.verbose,
        });
        succeedTask(`Docker app container is ready for "${runtime.envName}".`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to recreate NocoBase for "${runtime.envName}".`);
        this.error(formatDockerStartFailure(runtime.envName, message));
      }
      await waitForAppReady({
        envName: runtime.envName,
        apiBaseUrl,
        containerName: runtime.containerName,
        logHint: `You can inspect startup logs with \`nb app logs --env ${runtime.envName}\`.`,
        ...(flags.verbose ? { verbose: true } : {}),
      });
      if (isPreparedEnv) {
        await finalizePreparedEnv(runtime.envName);
      }
      await runRuntimeHookIfNeeded({
        hookName: 'afterAppStart',
        runtime,
        phase: hookPhase,
        command: hookCommand,
      });
      if (shouldPrintStartSuccess()) {
        succeedTask(`NocoBase is running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`);
      }
      return;
    }

    await ensureBuiltinDbReady(runtime, {
      verbose: flags.verbose,
      onStartTask: startTask,
      onSucceedTask: succeedTask,
      onFailTask: failTask,
    });

    if (runtime.source === 'npm' || runtime.source === 'git') {
      const downloadableRuntime = runtime as typeof runtime & { source: 'npm' | 'git' };
      await ensureSavedLocalSource(downloadableRuntime, runCommand, {
        verbose: flags.verbose,
        hookPhase: isPreparedEnv ? 'init' : 'restore',
        hookCommand,
        onStartTask: startTask,
        onSucceedTask: succeedTask,
        onFailTask: failTask,
      });
    }

    if (isPreparedEnv && flags.daemon === false) {
      this.error(
        `Can't start "${runtime.envName}" with --no-daemon yet. Run \`nb app start --env ${runtime.envName}\` to finish the first installation in daemon mode.`,
      );
    }

    const npmArgs = ['start'];

    if (quickstart) {
      npmArgs.push('--quickstart');
    }
    if (
      runtime.env.appPort !== undefined &&
      runtime.env.appPort !== null &&
      String(runtime.env.appPort).trim() !== ''
    ) {
      npmArgs.push('--port', String(runtime.env.appPort));
    }
    if (flags.daemon !== false) {
      npmArgs.push('--daemon');
    }

    const effectivePort =
      runtime.env.appPort !== undefined && runtime.env.appPort !== null
        ? String(runtime.env.appPort).trim()
        : undefined;
    const apiBaseUrl = resolveManagedAppApiBaseUrl(runtime, {
      portOverride: effectivePort,
    });
    const appUrl = resolveDisplayAppUrl(apiBaseUrl, effectivePort, runtime.env.config?.appPublicPath);
    let defaultCdnBaseUrl: string | undefined;

    if (await isAppReady(apiBaseUrl, { requestTimeoutMs: 1_500 })) {
      if (flags.daemon === false) {
        printInfo(
          `NocoBase is already running for "${runtime.envName}"${
            appUrl ? ` at ${appUrl}` : ''
          }. Use \`nb app stop --env ${runtime.envName}\` before starting it again in the foreground.`,
        );
      } else {
        if (shouldPrintStartSuccess()) {
          succeedTask(`NocoBase is already running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`);
        }
      }
      return;
    }

    if (shouldSyncLicensedPlugins) {
      try {
        await runWithSuppressedTargetEnvLog(async () => {
          await runCommand(
            'license:plugins:sync',
            buildLicenseSyncArgv(runtime.envName, {
              explicitEnvSelection,
              yes: flags.yes,
              verbose: flags.verbose,
            }),
          );
        });
      } catch (error: unknown) {
        this.error(error instanceof Error ? error.message : String(error));
      }
    }

    try {
      await ensureLocalPostinstall(runtime, {
        env: managedAppLifecycleEnvVars(),
        verbose: flags.verbose,
        onStartTask: startTask,
        onSucceedTask: succeedTask,
        onFailTask: failTask,
      });
    } catch (error: unknown) {
      this.error(error instanceof Error ? error.message : String(error));
    }

    try {
      startTask(`Extracting client assets for "${runtime.envName}"...`);
      await runLocalNocoBaseCommand(runtime, ['client:extract'], {
        env: managedAppLifecycleEnvVars(),
        stdio: commandStdio,
      });
      succeedTask(`Client assets are ready for "${runtime.envName}".`);
      defaultCdnBaseUrl = await resolveDefaultLocalCdnBaseUrl(runtime);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      failTask(`Failed to extract client assets for "${runtime.envName}".`);
      printWarning(formatLocalClientExtractWarning(runtime.envName, message));
    }

    if (flags.daemon === false) {
      printInfo(
        `Starting NocoBase for "${runtime.envName}" in the foreground${
          appUrl ? ` at ${appUrl}` : ''
        }. Press Ctrl+C to stop.`,
      );
    } else {
      startTask(`Starting NocoBase for "${runtime.envName}" in the background...`);
    }

    try {
      const startEnv = defaultCdnBaseUrl
        ? {
            ...managedAppLifecycleEnvVars(),
            CDN_BASE_URL: defaultCdnBaseUrl,
            ...(isPreparedEnv ? preparedInitEnvVars : {}),
          }
        : {
            ...managedAppLifecycleEnvVars(),
            ...(isPreparedEnv ? preparedInitEnvVars : {}),
          };
      if (shouldRunBeforeAppInstall) {
        await runRuntimeHookIfNeeded({
          hookName: 'beforeAppInstall',
          runtime,
          phase: hookPhase,
          command: hookCommand,
        });
      }
      await runLocalNocoBaseCommand(runtime, npmArgs, {
        env: startEnv,
        stdio: commandStdio,
      });
      if (flags.daemon !== false) {
        await waitForAppReady({
          envName: runtime.envName,
          apiBaseUrl,
          logHint: `You can inspect startup logs with \`nb app logs --env ${runtime.envName}\`.`,
        });
        if (isPreparedEnv) {
          await finalizePreparedEnv(runtime.envName);
        }
        await runRuntimeHookIfNeeded({
          hookName: 'afterAppStart',
          runtime,
          phase: hookPhase,
          command: hookCommand,
        });
        if (shouldPrintStartSuccess()) {
          succeedTask(`NocoBase is running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`);
        }
      }
    } catch (error: unknown) {
      failTask(`Failed to start NocoBase for "${runtime.envName}".`);
      if (error instanceof AppHealthCheckError) {
        this.error(
          formatLocalReadyFailure(runtime.envName, error.message, {
            port: effectivePort,
            source: runtime.source,
          }),
        );
      }
      this.error(
        formatLocalStartFailure(runtime.envName, {
          port: effectivePort,
          source: runtime.source,
        }),
      );
    }
  }
}
