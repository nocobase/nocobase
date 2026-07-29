/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineConfig } from '@nocobase/build';
import { spawn } from 'child_process';
import path from 'path';

const sourceDependencies = [
  '@nocobase/light-extension-sdk',
  '@nocobase/runjs',
  '@nocobase/client-v2',
  '@nocobase/runjs-workspace',
] as const;
const repositoryRoot = path.resolve(__dirname, '../../../..');

export default defineConfig({
  beforeBuild: async (log) => {
    const buildDeclarations = !process.argv.includes('--no-dts') && !process.argv.includes('--only-tar');
    log(`building source dependencies: ${sourceDependencies.join(', ')}`);
    await buildSourceDependencies(buildDeclarations);
  },
});

async function buildSourceDependencies(buildDeclarations: boolean): Promise<void> {
  for (const packageName of sourceDependencies) {
    await new Promise<void>((resolve, reject) => {
      const buildArgs = ['build', packageName];
      if (!buildDeclarations) {
        buildArgs.push('--no-dts');
      }
      const child = spawn('yarn', buildArgs, {
        cwd: repositoryRoot,
        shell: process.platform === 'win32',
        stdio: 'inherit',
      });
      child.once('error', reject);
      child.once('exit', (code, signal) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`Failed to build ${packageName} (${signal || `exit code ${code}`})`));
      });
    });
  }
}
