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
import { resolveCliHomeDir } from './cli-home.js';
import { compareVersions } from './self-manager.js';
import { commandOutput, run } from './run-npm.js';

export const NOCOBASE_SKILLS_SOURCE = 'nocobase/skills';
export const NOCOBASE_SKILLS_PACKAGE_NAME = '@nocobase/skills';
const NOCOBASE_SKILLS_NAME_PREFIX = 'nocobase-';

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
  verbose?: boolean;
};

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

async function writeManagedSkillsState(workspaceRoot: string, state: ManagedSkillsState): Promise<void> {
  const filePath = getManagedSkillsStateFile(workspaceRoot);
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, JSON.stringify(state, null, 2));
}

export async function listGlobalSkills(options: SkillsManagerOptions = {}): Promise<InstalledSkill[]> {
  const globalRoot = resolveSkillsRoot(options);
  await ensureSkillsWorkspaceRoot(globalRoot);
  const output = await (options.commandOutputFn ?? commandOutput)('npx', ['-y', 'skills', 'list', '-g', '--json'], {
    cwd: globalRoot,
    errorName: 'skills list',
  });
  const parsed = JSON.parse(output) as InstalledSkill[];
  return Array.isArray(parsed) ? parsed : [];
}

export async function listProjectSkills(options: SkillsManagerOptions = {}): Promise<InstalledSkill[]> {
  return await listGlobalSkills(options);
}

function pickInstalledNocoBaseSkillNames(installedSkills: InstalledSkill[], state?: ManagedSkillsState): string[] {
  const installedNames = new Set(installedSkills.map((skill) => String(skill.name ?? '').trim()).filter(Boolean));

  if (state?.skillNames?.length) {
    return state.skillNames.filter((name) => installedNames.has(name)).sort();
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
  const packageJsonPath = path.join(cacheRoot, 'node_modules', '@nocobase', 'skills', 'package.json');
  try {
    const content = await fsp.readFile(packageJsonPath, 'utf8');
    const parsed = JSON.parse(content) as { version?: string };
    const version = String(parsed.version ?? '').trim();
    return version || undefined;
  } catch {
    return undefined;
  }
}

async function prepareLocalSkillsPackage(
  globalRoot: string,
  options: SkillsSyncOptions = {},
  targetVersion?: string,
): Promise<{ packageDir: string; cleanup: () => Promise<void> }> {
  const cacheRoot = getSkillsCacheRoot(globalRoot);
  const packageDir = path.join(cacheRoot, 'node_modules', '@nocobase', 'skills');
  const packageSpec = targetVersion ? `${NOCOBASE_SKILLS_PACKAGE_NAME}@${targetVersion}` : NOCOBASE_SKILLS_PACKAGE_NAME;
  const cachedVersion = await readCachedSkillsVersion(cacheRoot);

  await fsp.mkdir(cacheRoot, { recursive: true });

  if (targetVersion && cachedVersion && compareVersions(cachedVersion, targetVersion) === 0) {
    return {
      packageDir,
      cleanup: async () => undefined,
    };
  }

  await fsp.rm(path.join(cacheRoot, 'node_modules'), { recursive: true, force: true });

  await (options.runFn ?? run)(
    'npm',
    ['install', '--no-save', '--ignore-scripts', '--no-package-lock', packageSpec],
    {
      cwd: cacheRoot,
      stdio: options.verbose ? 'inherit' : 'ignore',
      errorName: 'npm install',
    },
  );

  try {
    await fsp.access(packageDir);
  } catch {
    throw new Error(`npm install did not produce a local ${NOCOBASE_SKILLS_PACKAGE_NAME} package.`);
  }

  return {
    packageDir,
    cleanup: async () => undefined,
  };
}

export async function inspectSkillsStatus(options: SkillsManagerOptions = {}): Promise<SkillsStatus> {
  const globalRoot = resolveSkillsRoot(options);
  const stateFile = getManagedSkillsStateFile(globalRoot);
  const [installedSkills, managedState] = await Promise.all([
    listGlobalSkills({
      globalRoot,
      commandOutputFn: options.commandOutputFn,
    }),
    readManagedSkillsState(globalRoot),
  ]);
  const installedSkillNames = pickInstalledNocoBaseSkillNames(installedSkills, managedState);
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
): Promise<SkillsStatus> {
  const installedSkills = await listGlobalSkills({
    globalRoot,
    commandOutputFn: options.commandOutputFn,
  });
  const managedState = await readManagedSkillsState(globalRoot);
  const installedSkillNames = pickInstalledNocoBaseSkillNames(installedSkills, managedState);
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
    installedVersion: published.version,
    skillNames: installedSkillNames,
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
    await (options.runFn ?? run)('npx', ['-y', 'skills', 'add', prepared.packageDir, '-g', '-y'], {
      cwd: globalRoot,
      stdio: options.verbose ? 'inherit' : 'ignore',
      errorName: 'skills add',
    });
  } finally {
    await prepared.cleanup();
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

  if (status.installed) {
    return {
      action: 'noop',
      status,
    };
  }

  await ensureSkillsWorkspaceRoot(globalRoot);
  await reinstallManagedSkills(globalRoot, options, status.latestVersion);

  return {
    action: 'installed',
    status: await persistManagedSkillsState(globalRoot, options),
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

  if (!status.installed) {
    return {
      action: 'noop',
      reason: 'not-installed',
      status,
    };
  }

  if (
    status.managedByNb
    && status.latestVersion
    && status.installedVersion
    && compareVersions(status.latestVersion, status.installedVersion) <= 0
  ) {
    return {
      action: 'noop',
      reason: 'up-to-date',
      status,
    };
  }

  await reinstallManagedSkills(globalRoot, options, status.latestVersion);

  return {
    action: 'updated',
    status: await persistManagedSkillsState(globalRoot, options),
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
