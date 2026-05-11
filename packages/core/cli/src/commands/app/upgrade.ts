/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { upsertEnv, type Env } from '../../lib/auth-store.js';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  runLocalNocoBaseCommand,
  startDockerContainer,
  stopDockerContainer,
  type ManagedAppRuntime,
} from '../../lib/app-runtime.js';
import { resolveConfiguredEnvPath } from '../../lib/cli-home.js';
import { deriveBuiltinDbConnection } from '../../lib/builtin-db.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { commandSucceeds, run } from '../../lib/run-npm.js';
import { announceTargetEnv, failTask, printInfo, startTask, stopTask, succeedTask, updateTask } from '../../lib/ui.js';

const DEFAULT_DOCKER_REGISTRY = 'nocobase/nocobase';
const DOCKER_APP_STORAGE_DESTINATION = '/app/nocobase/storage';
const APP_HEALTH_CHECK_INTERVAL_MS = 2_000;
const APP_HEALTH_CHECK_TIMEOUT_MS = 600_000;
const APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS = 5_000;

type UpgradeParsedFlags = {
  env?: string;
  yes: boolean;
  verbose: boolean;
  'skip-code-update': boolean;
  version?: string;
};

type DockerUpgradePlan = {
  containerName: string;
  networkName: string;
  dockerRegistry: string;
  downloadVersion: string;
  imageRef: string;
  appPort?: string;
  storagePath: string;
  appKey: string;
  timeZone: string;
  dbDialect: string;
  dbHost: string;
  dbPort: string;
  dbDatabase: string;
  dbUser: string;
  dbPassword: string;
  args: string[];
};

type ResolvedUpgradeVersion = {
  downloadVersion?: string;
  persistDownloadVersion?: string;
};

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function formatAppUrl(port?: string): string | undefined {
  const value = trimValue(port);
  return value ? `http://127.0.0.1:${value}` : undefined;
}

function formatDisplayUrl(apiBaseUrl?: string, appPort?: string): string | undefined {
  const appUrl = formatAppUrl(appPort);
  if (appUrl) {
    return appUrl;
  }

  const value = trimValue(apiBaseUrl);
  if (!value) {
    return undefined;
  }

  return value.replace(/\/api\/?$/, '');
}

function resolveApiBaseUrl(runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>): string | undefined {
  const baseUrl = trimValue(runtime.env.baseUrl);
  if (baseUrl) {
    return baseUrl.replace(/\/+$/, '');
  }

  const appPort =
    runtime.env.appPort === undefined || runtime.env.appPort === null
      ? ''
      : trimValue(runtime.env.appPort);
  return appPort ? `http://127.0.0.1:${appPort}/api` : undefined;
}

function buildHealthCheckUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/__health_check`;
}

function dockerRefLabel(source: 'npm' | 'git' | 'local'): string {
  if (source === 'git') {
    return 'Git checkout';
  }
  if (source === 'npm') {
    return 'npm app';
  }
  return 'local app';
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

function formatLocalStartFailure(envName: string, source: 'npm' | 'git' | 'local', port?: string, message?: string): string {
  const sourceLabel = dockerRefLabel(source);
  const portHint = trimValue(port) ? ` Expected app port: ${trimValue(port)}.` : '';
  const details = trimValue(message) ? ` Details: ${trimValue(message)}` : '';
  return [
    `Couldn't finish the upgrade for "${envName}".`,
    `The CLI updated ${sourceLabel}, but it could not start the upgraded app successfully.`,
    `Check the local dependencies, database connection, and saved env settings, then try again.${portHint}${details}`,
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

function formatDockerStartFailure(envName: string, message: string): string {
  return [
    `Couldn't finish the upgrade for "${envName}".`,
    'The CLI was not able to start the upgraded Docker app successfully.',
    'Check that the saved Docker image, container settings, and database connection are still valid, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function normalizeDockerPlatform(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  if (!text || text === 'auto') {
    return undefined;
  }
  if (text === 'linux/amd64' || text === 'linux/arm64') {
    return text;
  }
  return undefined;
}

function readEnvValue(env: Env, key: keyof Env['config']): string {
  if (key === 'appRootPath' || key === 'storagePath') {
    return trimValue(resolveConfiguredEnvPath(env.config[key]));
  }

  return trimValue(env.config[key]);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestAppHealthCheck(params: {
  healthCheckUrl: string;
  fetchImpl?: typeof fetch;
  requestTimeoutMs?: number;
}): Promise<{ ok: boolean; message: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, params.requestTimeoutMs ?? APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS);

  try {
    const response = await (params.fetchImpl ?? fetch)(params.healthCheckUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    const text = await response.text().catch(() => '');
    const body = text.replace(/\s+/g, ' ').trim() || 'No response yet';
    return {
      ok: response.ok && text.trim().toLowerCase() === 'ok',
      message: `HTTP ${response.status}: ${body}`,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        message: `No response within ${Math.ceil((params.requestTimeoutMs ?? APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS) / 1000)}s`,
      };
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForAppHealthCheck(params: {
  envName: string;
  apiBaseUrl?: string;
  containerName?: string;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  if (!params.apiBaseUrl) {
    printInfo(`Skipping health check for "${params.envName}" because no local API URL is saved for this env.`);
    return;
  }

  const healthCheckUrl = buildHealthCheckUrl(params.apiBaseUrl);
  const startedAt = Date.now();
  let lastMessage = 'No response yet';
  let spinnerActive = true;

  startTask(`Waiting for NocoBase to become ready for "${params.envName}"...`);

  try {
    while (Date.now() - startedAt < APP_HEALTH_CHECK_TIMEOUT_MS) {
      const result = await requestAppHealthCheck({
        healthCheckUrl,
        fetchImpl: params.fetchImpl,
      });

      if (result.ok) {
        stopTask();
        spinnerActive = false;
        return;
      }

      lastMessage = result.message;
      const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      updateTask(
        `Waiting for NocoBase to become ready for "${params.envName}"... (${elapsedSeconds}s elapsed, last status: ${lastMessage})`,
      );
      await sleep(APP_HEALTH_CHECK_INTERVAL_MS);
    }
  } finally {
    if (spinnerActive) {
      stopTask();
    }
  }

  const logHint = params.containerName
    ? ` You can inspect startup logs with: docker logs ${params.containerName}`
    : '';
  throw new Error(
    `The upgraded app for "${params.envName}" did not become ready in time. Expected \`${healthCheckUrl}\` to respond with \`ok\`, but the last status was: ${lastMessage}.${logHint}`,
  );
}

async function dockerContainerExists(containerName: string): Promise<boolean> {
  return await commandSucceeds('docker', ['container', 'inspect', containerName]);
}

async function ensureDockerNetwork(name: string): Promise<void> {
  const exists = await commandSucceeds('docker', ['network', 'inspect', name]);
  if (exists) {
    return;
  }

  await run('docker', ['network', 'create', name], {
    errorName: 'docker network create',
    stdio: 'ignore',
  });
}

export default class AppUpgrade extends Command {
  static override hidden = false;
  static override description =
    'Upgrade the selected NocoBase app. Local npm/git installs refresh the saved source and restart with quickstart; Docker installs refresh the saved image and recreate the app container. Use --version to upgrade to a specific saved source version or image tag.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env local',
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
    'skip-code-update': Flags.boolean({
      char: 's',
      description: 'Restart with the saved local code or Docker image without downloading updates first',
      required: false,
    }),
    version: Flags.string({
      description:
        'Override the saved downloadVersion for this upgrade. When the upgrade succeeds, the new version is saved back to the env config.',
      required: false,
    }),
    verbose: Flags.boolean({
      description: 'Show raw output from the underlying local or Docker commands',
      default: false,
    }),
  };

  private static resolveUpgradeVersion(
    runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
    flags: UpgradeParsedFlags,
  ): ResolvedUpgradeVersion {
    const requestedVersion = trimValue(flags.version);
    if (requestedVersion && flags['skip-code-update']) {
      throw new Error(
        '`--version` and `--skip-code-update` cannot be used together. Use `--version` to download a specific upgrade target, or `--skip-code-update` to restart the saved code/image as-is.',
      );
    }

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

    const savedVersion = readEnvValue(runtime.env, 'downloadVersion');
    const downloadVersion = requestedVersion || savedVersion;
    if (!downloadVersion) {
      throw new Error(
        [
          `Env "${runtime.envName}" does not have a saved \`downloadVersion\`.`,
          'This env cannot be upgraded until a source version is explicit.',
          'Re-run `nb init` or `nb env add` for this env, or pass `--version` to `nb app upgrade`.',
        ].join('\n'),
      );
    }

    return {
      downloadVersion,
      persistDownloadVersion: requestedVersion || undefined,
    };
  }

  private static buildLocalDownloadArgv(
    runtime: Extract<ManagedAppRuntime, { kind: 'local' }>,
    downloadVersion: string,
  ): string[] {
    const argv = ['-y', '--no-intro', '--source', runtime.source, '--replace'];
    const gitUrl = readEnvValue(runtime.env, 'gitUrl');
    const npmRegistry = readEnvValue(runtime.env, 'npmRegistry');

    argv.push('--version', downloadVersion, '--output-dir', runtime.projectRoot);
    if (gitUrl) {
      argv.push('--git-url', gitUrl);
    }
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

    return argv;
  }

  private static buildDockerDownloadArgv(
    runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
    plan: DockerUpgradePlan,
  ): string[] {
    const argv = [
      '-y',
      '--no-intro',
      '--source',
      'docker',
      '--replace',
      '--docker-registry',
      plan.dockerRegistry,
      '--version',
      plan.downloadVersion,
    ];
    const dockerPlatform = normalizeDockerPlatform(runtime.env.config.dockerPlatform);
    if (dockerPlatform) {
      argv.push('--docker-platform', dockerPlatform);
    }
    return argv;
  }

  private static buildLocalStartArgv(runtime: Extract<ManagedAppRuntime, { kind: 'local' }>): string[] {
    const argv = ['start', '--quickstart'];
    const appPort =
      runtime.env.appPort === undefined || runtime.env.appPort === null
        ? ''
        : trimValue(runtime.env.appPort);
    if (appPort) {
      argv.push('--port', appPort);
    }
    argv.push('--daemon');
    return argv;
  }

  private static buildDockerUpgradePlan(
    runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
    downloadVersion: string,
  ): DockerUpgradePlan {
    const dockerRegistry = readEnvValue(runtime.env, 'dockerRegistry') || DEFAULT_DOCKER_REGISTRY;

    const appPort =
      runtime.env.appPort === undefined || runtime.env.appPort === null
        ? ''
        : trimValue(runtime.env.appPort);
    const storagePath = readEnvValue(runtime.env, 'storagePath');
    const appKey = readEnvValue(runtime.env, 'appKey');
    const timeZone = readEnvValue(runtime.env, 'timezone');
    const builtinDbConnection = runtime.env.config.builtinDb ? deriveBuiltinDbConnection(runtime) : undefined;
    const dbDialect = builtinDbConnection?.dbDialect || readEnvValue(runtime.env, 'dbDialect');
    const dbHost = builtinDbConnection?.dbHost || readEnvValue(runtime.env, 'dbHost');
    const dbPort = builtinDbConnection?.dbPort || readEnvValue(runtime.env, 'dbPort');
    const dbDatabase = readEnvValue(runtime.env, 'dbDatabase');
    const dbUser = readEnvValue(runtime.env, 'dbUser');
    const dbPassword = readEnvValue(runtime.env, 'dbPassword');
    const networkName = trimValue(runtime.dockerNetworkName || runtime.workspaceName);

    const missing: string[] = [];
    if (!networkName) {
      missing.push('docker.network');
    }
    if (!storagePath) {
      missing.push('storagePath');
    }
    if (!appKey) {
      missing.push('appKey');
    }
    if (!timeZone) {
      missing.push('timezone');
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
      throw new Error(
        `The saved Docker settings for "${runtime.envName}" are incomplete. Missing: ${missing.join(', ')}. Re-run \`nb init\` or \`nb env add\` to refresh this env config.`,
      );
    }

    const imageRef = `${dockerRegistry}:${downloadVersion}`;
    const args = [
      'run',
      '-d',
      '--name',
      runtime.containerName,
      '--restart',
      'always',
      '--network',
      networkName,
    ];

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
      containerName: runtime.containerName,
      networkName,
      dockerRegistry,
      downloadVersion,
      imageRef,
      appPort: appPort || undefined,
      storagePath,
      appKey,
      timeZone,
      dbDialect,
      dbHost,
      dbPort,
      dbDatabase,
      dbUser,
      dbPassword,
      args,
    };
  }

  private static async upgradeLocal(
    runCommand: (id: string, argv?: string[]) => Promise<unknown>,
    runtime: Extract<ManagedAppRuntime, { kind: 'local' }>,
    downloadVersion: string | undefined,
    flags: UpgradeParsedFlags,
    commandStdio: 'inherit' | 'ignore',
  ): Promise<string | undefined> {
    const displayUrl = formatDisplayUrl(resolveApiBaseUrl(runtime), trimValue(runtime.env.appPort));

    startTask(`Stopping NocoBase for "${runtime.envName}" before upgrade...`);
    try {
      await runLocalNocoBaseCommand(runtime, ['pm2', 'kill'], {
        stdio: commandStdio,
      });
      succeedTask(`Stopped the current NocoBase process for "${runtime.envName}".`);
    } catch (error: unknown) {
      stopTask();
      const message = error instanceof Error ? error.message : String(error);
      printInfo(
        `No running background process was stopped for "${runtime.envName}". Continuing with the upgrade. (${message})`,
      );
    }

    if (!flags['skip-code-update'] && (runtime.source === 'npm' || runtime.source === 'git')) {
      startTask(`Refreshing NocoBase files for "${runtime.envName}" from the saved ${runtime.source} source...`);
      try {
        await runCommand('source:download', AppUpgrade.buildLocalDownloadArgv(runtime, downloadVersion!));
        succeedTask(`NocoBase files are up to date for "${runtime.envName}".`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to refresh NocoBase files for "${runtime.envName}".`);
        throw new Error(formatLocalDownloadFailure(runtime.envName, runtime.source, message));
      }
    } else if (flags['skip-code-update']) {
      printInfo(`Skipping code download for "${runtime.envName}" (--skip-code-update).`);
    } else {
      printInfo(
        `Skipping code download for "${runtime.envName}" because this env is managed from an existing local app path.`,
      );
    }

    startTask(`Starting upgraded NocoBase for "${runtime.envName}"...`);
    try {
      await runLocalNocoBaseCommand(runtime, AppUpgrade.buildLocalStartArgv(runtime), {
        stdio: commandStdio,
      });
      succeedTask(`Upgraded NocoBase is starting for "${runtime.envName}".`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      failTask(`Failed to start upgraded NocoBase for "${runtime.envName}".`);
      throw new Error(
        formatLocalStartFailure(
          runtime.envName,
          runtime.source,
          trimValue(runtime.env.appPort),
          message,
        ),
      );
    }

    await waitForAppHealthCheck({
      envName: runtime.envName,
      apiBaseUrl: resolveApiBaseUrl(runtime),
    });
    return displayUrl;
  }

  private static async upgradeDocker(
    runCommand: (id: string, argv?: string[]) => Promise<unknown>,
    runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
    downloadVersion: string,
    flags: UpgradeParsedFlags,
    commandStdio: 'inherit' | 'ignore',
  ): Promise<string | undefined> {
    const apiBaseUrl = resolveApiBaseUrl(runtime);
    const containerExists = await dockerContainerExists(runtime.containerName);

    if (!flags['skip-code-update']) {
      const plan = AppUpgrade.buildDockerUpgradePlan(runtime, downloadVersion);
      startTask(`Refreshing the Docker image for "${runtime.envName}"...`);
      try {
        await runCommand('source:download', AppUpgrade.buildDockerDownloadArgv(runtime, plan));
        succeedTask(`Docker image is ready for "${runtime.envName}".`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to refresh the Docker image for "${runtime.envName}".`);
        throw new Error(formatDockerDownloadFailure(runtime.envName, message));
      }
    } else {
      printInfo(`Skipping image download for "${runtime.envName}" (--skip-code-update).`);
    }

    if (containerExists) {
      startTask(`Stopping the current Docker app for "${runtime.envName}"...`);
      try {
        const state = await stopDockerContainer(runtime.containerName, {
          stdio: commandStdio,
        });
        succeedTask(
          state === 'already-stopped'
            ? `The current Docker app was already stopped for "${runtime.envName}".`
            : `Stopped the current Docker app for "${runtime.envName}".`,
        );
      } catch (error: unknown) {
        stopTask();
        const message = error instanceof Error ? error.message : String(error);
        printInfo(
          `Could not stop the existing Docker container for "${runtime.envName}" cleanly. Continuing with container recreation. (${message})`,
        );
      }
    }

    if (flags['skip-code-update'] && containerExists) {
      startTask(`Starting NocoBase for "${runtime.envName}" with the saved Docker image...`);
      try {
        const state = await startDockerContainer(runtime.containerName, {
          stdio: commandStdio,
        });
        succeedTask(
          state === 'already-running'
            ? `NocoBase is already running for "${runtime.envName}".`
            : `NocoBase is starting for "${runtime.envName}".`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to start the Docker app for "${runtime.envName}".`);
        throw new Error(formatDockerStartFailure(runtime.envName, message));
      }
    } else {
      const plan = AppUpgrade.buildDockerUpgradePlan(runtime, downloadVersion);
      const displayUrl = formatDisplayUrl(apiBaseUrl, plan.appPort);
      startTask(`Recreating the Docker app container for "${runtime.envName}"...`);
      try {
        if (containerExists) {
          await run('docker', ['rm', '-f', runtime.containerName], {
            errorName: 'docker rm',
            stdio: commandStdio,
          });
        }
        await ensureDockerNetwork(plan.networkName);
        await run('docker', plan.args, {
          errorName: 'docker run',
          stdio: commandStdio,
        });
        succeedTask(`Docker app container is ready for "${runtime.envName}".`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to recreate the Docker app for "${runtime.envName}".`);
        throw new Error(formatDockerStartFailure(runtime.envName, message));
      }

      await waitForAppHealthCheck({
        envName: runtime.envName,
        apiBaseUrl,
        containerName: runtime.containerName,
      });
      return displayUrl;
    }

    await waitForAppHealthCheck({
      envName: runtime.envName,
      apiBaseUrl,
      containerName: runtime.containerName,
    });
    return formatDisplayUrl(apiBaseUrl, trimValue(runtime.env.appPort));
  }

  private static async persistDownloadVersion(
    runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
    downloadVersion: string,
  ): Promise<void> {
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
    const requestedEnv = parsed.env?.trim() || undefined;
    if (requestedEnv && hasExplicitEnvSelection(this.argv)) {
      const confirmed = await ensureCrossEnvConfirmed({
        command: this,
        requestedEnv,
        yes: parsed.yes,
      });
      if (!confirmed) {
        this.log('Canceled.');
        return;
      }
    }

    const commandStdio = parsed.verbose ? 'inherit' : 'ignore';
    const runtime = await resolveManagedAppRuntime(requestedEnv);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        [
          `Can't upgrade "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker runtime to upgrade here.',
          'If you want a local NocoBase AI environment that the CLI can upgrade, run `nb init` first.',
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

    announceTargetEnv(runtime.envName);

    try {
      const resolvedVersion = AppUpgrade.resolveUpgradeVersion(runtime, parsed);
      const runCommand = this.config.runCommand.bind(this.config) as (id: string, argv?: string[]) => Promise<unknown>;
      const displayUrl =
        runtime.kind === 'docker'
          ? await AppUpgrade.upgradeDocker(
              runCommand,
              runtime,
              resolvedVersion.downloadVersion!,
              parsed,
              commandStdio,
            )
          : await AppUpgrade.upgradeLocal(runCommand, runtime, resolvedVersion.downloadVersion, parsed, commandStdio);

      if (resolvedVersion.persistDownloadVersion) {
        await AppUpgrade.persistDownloadVersion(runtime, resolvedVersion.persistDownloadVersion);
      }

      succeedTask(
        `NocoBase has been upgraded for "${runtime.envName}"${displayUrl ? ` at ${displayUrl}` : ''}.`,
      );
    } catch (error: unknown) {
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
