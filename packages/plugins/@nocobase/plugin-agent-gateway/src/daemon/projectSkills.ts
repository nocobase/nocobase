/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { promises as fs } from 'fs';

import { AgentProviderKey } from '../shared/providerCapabilities';
import { JsonRecord } from './types';
import { SyncNodeSkillVersionResult } from './skillSync';

export interface ProjectSkillInstallRecord {
  skillVersionId: string;
  skillName: string;
  sourcePath: string;
  targetPath: string;
  sourceDigest: string;
}

export interface ProjectSkillSkippedRecord {
  skillVersionId: string;
  skillName: string;
  targetPath: string;
  sourceDigest: string;
  reason: 'existing_project_skill';
}

export interface ProjectSkillRunState {
  cwd: string;
  runId: string;
  stagingRoot: string;
  installed: ProjectSkillInstallRecord[];
  skipped: ProjectSkillSkippedRecord[];
}

export interface ProjectSkillCleanupResult {
  removed: ProjectSkillInstallRecord[];
  skipped: ProjectSkillInstallRecord[];
  existing: ProjectSkillSkippedRecord[];
  warnings: string[];
}

export interface ProjectSkillJanitorResult {
  removedPaths: string[];
  warnings: string[];
}

const PROJECT_SKILL_MARKER = '.agent-gateway-install.json';
const PROJECT_SKILL_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

interface ProjectSkillMarker {
  managedBy: 'agent-gateway';
  runId: string;
  skillVersionId: string;
  skillName: string;
  sourceDigest: string;
  installedAt: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function createStagingRoot(cwd: string, runId: string) {
  return path.join(cwd, '.agent-gateway', 'runs', runId, 'skill-source');
}

export function createProjectSkillRunState(cwd: string, runId: string): ProjectSkillRunState {
  return {
    cwd,
    runId,
    stagingRoot: createStagingRoot(cwd, runId),
    installed: [],
    skipped: [],
  };
}

function assertSafeSkillName(skillName: string) {
  if (!PROJECT_SKILL_NAME_PATTERN.test(skillName) || skillName === '.' || skillName === '..') {
    throw new Error(`Skill name is not safe for project installation: ${skillName || '(empty)'}`);
  }
}

function stripYamlScalarQuotes(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getSkillNameFromSkillMd(content: string) {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) {
    throw new Error('Skill SKILL.md must include frontmatter with a name field');
  }
  for (const rawLine of frontmatter[1].split(/\r?\n/)) {
    const match = rawLine.match(/^name:\s*(.+?)\s*$/);
    if (match) {
      const skillName = stripYamlScalarQuotes(match[1]);
      assertSafeSkillName(skillName);
      return skillName;
    }
  }
  throw new Error('Skill SKILL.md frontmatter must include a name field');
}

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findSkillMd(root: string): Promise<string | null> {
  const directPath = path.join(root, 'SKILL.md');
  if (await pathExists(directPath)) {
    return directPath;
  }
  let entries: Awaited<ReturnType<typeof fs.readdir>>;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) {
      continue;
    }
    const nested = await findSkillMd(path.join(root, entry.name));
    if (nested) {
      return nested;
    }
  }
  return null;
}

async function readProjectSkillMarker(skillDir: string): Promise<ProjectSkillMarker | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(skillDir, PROJECT_SKILL_MARKER), 'utf8')) as unknown;
    if (!isRecord(parsed) || parsed.managedBy !== 'agent-gateway') {
      return null;
    }
    const runId = getString(parsed.runId);
    const skillVersionId = getString(parsed.skillVersionId);
    const skillName = getString(parsed.skillName);
    const sourceDigest = getString(parsed.sourceDigest);
    const installedAt = getString(parsed.installedAt);
    if (!runId || !skillVersionId || !skillName || !sourceDigest || !installedAt) {
      return null;
    }
    return {
      managedBy: 'agent-gateway',
      runId,
      skillVersionId,
      skillName,
      sourceDigest,
      installedAt,
    };
  } catch {
    return null;
  }
}

async function writeProjectSkillMarker(skillDir: string, marker: ProjectSkillMarker) {
  await fs.writeFile(path.join(skillDir, PROJECT_SKILL_MARKER), `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
}

function resolveSkillTarget(cwd: string, targetDir: string, skillName: string) {
  return path.resolve(cwd, targetDir, skillName);
}

export async function installProjectSkillsForRun(options: {
  state: ProjectSkillRunState;
  provider: AgentProviderKey | null;
  projectSkillTargetDirs: string[];
  syncResults: SyncNodeSkillVersionResult[];
}) {
  if (!options.syncResults.length) {
    return options.state;
  }
  if (!options.projectSkillTargetDirs.length) {
    throw new Error(`Agent provider does not support temporary project skills: ${options.provider || 'unknown'}`);
  }

  for (const syncResult of options.syncResults) {
    const skillMdPath = await findSkillMd(syncResult.installPath);
    if (!skillMdPath) {
      throw new Error(`Synced Skill version has no SKILL.md: ${syncResult.skillVersionId}`);
    }
    const skillName = getSkillNameFromSkillMd(await fs.readFile(skillMdPath, 'utf8'));
    const sourcePath = path.dirname(skillMdPath);
    for (const targetDir of options.projectSkillTargetDirs) {
      const targetPath = resolveSkillTarget(options.state.cwd, targetDir, skillName);
      if (await pathExists(targetPath)) {
        const existingMarker = await readProjectSkillMarker(targetPath);
        if (existingMarker) {
          await fs.rm(targetPath, { recursive: true, force: true });
        } else {
          options.state.skipped.push({
            skillVersionId: syncResult.skillVersionId,
            skillName,
            targetPath,
            sourceDigest: syncResult.sourceDigest,
            reason: 'existing_project_skill',
          });
          continue;
        }
      }
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.cp(sourcePath, targetPath, { recursive: true, force: false, errorOnExist: true });
      await writeProjectSkillMarker(targetPath, {
        managedBy: 'agent-gateway',
        runId: options.state.runId,
        skillVersionId: syncResult.skillVersionId,
        skillName,
        sourceDigest: syncResult.sourceDigest,
        installedAt: new Date().toISOString(),
      });
      options.state.installed.push({
        skillVersionId: syncResult.skillVersionId,
        skillName,
        sourcePath,
        targetPath,
        sourceDigest: syncResult.sourceDigest,
      });
    }
  }

  return options.state;
}

export async function cleanupProjectSkillsForRun(state: ProjectSkillRunState): Promise<ProjectSkillCleanupResult> {
  const result: ProjectSkillCleanupResult = {
    removed: [],
    skipped: [],
    existing: [...state.skipped],
    warnings: [],
  };
  for (const installed of state.installed) {
    const marker = await readProjectSkillMarker(installed.targetPath);
    if (marker?.runId === state.runId && marker.skillVersionId === installed.skillVersionId) {
      await fs.rm(installed.targetPath, { recursive: true, force: true });
      result.removed.push(installed);
    } else {
      result.skipped.push(installed);
      result.warnings.push(`Skipped cleanup for changed project Skill: ${installed.targetPath}`);
    }
  }
  await fs.rm(state.stagingRoot, { recursive: true, force: true });
  return result;
}

export async function cleanupStaleProjectSkills(options: {
  cwd: string;
  runId: string;
  projectSkillTargetDirs: string[];
}): Promise<ProjectSkillJanitorResult> {
  const result: ProjectSkillJanitorResult = {
    removedPaths: [],
    warnings: [],
  };
  for (const targetDir of options.projectSkillTargetDirs) {
    const root = path.resolve(options.cwd, targetDir);
    let entries: Awaited<ReturnType<typeof fs.readdir>>;
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const skillDir = path.join(root, entry.name);
      const marker = await readProjectSkillMarker(skillDir);
      if (!marker || marker.runId === options.runId) {
        continue;
      }
      try {
        await fs.rm(skillDir, { recursive: true, force: true });
        result.removedPaths.push(skillDir);
      } catch (error) {
        result.warnings.push(
          `Failed to remove stale Agent Gateway project Skill ${skillDir}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }
  return result;
}
