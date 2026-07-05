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
import { loadAuthConfig } from './auth-store.js';
import {
  CADDY_PROXY_DRIVER_OPTIONS,
  DEFAULT_CADDY_PROXY_DRIVER,
  getCliConfigValue,
  normalizeCaddyProxyDriver,
  resolveDockerContainerPrefix,
  setCliConfigValue,
  type CaddyProxyDriver,
} from './cli-config.js';
import { resolveCliHomeRoot } from './cli-home.js';
import {
  applyEnvProxyAppEntryOptions,
  buildManualEnvProxyCaddyBundle,
  buildEnvProxyCaddyBundle,
  buildEnvProxyMainConfig,
  mapProxyPathFromCliRoot,
  resolveEnvProxyMainOutputPath,
  type EnvProxyAppEntryOptions,
  type EnvProxyCaddyBundle,
  type ManualEnvProxyNginxInput,
} from './env-proxy.js';
import { normalizeEnvProxyConfig } from './env-proxy-config.js';
import { commandOutput, run } from './run-npm.js';

const DOCKER_CADDY_PROXY_CONTAINER_SUFFIX = 'caddy-proxy';
const DOCKER_CADDY_PROXY_IMAGE = 'caddy:latest';
const DOCKER_CADDY_PROXY_RUNTIME_ROOT = '/apps';
const DOCKER_CADDY_PROXY_CONF_DESTINATION = '/etc/caddy/Caddyfile';
const DEFAULT_DOCKER_CADDY_PROXY_PUBLISHED_PORTS = [80, 443] as const;

type WritableProxyRuntime = Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>;

export type CaddyProxyWriteResult = {
  bundle: EnvProxyCaddyBundle;
  status: 'created' | 'updated';
};

type CaddyProxyWriteOptions = {
  cdnBaseUrl?: string;
};

export type CaddyProxyRuntimeContext = {
  driver: CaddyProxyDriver;
  runtimeCliRoot: string;
  upstreamHost: string;
};

export type CaddyProxyLifecycleResult = 'started' | 'stopped' | 'restarted' | 'reloaded' | 'already-running' | 'already-stopped';

export type CaddyProxyStatus = {
  driver: CaddyProxyDriver;
  state: 'running' | 'stopped';
  configFile: string;
  runtimeRoot: string;
  upstreamHost: string;
  caddyBinary?: string;
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

export function isCaddyProxyDriver(value: string): value is CaddyProxyDriver {
  return (CADDY_PROXY_DRIVER_OPTIONS as readonly string[]).includes(value);
}

export async function getCaddyProxyDriver(): Promise<CaddyProxyDriver> {
  const configured = await getCliConfigValue('proxy.caddy-driver');
  return normalizeCaddyProxyDriver(configured) ?? DEFAULT_CADDY_PROXY_DRIVER;
}

export async function setCaddyProxyDriver(driver: CaddyProxyDriver): Promise<CaddyProxyDriver> {
  const normalized = await setCliConfigValue('proxy.caddy-driver', driver);
  return normalizeCaddyProxyDriver(normalized) ?? DEFAULT_CADDY_PROXY_DRIVER;
}

export async function resolveCaddyProxyContainerName(): Promise<string> {
  const prefix = await resolveDockerContainerPrefix();
  return `${prefix}-${DOCKER_CADDY_PROXY_CONTAINER_SUFFIX}`;
}

export function resolveCaddyProxyImage(): string {
  return DOCKER_CADDY_PROXY_IMAGE;
}

export function resolveCaddyProxyRuntimeRoot(driver: CaddyProxyDriver, cliRoot: string): string {
  return driver === 'docker' ? DOCKER_CADDY_PROXY_RUNTIME_ROOT : cliRoot;
}

export function resolveCaddyProxyUpstreamHost(driver: CaddyProxyDriver): string {
  return driver === 'docker' ? 'host.docker.internal' : '127.0.0.1';
}

export async function resolveCaddyProxyRuntimeContext(options?: {
  cliRoot?: string;
}): Promise<CaddyProxyRuntimeContext> {
  const driver = await getCaddyProxyDriver();
  const cliRoot = String(options?.cliRoot ?? process.env.NB_CLI_ROOT ?? resolveCliHomeRoot()).trim() || resolveCliHomeRoot();

  return {
    driver,
    runtimeCliRoot: resolveCaddyProxyRuntimeRoot(driver, cliRoot),
    upstreamHost: resolveCaddyProxyUpstreamHost(driver),
  };
}

export async function writeCaddyProxyBundle(
  runtime: WritableProxyRuntime,
  appEntryOptions: EnvProxyAppEntryOptions,
  runtimeContext: CaddyProxyRuntimeContext,
  options?: CaddyProxyWriteOptions,
): Promise<CaddyProxyWriteResult> {
  const bundle = await buildEnvProxyCaddyBundle(runtime, {
    cdnBaseUrl: options?.cdnBaseUrl,
    runtimeCliRoot: runtimeContext.runtimeCliRoot,
    upstreamHost: runtimeContext.upstreamHost,
  });
  const currentAppConfigContent = await readOptionalTextFile(bundle.appConfigPath);
  const nextAppConfigContent = applyEnvProxyAppEntryOptions(bundle.appConfigContent, 'caddy', appEntryOptions);
  const status: CaddyProxyWriteResult['status'] = currentAppConfigContent ? 'updated' : 'created';

  await Promise.all([mkdir(bundle.entryDir, { recursive: true }), mkdir(bundle.publicDir, { recursive: true })]);
  await Promise.all([
    writeFile(bundle.appConfigPath, nextAppConfigContent, 'utf8'),
    writeFile(bundle.indexV1Path, bundle.indexV1Content, 'utf8'),
    writeFile(bundle.indexV2Path, bundle.indexV2Content, 'utf8'),
    writeFile(bundle.mainConfigPath, bundle.mainConfigContent, 'utf8'),
  ]);

  return {
    bundle,
    status,
  };
}

export async function writeManualCaddyProxyBundle(
  input: ManualEnvProxyNginxInput,
  appEntryOptions: EnvProxyAppEntryOptions,
  runtimeContext: CaddyProxyRuntimeContext,
  options?: CaddyProxyWriteOptions,
): Promise<CaddyProxyWriteResult> {
  const bundle = await buildManualEnvProxyCaddyBundle(input, {
    cdnBaseUrl: options?.cdnBaseUrl,
    runtimeCliRoot: runtimeContext.runtimeCliRoot,
    upstreamHost: input.upstreamHost || runtimeContext.upstreamHost,
  });
  const currentAppConfigContent = await readOptionalTextFile(bundle.appConfigPath);
  const nextAppConfigContent = applyEnvProxyAppEntryOptions(bundle.appConfigContent, 'caddy', appEntryOptions);
  const status: CaddyProxyWriteResult['status'] = currentAppConfigContent ? 'updated' : 'created';

  await Promise.all([mkdir(bundle.entryDir, { recursive: true }), mkdir(bundle.publicDir, { recursive: true })]);
  await Promise.all([
    writeFile(bundle.appConfigPath, nextAppConfigContent, 'utf8'),
    writeFile(bundle.indexV1Path, bundle.indexV1Content, 'utf8'),
    writeFile(bundle.indexV2Path, bundle.indexV2Content, 'utf8'),
    writeFile(bundle.mainConfigPath, bundle.mainConfigContent, 'utf8'),
  ]);

  return {
    bundle,
    status,
  };
}

function resolveLocalCaddyPidFilePath(): string {
  return path.join(path.dirname(resolveEnvProxyMainOutputPath({ provider: 'caddy' })), 'caddy.pid');
}

async function isLocalCaddyRunning(): Promise<boolean> {
  const pidText = await readOptionalTextFile(resolveLocalCaddyPidFilePath());
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

async function ensureCaddyProxyMainConfig(runtimeContext: CaddyProxyRuntimeContext): Promise<string> {
  const mainConfigPath = resolveEnvProxyMainOutputPath({ provider: 'caddy' });
  const mainConfigContent = await buildEnvProxyMainConfig({
    provider: 'caddy',
    runtimeCliRoot: runtimeContext.runtimeCliRoot,
  });
  await mkdir(path.dirname(mainConfigPath), { recursive: true });
  await writeFile(mainConfigPath, mainConfigContent, 'utf8');
  return mainConfigPath;
}

async function startLocalCaddyProxy(runtimeContext: CaddyProxyRuntimeContext): Promise<CaddyProxyLifecycleResult> {
  const mainConfigPath = await ensureCaddyProxyMainConfig(runtimeContext);
  const pidFilePath = resolveLocalCaddyPidFilePath();

  if (await isLocalCaddyRunning()) {
    return 'already-running';
  }

  await run(
    'caddy',
    ['start', '--config', mainConfigPath, '--adapter', 'caddyfile', '--pidfile', pidFilePath],
    {
      errorName: 'caddy start',
      stdio: 'ignore',
    },
  );
  return 'started';
}

async function stopLocalCaddyProxy(): Promise<CaddyProxyLifecycleResult> {
  const pidFilePath = resolveLocalCaddyPidFilePath();
  const pidText = await readOptionalTextFile(pidFilePath);
  const pid = Number.parseInt(String(pidText ?? '').trim(), 10);
  if (!Number.isInteger(pid) || pid <= 0) {
    return 'already-stopped';
  }

  try {
    process.kill(pid, 'SIGTERM');
    return 'stopped';
  } catch {
    return 'already-stopped';
  }
}

async function reloadLocalCaddyProxy(runtimeContext: CaddyProxyRuntimeContext): Promise<CaddyProxyLifecycleResult> {
  const mainConfigPath = await ensureCaddyProxyMainConfig(runtimeContext);
  if (!(await isLocalCaddyRunning())) {
    return await startLocalCaddyProxy(runtimeContext);
  }

  await run('caddy', ['reload', '--config', mainConfigPath, '--adapter', 'caddyfile'], {
    errorName: 'caddy reload',
    stdio: 'ignore',
  });
  return 'reloaded';
}

async function ensureDockerCaddyProxyContainer(runtimeContext: CaddyProxyRuntimeContext): Promise<void> {
  const containerName = await resolveCaddyProxyContainerName();
  const mainConfigPath = await ensureCaddyProxyMainConfig(runtimeContext);
  const publishedPorts = await resolveDockerCaddyPublishedPorts();
  if (await dockerContainerExists(containerName)) {
    if (await dockerCaddyProxyContainerMatchesPublishedPorts(containerName, publishedPorts)) {
      return;
    }

    await removeDockerCaddyProxyContainer(containerName);
  }

  const hostCliRoot = String(process.env.NB_CLI_ROOT ?? resolveCliHomeRoot()).trim() || resolveCliHomeRoot();
  const dockerPortArgs = publishedPorts.flatMap((port) => ['-p', `${port}:${port}`]);

  await run(
    'docker',
    [
      'run',
      '-d',
      '--name',
      containerName,
      '--add-host',
      'host.docker.internal:host-gateway',
      ...dockerPortArgs,
      '-v',
      `${hostCliRoot}:${DOCKER_CADDY_PROXY_RUNTIME_ROOT}`,
      '-v',
      `${mainConfigPath}:${DOCKER_CADDY_PROXY_CONF_DESTINATION}:ro`,
      DOCKER_CADDY_PROXY_IMAGE,
    ],
    {
      errorName: 'docker run',
      stdio: 'ignore',
    },
  );
}

async function resolveDockerCaddyPublishedPorts(): Promise<number[]> {
  const config = await loadAuthConfig();
  const ports = new Set<number>(DEFAULT_DOCKER_CADDY_PROXY_PUBLISHED_PORTS);

  for (const envConfig of Object.values(config.envs)) {
    const port = normalizeEnvProxyConfig(envConfig.proxy)?.port;
    if (port !== undefined) {
      ports.add(port);
    }
  }

  return Array.from(ports).sort((left, right) => left - right);
}

async function readDockerCaddyPublishedPorts(containerName: string): Promise<number[]> {
  const output = await commandOutput(
    'docker',
    ['inspect', '--format', '{{json .HostConfig.PortBindings}}', containerName],
    { errorName: 'docker inspect' },
  );
  const parsed = JSON.parse(output.trim() || '{}') as Record<string, Array<{ HostPort?: string }> | null>;
  const ports = new Set<number>();

  for (const bindings of Object.values(parsed)) {
    if (!Array.isArray(bindings)) {
      continue;
    }

    for (const binding of bindings) {
      const port = Number.parseInt(String(binding?.HostPort ?? '').trim(), 10);
      if (Number.isInteger(port) && port > 0) {
        ports.add(port);
      }
    }
  }

  return Array.from(ports).sort((left, right) => left - right);
}

async function dockerCaddyProxyContainerMatchesPublishedPorts(
  containerName: string,
  expectedPorts: number[],
): Promise<boolean> {
  const currentPorts = await readDockerCaddyPublishedPorts(containerName);
  return currentPorts.length === expectedPorts.length && currentPorts.every((port, index) => port === expectedPorts[index]);
}

async function removeDockerCaddyProxyContainer(containerName: string): Promise<void> {
  await run('docker', ['rm', '-f', containerName], {
    errorName: 'docker rm',
    stdio: 'ignore',
  });
}

async function startDockerCaddyProxy(runtimeContext: CaddyProxyRuntimeContext): Promise<CaddyProxyLifecycleResult> {
  const containerName = await resolveCaddyProxyContainerName();
  await ensureCaddyProxyMainConfig(runtimeContext);
  const existedBeforeEnsure = await dockerContainerExists(containerName);
  await ensureDockerCaddyProxyContainer(runtimeContext);

  if (existedBeforeEnsure && (await dockerContainerExists(containerName))) {
    const state = await startDockerContainer(containerName, { stdio: 'ignore' });
    return state === 'already-running' ? 'already-running' : 'started';
  }

  return 'started';
}

async function stopDockerCaddyProxy(): Promise<CaddyProxyLifecycleResult> {
  const containerName = await resolveCaddyProxyContainerName();
  if (!(await dockerContainerExists(containerName))) {
    return 'already-stopped';
  }
  return await stopDockerContainer(containerName, { stdio: 'ignore' });
}

async function reloadDockerCaddyProxy(runtimeContext: CaddyProxyRuntimeContext): Promise<CaddyProxyLifecycleResult> {
  const containerName = await resolveCaddyProxyContainerName();
  await ensureCaddyProxyMainConfig(runtimeContext);

  if (!(await dockerContainerIsRunning(containerName))) {
    return await startDockerCaddyProxy(runtimeContext);
  }

  await run('docker', ['exec', containerName, 'caddy', 'reload', '--config', DOCKER_CADDY_PROXY_CONF_DESTINATION, '--adapter', 'caddyfile'], {
    errorName: 'docker exec caddy reload',
    stdio: 'ignore',
  });
  return 'reloaded';
}

export async function startCaddyProxy(runtimeContext: CaddyProxyRuntimeContext): Promise<CaddyProxyLifecycleResult> {
  return runtimeContext.driver === 'docker'
    ? await startDockerCaddyProxy(runtimeContext)
    : await startLocalCaddyProxy(runtimeContext);
}

export async function stopCaddyProxy(runtimeContext: CaddyProxyRuntimeContext): Promise<CaddyProxyLifecycleResult> {
  return runtimeContext.driver === 'docker' ? await stopDockerCaddyProxy() : await stopLocalCaddyProxy();
}

export async function reloadCaddyProxy(runtimeContext: CaddyProxyRuntimeContext): Promise<CaddyProxyLifecycleResult> {
  return runtimeContext.driver === 'docker'
    ? await reloadDockerCaddyProxy(runtimeContext)
    : await reloadLocalCaddyProxy(runtimeContext);
}

export async function restartCaddyProxy(runtimeContext: CaddyProxyRuntimeContext): Promise<CaddyProxyLifecycleResult> {
  await stopCaddyProxy(runtimeContext);
  await startCaddyProxy(runtimeContext);
  return 'restarted';
}

export async function getCaddyProxyStatus(runtimeContext: CaddyProxyRuntimeContext): Promise<CaddyProxyStatus> {
  const configFile = await mapProxyPathFromCliRoot(resolveEnvProxyMainOutputPath({ provider: 'caddy' }), {
    runtimeCliRoot: runtimeContext.runtimeCliRoot,
  });

  if (runtimeContext.driver === 'docker') {
    const containerName = await resolveCaddyProxyContainerName();
    return {
      driver: runtimeContext.driver,
      state: (await dockerContainerIsRunning(containerName)) ? 'running' : 'stopped',
      configFile,
      runtimeRoot: runtimeContext.runtimeCliRoot,
      upstreamHost: runtimeContext.upstreamHost,
      containerName,
      image: resolveCaddyProxyImage(),
    };
  }

  return {
    driver: runtimeContext.driver,
    state: (await isLocalCaddyRunning()) ? 'running' : 'stopped',
    configFile,
    runtimeRoot: runtimeContext.runtimeCliRoot,
    upstreamHost: runtimeContext.upstreamHost,
    caddyBinary: await getCliConfigValue('bin.caddy'),
  };
}

export function formatCaddyProxyInfoLines(info: {
  driver: CaddyProxyDriver;
  configFile: string;
  upstreamHost: string;
  caddyBinary: string;
  runtimeRoot: string;
  containerName: string;
  image: string;
}): string[] {
  const lines = [
    `driver:      ${info.driver}`,
    `configFile:  ${info.configFile}`,
    `runtimeRoot: ${info.runtimeRoot}`,
    `upstreamHost:${info.upstreamHost}`,
  ];

  if (info.driver === 'local') {
    lines.push(`caddyBin:    ${info.caddyBinary}`);
  } else {
    lines.push(`container:   ${info.containerName}`);
    lines.push(`image:       ${info.image}`);
  }

  return lines;
}

export function formatCaddyProxyStatusLines(status: CaddyProxyStatus): string[] {
  const lines = [`driver: ${status.driver}`, `status: ${status.state}`, `config: ${status.configFile}`];

  if (status.driver === 'local') {
    lines.push(`caddy:  ${status.caddyBinary}`);
  } else {
    lines.push(`container: ${status.containerName}`);
    lines.push(`image: ${status.image}`);
  }

  return lines;
}
