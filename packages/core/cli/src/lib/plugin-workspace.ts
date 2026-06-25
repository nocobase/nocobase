/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type SyncMode = 'all' | 'targeted';

export type PluginWorkspaceSyncOptions = {
  appPath: string;
  sourcePath: string;
  mode: SyncMode;
  targetPackageNames?: string[];
  forceRecreate?: boolean;
};

export function isCliManagedSourceApp(params: { appPath: string; sourcePath: string }): boolean {
  const normalizedAppPath = path.resolve(params.appPath);
  const normalizedSourcePath = path.resolve(params.sourcePath);
  if (normalizedSourcePath !== path.join(normalizedAppPath, 'source')) {
    return false;
  }

  return (
    fs.existsSync(path.join(normalizedAppPath, 'storage')) ||
    fs.existsSync(path.join(normalizedAppPath, 'plugins'))
  );
}

export type PluginWorkspaceSyncResult = {
  createdPluginWorkspace: boolean;
  createdSourcePluginRoot: boolean;
  linked: string[];
  relinked: string[];
  removedDangling: string[];
  warnings: string[];
  skipped: string[];
  changed: boolean;
};

export function summarizePluginWorkspaceSync(result: PluginWorkspaceSyncResult): string[] {
  const parts: string[] = [];
  if (result.createdPluginWorkspace) {
    parts.push('created top-level plugins workspace');
  }
  if (result.createdSourcePluginRoot) {
    parts.push('created source plugin root');
  }
  if (result.linked.length > 0) {
    parts.push(`linked ${result.linked.length} plugin${result.linked.length > 1 ? 's' : ''}`);
  }
  if (result.relinked.length > 0) {
    parts.push(`relinked ${result.relinked.length} plugin${result.relinked.length > 1 ? 's' : ''}`);
  }
  if (result.removedDangling.length > 0) {
    parts.push(`removed ${result.removedDangling.length} dangling plugin link${result.removedDangling.length > 1 ? 's' : ''}`);
  }
  return parts;
}

type EntryKind = 'missing' | 'directory' | 'symlink' | 'other';

type SyncContext = {
  appPath: string;
  sourcePath: string;
  pluginWorkspacePath: string;
  sourcePluginRootPath: string;
  forceRecreate: boolean;
};

type PluginCandidate = {
  packageName: string;
  workspacePath: string;
  relativePath: string;
};

function normalizePackageNames(packageNames: string[] | undefined): string[] {
  return [...new Set((packageNames ?? []).map((item) => String(item).trim()).filter(Boolean))];
}

async function pathExists(candidate: string): Promise<boolean> {
  try {
    await fsp.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(candidate: string): Promise<boolean> {
  if (await pathExists(candidate)) {
    return false;
  }
  await fsp.mkdir(candidate, { recursive: true });
  return true;
}

async function readDirNames(candidate: string): Promise<string[]> {
  try {
    return await fsp.readdir(candidate);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function getEntryKind(candidate: string): Promise<EntryKind> {
  try {
    const stat = await fsp.lstat(candidate);
    if (stat.isSymbolicLink()) {
      return 'symlink';
    }
    if (stat.isDirectory()) {
      return 'directory';
    }
    return 'other';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return 'missing';
    }
    throw error;
  }
}

function normalizePathForComparison(value: string): string {
  return path.resolve(value).replace(/[\\/]+/g, '/').replace(/\/+$/, '');
}

async function safeRealpath(candidate: string): Promise<string | undefined> {
  try {
    return await fsp.realpath(candidate);
  } catch {
    return undefined;
  }
}

function symlinkType(): 'dir' | 'junction' {
  return os.platform() === 'win32' ? 'junction' : 'dir';
}

async function ensureScopedParent(targetPath: string): Promise<void> {
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
}

async function createSymlink(target: string, linkPath: string): Promise<void> {
  await ensureScopedParent(linkPath);
  await fsp.symlink(target, linkPath, symlinkType());
}

function formatConflictError(params: {
  packageName: string;
  sourceEntryPath: string;
  workspacePath: string;
}): Error {
  const message = [
    `Plugin workspace conflict detected for "${params.packageName}".`,
    `Source entry: ${params.sourceEntryPath}`,
    `Top-level plugin: ${params.workspacePath}`,
    `Choose one of them manually, then rerun the command.`,
    `You can either remove the conflicting entry under source/packages/plugins first, or keep that entry and remove/rename the top-level plugins copy.`,
  ].join('\n');
  return new Error(message);
}

async function readPluginCandidate(
  pluginWorkspacePath: string,
  packageName: string,
): Promise<PluginCandidate | undefined> {
  const relativePath = packageName.split('/').join(path.sep);
  const workspacePath = path.join(pluginWorkspacePath, relativePath);
  const packageJsonPath = path.join(workspacePath, 'package.json');

  if (!(await pathExists(packageJsonPath))) {
    return undefined;
  }

  return {
    packageName,
    workspacePath,
    relativePath,
  };
}

async function discoverTopLevelPluginPackageNames(pluginWorkspacePath: string): Promise<string[]> {
  const result: string[] = [];
  for (const firstLevelName of await readDirNames(pluginWorkspacePath)) {
    const firstLevelPath = path.join(pluginWorkspacePath, firstLevelName);
    const firstLevelKind = await getEntryKind(firstLevelPath);
    if (firstLevelKind !== 'directory' && firstLevelKind !== 'symlink') {
      continue;
    }

    if (firstLevelName.startsWith('@')) {
      for (const secondLevelName of await readDirNames(firstLevelPath)) {
        const packageName = `${firstLevelName}/${secondLevelName}`;
        const candidate = await readPluginCandidate(pluginWorkspacePath, packageName);
        if (candidate) {
          result.push(candidate.packageName);
        }
      }
      continue;
    }

    const candidate = await readPluginCandidate(pluginWorkspacePath, firstLevelName);
    if (candidate) {
      result.push(candidate.packageName);
    }
  }

  return result.sort((left, right) => left.localeCompare(right));
}

export async function resolveLocalPluginWorkspace(params: {
  cwd?: string;
  supportAppPath?: boolean;
}): Promise<{ appPath: string; sourcePath: string }> {
  const candidate = String(params.cwd ?? '').trim();
  if (!candidate) {
    throw new Error('A local source app path is required.');
  }

  const resolved = path.resolve(candidate);
  let stat;
  try {
    stat = await fsp.stat(resolved);
  } catch {
    throw new Error(`The specified --cwd does not exist: ${resolved}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`The specified --cwd is not a directory: ${resolved}`);
  }

  if (params.supportAppPath) {
    const sourceCandidate = path.join(resolved, 'source');
    if (await pathExists(sourceCandidate)) {
      const sourceBinary = path.join(sourceCandidate, 'node_modules', '.bin', process.platform === 'win32' ? 'nocobase-v1.cmd' : 'nocobase-v1');
      if (!(await pathExists(sourceBinary))) {
        throw new Error(`The specified --cwd points to an app path, but its source directory is not a valid NocoBase source project: ${sourceCandidate}`);
      }
      return {
        appPath: resolved,
        sourcePath: sourceCandidate,
      };
    }
  }

  const sourceBinary = path.join(resolved, 'node_modules', '.bin', process.platform === 'win32' ? 'nocobase-v1.cmd' : 'nocobase-v1');
  if (await pathExists(sourceBinary)) {
    return {
      appPath: path.dirname(resolved),
      sourcePath: resolved,
    };
  }

  let current = resolved;
  while (true) {
    const binaryPath = path.join(current, 'node_modules', '.bin', process.platform === 'win32' ? 'nocobase-v1.cmd' : 'nocobase-v1');
    if (await pathExists(binaryPath)) {
      return {
        appPath: path.dirname(current),
        sourcePath: current,
      };
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error(`Couldn't find a NocoBase source project from --cwd: ${resolved}`);
}

export function resolveLocalPluginWorkspaceSync(params: {
  cwd?: string;
  supportAppPath?: boolean;
}): { appPath: string; sourcePath: string } {
  const candidate = String(params.cwd ?? '').trim();
  if (!candidate) {
    throw new Error('A local source app path is required.');
  }

  const resolved = path.resolve(candidate);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(resolved);
  } catch {
    throw new Error(`The specified --cwd does not exist: ${resolved}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`The specified --cwd is not a directory: ${resolved}`);
  }

  if (params.supportAppPath) {
    const sourceCandidate = path.join(resolved, 'source');
    if (fs.existsSync(sourceCandidate)) {
      const sourceBinary = path.join(
        sourceCandidate,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'nocobase-v1.cmd' : 'nocobase-v1',
      );
      if (!fs.existsSync(sourceBinary)) {
        throw new Error(
          `The specified --cwd points to an app path, but its source directory is not a valid NocoBase source project: ${sourceCandidate}`,
        );
      }
      return {
        appPath: resolved,
        sourcePath: sourceCandidate,
      };
    }
  }

  let current = resolved;
  while (true) {
    const binaryPath = path.join(
      current,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'nocobase-v1.cmd' : 'nocobase-v1',
    );
    if (fs.existsSync(binaryPath)) {
      return {
        appPath: path.dirname(current),
        sourcePath: current,
      };
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error(`Couldn't find a NocoBase source project from --cwd: ${resolved}`);
}

async function syncSinglePlugin(
  context: SyncContext,
  candidate: PluginCandidate,
  result: PluginWorkspaceSyncResult,
): Promise<void> {
  const sourceEntryPath = path.join(context.sourcePluginRootPath, candidate.relativePath);
  const sourceEntryKind = await getEntryKind(sourceEntryPath);
  const workspaceRealPath = normalizePathForComparison(candidate.workspacePath);

  if (sourceEntryKind === 'missing') {
    await createSymlink(candidate.workspacePath, sourceEntryPath);
    result.linked.push(candidate.packageName);
    return;
  }

  if (sourceEntryKind === 'symlink') {
    const realPath = await safeRealpath(sourceEntryPath);
    if (realPath && normalizePathForComparison(realPath) === workspaceRealPath) {
      result.skipped.push(candidate.packageName);
      return;
    }

    if (realPath && !context.forceRecreate) {
      throw formatConflictError({
        packageName: candidate.packageName,
        sourceEntryPath,
        workspacePath: candidate.workspacePath,
      });
    }

    await fsp.rm(sourceEntryPath, { recursive: true, force: true });
    await createSymlink(candidate.workspacePath, sourceEntryPath);
    result.relinked.push(candidate.packageName);
    if (realPath) {
      result.warnings.push(
        `Recreated source plugin entry for "${candidate.packageName}" at ${sourceEntryPath}; previous target was ${realPath}.`,
      );
    }
    return;
  }

  if (sourceEntryKind === 'directory') {
    if (!context.forceRecreate) {
      throw formatConflictError({
        packageName: candidate.packageName,
        sourceEntryPath,
        workspacePath: candidate.workspacePath,
      });
    }

    await fsp.rm(sourceEntryPath, { recursive: true, force: true });
    await createSymlink(candidate.workspacePath, sourceEntryPath);
    result.relinked.push(candidate.packageName);
    result.warnings.push(`Recreated source plugin entry for "${candidate.packageName}" at ${sourceEntryPath}.`);
    return;
  }

  throw new Error(`Unsupported plugin entry at ${sourceEntryPath}. Remove it manually and retry.`);
}

async function cleanupDanglingSourceEntries(
  context: SyncContext,
  targetPackageNames: string[],
  result: PluginWorkspaceSyncResult,
): Promise<void> {
  for (const packageName of targetPackageNames) {
    const relativePath = packageName.split('/').join(path.sep);
    const sourceEntryPath = path.join(context.sourcePluginRootPath, relativePath);
    if ((await getEntryKind(sourceEntryPath)) !== 'symlink') {
      continue;
    }

    const workspacePath = path.join(context.pluginWorkspacePath, relativePath);
    const workspacePackageJsonPath = path.join(workspacePath, 'package.json');
    if (await pathExists(workspacePackageJsonPath)) {
      continue;
    }

    const realPath = await safeRealpath(sourceEntryPath);
    if (realPath) {
      continue;
    }

    await fsp.rm(sourceEntryPath, { recursive: true, force: true });
    result.removedDangling.push(packageName);
  }
}

export async function syncPluginWorkspace(options: PluginWorkspaceSyncOptions): Promise<PluginWorkspaceSyncResult> {
  const appPath = path.resolve(options.appPath);
  const sourcePath = path.resolve(options.sourcePath);
  const pluginWorkspacePath = path.join(appPath, 'plugins');
  const sourcePluginRootPath = path.join(sourcePath, 'packages', 'plugins');

  const result: PluginWorkspaceSyncResult = {
    createdPluginWorkspace: await ensureDir(pluginWorkspacePath),
    createdSourcePluginRoot: await ensureDir(sourcePluginRootPath),
    linked: [],
    relinked: [],
    removedDangling: [],
    warnings: [],
    skipped: [],
    changed: false,
  };

  const targetPackageNames =
    options.mode === 'all'
      ? await discoverTopLevelPluginPackageNames(pluginWorkspacePath)
      : normalizePackageNames(options.targetPackageNames);

  const context: SyncContext = {
    appPath,
    sourcePath,
    pluginWorkspacePath,
    sourcePluginRootPath,
    forceRecreate: Boolean(options.forceRecreate),
  };

  for (const packageName of targetPackageNames) {
    const candidate = await readPluginCandidate(pluginWorkspacePath, packageName);
    if (!candidate) {
      continue;
    }
    await syncSinglePlugin(context, candidate, result);
  }

  await cleanupDanglingSourceEntries(context, targetPackageNames, result);

  result.changed =
    result.createdPluginWorkspace ||
    result.createdSourcePluginRoot ||
    result.linked.length > 0 ||
    result.relinked.length > 0 ||
    result.removedDangling.length > 0;

  return result;
}
