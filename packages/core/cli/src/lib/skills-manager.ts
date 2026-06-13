/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createGunzip } from 'node:zlib';
import * as tar from 'tar';
import { resolveCliHomeDir } from './cli-home.js';
import { compareVersions } from './self-manager.js';
import { commandOutput, commandOutputViaFile, run } from './run-npm.js';

export const NOCOBASE_SKILLS_SOURCE = 'nocobase/skills';
export const NOCOBASE_SKILLS_PACKAGE_NAME = '@nocobase/skills';
const NOCOBASE_SKILLS_NAME_PREFIX = 'nocobase-';
// `npx skills list` may take several seconds on cold starts while `npx`
// resolves and boots the package, even when the local skills installation is healthy.
const SKILLS_LIST_TIMEOUT_MS = 15000;
const SKILLS_NPM_VIEW_TIMEOUT_MS = 3000;
const SKILLS_PACK_TIMEOUT_MS = 30000;
const SKILLS_ADD_TIMEOUT_MS = 20000;
const NPM_REGISTRY_UNAVAILABLE_PATTERNS = [
  'enotfound',
  'eai_again',
  'etimedout',
  'esockettimedout',
  'econnreset',
  'econnrefused',
  'ehostunreach',
  'enetunreach',
  'socket hang up',
  'getaddrinfo',
  'fetch failed',
  'network request to',
  'self_signed_cert',
  'depth_zero_self_signed_cert',
  'unable_to_verify_leaf_signature',
  'cert_has_expired',
  'timed out after',
] as const;

export type InstalledSkill = {
  name: string;
  path?: string;
  scope?: string;
  agents?: string[];
};

export type ManagedSkillsState = {
  packageName: string;
  sourcePackage?: string;
  repoUrl?: string;
  installedAt: string;
  updatedAt: string;
  installedVersion?: string;
  installedRef?: string;
  skillNames: string[];
};

export type SkillsStatus = {
  globalRoot: string;
  /** @deprecated Use globalRoot instead. */
  workspaceRoot: string;
  stateFile: string;
  installed: boolean;
  managedByNb: boolean;
  sourcePackage: string;
  npmPackageName: string;
  packageSkillNames: string[];
  installedSkillNames: string[];
  latestVersion?: string;
  installedVersion?: string;
  /** @deprecated Use latestVersion instead. */
  latestRef?: string;
  /** @deprecated Use installedVersion instead. */
  installedRef?: string;
  updateAvailable: boolean | null;
  registryError?: string;
};

type SkillsManagerOptions = {
  commandOutputFn?: typeof commandOutput;
  globalRoot?: string;
  /** @deprecated Use globalRoot instead. */
  workspaceRoot?: string;
};

type SkillsSyncOptions = SkillsManagerOptions & {
  runFn?: typeof run;
  targetVersion?: string;
  verbose?: boolean;
};

function collectErrorMessages(error: unknown): string[] {
  const messages: string[] = [];
  const queue: unknown[] = [error];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || current === null || seen.has(current)) {
      continue;
    }
    seen.add(current);

    if (current instanceof Error) {
      if (current.message) {
        messages.push(current.message);
      }
      const cause = (current as Error & { cause?: unknown }).cause;
      if (cause !== undefined) {
        queue.push(cause);
      }
      continue;
    }

    if (typeof current === 'string') {
      messages.push(current);
      continue;
    }

    if (typeof current === 'object') {
      if ('message' in current && typeof current.message === 'string') {
        messages.push(current.message);
      }
      if ('cause' in current) {
        queue.push(current.cause);
      }
      continue;
    }

    messages.push(String(current));
  }

  return messages;
}

export function isNpmRegistryUnavailable(error: unknown): boolean {
  return collectErrorMessages(error).some((message) => {
    const normalized = message.toLowerCase();
    return NPM_REGISTRY_UNAVAILABLE_PATTERNS.some((pattern) => normalized.includes(pattern));
  });
}

function normalizePath(value: string): string {
  return path.resolve(value);
}

export function resolveGlobalSkillsRoot(_startCwd = process.cwd()): string {
  return normalizePath(resolveCliHomeDir('global'));
}

export function resolveSkillsWorkspaceRoot(startCwd = process.cwd()): string {
  return resolveGlobalSkillsRoot(startCwd);
}

function resolveSkillsRoot(options: SkillsManagerOptions = {}): string {
  return options.globalRoot
    ? normalizePath(options.globalRoot)
    : options.workspaceRoot
      ? normalizePath(options.workspaceRoot)
      : resolveGlobalSkillsRoot();
}

function getSkillsCacheRoot(globalRoot: string): string {
  return path.join(globalRoot, 'cache', 'skills');
}

function getCachedSkillsPackageDir(cacheRoot: string): string {
  return path.join(cacheRoot, 'node_modules', '@nocobase', 'skills');
}

function getCachedSkillsPackRoot(cacheRoot: string): string {
  return path.join(cacheRoot, 'pack');
}

function getCachedSkillsExtractRoot(cacheRoot: string): string {
  return path.join(cacheRoot, 'extract');
}

export function getManagedSkillsStateFile(workspaceRoot: string): string {
  return path.join(workspaceRoot, 'skills.json');
}

async function ensureSkillsWorkspaceRoot(workspaceRoot: string): Promise<void> {
  await fsp.mkdir(workspaceRoot, { recursive: true });
}

async function readManagedSkillsState(workspaceRoot: string): Promise<ManagedSkillsState | undefined> {
  const filePath = getManagedSkillsStateFile(workspaceRoot);
  try {
    const content = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(content) as ManagedSkillsState;
  } catch {
    return undefined;
  }
}

export async function readInstalledManagedSkillsVersion(options: SkillsManagerOptions = {}): Promise<string | undefined> {
  const globalRoot = resolveSkillsRoot(options);
  const state = await readManagedSkillsState(globalRoot);
  const installedVersion = String(state?.installedVersion ?? state?.installedRef ?? '').trim();
  return installedVersion || undefined;
}

async function writeManagedSkillsState(workspaceRoot: string, state: ManagedSkillsState): Promise<void> {
  const filePath = getManagedSkillsStateFile(workspaceRoot);
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, JSON.stringify(state, null, 2));
}

export async function listGlobalSkills(options: SkillsManagerOptions = {}): Promise<InstalledSkill[]> {
  const globalRoot = resolveSkillsRoot(options);
  await ensureSkillsWorkspaceRoot(globalRoot);
  const output = await (options.commandOutputFn ?? commandOutputViaFile)(
    'npx',
    ['-y', 'skills', 'list', '-g', '--json'],
    {
      cwd: globalRoot,
      errorName: 'skills list',
      timeoutMs: SKILLS_LIST_TIMEOUT_MS,
    },
  );
  const parsed = JSON.parse(output) as InstalledSkill[];
  return Array.isArray(parsed) ? parsed : [];
}

export async function listProjectSkills(options: SkillsManagerOptions = {}): Promise<InstalledSkill[]> {
  return await listGlobalSkills(options);
}

function pickInstalledNocoBaseSkillNames(
  installedSkills: InstalledSkill[],
  state?: ManagedSkillsState,
  sourceSkillNames: string[] = [],
): string[] {
  const installedNames = new Set(installedSkills.map((skill) => String(skill.name ?? '').trim()).filter(Boolean));
  const managedNames = new Set([...sourceSkillNames, ...(state?.skillNames ?? [])]);

  if (managedNames.size > 0) {
    return Array.from(managedNames)
      .filter((name) => installedNames.has(name))
      .sort();
  }

  return Array.from(installedNames)
    .filter((name) => name.startsWith(NOCOBASE_SKILLS_NAME_PREFIX))
    .sort();
}

async function readPublishedSkillsVersion(
  options: SkillsManagerOptions = {},
): Promise<{ version?: string; error?: string }> {
  const globalRoot = resolveSkillsRoot(options);
  await ensureSkillsWorkspaceRoot(globalRoot);
  try {
    const output = await (options.commandOutputFn ?? commandOutput)(
      'npm',
      ['view', NOCOBASE_SKILLS_PACKAGE_NAME, 'version', '--json'],
      {
        cwd: globalRoot,
        errorName: 'npm view',
        timeoutMs: SKILLS_NPM_VIEW_TIMEOUT_MS,
      },
    );
    const parsed = JSON.parse(output) as string;
    const version = String(parsed ?? '').trim();
    return { version: version || undefined };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function readCachedSkillsVersion(cacheRoot: string): Promise<string | undefined> {
  const packageJsonPath = path.join(getCachedSkillsPackageDir(cacheRoot), 'package.json');
  try {
    const content = await fsp.readFile(packageJsonPath, 'utf8');
    const parsed = JSON.parse(content) as { version?: string };
    const version = String(parsed.version ?? '').trim();
    return version || undefined;
  } catch {
    return undefined;
  }
}

async function readCachedPackageSkillNames(globalRoot: string): Promise<string[]> {
  const skillsDir = path.join(getCachedSkillsPackageDir(getSkillsCacheRoot(globalRoot)), 'skills');
  try {
    const entries = await fsp.readdir(skillsDir, { withFileTypes: true });
    const skillNames = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const skillName = entry.name.trim();
          if (!skillName) {
            return undefined;
          }

          try {
            await fsp.access(path.join(skillsDir, skillName, 'SKILL.md'));
            return skillName;
          } catch {
            return undefined;
          }
        }),
    );

    return skillNames.filter((name): name is string => Boolean(name)).sort();
  } catch {
    return [];
  }
}

async function resolvePackedSkillsTarball(packRoot: string): Promise<string> {
  const entries = await fsp.readdir(packRoot, { withFileTypes: true });
  const tarballs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tgz'))
    .map((entry) => path.join(packRoot, entry.name))
    .sort();

  if (tarballs.length === 1) {
    return tarballs[0];
  }

  if (tarballs.length === 0) {
    throw new Error(`npm pack did not produce a local tarball for ${NOCOBASE_SKILLS_PACKAGE_NAME}.`);
  }

  throw new Error(`npm pack produced multiple tarballs for ${NOCOBASE_SKILLS_PACKAGE_NAME}.`);
}

async function extractPackedSkillsTarball(
  tarballPath: string,
  cacheRoot: string,
  targetVersion?: string,
): Promise<string> {
  const packageDir = getCachedSkillsPackageDir(cacheRoot);
  const extractRoot = getCachedSkillsExtractRoot(cacheRoot);

  await fsp.rm(extractRoot, { recursive: true, force: true });
  await fsp.mkdir(extractRoot, { recursive: true });

  try {
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(tarballPath)
        .pipe(createGunzip())
        .pipe(tar.extract({ cwd: extractRoot, strip: 1 }))
        .on('finish', () => resolve())
        .on('error', reject);
    });

    const packageJsonPath = path.join(extractRoot, 'package.json');
    const packageJsonRaw = await fsp.readFile(packageJsonPath, 'utf8');
    const manifest = JSON.parse(packageJsonRaw) as { name?: string; version?: string };
    const packageName = String(manifest.name ?? '').trim();
    const packageVersion = String(manifest.version ?? '').trim();

    if (packageName !== NOCOBASE_SKILLS_PACKAGE_NAME) {
      throw new Error(
        `packed tarball resolved to ${
          packageName || '(missing package name)'
        } instead of ${NOCOBASE_SKILLS_PACKAGE_NAME}.`,
      );
    }

    if (targetVersion && packageVersion !== targetVersion) {
      throw new Error(
        `packed tarball resolved to version ${packageVersion || '(missing version)'} instead of ${targetVersion}.`,
      );
    }

    await fsp.rm(packageDir, { recursive: true, force: true });
    await fsp.mkdir(path.dirname(packageDir), { recursive: true });
    await fsp.rename(extractRoot, packageDir);
    return packageDir;
  } catch (error: unknown) {
    await fsp.rm(extractRoot, { recursive: true, force: true });
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`failed to extract ${NOCOBASE_SKILLS_PACKAGE_NAME} tarball: ${message}`);
  }
}

async function prepareLocalSkillsPackage(
  globalRoot: string,
  options: SkillsSyncOptions = {},
  targetVersion?: string,
): Promise<{ packageDir: string; cleanup: () => Promise<void> }> {
  const cacheRoot = getSkillsCacheRoot(globalRoot);
  const packageDir = getCachedSkillsPackageDir(cacheRoot);
  const packRoot = getCachedSkillsPackRoot(cacheRoot);
  const packageSpec = targetVersion ? `${NOCOBASE_SKILLS_PACKAGE_NAME}@${targetVersion}` : NOCOBASE_SKILLS_PACKAGE_NAME;
  const cachedVersion = await readCachedSkillsVersion(cacheRoot);

  await fsp.mkdir(cacheRoot, { recursive: true });

  if (targetVersion && cachedVersion && compareVersions(cachedVersion, targetVersion) === 0) {
    return {
      packageDir,
      cleanup: async () => undefined,
    };
  }

  await fsp.rm(packRoot, { recursive: true, force: true });
  await fsp.mkdir(packRoot, { recursive: true });

  try {
    await (options.runFn ?? run)('npm', ['pack', '--silent', packageSpec], {
      cwd: packRoot,
      stdio: options.verbose ? 'inherit' : 'ignore',
      errorName: 'npm pack',
      timeoutMs: SKILLS_PACK_TIMEOUT_MS,
    });
    const tarballPath = await resolvePackedSkillsTarball(packRoot);
    await extractPackedSkillsTarball(tarballPath, cacheRoot, targetVersion);
  } finally {
    await fsp.rm(packRoot, { recursive: true, force: true });
  }

  return {
    packageDir,
    cleanup: async () => undefined,
  };
}

export async function inspectSkillsStatus(options: SkillsManagerOptions = {}): Promise<SkillsStatus> {
  const globalRoot = resolveSkillsRoot(options);
  const stateFile = getManagedSkillsStateFile(globalRoot);
  const [installedSkills, managedState, cachedSkillNames] = await Promise.all([
    listGlobalSkills({
      globalRoot,
      commandOutputFn: options.commandOutputFn,
    }),
    readManagedSkillsState(globalRoot),
    readCachedPackageSkillNames(globalRoot),
  ]);
  const installedSkillNames = pickInstalledNocoBaseSkillNames(installedSkills, managedState, cachedSkillNames);
  const packageSkillNames = cachedSkillNames;
  const managedByNb = managedState?.packageName === NOCOBASE_SKILLS_PACKAGE_NAME;

  let latestVersion: string | undefined;
  let registryError: string | undefined;
  let updateAvailable: boolean | null = installedSkillNames.length > 0 ? null : false;

  if (installedSkillNames.length > 0 || managedByNb) {
    const published = await readPublishedSkillsVersion({
      globalRoot,
      commandOutputFn: options.commandOutputFn,
    });
    latestVersion = published.version;
    registryError = published.error;

    const installedVersion = managedState?.installedVersion ?? managedState?.installedRef;
    if (installedVersion && latestVersion) {
      updateAvailable = compareVersions(latestVersion, installedVersion) > 0;
    }
  }

  const installedVersion = managedState?.installedVersion ?? managedState?.installedRef;

  return {
    globalRoot,
    workspaceRoot: globalRoot,
    stateFile,
    installed: installedSkillNames.length > 0,
    managedByNb,
    sourcePackage: managedState?.sourcePackage ?? NOCOBASE_SKILLS_SOURCE,
    npmPackageName: managedState?.packageName ?? NOCOBASE_SKILLS_PACKAGE_NAME,
    packageSkillNames,
    installedSkillNames,
    latestVersion,
    installedVersion,
    latestRef: latestVersion,
    installedRef: installedVersion,
    updateAvailable,
    registryError,
  };
}

async function persistManagedSkillsState(
  globalRoot: string,
  options: SkillsManagerOptions = {},
  installedVersion?: string,
): Promise<SkillsStatus> {
  const [installedSkills, managedState, cachedSkillNames] = await Promise.all([
    listGlobalSkills({
      globalRoot,
      commandOutputFn: options.commandOutputFn,
    }),
    readManagedSkillsState(globalRoot),
    readCachedPackageSkillNames(globalRoot),
  ]);
  const installedSkillNames = pickInstalledNocoBaseSkillNames(installedSkills, managedState, cachedSkillNames);
  const packageSkillNames = cachedSkillNames.length ? cachedSkillNames : installedSkillNames;
  const cachedVersion = await readCachedSkillsVersion(getSkillsCacheRoot(globalRoot));
  const published = await readPublishedSkillsVersion({
    globalRoot,
    commandOutputFn: options.commandOutputFn,
  });
  const now = new Date().toISOString();

  await writeManagedSkillsState(globalRoot, {
    packageName: NOCOBASE_SKILLS_PACKAGE_NAME,
    sourcePackage: NOCOBASE_SKILLS_SOURCE,
    installedAt: managedState?.installedAt ?? now,
    updatedAt: now,
    installedVersion: installedVersion ?? cachedVersion ?? published.version,
    skillNames: packageSkillNames,
  });

  return await inspectSkillsStatus({
    globalRoot,
    commandOutputFn: options.commandOutputFn,
  });
}

async function reinstallManagedSkills(
  globalRoot: string,
  options: SkillsSyncOptions = {},
  targetVersion?: string,
): Promise<void> {
  const prepared = await prepareLocalSkillsPackage(globalRoot, options, targetVersion);
  try {
    await (options.runFn ?? run)('npx', ['-y', 'skills', 'add', prepared.packageDir, '-g', '-y', '--skill', '*'], {
      cwd: globalRoot,
      stdio: options.verbose ? 'inherit' : 'ignore',
      errorName: 'skills add',
      timeoutMs: SKILLS_ADD_TIMEOUT_MS,
    });
  } finally {
    await prepared.cleanup();
  }
}

function pickObsoleteManagedSkillNames(installedSkillNames: string[], packageSkillNames: string[]): string[] {
  if (!packageSkillNames.length) {
    return [];
  }

  const packageSkillNameSet = new Set(packageSkillNames);
  return installedSkillNames.filter((skillName) => !packageSkillNameSet.has(skillName)).sort();
}

async function removeObsoleteManagedSkills(
  globalRoot: string,
  installedSkillNames: string[],
  options: SkillsSyncOptions = {},
): Promise<void> {
  const packageSkillNames = await readCachedPackageSkillNames(globalRoot);
  const obsoleteSkillNames = pickObsoleteManagedSkillNames(installedSkillNames, packageSkillNames);

  for (const skillName of obsoleteSkillNames) {
    await (options.runFn ?? run)('npx', ['-y', 'skills', 'remove', skillName, '-g', '-y'], {
      cwd: globalRoot,
      stdio: options.verbose ? 'inherit' : 'ignore',
      errorName: 'skills remove',
    });
  }
}

export async function installNocoBaseSkills(options: SkillsSyncOptions = {}): Promise<{
  action: 'installed' | 'noop';
  status: SkillsStatus;
}> {
  const globalRoot = resolveSkillsRoot(options);
  const status = await inspectSkillsStatus({
    globalRoot,
    commandOutputFn: options.commandOutputFn,
  });
  const cachedSkillNames = await readCachedPackageSkillNames(globalRoot);
  const missingCachedSkillNames = cachedSkillNames.filter((name) => !status.installedSkillNames.includes(name));
  const obsoleteSkillNames = pickObsoleteManagedSkillNames(status.installedSkillNames, cachedSkillNames);
  const targetVersion = String(options.targetVersion ?? '').trim() || undefined;
  const targetVersionMatches = !targetVersion || status.installedVersion === targetVersion;

  if (status.installed && targetVersionMatches && missingCachedSkillNames.length === 0 && obsoleteSkillNames.length === 0) {
    return {
      action: 'noop',
      status,
    };
  }

  await ensureSkillsWorkspaceRoot(globalRoot);
  if (!status.installed || !targetVersionMatches || missingCachedSkillNames.length > 0) {
    const installVersion = targetVersion ?? status.latestVersion;
    await reinstallManagedSkills(globalRoot, options, installVersion);
  }
  await removeObsoleteManagedSkills(globalRoot, status.installedSkillNames, options);

  return {
    action: 'installed',
    status: await persistManagedSkillsState(globalRoot, options, targetVersion),
  };
}

export async function updateNocoBaseSkills(options: SkillsSyncOptions = {}): Promise<
  | {
      action: 'updated';
      status: SkillsStatus;
    }
  | {
      action: 'noop';
      reason: 'not-installed' | 'up-to-date';
      status: SkillsStatus;
    }
> {
  const globalRoot = resolveSkillsRoot(options);
  const status = await inspectSkillsStatus({
    globalRoot,
    commandOutputFn: options.commandOutputFn,
  });
  const cachedSkillNames = await readCachedPackageSkillNames(globalRoot);
  const missingCachedSkillNames = cachedSkillNames.filter((name) => !status.installedSkillNames.includes(name));
  const obsoleteSkillNames = pickObsoleteManagedSkillNames(status.installedSkillNames, cachedSkillNames);
  const targetVersion = String(options.targetVersion ?? '').trim() || undefined;

  if (!status.installed) {
    return {
      action: 'noop',
      reason: 'not-installed',
      status,
    };
  }

  if (
    status.managedByNb &&
    !targetVersion &&
    status.latestVersion &&
    status.installedVersion &&
    missingCachedSkillNames.length === 0 &&
    obsoleteSkillNames.length === 0 &&
    compareVersions(status.latestVersion, status.installedVersion) <= 0
  ) {
    return {
      action: 'noop',
      reason: 'up-to-date',
      status,
    };
  }

  if (
    targetVersion &&
    status.installedVersion === targetVersion &&
    missingCachedSkillNames.length === 0 &&
    obsoleteSkillNames.length === 0
  ) {
    return {
      action: 'noop',
      reason: 'up-to-date',
      status,
    };
  }

  if (!targetVersion || status.installedVersion !== targetVersion || missingCachedSkillNames.length > 0) {
    const installVersion = targetVersion ?? status.latestVersion;
    await reinstallManagedSkills(globalRoot, options, installVersion);
  }
  await removeObsoleteManagedSkills(globalRoot, status.installedSkillNames, options);

  return {
    action: 'updated',
    status: await persistManagedSkillsState(globalRoot, options, targetVersion),
  };
}

export async function removeNocoBaseSkills(options: SkillsSyncOptions = {}): Promise<{
  action: 'removed' | 'noop';
  status: SkillsStatus;
}> {
  const globalRoot = resolveSkillsRoot(options);
  const status = await inspectSkillsStatus({
    globalRoot,
    commandOutputFn: options.commandOutputFn,
  });

  if (!status.installed || status.installedSkillNames.length === 0) {
    return {
      action: 'noop',
      status,
    };
  }

  for (const skillName of status.installedSkillNames) {
    await (options.runFn ?? run)('npx', ['-y', 'skills', 'remove', skillName, '-g', '-y'], {
      cwd: globalRoot,
      stdio: options.verbose ? 'inherit' : 'ignore',
      errorName: 'skills remove',
    });
  }

  await fsp.rm(getManagedSkillsStateFile(globalRoot), { force: true });

  return {
    action: 'removed',
    status: await inspectSkillsStatus({
      globalRoot,
      commandOutputFn: options.commandOutputFn,
    }),
  };
}
