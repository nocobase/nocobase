import { captureChildOutput } from './child-output.js';
import { createDiagnosticLogger, type Logger } from '@nocobase/logging';
import type { DeploymentLogListener } from './deployment-log.js';
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAppHostMode, type AppHostMode } from './host-mode.ts';
import {
  IpcHostManagementClient,
  type ApplyDeploymentSetResult,
  type HostDeploymentSpec,
  type HostDeploymentSet,
  type HostManagementService,
  type HostStatus,
} from './management/index.ts';

export type AppHostSupervisorStatus =
  | 'disabled'
  | 'external'
  | 'stopped'
  | 'starting'
  | 'ready'
  | 'stopping'
  | 'failed';

export type AppHostDriver = 'disabled' | 'external' | 'node' | 'tsx';

export interface AppHostSupervisorOptions {
  logger?: Logger;
  mode?: AppHostMode;
  enabled?: boolean;
  targetUrl?: string;
  appRevisionsDir?: string;
  appVolumesDir?: string;
  configPath?: string;
  childOutputDir?: string;
  host?: string;
  port?: number;
  /** Match the loaded package's source or compiled entrypoint with `auto`. */
  driver?: AppHostDriver | 'auto';
  prestart?: boolean;
  startTimeoutMs?: number;
  ipcTimeoutMs?: number;
  shutdownTimeoutMs?: number;
  healthPath?: string;
  autoRestart?: boolean;
  maxAutomaticRestarts?: number;
  automaticRestartWindowMs?: number;
  automaticRestartBaseDelayMs?: number;
  entrypoint?: string;
  tsxCli?: string;
  tsconfig?: string;
  /**
   * The environment the Host child starts with. Omitted, the child inherits this process's whole environment. With
   * `allow`, it receives only the listed variables (plus `APP_HOST_CHILD_BASE_ENV` and the Host's own settings), so
   * Apps running inside the Host cannot read this process's secrets from `process.env`.
   */
  env?: {
    allow?: readonly string[];
    set?: Readonly<Record<string, string>>;
  };
  /** Runs the Host child as this user and group; needs the privilege to switch users (root or CAP_SETUID/SETGID). */
  uid?: number;
  gid?: number;
  /**
   * A command the Host child is started through, such as `['setpriv', '--reuid=preview', '--']` or
   * `['sandbox-exec', '-f', 'host.sb']`; the Node command and its arguments follow it.
   */
  launchPrefix?: readonly string[];
}

/** Variables an allow-listed Host child always keeps: what Node and child tools need to run, nothing secret. */
export const APP_HOST_CHILD_BASE_ENV: readonly string[] = [
  'PATH',
  'HOME',
  'TMPDIR',
  'TZ',
  'LANG',
  'LC_ALL',
  'NODE_ENV',
  'NODE_OPTIONS',
  'FORCE_COLOR',
  'NO_COLOR',
];

/** Selects the variables of `source` an allow-listed Host child may see; without `allow`, the whole environment. */
export function selectAppHostChildEnv(
  source: NodeJS.ProcessEnv,
  options?: AppHostSupervisorOptions['env'],
): NodeJS.ProcessEnv {
  if (!options?.allow) return { ...source, ...options?.set };
  const allowed = new Set([...APP_HOST_CHILD_BASE_ENV, ...options.allow]);
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(source)) {
    if (allowed.has(key) && value !== undefined) env[key] = value;
  }
  return { ...env, ...options.set };
}

export interface AppHostSupervisorInfo {
  mode: AppHostMode;
  driver: AppHostDriver;
  status: AppHostSupervisorStatus;
  targetUrl?: string;
  pid?: number;
  activeLeases: number;
  appRevisionsDir?: string;
  appVolumesDir?: string;
  configPath?: string;
  childOutputDir?: string;
  entrypoint?: string;
}

export interface AppHostLease {
  targetUrl: URL;
  release(): void;
}

interface ManagedChild {
  child: ChildProcess;
  management?: IpcHostManagementClient;
  entrypoint?: string;
  port: number;
  targetUrl: URL;
}

interface AppHostLaunchOptions {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  entrypoint?: string;
}

const DEFAULT_APP_HOST_PORT = 13010;
const DEFAULT_START_TIMEOUT_MS = 30 * 1000;
const DEFAULT_IPC_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 30 * 1000;
const DEFAULT_HEALTH_PATH = '/__live';
const DEFAULT_MAX_AUTOMATIC_RESTARTS = 5;
const DEFAULT_AUTOMATIC_RESTART_WINDOW_MS = 60_000;
const DEFAULT_AUTOMATIC_RESTART_BASE_DELAY_MS = 250;
const MAX_TCP_PORT = 65_535;
const APP_HOST_CHILD_DENIED_NODE_OPTIONS = [
  '--preserve-symlinks',
  '--preserve-symlinks-main',
];
const currentDir = path.dirname(fileURLToPath(import.meta.url));

export class AppHostSupervisor {
  private diagnostic = createDiagnosticLogger();
  private static instance: AppHostSupervisor | null = null;
  private readonly enabled: boolean;
  private readonly mode: AppHostMode;
  private readonly driver: AppHostDriver;
  private readonly externalUrl?: URL;
  private readonly appRevisionsDir?: string;
  private readonly appVolumesDir?: string;
  private readonly configPath?: string;
  private readonly childOutputDir?: string;
  private readonly host: string;
  private readonly configuredPort?: number;
  private readonly startTimeoutMs: number;
  private readonly ipcTimeoutMs: number;
  private readonly shutdownTimeoutMs: number;
  private readonly healthPath: string;
  private readonly autoRestart: boolean;
  private readonly maxAutomaticRestarts: number;
  private readonly automaticRestartWindowMs: number;
  private readonly automaticRestartBaseDelayMs: number;
  private readonly entrypoint?: string;
  private readonly tsxCli?: string;
  private readonly tsconfig?: string;
  private readonly envOptions?: AppHostSupervisorOptions['env'];
  private readonly uid?: number;
  private readonly gid?: number;
  private readonly launchPrefix: readonly string[];
  private status: AppHostSupervisorStatus;
  private managedChild: ManagedChild | null = null;
  private startPromise: Promise<URL> | null = null;
  private stopPromise: Promise<void> | null = null;
  private activeLeases = 0;
  private shuttingDown = false;
  private shutdownPromise: Promise<void> | null = null;
  private session: string | null = null;
  private readonly readyListeners = new Set<() => void>();
  private automaticRestartTimer: NodeJS.Timeout | null = null;
  private automaticRestartAttempts: number[] = [];
  private readonly handleShutdownSignal: () => void = () => {
    this.shutdown().catch((error: unknown) => {
      this.diagnostic.error('Failed to shutdown app-host child process', error);
    });
  };

  private constructor(options: AppHostSupervisorOptions = {}) {
    this.diagnostic = createDiagnosticLogger(options.logger);
    this.mode = resolveAppHostMode(options.mode);
    this.enabled = options.enabled ?? true;
    this.externalUrl = normalizeUrl(options.targetUrl);
    this.driver = this.resolveDriver(options);
    this.appRevisionsDir = options.appRevisionsDir;
    this.appVolumesDir = options.appVolumesDir;
    this.configPath = options.configPath;
    this.childOutputDir = options.childOutputDir;
    this.host = options.host ?? '127.0.0.1';
    this.configuredPort = options.port;
    this.entrypoint = options.entrypoint;
    this.tsxCli = options.tsxCli;
    this.tsconfig = options.tsconfig;
    this.envOptions = options.env;
    this.uid = options.uid;
    this.gid = options.gid;
    this.launchPrefix = options.launchPrefix ?? [];
    this.startTimeoutMs = options.startTimeoutMs ?? DEFAULT_START_TIMEOUT_MS;
    this.ipcTimeoutMs = options.ipcTimeoutMs ?? DEFAULT_IPC_TIMEOUT_MS;
    this.shutdownTimeoutMs =
      options.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
    this.healthPath = options.healthPath ?? DEFAULT_HEALTH_PATH;
    this.autoRestart = options.autoRestart ?? true;
    this.maxAutomaticRestarts =
      options.maxAutomaticRestarts ?? DEFAULT_MAX_AUTOMATIC_RESTARTS;
    this.automaticRestartWindowMs =
      options.automaticRestartWindowMs ?? DEFAULT_AUTOMATIC_RESTART_WINDOW_MS;
    this.automaticRestartBaseDelayMs =
      options.automaticRestartBaseDelayMs ??
      DEFAULT_AUTOMATIC_RESTART_BASE_DELAY_MS;
    this.status =
      !this.enabled || this.driver === 'disabled'
        ? 'disabled'
        : this.externalUrl
          ? 'external'
          : 'stopped';

    process.once('SIGINT', this.handleShutdownSignal);
    process.once('SIGTERM', this.handleShutdownSignal);

    if (options.prestart) {
      this.ensureStarted().catch((error) => {
        this.diagnostic.error(
          'Failed to prestart app-host child process',
          error,
        );
      });
    }
  }

  static initialize(options: AppHostSupervisorOptions = {}): AppHostSupervisor {
    if (AppHostSupervisor.instance) {
      throw new Error('AppHostSupervisor is already initialized');
    }
    AppHostSupervisor.instance = new AppHostSupervisor(options);
    return AppHostSupervisor.instance;
  }

  /**
   * A supervisor of its own, beside the process-wide one `initialize` sets up: for a second Host child, such as one
   * running an external-service backend apart from the Host that runs in-process Apps.
   */
  static create(options: AppHostSupervisorOptions = {}): AppHostSupervisor {
    return new AppHostSupervisor(options);
  }

  static getInstance(): AppHostSupervisor {
    if (!AppHostSupervisor.instance) {
      throw new Error('AppHostSupervisor is not initialized');
    }
    return AppHostSupervisor.instance;
  }

  getStatus(): AppHostSupervisorStatus {
    return this.status;
  }

  getInfo(): AppHostSupervisorInfo {
    return {
      mode: this.mode,
      driver: this.driver,
      status: this.status,
      targetUrl:
        this.externalUrl?.toString() ?? this.managedChild?.targetUrl.toString(),
      pid: this.managedChild?.child.pid,
      activeLeases: this.activeLeases,
      appRevisionsDir: this.appRevisionsDir,
      appVolumesDir: this.appVolumesDir,
      configPath: this.configPath,
      entrypoint: this.managedChild?.entrypoint,
    };
  }

  async acquire(): Promise<AppHostLease> {
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
    if (this.shuttingDown) {
      throw new Error('App host supervisor is shut down');
    }
    if (!this.enabled) {
      throw new Error('App host is disabled');
    }

    if (this.externalUrl) {
      return this.externalUrl;
    }

    this.clearAutomaticRestartTimer();

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

  async stop(reason = 'app-host stopped'): Promise<void> {
    this.clearAutomaticRestartTimer();
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

  async restart(reason = 'app-host restarted'): Promise<URL> {
    if (this.externalUrl || this.driver === 'external') {
      throw new Error(
        'App host is external and cannot be restarted by the supervisor',
      );
    }
    if (!this.enabled || this.driver === 'disabled') {
      throw new Error('App host is disabled');
    }

    await this.stop(reason);
    return await this.ensureStarted();
  }

  onReady(listener: () => void): () => void {
    this.readyListeners.add(listener);
    return () => {
      this.readyListeners.delete(listener);
    };
  }

  async applyDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult> {
    return (await this.getManagementClient()).applyDeploymentSet(deploymentSet);
  }

  async restoreDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult> {
    return (await this.getManagementClient()).restoreDeploymentSet(
      deploymentSet,
    );
  }

  async applyDeployment(
    deployment: HostDeploymentSpec,
    listener?: DeploymentLogListener,
  ): Promise<HostStatus> {
    return (await this.getManagementClient()).applyDeployment(
      deployment,
      listener,
    );
  }

  async startDeployment(deployment: HostDeploymentSpec): Promise<HostStatus> {
    return (await this.getManagementClient()).startDeployment(deployment);
  }

  async stopDeployment(appId: string): Promise<HostStatus> {
    return (await this.getManagementClient()).stopDeployment(appId);
  }

  async removeDeployment(appId: string): Promise<HostStatus> {
    return (await this.getManagementClient()).removeDeployment(appId);
  }

  async getManagementClient(): Promise<HostManagementService> {
    if (this.mode !== 'managed') {
      throw new Error('App host management client requires managed mode');
    }
    if (this.externalUrl) {
      throw new Error('Remote app host management transport is not configured');
    }
    await this.ensureStarted();
    const client = this.managedChild?.management;
    if (!client) {
      throw new Error('App host IPC management client is not available');
    }
    return client;
  }

  shutdown(): Promise<void> {
    if (this.shutdownPromise) return this.shutdownPromise;
    this.shuttingDown = true;
    process.off('SIGINT', this.handleShutdownSignal);
    process.off('SIGTERM', this.handleShutdownSignal);
    this.shutdownPromise = this.stop('App host supervisor shutdown').then(
      () => {
        if (AppHostSupervisor.instance === this)
          AppHostSupervisor.instance = null;
      },
    );
    return this.shutdownPromise;
  }

  private async startManagedChild(): Promise<URL> {
    if (this.stopPromise) {
      await this.stopPromise;
    }

    this.status = 'starting';
    const port = await this.resolvePort();
    if (this.shuttingDown) {
      this.status = 'stopped';
      throw new Error('App host supervisor is shut down');
    }
    const targetUrl = new URL(`http://${this.host}:${port}`);
    this.session = this.mode === 'managed' ? randomUUID() : null;
    const launchOptions = this.resolveLaunchOptions(port);

    const [command, ...prefixArgs] = [
      ...this.launchPrefix,
      launchOptions.command,
    ];
    let child: ChildProcess;
    try {
      child = spawn(command, [...prefixArgs, ...launchOptions.args], {
        cwd: process.cwd(),
        env: launchOptions.env,
        ...(this.uid !== undefined ? { uid: this.uid } : {}),
        ...(this.gid !== undefined ? { gid: this.gid } : {}),
        stdio:
          this.mode === 'managed'
            ? ['ignore', 'pipe', 'pipe', 'ipc']
            : ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      // Switching user without the privilege to do so fails synchronously (EPERM).
      this.status = 'failed';
      throw new Error(
        `app-host child process could not be started: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }

    const management =
      this.mode === 'managed' && this.session
        ? new IpcHostManagementClient(child, {
            session: this.session,
            timeoutMs: this.ipcTimeoutMs,
          })
        : undefined;

    this.managedChild = {
      child,
      management,
      entrypoint: launchOptions.entrypoint,
      port,
      targetUrl,
    };

    this.pipeChildLogs(child);
    // A child that cannot be started (missing launch command, no privilege to switch user) reports an error instead
    // of exiting; unhandled, that error would end this process.
    child.once('error', (error) => {
      this.diagnostic.error('app-host child process could not start', error);
      if (this.managedChild?.child === child) this.managedChild = null;
    });
    child.once('exit', (code, signal) => {
      const wasStopping = this.status === 'stopping' || this.shuttingDown;
      const wasReady = this.status === 'ready';
      this.managedChild = null;
      this.status = wasStopping ? 'stopped' : 'failed';
      if (!wasStopping) {
        this.diagnostic.error(
          `app-host exited unexpectedly; code=${code ?? 'null'} signal=${signal ?? 'null'}`,
        );
        if (wasReady) {
          this.scheduleAutomaticRestart();
        }
      }
    });

    try {
      await this.waitForReady(targetUrl);
      this.status = 'ready';
      for (const listener of this.readyListeners) {
        try {
          listener();
        } catch (error) {
          this.diagnostic.error('App host ready listener failed', error);
        }
      }
      return targetUrl;
    } catch (error) {
      this.status = 'failed';
      await this.stopManagedChild('app-host failed to start');
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
    this.diagnostic.info(`Stopping app-host child process: ${reason}`);
    const exitPromise = waitForChildExit(managed.child, this.shutdownTimeoutMs);
    managed.child.kill('SIGTERM');

    await exitPromise.catch((error: unknown) => {
      this.diagnostic.warn(
        error instanceof Error ? error.message : String(error),
      );
      managed.child.kill('SIGKILL');
    });

    this.managedChild = null;
    this.session = null;
    this.status = this.enabled ? 'stopped' : 'disabled';
  }

  private scheduleAutomaticRestart(): void {
    if (
      !this.autoRestart ||
      this.mode !== 'managed' ||
      this.externalUrl ||
      this.shuttingDown ||
      this.automaticRestartTimer
    ) {
      return;
    }
    const now = Date.now();
    this.automaticRestartAttempts = this.automaticRestartAttempts.filter(
      (attemptedAt) => now - attemptedAt < this.automaticRestartWindowMs,
    );
    if (this.automaticRestartAttempts.length >= this.maxAutomaticRestarts) {
      this.diagnostic.error(
        `app-host automatic restart limit reached (${this.maxAutomaticRestarts} attempts in ${this.automaticRestartWindowMs}ms)`,
      );
      return;
    }
    const attempt = this.automaticRestartAttempts.length + 1;
    this.automaticRestartAttempts.push(now);
    const delay = Math.min(
      this.automaticRestartBaseDelayMs * 2 ** (attempt - 1),
      10_000,
    );
    this.diagnostic.warn(
      `Restarting app-host automatically in ${delay}ms (attempt ${attempt}/${this.maxAutomaticRestarts})`,
    );
    this.automaticRestartTimer = setTimeout(() => {
      this.automaticRestartTimer = null;
      this.ensureStarted().catch((error: unknown) => {
        this.diagnostic.error(
          'Failed to restart app-host automatically',
          error,
        );
        this.scheduleAutomaticRestart();
      });
    }, delay);
    this.automaticRestartTimer.unref?.();
  }

  private clearAutomaticRestartTimer(): void {
    if (!this.automaticRestartTimer) {
      return;
    }
    clearTimeout(this.automaticRestartTimer);
    this.automaticRestartTimer = null;
  }

  private release(): void {
    this.activeLeases = Math.max(0, this.activeLeases - 1);
  }

  private resolveDriver(options: AppHostSupervisorOptions): AppHostDriver {
    if (!this.enabled || options.driver === 'disabled') {
      return 'disabled';
    }
    if (this.externalUrl) {
      return 'external';
    }

    const driver = options.driver ?? 'node';
    if (driver === 'auto') {
      return path.extname(fileURLToPath(import.meta.url)) === '.ts'
        ? 'tsx'
        : 'node';
    }
    return driver === 'tsx' ? 'tsx' : 'node';
  }

  private resolveLaunchOptions(port: number): AppHostLaunchOptions {
    if (this.driver === 'tsx') {
      return this.resolveTsxLaunchOptions(port);
    }

    return this.resolveNodeLaunchOptions(port);
  }

  private baseAppHostEnv(port: number): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
      ...selectAppHostChildEnv(process.env, this.envOptions),
      PORT: `${port}`,
      APP_HOST_PORT: `${port}`,
      APP_HOST_BIND: this.host,
      APP_HOST_MODE: this.mode,
      APP_HOST_SESSION: this.session ?? undefined,
      APP_REVISIONS_DIR: this.appRevisionsDir,
      APP_VOLUMES_DIR: this.appVolumesDir,
      APP_HOST_CONFIG_PATH: this.configPath,
    };
    // This process relays the child's piped output to its own stdout, so the child cannot detect a
    // terminal on its own. FORCE_COLOR is the only channel; an explicit environment setting wins.
    if (appHostChildForcesColor(process.env, process.stdout.isTTY)) {
      env.FORCE_COLOR = '1';
    }
    const nodeOptions = sanitizeAppHostChildNodeOptions(env.NODE_OPTIONS);

    if (nodeOptions) {
      env.NODE_OPTIONS = nodeOptions;
    } else {
      delete env.NODE_OPTIONS;
    }

    return env;
  }

  private resolveNodeLaunchOptions(port: number): AppHostLaunchOptions {
    const entrypoint = resolveNodeAppHostEntrypoint(this.entrypoint);
    if (!entrypoint) {
      this.status = 'failed';
      throw new Error(
        'The app-host code is not compiled. Please run pnpm build first.',
      );
    }

    return {
      command: process.execPath,
      args: [entrypoint],
      env: this.baseAppHostEnv(port),
      entrypoint,
    };
  }

  private resolveTsxLaunchOptions(port: number): AppHostLaunchOptions {
    const entrypoint = resolveTsxAppHostEntrypoint(this.entrypoint);
    const tsxCli = resolveTsxCli(this.tsxCli);
    if (!entrypoint) {
      this.status = 'failed';
      throw new Error('The app-host source entrypoint does not exist.');
    }
    if (!tsxCli) {
      this.status = 'failed';
      throw new Error(
        'The tsx runtime is not installed. Please run pnpm install first.',
      );
    }

    const tsconfig = this.tsconfig;
    const args =
      this.mode === 'managed'
        ? [tsxCli]
        : [tsxCli, 'watch', '--clear-screen=false'];
    if (tsconfig) {
      args.push('--tsconfig', tsconfig);
    }
    args.push(entrypoint);

    return {
      command: process.execPath,
      args,
      env: {
        ...this.baseAppHostEnv(port),
        NODE_ENV: 'development',
      },
      entrypoint,
    };
  }

  private async resolvePort(): Promise<number> {
    if (this.configuredPort) {
      return this.configuredPort;
    }

    return await findAvailablePort(DEFAULT_APP_HOST_PORT, this.host);
  }

  private pipeChildLogs(child: ChildProcess): void {
    if (this.childOutputDir) captureChildOutput(child, this.childOutputDir);
    child.stdout?.on('data', (chunk: unknown) => {
      if (Buffer.isBuffer(chunk)) process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk: unknown) => {
      if (Buffer.isBuffer(chunk)) process.stderr.write(chunk);
    });
  }

  private async waitForReady(targetUrl: URL): Promise<void> {
    const startedAt = Date.now();
    let lastError: Error | null = null;

    while (Date.now() - startedAt < this.startTimeoutMs) {
      if (!this.managedChild) {
        throw new Error('app-host child process exited before it became ready');
      }

      try {
        await requestHealth(new URL(this.healthPath, targetUrl));
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        await sleep(250);
      }
    }

    throw new Error(
      `app-host did not become ready within ${this.startTimeoutMs}ms: ${lastError?.message ?? ''}`,
    );
  }
}

function resolveNodeAppHostEntrypoint(explicit?: string): string | null {
  if (explicit && existsSync(path.resolve(process.cwd(), explicit))) {
    return path.resolve(process.cwd(), explicit);
  }

  const compiled = path.resolve(currentDir, 'cli.js');
  if (existsSync(compiled)) {
    return compiled;
  }

  return null;
}

function resolveTsxAppHostEntrypoint(explicit?: string): string | null {
  if (explicit && existsSync(path.resolve(process.cwd(), explicit))) {
    return path.resolve(process.cwd(), explicit);
  }

  const candidates = [
    path.resolve(currentDir, 'cli.ts'),
    path.resolve(currentDir, '..', 'src', 'cli.ts'),
  ];
  for (const source of candidates) {
    if (existsSync(source)) {
      return source;
    }
  }

  return null;
}

function resolveTsxCli(explicit?: string): string | null {
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

/**
 * A managed App Host child inherits a pipe, so it cannot tell that this process relays its output to
 * a terminal. Color has to be requested explicitly with FORCE_COLOR; an environment that already
 * states an intent, in either direction, is left alone.
 */
export function appHostChildForcesColor(
  environment: NodeJS.ProcessEnv,
  isTerminal: boolean | undefined,
): boolean {
  if (
    environment.FORCE_COLOR !== undefined ||
    environment.NO_COLOR !== undefined
  ) {
    return false;
  }
  return isTerminal === true;
}

export function sanitizeAppHostChildNodeOptions(value: unknown): string {
  const source = typeof value === 'string' ? value : '';
  return source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter(
      (option) =>
        !APP_HOST_CHILD_DENIED_NODE_OPTIONS.some(
          (deniedOption) =>
            option === deniedOption || option.startsWith(`${deniedOption}=`),
        ),
    )
    .join(' ');
}

export async function findAvailablePort(
  startPort: number,
  host: string,
): Promise<number> {
  if (
    !Number.isInteger(startPort) ||
    startPort < 1 ||
    startPort > MAX_TCP_PORT
  ) {
    throw new RangeError(
      `Invalid app-host port range start: ${String(startPort)}`,
    );
  }

  for (let port = startPort; port <= MAX_TCP_PORT; port += 1) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }

  throw new Error(
    `No available app-host port found from ${startPort} through ${MAX_TCP_PORT}`,
  );
}

function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      reject(error);
    });
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

      reject(
        new Error(
          `health check returned ${res.statusCode ?? 'unknown status'}`,
        ),
      );
    });

    req.setTimeout(1000, () => {
      req.destroy(new Error('health check timed out'));
    });
    req.once('error', reject);
  });
}

function waitForChildExit(
  child: ChildProcess,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`app-host did not exit within ${timeoutMs}ms`));
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
