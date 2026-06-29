/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import type { ChildProcess, StdioOptions } from 'node:child_process';
import path from 'node:path';
import spawn from 'cross-spawn';
import { translateCli } from './cli-locale.js';
import { resolveConfiguredCommandName } from './cli-config.js';

const FORWARDED_SIGNALS: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
const PROCESS_TIMEOUT_FORCE_KILL_DELAY_MS = 1000;
const MISSING_COMMAND_SPECS = {
  docker: {
    displayName: 'Docker',
    configKey: 'bin.docker',
  },
  caddy: {
    displayName: 'Caddy',
    configKey: 'bin.caddy',
  },
  git: {
    displayName: 'Git',
    configKey: 'bin.git',
  },
  nginx: {
    displayName: 'Nginx',
    configKey: 'bin.nginx',
  },
  yarn: {
    displayName: 'Yarn',
    configKey: 'bin.yarn',
  },
  pnpm: {
    displayName: 'pnpm',
    configKey: 'bin.pnpm',
  },
} as const;
const DOCKER_DAEMON_UNAVAILABLE_PATTERNS = [
  /cannot connect to the docker daemon/i,
  /is the docker daemon running\?/i,
  /error during connect/i,
  /docker daemon is not running/i,
];

async function resolveCommandName(name: string): Promise<string> {
  return await resolveConfiguredCommandName(name);
}

type CommandProcessOptions = {
  cwd?: string;
  env?: Record<string, string>;
  errorName?: string;
  timeoutMs?: number;
};

type RunProcessOptions = CommandProcessOptions & {
  stdio?: 'inherit' | 'pipe' | 'ignore';
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
};

function shouldTeeInheritedOutput(options?: RunProcessOptions): boolean {
  return options?.stdio === 'inherit' && Boolean(String(process.env.NB_CLI_ACTIVE_LOG_FILE ?? '').trim());
}

function createMissingCommandError(name: string, label: string, error: unknown): Error | undefined {
  const code =
    error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : undefined;
  if (code !== 'ENOENT') {
    return undefined;
  }

  if (!Object.prototype.hasOwnProperty.call(MISSING_COMMAND_SPECS, name)) {
    return undefined;
  }

  const spec = MISSING_COMMAND_SPECS[name as keyof typeof MISSING_COMMAND_SPECS];
  return new Error(
    translateCli(
      'commands.shared.missingCommand',
      { action: label, displayName: spec.displayName, configKey: spec.configKey },
      {
        fallback: `Couldn't run \`${label}\` because the ${spec.displayName} executable could not be found. Install ${spec.displayName} or update \`nb config set ${spec.configKey} <path>\` and try again.`,
      },
    ),
  );
}

function isDockerDaemonUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return DOCKER_DAEMON_UNAVAILABLE_PATTERNS.some((pattern) => pattern.test(message));
}

function createDockerDaemonUnavailableError(action: string, error: unknown): Error {
  const details = error instanceof Error ? error.message : String(error);
  return new Error(
    translateCli(
      'commands.shared.dockerDaemonUnavailable',
      { action, details },
      {
        fallback:
          `Couldn't run \`${action}\` because Docker is installed but the Docker daemon is not running.` +
          ` Start Docker Desktop or the Docker daemon service, then try again. Details: ${details}`,
      },
    ),
  );
}

function pathExists(candidate: string): boolean {
  try {
    return Boolean(candidate) && fs.statSync(candidate) !== undefined;
  } catch {
    return false;
  }
}

function isDirectory(candidate: string): boolean {
  try {
    return Boolean(candidate) && fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

function hasLocalNocoBaseBinary(candidate: string): boolean {
  return (
    pathExists(path.join(candidate, 'node_modules', '.bin', 'nocobase-v1')) ||
    pathExists(path.join(candidate, 'node_modules', '.bin', 'nocobase-v1.cmd'))
  );
}

export function resolveCwd(cwd?: string): string {
  const next = cwd ?? process.cwd();
  if (path.isAbsolute(next)) {
    return next;
  }
  return path.resolve(process.cwd(), next);
}

export function resolveProjectCwd(cwd?: string): string {
  const normalizedCwd = typeof cwd === 'string' && cwd.trim() === '' ? undefined : cwd;
  const fallback = resolveCwd(normalizedCwd);
  const hasExplicitInput = normalizedCwd !== undefined;
  if (hasExplicitInput && !pathExists(fallback)) {
    throw new Error(`The specified --cwd does not exist: ${fallback}`);
  }
  if (hasExplicitInput && !isDirectory(fallback)) {
    throw new Error(`The specified --cwd is not a directory: ${fallback}`);
  }
  let current = hasExplicitInput ? fallback : process.cwd();

  while (!hasLocalNocoBaseBinary(current)) {
    const parent = path.dirname(current);
    if (parent === current) {
      if (hasExplicitInput) {
        throw new Error(`Couldn't find a NocoBase source project from --cwd: ${fallback}`);
      }
      return fallback;
    }
    current = parent;
  }

  return current;
}

export async function run(name: string, args: string[], options?: RunProcessOptions): Promise<void> {
  const cwd = resolveCwd(options?.cwd);
  const label = options?.errorName ?? name;
  const command = await resolveCommandName(name);
  const stdio: StdioOptions = shouldTeeInheritedOutput(options)
    ? ['inherit', 'pipe', 'pipe']
    : (options?.stdio ?? 'inherit');
  return await new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      stdio,
      cwd,
      env: {
        ...process.env,
        ...options?.env,
      },
      windowsHide: process.platform === 'win32',
    });
    if (options?.stdio === 'pipe' || shouldTeeInheritedOutput(options)) {
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk) => {
        if (shouldTeeInheritedOutput(options)) {
          process.stdout.write(chunk);
        }
        options.onStdout?.(String(chunk));
      });
      child.stderr?.on('data', (chunk) => {
        if (shouldTeeInheritedOutput(options)) {
          process.stderr.write(chunk);
        }
        options.onStderr?.(String(chunk));
      });
    }
    const cleanupSignalForwarding = forwardSignalsToChild(child);
    const timeoutController = attachProcessTimeout(child, options?.timeoutMs);
    child.once('error', (error) => {
      timeoutController.cleanup();
      cleanupSignalForwarding();
      reject(createMissingCommandError(name, label, error) ?? error);
    });
    child.once('close', (code, signal) => {
      timeoutController.cleanup();
      cleanupSignalForwarding();
      if (timeoutController.didTimeout()) {
        reject(new Error(`${label} timed out after ${options?.timeoutMs}ms`));
        return;
      }
      if (code === 0) {
        resolve();
        return;
      }
      if (signal) {
        reject(new Error(`${label} exited due to signal ${signal}`));
        return;
      }
      reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

function attachProcessTimeout(
  child: ChildProcess,
  timeoutMs?: number,
): { cleanup: () => void; didTimeout: () => boolean } {
  if (!timeoutMs || timeoutMs <= 0) {
    return {
      cleanup: () => undefined,
      didTimeout: () => false,
    };
  }

  let didTimeout = false;
  let forceKillTimer: NodeJS.Timeout | undefined;
  const isChildRunning = () => child.exitCode === null && child.signalCode === null;
  const terminateChild = (signal: NodeJS.Signals) => {
    if (!isChildRunning()) {
      return;
    }
    try {
      child.kill(signal);
    } catch {
      // Ignore kill errors here and let the child close/error handlers surface the failure.
    }
  };
  const timeoutTimer = setTimeout(() => {
    didTimeout = true;
    terminateChild('SIGTERM');
    forceKillTimer = setTimeout(() => {
      terminateChild('SIGKILL');
    }, PROCESS_TIMEOUT_FORCE_KILL_DELAY_MS);
    forceKillTimer.unref?.();
  }, timeoutMs);
  timeoutTimer.unref?.();

  return {
    cleanup: () => {
      clearTimeout(timeoutTimer);
      if (forceKillTimer) {
        clearTimeout(forceKillTimer);
      }
    },
    didTimeout: () => didTimeout,
  };
}

function forwardSignalsToChild(child: ChildProcess): () => void {
  let forwardedSignalCount = 0;
  const listeners = new Map<NodeJS.Signals, () => void>();
  const isChildRunning = () => child.exitCode === null && child.signalCode === null;

  for (const signal of FORWARDED_SIGNALS) {
    const listener = () => {
      if (!isChildRunning()) {
        return;
      }

      const nextSignal: NodeJS.Signals = forwardedSignalCount > 0 ? 'SIGKILL' : signal;
      forwardedSignalCount += 1;

      try {
        child.kill(nextSignal);
      } catch {
        // Ignore kill errors here and let the child close/error handlers surface the failure.
      }
    };

    listeners.set(signal, listener);
    process.on(signal, listener);
  }

  return () => {
    for (const [signal, listener] of listeners) {
      process.off(signal, listener);
    }
  };
}

export async function commandSucceeds(name: string, args: string[], options?: CommandProcessOptions): Promise<boolean> {
  const cwd = resolveCwd(options?.cwd);
  const label = options?.errorName ?? name;
  const command = await resolveCommandName(name);
  return await new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd,
      env: {
        ...process.env,
        ...options?.env,
      },
      stdio: 'ignore',
      windowsHide: process.platform === 'win32',
    });
    const timeoutController = attachProcessTimeout(child, options?.timeoutMs);

    child.once('error', (error) => {
      timeoutController.cleanup();
      const missingCommandError = createMissingCommandError(name, label, error);
      if (missingCommandError) {
        reject(missingCommandError);
        return;
      }
      resolve(false);
    });
    child.once('close', (code) => {
      timeoutController.cleanup();
      if (timeoutController.didTimeout()) {
        resolve(false);
        return;
      }
      resolve(code === 0);
    });
  });
}

export async function commandOutput(name: string, args: string[], options?: CommandProcessOptions): Promise<string> {
  const cwd = resolveCwd(options?.cwd);
  const label = options?.errorName ?? name;
  const command = await resolveCommandName(name);
  return await new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd,
      env: {
        ...process.env,
        ...options?.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: process.platform === 'win32',
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    const timeoutController = attachProcessTimeout(child, options?.timeoutMs);
    child.once('error', (error) => {
      timeoutController.cleanup();
      reject(createMissingCommandError(name, label, error) ?? error);
    });
    child.once('close', (code, signal) => {
      timeoutController.cleanup();
      if (timeoutController.didTimeout()) {
        reject(new Error(`${label} timed out after ${options?.timeoutMs}ms`));
        return;
      }
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      if (signal) {
        reject(new Error(`${label} exited due to signal ${signal}`));
        return;
      }
      const details = stderr.trim() || stdout.trim();
      reject(
        new Error(details ? `${label} exited with code ${code}: ${details}` : `${label} exited with code ${code}`),
      );
    });
  });
}

async function readCommandOutputFile(filePath: string): Promise<string> {
  try {
    return await fsp.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

export async function commandOutputViaFile(
  name: string,
  args: string[],
  options?: CommandProcessOptions,
): Promise<string> {
  const cwd = resolveCwd(options?.cwd);
  const label = options?.errorName ?? name;
  const command = await resolveCommandName(name);
  const captureDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-output-'));
  const stdoutPath = path.join(captureDir, 'stdout.log');
  const stderrPath = path.join(captureDir, 'stderr.log');
  const stdoutHandle = await fsp.open(stdoutPath, 'w');
  const stderrHandle = await fsp.open(stderrPath, 'w');

  try {
    const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
      const child = spawn(command, [...args], {
        cwd,
        env: {
          ...process.env,
          ...options?.env,
        },
        stdio: ['ignore', stdoutHandle.fd, stderrHandle.fd],
        windowsHide: process.platform === 'win32',
      });
      const timeoutController = attachProcessTimeout(child, options?.timeoutMs);

      child.once('error', (error) => {
        timeoutController.cleanup();
        reject(createMissingCommandError(name, label, error) ?? error);
      });
      child.once('close', (code, signal) => {
        timeoutController.cleanup();
        if (timeoutController.didTimeout()) {
          reject(new Error(`${label} timed out after ${options?.timeoutMs}ms`));
          return;
        }
        resolve({ code, signal });
      });
    });

    await stdoutHandle.close();
    await stderrHandle.close();

    const stdout = await readCommandOutputFile(stdoutPath);
    const stderr = await readCommandOutputFile(stderrPath);

    if (result.code === 0) {
      return stdout.trim();
    }
    if (result.signal) {
      throw new Error(`${label} exited due to signal ${result.signal}`);
    }

    const details = stderr.trim() || stdout.trim();
    throw new Error(
      details ? `${label} exited with code ${result.code}: ${details}` : `${label} exited with code ${result.code}`,
    );
  } finally {
    await Promise.allSettled([stdoutHandle.close(), stderrHandle.close()]);
    await fsp.rm(captureDir, { recursive: true, force: true });
  }
}

/** Run `yarn` with the given argument list, inheriting stdio (errors label as `npm` for compatibility). */
export function runNpm(args: string[], options?: Omit<RunProcessOptions, 'errorName'>): Promise<void> {
  return run('yarn', [...args], { ...options, errorName: 'npm' });
}

export async function ensureDockerDaemonRunning(action = 'use Docker'): Promise<void> {
  try {
    await commandOutput('docker', ['info'], { errorName: 'docker info', timeoutMs: 5000 });
  } catch (error: unknown) {
    if (isDockerDaemonUnavailableError(error)) {
      throw createDockerDaemonUnavailableError(action, error);
    }
    throw error;
  }
}

export function runNocoBaseCommand(args: string[], options?: Omit<RunProcessOptions, 'errorName'>): Promise<void> {
  const cwd = resolveProjectCwd(options?.cwd);
  const localBin = path.join(cwd, 'node_modules', '.bin');
  return run('nocobase-v1', [...args], {
    ...options,
    cwd,
    errorName: 'nocobase command',
    env: {
      PATH: `${localBin}${path.delimiter}${process.env.PATH ?? ''}`,
      ...options?.env,
    },
  });
}
