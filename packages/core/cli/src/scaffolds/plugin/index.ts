/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTemplateDirectory, type TemplateContext } from '../shared/template-renderer.js';

export type PluginScaffoldContext = TemplateContext & {
  packageName: string;
  packageVersion: string;
  pascalCaseName: string;
};

function camelize(value: string): string {
  return value.trim().replace(/[-_\s]+(.)?/g, (_match, capture: string | undefined) => capture?.toUpperCase() ?? '');
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function isValidPluginPackageName(packageName: string): boolean {
  if (!packageName || typeof packageName !== 'string') {
    return false;
  }
  if (packageName.includes('\0')) {
    return false;
  }
  if (path.isAbsolute(packageName)) {
    return false;
  }
  if (packageName.includes('..') || packageName.includes('\\')) {
    return false;
  }
  return /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i.test(packageName);
}

export function packageNameToSegments(packageName: string): string[] {
  return packageName.split('/').filter(Boolean);
}

export function resolvePluginScaffoldTargetPath(targetRoot: string, packageName: string): string {
  return path.join(targetRoot, ...packageNameToSegments(packageName));
}

export function resolvePluginTemplateRoot(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  return path.join(path.dirname(currentFilePath), 'templates');
}

async function readProjectVersion(sourcePath: string): Promise<string> {
  const content = await fsp.readFile(path.join(sourcePath, 'lerna.json'), 'utf8');
  const json = JSON.parse(content) as { version?: string };
  return json.version || '0.1.0';
}

export async function buildPluginScaffoldContext(params: {
  packageName: string;
  sourcePath: string;
}): Promise<PluginScaffoldContext> {
  const packageVersion = await readProjectVersion(params.sourcePath);
  const nameTail = packageNameToSegments(params.packageName).at(-1) ?? params.packageName;

  return {
    packageName: params.packageName,
    packageVersion,
    pascalCaseName: capitalize(camelize(nameTail)),
  };
}

export async function generatePluginScaffold(params: {
  packageName: string;
  sourcePath: string;
  targetRoot: string;
}): Promise<{ targetPath: string; context: PluginScaffoldContext }> {
  const packageName = String(params.packageName).trim();
  if (!isValidPluginPackageName(packageName)) {
    throw new Error(`Invalid plugin package name: ${packageName}`);
  }

  const context = await buildPluginScaffoldContext({
    packageName,
    sourcePath: params.sourcePath,
  });
  const targetPath = resolvePluginScaffoldTargetPath(params.targetRoot, packageName);

  await renderTemplateDirectory({
    templateRoot: resolvePluginTemplateRoot(),
    targetRoot: targetPath,
    context,
  });

  return {
    targetPath,
    context,
  };
}
