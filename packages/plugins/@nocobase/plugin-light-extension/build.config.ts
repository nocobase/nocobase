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

const sourceDependencies = [
  {
    packageName: '@nocobase/light-extension-sdk',
    exportKeys: ['.', './client', './schema', './schema/server', './shared', './typegen'],
    declarationChecks: [],
  },
  {
    packageName: '@nocobase/runjs',
    exportKeys: ['.', './compiler', './server', './settings'],
    declarationChecks: [{ path: 'lib/server.d.ts', includes: 'buildRunJSFilesHash' }],
  },
  {
    packageName: '@nocobase/client-v2',
    exportKeys: ['.'],
    declarationChecks: [
      { path: 'es/ai/authoring/types.d.ts', includes: 'CodeAuthoringDiagnostic' },
      { path: 'es/ai/ai-manager.d.ts', includes: 'authoringSurfaces' },
      { path: 'es/flow/components/code-editor/types.d.ts', includes: 'authoringSurfaceId' },
    ],
  },
] as const;
const repositoryRoot = path.resolve(__dirname, '../../../..');

export default defineConfig({
  beforeBuild: async (log) => {
    const outdatedDependencies = sourceDependencies.filter((dependency) => !hasRequiredBuiltOutput(dependency));
    if (!outdatedDependencies.length) {
      return;
    }

    const packageNames = outdatedDependencies.map((dependency) => dependency.packageName);
    log(`building source dependencies: ${packageNames.join(', ')}`);
    await buildSourceDependencies(packageNames);
  },
});

function hasRequiredBuiltOutput(dependency: (typeof sourceDependencies)[number]): boolean {
  try {
    const packageJsonPath = require.resolve(`${dependency.packageName}/package.json`, { paths: [__dirname] });
    const packageJson: unknown = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!isRecord(packageJson) || !isRecord(packageJson.exports)) {
      return false;
    }
    const packageRoot = path.dirname(packageJsonPath);
    const outputPaths = new Set<string>();
    dependency.exportKeys.forEach((exportKey) => collectOutputPaths(packageJson.exports[exportKey], outputPaths));
    const resolvedOutputPaths = [...outputPaths].map((outputPath) => path.resolve(packageRoot, outputPath));
    if (!resolvedOutputPaths.length || resolvedOutputPaths.some((outputPath) => !fs.existsSync(outputPath))) {
      return false;
    }

    return dependency.declarationChecks.every((check) => {
      const declarationPath = path.resolve(packageRoot, check.path);
      return fs.existsSync(declarationPath) && fs.readFileSync(declarationPath, 'utf8').includes(check.includes);
    });
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
