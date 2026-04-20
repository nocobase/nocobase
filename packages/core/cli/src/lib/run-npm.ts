/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

export function run(
  name: string,
  args: string[],
  options?: { cwd?: string; env?: Record<string, string>; errorName?: string },
): Promise<void> {
  let cwd = options?.cwd ?? process.cwd();
  if (!path.isAbsolute(cwd)) {
    cwd = path.resolve(process.cwd(), cwd);
  }
  const label = options?.errorName ?? name;
  return new Promise((resolve, reject) => {
    const child = spawn(name, [...args], {
      stdio: 'inherit',
      shell: true,
      cwd,
      env: {
        ...process.env,
        ...options?.env,
      },
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

/** Run `yarn` with the given argument list, inheriting stdio (errors label as `npm` for compatibility). */
export function runNpm(
  args: string[],
  options?: { cwd?: string; env?: Record<string, string> },
): Promise<void> {
  return run('yarn', [...args], { ...options, errorName: 'npm' });
}

export function runNocoBaseCommand(
  args: string[],
  options?: { cwd?: string; env?: Record<string, string> },
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
