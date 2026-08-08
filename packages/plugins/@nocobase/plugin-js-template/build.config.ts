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
import fs from 'fs-extra';
import path from 'path';

const sourceDependencies = ['@nocobase/js-template-sdk', '@nocobase/runjs', '@nocobase/runjs-workspace'] as const;
const repositoryRoot = path.resolve(__dirname, '../../../..');
const requiredJavaScriptArtifacts = [
  'dist/client/index.js',
  'dist/client-v2/index.js',
  'dist/server/index.js',
  'dist/swagger/index.js',
] as const;
const requiredDeclarationArtifacts = [
  'dist/client/index.d.ts',
  'dist/client-v2/index.d.ts',
  'dist/server/index.d.ts',
] as const;

export default defineConfig({
  beforeBuild: async (log) => {
    const buildDeclarations = !process.argv.includes('--no-dts') && !process.argv.includes('--only-tar');
    log(`building source dependencies: ${sourceDependencies.join(', ')}`);
    await buildSourceDependencies(buildDeclarations);
  },
  afterBuild: (log) => {
    assertBuildArtifacts(requiredJavaScriptArtifacts);
    log(`verified build artifacts: ${requiredJavaScriptArtifacts.join(', ')}`);

    if (!process.argv.includes('--no-dts') && !process.argv.includes('--only-tar')) {
      const verifyDeclarationArtifacts = () => {
        assertBuildArtifacts(requiredDeclarationArtifacts);
        log(`verified declaration artifacts: ${requiredDeclarationArtifacts.join(', ')}`);
      };
      process.once('beforeExit', verifyDeclarationArtifacts);
    }
  },
});

function assertBuildArtifacts(relativePaths: readonly string[]): void {
  const missingArtifacts = relativePaths.filter(
    (relativePath) => !fs.pathExistsSync(path.join(__dirname, relativePath)),
  );
  if (missingArtifacts.length) {
    throw new Error(`Missing JS Template build artifacts: ${missingArtifacts.join(', ')}`);
  }
}

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
