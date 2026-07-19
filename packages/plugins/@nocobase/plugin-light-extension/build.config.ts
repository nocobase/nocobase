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
import fs from 'fs';
import path from 'path';

const sourceDependencies = ['@nocobase/light-extension-sdk', '@nocobase/runjs'] as const;
const repositoryRoot = path.resolve(__dirname, '../../../..');

export default defineConfig({
  beforeBuild: async (log) => {
    const missingDependencies = sourceDependencies.filter((packageName) => !hasBuiltOutput(packageName));
    if (!missingDependencies.length) {
      return;
    }

    log(`building source dependencies: ${missingDependencies.join(', ')}`);
    await buildSourceDependencies(missingDependencies);
  },
});

function hasBuiltOutput(packageName: string): boolean {
  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`, { paths: [__dirname] });
    const packageJson: unknown = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!isRecord(packageJson)) {
      return false;
    }
    const packageRoot = path.dirname(packageJsonPath);
    const outputPaths = new Set<string>();
    collectOutputPaths(packageJson.main, outputPaths);
    collectOutputPaths(packageJson.types, outputPaths);
    collectOutputPaths(packageJson.exports, outputPaths);
    return (
      outputPaths.size > 0 &&
      [...outputPaths].every((outputPath) => fs.existsSync(path.resolve(packageRoot, outputPath)))
    );
  } catch {
    return false;
  }
}

function collectOutputPaths(value: unknown, outputPaths: Set<string>): void {
  if (typeof value === 'string') {
    outputPaths.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectOutputPaths(item, outputPaths));
    return;
  }
  if (isRecord(value)) {
    Object.values(value).forEach((item) => collectOutputPaths(item, outputPaths));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function buildSourceDependencies(packageNames: readonly string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('yarn', ['build', ...packageNames], {
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
      reject(new Error(`Failed to build ${packageNames.join(', ')} (${signal || `exit code ${code}`})`));
    });
  });
}
