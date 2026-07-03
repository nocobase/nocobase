/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ManagedAppRuntime } from './app-runtime.js';
import {
  dockerContainerExists,
  dockerContainerIsRunning,
  startDockerContainer,
  stopDockerContainer,
} from './app-runtime.js';
import {
  DEFAULT_NGINX_PROXY_DRIVER,
  getCliConfigValue,
  NGINX_PROXY_DRIVER_OPTIONS,
  normalizeNginxProxyDriver,
  resolveDockerContainerPrefix,
  setCliConfigValue,
  type NginxProxyDriver,
} from './cli-config.js';
import { resolveCliHomeRoot } from './cli-home.js';
import {
  applyEnvProxyAppEntryOptions,
  appConfigHasManagedNginxBlock,
  buildManualEnvProxyNginxBundle,
  buildEnvProxyMainConfig,
  buildEnvProxyNginxBundle,
  extractManagedNginxConfigBlock,
  installEnvProxyProvider,
  mapProxyPathFromCliRoot,
  reloadEnvProxyProvider,
  resolveEnvProxyMainOutputPath,
  replaceManagedNginxConfigBlock,
  syncEnvProxyNginxSnippets,
  type EnvProxyAppEntryOptions,
  type EnvProxyNginxBundle,
  type ManualEnvProxyNginxInput,
} from './env-proxy.js';
import { run } from './run-npm.js';

const DOCKER_NGINX_PROXY_CONTAINER_SUFFIX = 'nginx-proxy';
const DOCKER_NGINX_PROXY_IMAGE = 'nginx:latest';
const DOCKER_NGINX_PROXY_RUNTIME_ROOT = '/apps';
const DOCKER_NGINX_PROXY_CONF_DESTINATION = '/etc/nginx/conf.d/default.conf';

type WritableProxyRuntime = Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>;

export type NginxProxyWriteResult = {
  bundle: EnvProxyNginxBundle;
  status: 'created' | 'updated';
};

type NginxProxyWriteOptions = {
  cdnBaseUrl?: string;
  force?: boolean;
};

export type NginxProxyRuntimeContext = {
  driver: NginxProxyDriver;
  runtimeCliRoot: string;
  upstreamHost: string;
};

export type NginxProxyLifecycleResult = 'started' | 'stopped' | 'restarted' | 'reloaded' | 'already-running' | 'already-stopped';

export type NginxProxyStatus = {
  driver: NginxProxyDriver;
  state: 'running' | 'stopped';
  configFile: string;
  runtimeRoot: string;
  upstreamHost: string;
  nginxBinary?: string;
  containerName?: string;
  image?: string;
};

async function readOptionalTextFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: unknown }).code : undefined;
    if (code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

export function isNginxProxyDriver(value: string): value is NginxProxyDriver {
  return (NGINX_PROXY_DRIVER_OPTIONS as readonly string[]).includes(value);
}

export async function getNginxProxyDriver(): Promise<NginxProxyDriver> {
  const configured = await getCliConfigValue('proxy.nginx-driver');
  return normalizeNginxProxyDriver(configured) ?? DEFAULT_NGINX_PROXY_DRIVER;
}

export async function setNginxProxyDriver(driver: NginxProxyDriver): Promise<NginxProxyDriver> {
  const normalized = await setCliConfigValue('proxy.nginx-driver', driver);
  return normalizeNginxProxyDriver(normalized) ?? DEFAULT_NGINX_PROXY_DRIVER;
}

export async function resolveNginxProxyContainerName(): Promise<string> {
  const prefix = await resolveDockerContainerPrefix();
  return `${prefix}-${DOCKER_NGINX_PROXY_CONTAINER_SUFFIX}`;
}

export function resolveNginxProxyImage(): string {
  return DOCKER_NGINX_PROXY_IMAGE;
}

export function resolveNginxProxyRuntimeRoot(driver: NginxProxyDriver, cliRoot: string): string {
  return driver === 'docker' ? DOCKER_NGINX_PROXY_RUNTIME_ROOT : cliRoot;
}

export function resolveNginxProxyUpstreamHost(driver: NginxProxyDriver): string {
  return driver === 'docker' ? 'host.docker.internal' : '127.0.0.1';
}

export async function resolveNginxProxyRuntimeContext(options?: {
  cliRoot?: string;
}): Promise<NginxProxyRuntimeContext> {
  const driver = await getNginxProxyDriver();
  const cliRoot = String(options?.cliRoot ?? process.env.NB_CLI_ROOT ?? resolveCliHomeRoot()).trim() || resolveCliHomeRoot();

  return {
    driver,
    runtimeCliRoot: resolveNginxProxyRuntimeRoot(driver, cliRoot),
    upstreamHost: resolveNginxProxyUpstreamHost(driver),
  };
}

function buildNginxManagedBlockMissingMessage(appConfigPath: string): string {
  return (
    `The editable nginx app entry config at ${appConfigPath} does not contain the NocoBase managed block. ` +
    'Restore the managed block or delete the file and regenerate the proxy config.'
  );
}

export async function writeNginxProxyBundle(
  runtime: WritableProxyRuntime,
  appEntryOptions: EnvProxyAppEntryOptions,
  runtimeContext: NginxProxyRuntimeContext,
  options?: NginxProxyWriteOptions,
): Promise<NginxProxyWriteResult> {
  const bundle = await buildEnvProxyNginxBundle(runtime, {
    cdnBaseUrl: options?.cdnBaseUrl,
    runtimeCliRoot: runtimeContext.runtimeCliRoot,
    upstreamHost: runtimeContext.upstreamHost,
  });
  return await writeResolvedNginxProxyBundle(bundle, appEntryOptions, options);
}

export async function writeManualNginxProxyBundle(
  input: ManualEnvProxyNginxInput,
  appEntryOptions: EnvProxyAppEntryOptions,
  runtimeContext: NginxProxyRuntimeContext,
  options?: NginxProxyWriteOptions,
): Promise<NginxProxyWriteResult> {
  const bundle = await buildManualEnvProxyNginxBundle(input, {
    cdnBaseUrl: options?.cdnBaseUrl,
    runtimeCliRoot: runtimeContext.runtimeCliRoot,
    upstreamHost: runtimeContext.upstreamHost,
  });
  return await writeResolvedNginxProxyBundle(bundle, appEntryOptions, options);
}

async function writeResolvedNginxProxyBundle(
  bundle: EnvProxyNginxBundle,
  appEntryOptions: EnvProxyAppEntryOptions,
  options?: NginxProxyWriteOptions,
): Promise<NginxProxyWriteResult> {
  const managedConfigBlock = extractManagedNginxConfigBlock(bundle.appConfigContent);
  if (!managedConfigBlock) {
    throw new Error('Failed to render the managed nginx config block.');
  }

  const currentAppConfigContent = await readOptionalTextFile(bundle.appConfigPath);
  let nextAppConfigContent = applyEnvProxyAppEntryOptions(bundle.appConfigContent, 'nginx', appEntryOptions);
  let status: NginxProxyWriteResult['status'] = 'created';

  if (currentAppConfigContent) {
    if (!appConfigHasManagedNginxBlock(currentAppConfigContent) && !options?.force) {
      throw new Error(buildNginxManagedBlockMissingMessage(bundle.appConfigPath));
    }

    nextAppConfigContent = appConfigHasManagedNginxBlock(currentAppConfigContent)
      ? applyEnvProxyAppEntryOptions(
          replaceManagedNginxConfigBlock(currentAppConfigContent, managedConfigBlock),
          'nginx',
          appEntryOptions,
        )
      : applyEnvProxyAppEntryOptions(bundle.appConfigContent, 'nginx', appEntryOptions);
    status = 'updated';
  }

  await Promise.all([mkdir(bundle.entryDir, { recursive: true }), mkdir(bundle.publicDir, { recursive: true })]);
  await Promise.all([
    writeFile(bundle.appConfigPath, nextAppConfigContent, 'utf8'),
    writeFile(bundle.indexV1Path, bundle.indexV1Content, 'utf8'),
    writeFile(bundle.indexV2Path, bundle.indexV2Content, 'utf8'),
    writeFile(bundle.mainConfigPath, bundle.mainConfigContent, 'utf8'),
    syncEnvProxyNginxSnippets(),
  ]);

  return {
    bundle,
    status,
  };
}

export function normalizeProxyListenPort(value?: string): string | undefined {
  const normalized = value?.trim() || undefined;
  if (!normalized || !/^\d+$/.test(normalized)) {
    return undefined;
  }

  const port = Number(normalized);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return undefined;
  }

  return normalized;
}

export function resolveProxyAppEntryOptions(flags: {
  host?: string;
  port?: string;
}): EnvProxyAppEntryOptions {
  return {
    host: flags.host?.trim() || undefined,
    port: normalizeProxyListenPort(flags.port?.trim()),
  };
}

export function formatNginxProxyInfoLines(info: {
  driver: NginxProxyDriver;
  configFile: string;
  snippetsDir: string;
  upstreamHost: string;
  nginxBinary: string;
  runtimeRoot: string;
  containerName: string;
  image: string;
}): string[] {
  const lines = [
    `driver:      ${info.driver}`,
    `configFile:  ${info.configFile}`,
    `snippetsDir: ${info.snippetsDir}`,
    `runtimeRoot: ${info.runtimeRoot}`,
    `upstreamHost:${info.upstreamHost}`,
  ];

  if (info.driver === 'local') {
    lines.push(`nginxBin:    ${info.nginxBinary}`);
  } else {
    lines.push(`container:   ${info.containerName}`);
    lines.push(`image:       ${info.image}`);
  }

  return lines;
}

function parseNginxPidPathFromVersionOutput(output: string): string {
  const match = output.match(/--pid-path=(?:"([^"]+)"|'([^']+)'|([^\s]+))/);
  const pidPath = String(match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();
  if (!pidPath) {
    throw new Error('Failed to detect the nginx pid path from `nginx -V`.');
  }
  return pidPath;
}

async function captureNginxVersionOutput(): Promise<string> {
  let stdout = '';
  let stderr = '';
  await run('nginx', ['-V'], {
    errorName: 'nginx -V',
    stdio: 'pipe',
    onStdout: (chunk) => {
      stdout += chunk;
    },
    onStderr: (chunk) => {
      stderr += chunk;
    },
  });
  return `${stdout}${stderr}`.trim();
}

async function resolveLocalNginxPidPath(): Promise<string> {
  return parseNginxPidPathFromVersionOutput(await captureNginxVersionOutput());
}

async function isLocalNginxRunning(): Promise<boolean> {
  const pidPath = await resolveLocalNginxPidPath();
  const pidText = await readOptionalTextFile(pidPath);
  const pid = Number.parseInt(String(pidText ?? '').trim(), 10);
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function ensureNginxProxyMainConfig(runtimeContext: NginxProxyRuntimeContext): Promise<string> {
  const mainConfigPath = resolveEnvProxyMainOutputPath({ provider: 'nginx' });
  const mainConfigContent = await buildEnvProxyMainConfig({
    provider: 'nginx',
    runtimeCliRoot: runtimeContext.runtimeCliRoot,
  });
  await mkdir(path.dirname(mainConfigPath), { recursive: true });
  await writeFile(mainConfigPath, mainConfigContent, 'utf8');
  await syncEnvProxyNginxSnippets();
  return mainConfigPath;
}

async function startLocalNginxProxy(runtimeContext: NginxProxyRuntimeContext): Promise<NginxProxyLifecycleResult> {
  await ensureNginxProxyMainConfig(runtimeContext);
  await installEnvProxyProvider('nginx', { runtimeCliRoot: runtimeContext.runtimeCliRoot });

  if (await isLocalNginxRunning()) {
    return 'already-running';
  }

  await run('nginx', [], {
    errorName: 'nginx',
    stdio: 'ignore',
  });
  return 'started';
}

async function stopLocalNginxProxy(): Promise<NginxProxyLifecycleResult> {
  if (!(await isLocalNginxRunning())) {
    return 'already-stopped';
  }

  await run('nginx', ['-s', 'stop'], {
    errorName: 'nginx -s stop',
    stdio: 'ignore',
  });
  return 'stopped';
}

async function reloadLocalNginxProxy(runtimeContext: NginxProxyRuntimeContext): Promise<NginxProxyLifecycleResult> {
  await ensureNginxProxyMainConfig(runtimeContext);
  await installEnvProxyProvider('nginx', { runtimeCliRoot: runtimeContext.runtimeCliRoot });

  if (!(await isLocalNginxRunning())) {
    return await startLocalNginxProxy(runtimeContext);
  }

  await reloadEnvProxyProvider('nginx', { runtimeCliRoot: runtimeContext.runtimeCliRoot });
  return 'reloaded';
}

async function ensureDockerNginxProxyContainer(runtimeContext: NginxProxyRuntimeContext): Promise<void> {
  const containerName = await resolveNginxProxyContainerName();
  if (await dockerContainerExists(containerName)) {
    return;
  }

  const hostCliRoot = String(process.env.NB_CLI_ROOT ?? resolveCliHomeRoot()).trim() || resolveCliHomeRoot();
  const mainConfigPath = await ensureNginxProxyMainConfig(runtimeContext);

  await run('docker', [
    'run',
    '-d',
    '--name',
    containerName,
    '--add-host',
    'host.docker.internal:host-gateway',
    '-p',
    '80:80',
    '-v',
    `${hostCliRoot}:${DOCKER_NGINX_PROXY_RUNTIME_ROOT}`,
    '-v',
    `${mainConfigPath}:${DOCKER_NGINX_PROXY_CONF_DESTINATION}:ro`,
    DOCKER_NGINX_PROXY_IMAGE,
  ], {
    errorName: 'docker run',
    stdio: 'ignore',
  });
}

async function startDockerNginxProxy(runtimeContext: NginxProxyRuntimeContext): Promise<NginxProxyLifecycleResult> {
  const containerName = await resolveNginxProxyContainerName();
  await ensureNginxProxyMainConfig(runtimeContext);

  if (await dockerContainerExists(containerName)) {
    const state = await startDockerContainer(containerName, { stdio: 'ignore' });
    return state === 'already-running' ? 'already-running' : 'started';
  }

  await ensureDockerNginxProxyContainer(runtimeContext);
  return 'started';
}

async function stopDockerNginxProxy(): Promise<NginxProxyLifecycleResult> {
  const containerName = await resolveNginxProxyContainerName();
  if (!(await dockerContainerExists(containerName))) {
    return 'already-stopped';
  }
  return await stopDockerContainer(containerName, { stdio: 'ignore' });
}

async function reloadDockerNginxProxy(runtimeContext: NginxProxyRuntimeContext): Promise<NginxProxyLifecycleResult> {
  const containerName = await resolveNginxProxyContainerName();
  await ensureNginxProxyMainConfig(runtimeContext);

  if (!(await dockerContainerIsRunning(containerName))) {
    return await startDockerNginxProxy(runtimeContext);
  }

  await run('docker', ['exec', containerName, 'nginx', '-s', 'reload'], {
    errorName: 'docker exec nginx -s reload',
    stdio: 'ignore',
  });
  return 'reloaded';
}

export async function startNginxProxy(runtimeContext: NginxProxyRuntimeContext): Promise<NginxProxyLifecycleResult> {
  return runtimeContext.driver === 'docker'
    ? await startDockerNginxProxy(runtimeContext)
    : await startLocalNginxProxy(runtimeContext);
}

export async function stopNginxProxy(runtimeContext: NginxProxyRuntimeContext): Promise<NginxProxyLifecycleResult> {
  return runtimeContext.driver === 'docker' ? await stopDockerNginxProxy() : await stopLocalNginxProxy();
}

export async function reloadNginxProxy(runtimeContext: NginxProxyRuntimeContext): Promise<NginxProxyLifecycleResult> {
  return runtimeContext.driver === 'docker'
    ? await reloadDockerNginxProxy(runtimeContext)
    : await reloadLocalNginxProxy(runtimeContext);
}

export async function restartNginxProxy(runtimeContext: NginxProxyRuntimeContext): Promise<NginxProxyLifecycleResult> {
  await stopNginxProxy(runtimeContext);
  await startNginxProxy(runtimeContext);
  return 'restarted';
}

export async function getNginxProxyStatus(runtimeContext: NginxProxyRuntimeContext): Promise<NginxProxyStatus> {
  const configFile = await mapProxyPathFromCliRoot(resolveEnvProxyMainOutputPath({ provider: 'nginx' }), {
    runtimeCliRoot: runtimeContext.runtimeCliRoot,
  });

  if (runtimeContext.driver === 'docker') {
    const containerName = await resolveNginxProxyContainerName();
    return {
      driver: runtimeContext.driver,
      state: (await dockerContainerIsRunning(containerName)) ? 'running' : 'stopped',
      configFile,
      runtimeRoot: runtimeContext.runtimeCliRoot,
      upstreamHost: runtimeContext.upstreamHost,
      containerName,
      image: resolveNginxProxyImage(),
    };
  }

  return {
    driver: runtimeContext.driver,
    state: (await isLocalNginxRunning()) ? 'running' : 'stopped',
    configFile,
    runtimeRoot: runtimeContext.runtimeCliRoot,
    upstreamHost: runtimeContext.upstreamHost,
    nginxBinary: await getCliConfigValue('bin.nginx'),
  };
}

export function formatNginxProxyStatusLines(status: NginxProxyStatus): string[] {
  const lines = [
    `driver: ${status.driver}`,
    `status: ${status.state}`,
    `config: ${status.configFile}`,
  ];

  if (status.driver === 'local') {
    lines.push(`nginx:  ${status.nginxBinary}`);
  } else {
    lines.push(`container: ${status.containerName}`);
    lines.push(`image: ${status.image}`);
  }

  return lines;
}
