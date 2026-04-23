/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import type { Env } from '../lib/auth-store.js';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  runLocalNocoBaseCommand,
  startDockerContainer,
  stopDockerContainer,
  type ManagedAppRuntime,
} from '../lib/app-runtime.js';
import { commandOutput, commandSucceeds, run } from '../lib/run-npm.js';
import { failTask, printInfo, startTask, stopTask, succeedTask, updateTask } from '../lib/ui.js';

const DEFAULT_DOCKER_REGISTRY = 'nocobase/nocobase';
const DEFAULT_DOWNLOAD_VERSION = 'alpha';
const DOCKER_APP_STORAGE_DESTINATION = '/app/nocobase/storage';
const APP_HEALTH_CHECK_INTERVAL_MS = 2_000;
const APP_HEALTH_CHECK_TIMEOUT_MS = 600_000;
const APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS = 5_000;

type UpgradeParsedFlags = {
  env?: string;
  verbose: boolean;
  'skip-code-update': boolean;
};

type DockerUpgradePlan = {
  containerName: string;
  networkName: string;
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

function parseDockerImageRef(imageRef: string): { dockerRegistry: string; version: string } {
  const cleaned = trimValue(imageRef).replace(/@.+$/, '');
  if (!cleaned) {
    return {
      dockerRegistry: DEFAULT_DOCKER_REGISTRY,
      version: DEFAULT_DOWNLOAD_VERSION,
    };
  }

  const lastSlash = cleaned.lastIndexOf('/');
  const lastColon = cleaned.lastIndexOf(':');
  if (lastColon > lastSlash) {
    return {
      dockerRegistry: cleaned.slice(0, lastColon),
      version: cleaned.slice(lastColon + 1) || DEFAULT_DOWNLOAD_VERSION,
    };
  }

  return {
    dockerRegistry: cleaned,
    version: 'latest',
  };
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

async function inspectDockerContainerEnv(name: string): Promise<Record<string, string>> {
  const output = await commandOutput('docker', [
    'inspect',
    '--format',
    '{{range .Config.Env}}{{println .}}{{end}}',
    name,
  ], {
    errorName: 'docker inspect',
  });

  const env: Record<string, string> = {};
  for (const line of output.split(/\r?\n/)) {
    const index = line.indexOf('=');
    if (index <= 0) {
      continue;
    }
    env[line.slice(0, index)] = line.slice(index + 1);
  }
  return env;
}

async function inspectDockerContainerImage(name: string): Promise<string> {
  return await commandOutput('docker', [
    'inspect',
    '--format',
    '{{.Config.Image}}',
    name,
  ], {
    errorName: 'docker inspect',
  });
}

async function inspectDockerStoragePath(name: string): Promise<string> {
  return await commandOutput('docker', [
    'inspect',
    '--format',
    `{{range .Mounts}}{{if eq .Destination "${DOCKER_APP_STORAGE_DESTINATION}"}}{{println .Source}}{{end}}{{end}}`,
    name,
  ], {
    errorName: 'docker inspect',
  });
}

export default class Upgrade extends Command {
  static override description =
    'Upgrade the selected NocoBase app. Local npm/git installs refresh the saved source and restart with quickstart; Docker installs refresh the saved image and recreate the app container.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env local',
    '<%= config.bin %> <%= command.id %> --env local -s',
    '<%= config.bin %> <%= command.id %> --env local --verbose',
    '<%= config.bin %> <%= command.id %> --env local-docker -s',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to upgrade. Defaults to the current env when omitted',
    }),
    'skip-code-update': Flags.boolean({
      char: 's',
      description: 'Restart with the saved local code or Docker image without downloading updates first',
      required: false,
    }),
    verbose: Flags.boolean({
      description: 'Show raw output from the underlying local or Docker commands',
      default: false,
    }),
  };

  private static buildLocalDownloadArgv(runtime: Extract<ManagedAppRuntime, { kind: 'local' }>): string[] {
    const argv = ['-y', '--no-intro', '--source', runtime.source, '--replace'];
    const version = readEnvValue(runtime.env, 'downloadVersion');
    const outputDir = readEnvValue(runtime.env, 'appRootPath');
    const gitUrl = readEnvValue(runtime.env, 'gitUrl');
    const npmRegistry = readEnvValue(runtime.env, 'npmRegistry');

    if (version) {
      argv.push('--version', version);
    }
    if (outputDir) {
      argv.push('--output-dir', outputDir);
    }
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

  private static async buildDockerUpgradePlan(
    runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
  ): Promise<DockerUpgradePlan> {
    const containerExists = await dockerContainerExists(runtime.containerName);
    let inspectedEnv: Record<string, string> | undefined;

    const readContainerEnv = async (): Promise<Record<string, string>> => {
      if (!containerExists) {
        return {};
      }
      if (!inspectedEnv) {
        inspectedEnv = await inspectDockerContainerEnv(runtime.containerName);
      }
      return inspectedEnv;
    };

    let dockerRegistry = readEnvValue(runtime.env, 'dockerRegistry');
    let version = readEnvValue(runtime.env, 'downloadVersion');
    if ((!dockerRegistry || !version) && containerExists) {
      const imageRef = await inspectDockerContainerImage(runtime.containerName);
      const parsed = parseDockerImageRef(imageRef);
      dockerRegistry ||= parsed.dockerRegistry;
      version ||= parsed.version;
    }

    const envVars = await readContainerEnv();

    const appPort =
      runtime.env.appPort === undefined || runtime.env.appPort === null
        ? ''
        : trimValue(runtime.env.appPort);
    let storagePath = readEnvValue(runtime.env, 'storagePath');
    if (!storagePath && containerExists) {
      storagePath = trimValue(await inspectDockerStoragePath(runtime.containerName));
    }

    const appKey = readEnvValue(runtime.env, 'appKey') || trimValue(envVars.APP_KEY);
    const timeZone = readEnvValue(runtime.env, 'timezone') || trimValue(envVars.TZ);
    const dbDialect = readEnvValue(runtime.env, 'dbDialect') || trimValue(envVars.DB_DIALECT);
    const dbHost = readEnvValue(runtime.env, 'dbHost') || trimValue(envVars.DB_HOST);
    const dbPort = readEnvValue(runtime.env, 'dbPort') || trimValue(envVars.DB_PORT);
    const dbDatabase = readEnvValue(runtime.env, 'dbDatabase') || trimValue(envVars.DB_DATABASE);
    const dbUser = readEnvValue(runtime.env, 'dbUser') || trimValue(envVars.DB_USER);
    const dbPassword = readEnvValue(runtime.env, 'dbPassword') || trimValue(envVars.DB_PASSWORD);

    const missing: string[] = [];
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
        `The saved Docker settings for "${runtime.envName}" are incomplete. Missing: ${missing.join(', ')}. Re-run \`nb install\` or \`nb env add\` to refresh this env config.`,
      );
    }

    const resolvedRegistry = dockerRegistry || DEFAULT_DOCKER_REGISTRY;
    const resolvedVersion = version || DEFAULT_DOWNLOAD_VERSION;
    const imageRef = `${resolvedRegistry}:${resolvedVersion}`;
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
      networkName: runtime.workspaceName,
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
    flags: UpgradeParsedFlags,
    commandStdio: 'inherit' | 'ignore',
  ): Promise<void> {
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
        await runCommand('download', Upgrade.buildLocalDownloadArgv(runtime));
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
      await runLocalNocoBaseCommand(runtime, Upgrade.buildLocalStartArgv(runtime), {
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

    succeedTask(
      `NocoBase has been upgraded for "${runtime.envName}"${displayUrl ? ` at ${displayUrl}` : ''}.`,
    );
  }

  private static async upgradeDocker(
    runCommand: (id: string, argv?: string[]) => Promise<unknown>,
    runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
    flags: UpgradeParsedFlags,
    commandStdio: 'inherit' | 'ignore',
  ): Promise<void> {
    const plan = await Upgrade.buildDockerUpgradePlan(runtime);
    const apiBaseUrl = resolveApiBaseUrl(runtime);
    const displayUrl = formatDisplayUrl(apiBaseUrl, plan.appPort);
    const containerExists = await dockerContainerExists(runtime.containerName);

    if (!flags['skip-code-update']) {
      const argv = ['-y', '--no-intro', '--source', 'docker', '--replace', '--docker-registry', parseDockerImageRef(plan.imageRef).dockerRegistry, '--version', parseDockerImageRef(plan.imageRef).version];
      const dockerPlatform = normalizeDockerPlatform(runtime.env.config.dockerPlatform);
      if (dockerPlatform) {
        argv.push('--docker-platform', dockerPlatform);
      }
      startTask(`Refreshing the Docker image for "${runtime.envName}"...`);
      try {
        await runCommand('download', argv);
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
    }

    await waitForAppHealthCheck({
      envName: runtime.envName,
      apiBaseUrl,
      containerName: runtime.containerName,
    });

    succeedTask(
      `NocoBase has been upgraded for "${runtime.envName}"${displayUrl ? ` at ${displayUrl}` : ''}.`,
    );
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Upgrade);
    const parsed = flags as UpgradeParsedFlags;
    const requestedEnv = parsed.env?.trim() || undefined;

    const commandStdio = parsed.verbose ? 'inherit' : 'ignore';
    const runtime = await resolveManagedAppRuntime(requestedEnv);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'remote') {
      this.error(
        [
          `Can't upgrade "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker runtime to upgrade here.',
          'If you want a local NocoBase AI environment that the CLI can upgrade, run `nb init` first.',
        ].join('\n'),
      );
    }

    try {
      const runCommand = this.config.runCommand.bind(this.config) as (id: string, argv?: string[]) => Promise<unknown>;
      if (runtime.kind === 'docker') {
        await Upgrade.upgradeDocker(runCommand, runtime, parsed, commandStdio);
      } else {
        await Upgrade.upgradeLocal(runCommand, runtime, parsed, commandStdio);
      }
    } catch (error: unknown) {
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
