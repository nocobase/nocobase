/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import spawn from 'cross-spawn';

function resolveCommandName(name: string): string {
  return name;
}

function resolveCwd(cwd?: string): string {
  const next = cwd ?? process.cwd();
  if (path.isAbsolute(next)) {
    return next;
  }
  return path.resolve(process.cwd(), next);
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
    child.once('error', reject);
    child.once('close', (code, signal) => {
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
  let cwd = options?.cwd ?? process.cwd();
  if (!path.isAbsolute(cwd)) {
    cwd = path.resolve(process.cwd(), cwd);
  }
  const localBin = path.join(cwd, 'node_modules', '.bin');
  return run('node', ['./node_modules/.bin/nocobase-v1', ...args], {
    ...options,
    errorName: 'nocobase command',
    env: {
      PATH: `${localBin}${path.delimiter}${process.env.PATH}`,
      ...options?.env,
    },
  });
}
