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
import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import spawn from 'cross-spawn';

const FORWARDED_SIGNALS: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

function resolveCommandName(name: string): string {
  return name;
}

function pathExists(candidate: string): boolean {
  try {
    return Boolean(candidate) && fs.statSync(candidate) !== undefined;
  } catch {
    return false;
  }
}

function hasLocalNocoBaseBinary(candidate: string): boolean {
  return (
    pathExists(path.join(candidate, 'node_modules', '.bin', 'nocobase-v1'))
    || pathExists(path.join(candidate, 'node_modules', '.bin', 'nocobase-v1.cmd'))
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
  const next = normalizedCwd ?? process.cwd();
  const resolvedNext = resolveCwd(normalizedCwd);

  if (!normalizedCwd || path.isAbsolute(next)) {
    return resolvedNext;
  }

  const baseCwd = process.cwd();
  let current = baseCwd;
  const fallback = resolvedNext;

  while (true) {
    const candidate = path.resolve(current, next);
    if (hasLocalNocoBaseBinary(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return fallback;
    }
    current = parent;
  }
}

export function run(
  name: string,
  args: string[],
  options?: { stdio?: 'inherit' | 'pipe' | 'ignore'; cwd?: string; env?: Record<string, string>; errorName?: string },
): Promise<void> {
  const cwd = resolveCwd(options?.cwd);
  const label = options?.errorName ?? name;
  const command = resolveCommandName(name);
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      stdio: options?.stdio ?? 'inherit',
      cwd,
      env: {
        ...process.env,
        ...options?.env,
      },
      windowsHide: process.platform === 'win32',
    });
    const cleanupSignalForwarding = forwardSignalsToChild(child);
    child.once('error', (error) => {
      cleanupSignalForwarding();
      reject(error);
    });
    child.once('close', (code, signal) => {
      cleanupSignalForwarding();
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

export function commandSucceeds(
  name: string,
  args: string[],
  options?: { cwd?: string; env?: Record<string, string> },
): Promise<boolean> {
  const cwd = resolveCwd(options?.cwd);
  const command = resolveCommandName(name);
  return new Promise((resolve) => {
    const child = spawn(command, [...args], {
      cwd,
      env: {
        ...process.env,
        ...options?.env,
      },
      stdio: 'ignore',
      windowsHide: process.platform === 'win32',
    });

    child.once('error', () => resolve(false));
    child.once('close', (code) => resolve(code === 0));
  });
}

export function commandOutput(
  name: string,
  args: string[],
  options?: { cwd?: string; env?: Record<string, string>; errorName?: string },
): Promise<string> {
  const cwd = resolveCwd(options?.cwd);
  const label = options?.errorName ?? name;
  const command = resolveCommandName(name);
  return new Promise((resolve, reject) => {
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
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      if (signal) {
        reject(new Error(`${label} exited due to signal ${signal}`));
        return;
      }
      const details = stderr.trim() || stdout.trim();
      reject(new Error(details ? `${label} exited with code ${code}: ${details}` : `${label} exited with code ${code}`));
    });
  });
}

/** Run `yarn` with the given argument list, inheriting stdio (errors label as `npm` for compatibility). */
export function runNpm(
  args: string[],
  options?: { stdio?: 'inherit' | 'pipe' | 'ignore'; cwd?: string; env?: Record<string, string> },
): Promise<void> {
  return run('yarn', [...args], { ...options, errorName: 'npm' });
}

export function runNocoBaseCommand(
  args: string[],
  options?: { stdio?: 'inherit' | 'pipe' | 'ignore'; cwd?: string; env?: Record<string, string> },
): Promise<void> {
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
