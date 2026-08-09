/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';

export type PortalHostSupervisorStatus =
  | 'disabled'
  | 'external'
  | 'stopped'
  | 'starting'
  | 'ready'
  | 'stopping'
  | 'failed';

export type PortalHostDriver = 'disabled' | 'external' | 'node' | 'tsx';

export interface PortalHostSupervisorOptions {
  enabled?: boolean;
  targetUrl?: string;
  portalsDir?: string;
  host?: string;
  port?: number;
  driver?: PortalHostDriver;
  prestart?: boolean;
  startTimeoutMs?: number;
  shutdownTimeoutMs?: number;
  healthPath?: string;
}

export interface PortalHostSupervisorInfo {
  driver: PortalHostDriver;
  status: PortalHostSupervisorStatus;
  targetUrl?: string;
  pid?: number;
  activeLeases: number;
  portalsDir?: string;
  entrypoint?: string;
}

export interface PortalHostLease {
  targetUrl: URL;
  release(): void;
}

interface ManagedChild {
  child: ChildProcessWithoutNullStreams;
  entrypoint?: string;
  port: number;
  targetUrl: URL;
}

interface PortalHostLaunchOptions {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  entrypoint?: string;
}

const DEFAULT_PORTAL_HOST_PORT = 13010;
const DEFAULT_START_TIMEOUT_MS = 30 * 1000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 30 * 1000;
const DEFAULT_HEALTH_PATH = '/__health';
const PORTAL_HOST_CHILD_DENIED_NODE_OPTIONS = ['--preserve-symlinks', '--preserve-symlinks-main'];

export class PortalHostSupervisor {
  private static instance: PortalHostSupervisor | null = null;
  private readonly enabled: boolean;
  private readonly driver: PortalHostDriver;
  private readonly externalUrl?: URL;
  private readonly portalsDir?: string;
  private readonly host: string;
  private readonly configuredPort?: number;
  private readonly startTimeoutMs: number;
  private readonly shutdownTimeoutMs: number;
  private readonly healthPath: string;
  private status: PortalHostSupervisorStatus;
  private managedChild: ManagedChild | null = null;
  private startPromise: Promise<URL> | null = null;
  private stopPromise: Promise<void> | null = null;
  private activeLeases = 0;
  private shuttingDown = false;

  private constructor(options: PortalHostSupervisorOptions = {}) {
    this.enabled = options.enabled ?? process.env.PORTAL_HOST_ENABLED !== 'false';
    this.externalUrl = normalizeUrl(options.targetUrl ?? process.env.PORTAL_HOST_URL);
    this.driver = this.resolveDriver(options);
    this.portalsDir = options.portalsDir ?? process.env.PORTALS_DIR;
    this.host = options.host ?? process.env.PORTAL_HOST_BIND ?? '127.0.0.1';
    this.configuredPort = options.port ?? numberFromEnv('PORTAL_HOST_PORT');
    this.startTimeoutMs =
      options.startTimeoutMs ?? numberFromEnv('PORTAL_HOST_START_TIMEOUT_MS') ?? DEFAULT_START_TIMEOUT_MS;
    this.shutdownTimeoutMs =
      options.shutdownTimeoutMs ?? numberFromEnv('PORTAL_HOST_SHUTDOWN_TIMEOUT_MS') ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
    this.healthPath = options.healthPath ?? process.env.PORTAL_HOST_HEALTH_PATH ?? DEFAULT_HEALTH_PATH;
    this.status = !this.enabled || this.driver === 'disabled' ? 'disabled' : this.externalUrl ? 'external' : 'stopped';

    process.once('SIGINT', () => {
      this.shutdown().catch((error) => {
        console.error('Failed to shutdown portal-host child process', error);
      });
    });
    process.once('SIGTERM', () => {
      this.shutdown().catch((error) => {
        console.error('Failed to shutdown portal-host child process', error);
      });
    });

    if (options.prestart ?? process.env.PORTAL_HOST_PRESTART === 'true') {
      this.ensureStarted().catch((error) => {
        console.error('Failed to prestart portal-host child process', error);
      });
    }
  }

  static getInstance(options: PortalHostSupervisorOptions = {}): PortalHostSupervisor {
    if (!PortalHostSupervisor.instance) {
      PortalHostSupervisor.instance = new PortalHostSupervisor(options);
    }

    return PortalHostSupervisor.instance;
  }

  static resetInstance(): void {
    PortalHostSupervisor.instance = null;
  }

  getStatus(): PortalHostSupervisorStatus {
    return this.status;
  }

  getInfo(): PortalHostSupervisorInfo {
    return {
      driver: this.driver,
      status: this.status,
      targetUrl: this.externalUrl?.toString() ?? this.managedChild?.targetUrl.toString(),
      pid: this.managedChild?.child.pid,
      activeLeases: this.activeLeases,
      portalsDir: this.portalsDir,
      entrypoint: this.managedChild?.entrypoint,
    };
  }

  async acquire(): Promise<PortalHostLease> {
    const targetUrl = await this.ensureStarted();
    this.activeLeases += 1;

    return {
      targetUrl,
      release: () => {
        this.release();
      },
    };
  }

  async ensureStarted(): Promise<URL> {
    if (!this.enabled) {
      throw new Error('Portal host is disabled');
    }

    if (this.externalUrl) {
      return this.externalUrl;
    }

    if (this.managedChild && this.status === 'ready') {
      return this.managedChild.targetUrl;
    }

    if (this.startPromise) {
      return await this.startPromise;
    }

    this.startPromise = this.startManagedChild();
    try {
      return await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  async stop(reason = 'portal-host stopped'): Promise<void> {
    if (this.externalUrl || !this.enabled || !this.managedChild) {
      return;
    }

    if (this.stopPromise) {
      return await this.stopPromise;
    }

    this.stopPromise = this.stopManagedChild(reason);
    try {
      await this.stopPromise;
    } finally {
      this.stopPromise = null;
    }
  }

  async restart(reason = 'portal-host restarted'): Promise<URL> {
    if (this.externalUrl || this.driver === 'external') {
      throw new Error('Portal host is external and cannot be restarted by NocoBase');
    }
    if (!this.enabled || this.driver === 'disabled') {
      throw new Error('Portal host is disabled');
    }

    await this.stop(reason);
    return await this.ensureStarted();
  }

  async shutdown(): Promise<void> {
    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;
    await this.stop('NocoBase shutdown');
  }

  private async startManagedChild(): Promise<URL> {
    if (this.stopPromise) {
      await this.stopPromise;
    }

    this.status = 'starting';
    const port = await this.resolvePort();
    const targetUrl = new URL(`http://${this.host}:${port}`);
    const launchOptions = this.resolveLaunchOptions(port);

    const child = spawn(launchOptions.command, launchOptions.args, {
      cwd: process.cwd(),
      env: launchOptions.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.managedChild = {
      child,
      entrypoint: launchOptions.entrypoint,
      port,
      targetUrl,
    };

    this.pipeChildLogs(child);
    child.once('exit', (code, signal) => {
      const wasStopping = this.status === 'stopping' || this.shuttingDown;
      this.managedChild = null;
      this.status = wasStopping ? 'stopped' : 'failed';
      if (!wasStopping) {
        console.error(`portal-host exited unexpectedly; code=${code ?? 'null'} signal=${signal ?? 'null'}`);
      }
    });

    try {
      await this.waitForReady(targetUrl);
      this.status = 'ready';
      return targetUrl;
    } catch (error) {
      this.status = 'failed';
      await this.stopManagedChild('portal-host failed to start');
      throw error;
    }
  }

  private async stopManagedChild(reason: string): Promise<void> {
    const managed = this.managedChild;
    if (!managed) {
      this.status = this.enabled ? 'stopped' : 'disabled';
      return;
    }

    this.status = 'stopping';
    console.log(`Stopping portal-host child process: ${reason}`);
    const exitPromise = waitForChildExit(managed.child, this.shutdownTimeoutMs);
    managed.child.kill('SIGTERM');

    await exitPromise.catch((error) => {
      console.warn(error.message);
      managed.child.kill('SIGKILL');
    });

    this.managedChild = null;
    this.status = this.enabled ? 'stopped' : 'disabled';
  }

  private release(): void {
    this.activeLeases = Math.max(0, this.activeLeases - 1);
  }

  private resolveDriver(options: PortalHostSupervisorOptions): PortalHostDriver {
    if (!(options.enabled ?? process.env.PORTAL_HOST_ENABLED !== 'false')) {
      return 'disabled';
    }
    if (options.targetUrl ?? process.env.PORTAL_HOST_URL) {
      return 'external';
    }

    const driver = options.driver ?? process.env.PORTAL_HOST_DRIVER ?? 'node';
    return driver === 'tsx' ? 'tsx' : 'node';
  }

  private resolveLaunchOptions(port: number): PortalHostLaunchOptions {
    if (this.driver === 'tsx') {
      return this.resolveTsxLaunchOptions(port);
    }

    return this.resolveNodeLaunchOptions(port);
  }

  private basePortalHostEnv(port: number): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PORT: `${port}`,
      PORTAL_HOST_PORT: `${port}`,
      PORTAL_HOST_BIND: this.host,
      PORTALS_DIR: this.portalsDir,
    };
    const nodeOptions = sanitizePortalHostChildNodeOptions(env.NODE_OPTIONS);

    if (nodeOptions) {
      env.NODE_OPTIONS = nodeOptions;
    } else {
      delete env.NODE_OPTIONS;
    }

    return env;
  }

  private resolveNodeLaunchOptions(port: number): PortalHostLaunchOptions {
    const entrypoint = resolveNodePortalHostEntrypoint();
    if (!entrypoint) {
      this.status = 'failed';
      throw new Error('The portal-host code is not compiled. Please run yarn build first.');
    }

    return {
      command: process.execPath,
      args: [entrypoint],
      env: this.basePortalHostEnv(port),
      entrypoint,
    };
  }

  private resolveTsxLaunchOptions(port: number): PortalHostLaunchOptions {
    const entrypoint = resolveTsxPortalHostEntrypoint();
    const tsxCli = resolveTsxCli();
    if (!entrypoint) {
      this.status = 'failed';
      throw new Error('The portal-host source entrypoint does not exist.');
    }
    if (!tsxCli) {
      this.status = 'failed';
      throw new Error('The tsx runtime is not installed. Please run yarn install first.');
    }

    const tsconfig = process.env.PORTAL_HOST_TSCONFIG ?? process.env.SERVER_TSCONFIG_PATH;
    const args = [tsxCli, 'watch', '--clear-screen=false'];
    if (tsconfig) {
      args.push('--tsconfig', tsconfig);
    }
    args.push('-r', 'tsconfig-paths/register', entrypoint);

    return {
      command: process.execPath,
      args,
      env: {
        ...this.basePortalHostEnv(port),
        NODE_ENV: 'development',
      },
      entrypoint,
    };
  }

  private async resolvePort(): Promise<number> {
    if (this.configuredPort) {
      return this.configuredPort;
    }

    const appPort = numberFromEnv('APP_PORT') ?? DEFAULT_PORTAL_HOST_PORT - 10;
    return await findAvailablePort(appPort + 10, this.host);
  }

  private pipeChildLogs(child: ChildProcessWithoutNullStreams): void {
    child.stdout.on('data', (chunk) => {
      writePrefixedChunk('portal-host', chunk, process.stdout);
    });
    child.stderr.on('data', (chunk) => {
      writePrefixedChunk('portal-host', chunk, process.stderr);
    });
  }

  private async waitForReady(targetUrl: URL): Promise<void> {
    const startedAt = Date.now();
    let lastError: Error | null = null;

    while (Date.now() - startedAt < this.startTimeoutMs) {
      if (!this.managedChild) {
        throw new Error('portal-host child process exited before it became ready');
      }

      try {
        await requestHealth(new URL(this.healthPath, targetUrl));
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        await sleep(250);
      }
    }

    throw new Error(`portal-host did not become ready within ${this.startTimeoutMs}ms: ${lastError?.message ?? ''}`);
  }
}

function resolveNodePortalHostEntrypoint(): string | null {
  const explicit = process.env.PORTAL_HOST_ENTRY;
  if (explicit && existsSync(path.resolve(process.cwd(), explicit))) {
    return path.resolve(process.cwd(), explicit);
  }

  const compiled = path.resolve(__dirname, 'index.js');
  if (existsSync(compiled)) {
    return compiled;
  }

  return null;
}

function resolveTsxPortalHostEntrypoint(): string | null {
  const explicit = process.env.PORTAL_HOST_ENTRY;
  if (explicit && existsSync(path.resolve(process.cwd(), explicit))) {
    return path.resolve(process.cwd(), explicit);
  }

  const source = path.resolve(__dirname, 'index.ts');
  if (existsSync(source)) {
    return source;
  }

  return null;
}

function resolveTsxCli(): string | null {
  const explicit = process.env.PORTAL_HOST_TSX_CLI;
  if (explicit && existsSync(path.resolve(process.cwd(), explicit))) {
    return path.resolve(process.cwd(), explicit);
  }

  try {
    return require.resolve('tsx/dist/cli.mjs', { paths: [process.cwd()] });
  } catch {
    const local = path.resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs');
    return existsSync(local) ? local : null;
  }
}

function normalizeUrl(value?: string): URL | undefined {
  if (!value) {
    return undefined;
  }

  return new URL(value);
}

export function sanitizePortalHostChildNodeOptions(value: unknown): string {
  return String(value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter(
      (option) =>
        !PORTAL_HOST_CHILD_DENIED_NODE_OPTIONS.some(
          (deniedOption) => option === deniedOption || option.startsWith(`${deniedOption}=`),
        ),
    )
    .join(' ');
}

function numberFromEnv(name: string): number | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

async function findAvailablePort(startPort: number, host: string): Promise<number> {
  let port = startPort;
  while (!(await isPortAvailable(port, host))) {
    port += 1;
  }

  return port;
}

function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

function requestHealth(url: URL): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
        return;
      }

      reject(new Error(`health check returned ${res.statusCode ?? 'unknown status'}`));
    });

    req.setTimeout(1000, () => {
      req.destroy(new Error('health check timed out'));
    });
    req.once('error', reject);
  });
}

function waitForChildExit(child: ChildProcessWithoutNullStreams, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`portal-host did not exit within ${timeoutMs}ms`));
    }, timeoutMs);

    const onExit = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      clearTimeout(timer);
      child.off('exit', onExit);
    };

    child.once('exit', onExit);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function writePrefixedChunk(prefix: string, chunk: Buffer, writer: NodeJS.WriteStream): void {
  const text = chunk.toString();
  const lines = text.split(/\r?\n/);
  const hasTrailingNewline = text.endsWith('\n') || text.endsWith('\r');

  lines.forEach((line, index) => {
    if (!line && index === lines.length - 1 && hasTrailingNewline) {
      return;
    }

    writer.write(`[${prefix}] ${line}\n`);
  });
}
