/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';

export function run(name: string, args: string[], cwd: string, options?: { env?: Record<string, string> }): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(name, [...args], {
      stdio: 'inherit',
      shell: true,
      cwd,
      env: {
        ...options?.env,
        ...process.env,
      },
    });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${name} exited with code ${code}`));
    });
  });
}

/** Run `npm` with the given argument list in `cwd`, inheriting stdio. */
export function runNpm(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('yarn', [...args], {
      stdio: 'inherit',
      shell: true,
      cwd,
      env: process.env,
    });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      if (signal) {
        reject(new Error(`npm exited due to signal ${signal}`));
        return;
      }
      reject(new Error(`npm exited with code ${code}`));
    });
  });
}

export async function runNocoBaseCommand(args: string[], cwd: string, options?: { env?: Record<string, string> }): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['./node_modules/.bin/nocobase-v1', ...args], {
      stdio: 'inherit',
      shell: true,
      cwd,
      env: {
        ...options?.env,
        ...process.env,
      },
    });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`nocobase command exited with code ${code}`));
    });
  });
}