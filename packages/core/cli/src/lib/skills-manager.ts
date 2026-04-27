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
import { commandOutput, run } from './run-npm.js';

export const NOCOBASE_SKILLS_PACKAGE = 'nocobase/skills';
export const NOCOBASE_SKILLS_REPO_URL = 'https://github.com/nocobase/skills.git';
const NOCOBASE_SKILLS_NAME_PREFIX = 'nocobase-';

export type InstalledSkill = {
  name: string;
  path?: string;
  scope?: string;
  agents?: string[];
};

export type ManagedSkillsState = {
  packageName: string;
  repoUrl: string;
  installedAt: string;
  updatedAt: string;
  installedRef?: string;
  skillNames: string[];
};

export type SkillsStatus = {
  workspaceRoot: string;
  stateFile: string;
  installed: boolean;
  managedByNb: boolean;
  sourcePackage: string;
  installedSkillNames: string[];
  latestRef?: string;
  installedRef?: string;
  updateAvailable: boolean | null;
  registryError?: string;
};

type SkillsManagerOptions = {
  commandOutputFn?: typeof commandOutput;
  workspaceRoot?: string;
};

type SkillsSyncOptions = SkillsManagerOptions & {
  runFn?: typeof run;
};

function normalizePath(value: string): string {
  return path.resolve(value);
}

export function resolveSkillsWorkspaceRoot(_startCwd = process.cwd()): string {
  return normalizePath(resolveCliHomeDir('global'));
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

export async function listProjectSkills(options: SkillsManagerOptions = {}): Promise<InstalledSkill[]> {
  const workspaceRoot = options.workspaceRoot ? normalizePath(options.workspaceRoot) : resolveSkillsWorkspaceRoot();
  await ensureSkillsWorkspaceRoot(workspaceRoot);
  const output = await (options.commandOutputFn ?? commandOutput)('npx', ['-y', 'skills', 'list', '-g', '--json'], {
    cwd: workspaceRoot,
    errorName: 'skills list',
  });
  const parsed = JSON.parse(output) as InstalledSkill[];
  return Array.isArray(parsed) ? parsed : [];
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

export async function readNocoBaseSkillsHeadRef(
  options: SkillsManagerOptions = {},
): Promise<{ ref?: string; error?: string }> {
  const workspaceRoot = options.workspaceRoot ? normalizePath(options.workspaceRoot) : resolveSkillsWorkspaceRoot();
  await ensureSkillsWorkspaceRoot(workspaceRoot);
  try {
    const output = await (options.commandOutputFn ?? commandOutput)(
      'git',
      ['ls-remote', NOCOBASE_SKILLS_REPO_URL, 'HEAD'],
      {
        cwd: workspaceRoot,
        errorName: 'git ls-remote',
      },
    );
    const ref = output.trim().split(/\s+/)[0];
    return { ref: ref || undefined };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function inspectSkillsStatus(options: SkillsManagerOptions = {}): Promise<SkillsStatus> {
  const workspaceRoot = options.workspaceRoot ? normalizePath(options.workspaceRoot) : resolveSkillsWorkspaceRoot();
  const stateFile = getManagedSkillsStateFile(workspaceRoot);
  const [installedSkills, managedState] = await Promise.all([
    listProjectSkills({
      workspaceRoot,
      commandOutputFn: options.commandOutputFn,
    }),
    readManagedSkillsState(workspaceRoot),
  ]);
  const installedSkillNames = pickInstalledNocoBaseSkillNames(installedSkills, managedState);
  const managedByNb = managedState?.packageName === NOCOBASE_SKILLS_PACKAGE;

  let latestRef: string | undefined;
  let registryError: string | undefined;
  let updateAvailable: boolean | null = installedSkillNames.length > 0 ? null : false;

  if (installedSkillNames.length > 0 || managedByNb) {
    const remote = await readNocoBaseSkillsHeadRef({
      workspaceRoot,
      commandOutputFn: options.commandOutputFn,
    });
    latestRef = remote.ref;
    registryError = remote.error;

    if (managedState?.installedRef && latestRef) {
      updateAvailable = latestRef !== managedState.installedRef;
    }
  }

  return {
    workspaceRoot,
    stateFile,
    installed: installedSkillNames.length > 0,
    managedByNb,
    sourcePackage: NOCOBASE_SKILLS_PACKAGE,
    installedSkillNames,
    latestRef,
    installedRef: managedState?.installedRef,
    updateAvailable,
    registryError,
  };
}

function formatSkillsNotInstalledMessage(): string {
  return [
    'NocoBase AI coding skills are not installed globally.',
    'Run `nb skills install` first.',
  ].join('\n');
}

async function persistManagedSkillsState(
  workspaceRoot: string,
  options: SkillsManagerOptions = {},
): Promise<SkillsStatus> {
  const installedSkills = await listProjectSkills({
    workspaceRoot,
    commandOutputFn: options.commandOutputFn,
  });
  const managedState = await readManagedSkillsState(workspaceRoot);
  const installedSkillNames = pickInstalledNocoBaseSkillNames(installedSkills, managedState);
  const remote = await readNocoBaseSkillsHeadRef({
    workspaceRoot,
    commandOutputFn: options.commandOutputFn,
  });
  const now = new Date().toISOString();

  await writeManagedSkillsState(workspaceRoot, {
    packageName: NOCOBASE_SKILLS_PACKAGE,
    repoUrl: NOCOBASE_SKILLS_REPO_URL,
    installedAt: managedState?.installedAt ?? now,
    updatedAt: now,
    installedRef: remote.ref,
    skillNames: installedSkillNames,
  });

  return await inspectSkillsStatus({
    workspaceRoot,
    commandOutputFn: options.commandOutputFn,
  });
}

export async function installNocoBaseSkills(options: SkillsSyncOptions = {}): Promise<{
  action: 'installed' | 'noop';
  status: SkillsStatus;
}> {
  const workspaceRoot = options.workspaceRoot ? normalizePath(options.workspaceRoot) : resolveSkillsWorkspaceRoot();
  const status = await inspectSkillsStatus({
    workspaceRoot,
    commandOutputFn: options.commandOutputFn,
  });

  if (status.installed) {
    return {
      action: 'noop',
      status,
    };
  }

  await ensureSkillsWorkspaceRoot(workspaceRoot);
  await (options.runFn ?? run)('npx', ['-y', 'skills', 'add', NOCOBASE_SKILLS_PACKAGE, '-g', '-y'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    errorName: 'skills add',
  });

  return {
    action: 'installed',
    status: await persistManagedSkillsState(workspaceRoot, options),
  };
}

export async function updateNocoBaseSkills(options: SkillsSyncOptions = {}): Promise<{
  action: 'updated' | 'noop';
  status: SkillsStatus;
}> {
  const workspaceRoot = options.workspaceRoot ? normalizePath(options.workspaceRoot) : resolveSkillsWorkspaceRoot();
  const status = await inspectSkillsStatus({
    workspaceRoot,
    commandOutputFn: options.commandOutputFn,
  });

  if (!status.installed) {
    throw new Error(formatSkillsNotInstalledMessage());
  }

  if (
    status.managedByNb
    && status.latestRef
    && status.installedRef
    && status.latestRef === status.installedRef
  ) {
    return {
      action: 'noop',
      status,
    };
  }

  await (options.runFn ?? run)(
    'npx',
    ['-y', 'skills', 'update', '-g', '-y', ...status.installedSkillNames],
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
      errorName: 'skills update',
    },
  );

  return {
    action: 'updated',
    status: await persistManagedSkillsState(workspaceRoot, options),
  };
}
