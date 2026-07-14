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

import type { AgentGatewayDaemonNodeClient } from '../gateway';
import type { ProjectSkillCleanupResult, ProjectSkillRunState } from '../projectSkills';
import {
  syncNodeSkillVersion,
  type SkillVersionInstallRecord,
  type SkillVersionSource,
  type SyncNodeSkillVersionResult,
} from '../skillSync';
import type { ClaimedRunLease, RunLease } from '../types';
import { getPayload } from '../executionCommand';
import { throwIfSignalAborted } from './leaseHeartbeat';

const SUMMARY_ARRAY_SAMPLE_LIMIT = 20;

export type SkillSyncFunction = typeof syncNodeSkillVersion;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isWithin(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isSkillVersionSource(value: unknown): value is SkillVersionSource {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type === 'zip') {
    return (
      typeof value.sha256 === 'string' &&
      (typeof value.archivePath === 'string' || typeof value.archiveUrl === 'string')
    );
  }
  if (value.type === 'github') {
    return typeof value.repoUrl === 'string';
  }
  return false;
}

export async function resolveWorkspaceCwd(workspaceRoot: string, value: unknown) {
  const cwd = getString(value) || '.';
  if (path.isAbsolute(cwd)) {
    throw new Error('cwd must be relative to the configured workspace root');
  }
  const requestedCwd = path.resolve(workspaceRoot, cwd);
  const [realWorkspaceRoot, realCwd] = await Promise.all([fs.realpath(workspaceRoot), fs.realpath(requestedCwd)]);
  if (!isWithin(realWorkspaceRoot, realCwd)) {
    throw new Error('cwd must stay inside the configured workspace root');
  }
  return realCwd;
}

export function getSkillVersions(payload: ClaimedRunLease['run']['executionPayloadJson']) {
  const versions: SkillVersionInstallRecord[] = [];
  const appendVersion = (value: unknown) => {
    if (!isRecord(value) || typeof value.skillVersionId !== 'string' || !isSkillVersionSource(value.source)) {
      return;
    }
    versions.push({
      skillVersionId: value.skillVersionId,
      versionLabel: getString(value.versionLabel) || value.skillVersionId,
      source: value.source,
    });
  };

  appendVersion(payload.skillVersion);
  if (Array.isArray(payload.skillVersions)) {
    for (const value of payload.skillVersions) {
      appendVersion(value);
    }
  }
  return versions;
}

function compactProjectSkillState(projectSkillState: ProjectSkillRunState | null) {
  if (!projectSkillState) {
    return {};
  }
  return {
    projectSkillInstall: {
      stagingRoot: projectSkillState.stagingRoot,
      installed: projectSkillState.installed.map((item) => ({
        skillVersionId: item.skillVersionId,
        skillName: item.skillName,
        targetPath: item.targetPath,
        sourceDigest: item.sourceDigest,
      })),
      skipped: projectSkillState.skipped.map((item) => ({
        skillVersionId: item.skillVersionId,
        skillName: item.skillName,
        targetPath: item.targetPath,
        sourceDigest: item.sourceDigest,
        reason: item.reason,
      })),
    },
  };
}

export function withInstalledSkillMetadata(
  lease: ClaimedRunLease,
  syncResults: SyncNodeSkillVersionResult[],
  projectSkillState: ProjectSkillRunState | null,
): ClaimedRunLease {
  if (!syncResults.length && !projectSkillState) {
    return lease;
  }
  const run = lease.run;
  const payload = getPayload(lease);
  return {
    ...lease,
    run: {
      ...run,
      executionPayloadJson: {
        ...payload,
        installedSkills: syncResults.map((result) => ({
          skillVersionId: result.skillVersionId,
          installPath: result.installPath,
          skillMdPath: path.join(result.installPath, 'SKILL.md'),
          status: result.status,
          sourceDigest: result.sourceDigest,
        })),
        ...compactProjectSkillState(projectSkillState),
      },
    },
  };
}

function dedupeSkillVersions(skillVersions: SkillVersionInstallRecord[]) {
  const result: SkillVersionInstallRecord[] = [];
  const seen = new Set<string>();
  for (const skillVersion of skillVersions) {
    if (!seen.has(skillVersion.skillVersionId)) {
      result.push(skillVersion);
      seen.add(skillVersion.skillVersionId);
    }
  }
  return result;
}

export async function syncSkillsForRun(
  options: {
    gateway: AgentGatewayDaemonNodeClient;
    skillsRoot: string;
    syncSkillVersion?: SkillSyncFunction;
  },
  lease: RunLease,
  skillsRoot = options.skillsRoot,
  signal?: AbortSignal,
): Promise<SyncNodeSkillVersionResult[]> {
  const payload = getPayload(lease);
  const skillVersions = dedupeSkillVersions(getSkillVersions(payload));
  const results: SyncNodeSkillVersionResult[] = [];
  for (const skillVersion of skillVersions) {
    throwIfSignalAborted(signal);
    results.push(
      await (options.syncSkillVersion || syncNodeSkillVersion)({
        nodeId: options.gateway.nodeId,
        skillsRoot,
        skillVersion,
        downloadHeaders: options.gateway.getNodeAuthHeaders(),
        trustedArchiveServerUrl: options.gateway.serverUrl,
        signal,
        writeInstallStatus: async (installPayload) => {
          await options.gateway.upsertSkillInstall(installPayload);
        },
      }),
    );
  }
  throwIfSignalAborted(signal);
  return results;
}

export function compactProjectSkillCleanupResult(result: ProjectSkillCleanupResult) {
  return {
    removedCount: result.removed.length,
    skippedCount: result.skipped.length,
    existingCount: result.existing.length,
    warningCount: result.warnings.length,
    removed: result.removed.slice(0, SUMMARY_ARRAY_SAMPLE_LIMIT).map((item) => ({
      skillVersionId: item.skillVersionId,
      skillName: item.skillName,
      targetPath: item.targetPath,
    })),
    skipped: result.skipped.slice(0, SUMMARY_ARRAY_SAMPLE_LIMIT).map((item) => ({
      skillVersionId: item.skillVersionId,
      skillName: item.skillName,
      targetPath: item.targetPath,
    })),
    existing: result.existing.slice(0, SUMMARY_ARRAY_SAMPLE_LIMIT).map((item) => ({
      skillVersionId: item.skillVersionId,
      skillName: item.skillName,
      targetPath: item.targetPath,
    })),
  };
}

export function compactProjectSkillJanitorResult(result: { removedPaths: string[]; warnings: string[] }) {
  return {
    removedCount: result.removedPaths.length,
    warningCount: result.warnings.length,
    removedPaths: result.removedPaths.slice(0, SUMMARY_ARRAY_SAMPLE_LIMIT),
  };
}

export async function markProjectSkillsRemoved(options: {
  gateway: AgentGatewayDaemonNodeClient;
  nodeId: string;
  cleanupResult: ProjectSkillCleanupResult;
}) {
  for (const removed of [...options.cleanupResult.removed, ...options.cleanupResult.existing]) {
    await options.gateway.upsertSkillInstall({
      nodeId: options.nodeId,
      skillVersionId: removed.skillVersionId,
      status: 'removed',
      lastSeenAt: new Date().toISOString(),
      capabilitiesSnapshotJson: {
        projectSkillPath: removed.targetPath,
        sourceDigest: removed.sourceDigest,
      },
      settingsSnapshotJson: {
        cleanup: true,
        skillName: removed.skillName,
      },
    });
  }
}
