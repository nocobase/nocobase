/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FrontendToolManifest } from './frontend-tools';

export const WORKSPACE_AUTHORING_TOOL_NAMES = {
  describe: 'workspaceDescribe',
  readFiles: 'workspaceReadFiles',
  search: 'workspaceSearch',
  prepareChanges: 'workspacePrepareChanges',
  applyPreparedChanges: 'workspaceApplyPreparedChanges',
  validateDraft: 'workspaceValidateDraft',
} as const;

export const LEGACY_CODE_EDITOR_TOOL_NAMES = ['readJSCode', 'writeJSCode', 'patchJSCode', 'lintAndTestJS'] as const;

export type WorkspaceAuthoringToolName =
  (typeof WORKSPACE_AUTHORING_TOOL_NAMES)[keyof typeof WORKSPACE_AUTHORING_TOOL_NAMES];

export interface WorkspaceApplyResult {
  surfaceId: string;
  snapshotId: string;
  changedPaths: string[];
}

export interface WorkspaceValidationResult {
  surfaceId: string;
  snapshotId: string;
  diagnostics: unknown[];
  stale: boolean;
  validationPassed: boolean;
}

export interface WorkspaceDescribeResult {
  surfaceId: string;
  snapshotId: string;
  cachedDiagnostics: unknown[];
  validationPassed: null;
  validationRequired: true;
}

export interface WorkspaceAuthoringToolSet {
  surfaceId: string;
  toolIds: Record<WorkspaceAuthoringToolName, string>;
}

const workspaceToolNames = Object.values(WORKSPACE_AUTHORING_TOOL_NAMES);
const workspaceToolNameSet = new Set<string>(workspaceToolNames);

export function resolveWorkspaceAuthoringToolSets(
  frontendTools: FrontendToolManifest[],
): Map<string, WorkspaceAuthoringToolSet> {
  const toolsBySurface = new Map<string, Map<WorkspaceAuthoringToolName, string>>();
  for (const tool of frontendTools) {
    if (!workspaceToolNameSet.has(tool.name)) {
      continue;
    }
    const tools = toolsBySurface.get(tool.blockUid) ?? new Map<WorkspaceAuthoringToolName, string>();
    tools.set(tool.name as WorkspaceAuthoringToolName, tool.id);
    toolsBySurface.set(tool.blockUid, tools);
  }

  const result = new Map<string, WorkspaceAuthoringToolSet>();
  for (const [surfaceId, tools] of toolsBySurface) {
    if (!workspaceToolNames.every((name) => tools.has(name))) {
      continue;
    }
    result.set(surfaceId, {
      surfaceId,
      toolIds: Object.fromEntries(workspaceToolNames.map((name) => [name, tools.get(name)])) as Record<
        WorkspaceAuthoringToolName,
        string
      >,
    });
  }
  return result;
}

export function isWorkspaceApplyResult(value: unknown): value is WorkspaceApplyResult {
  if (!isRecord(value)) return false;
  return (
    typeof value.surfaceId === 'string' &&
    typeof value.snapshotId === 'string' &&
    Array.isArray(value.changedPaths) &&
    value.changedPaths.every((path) => typeof path === 'string')
  );
}

export function isWorkspaceValidationResult(value: unknown): value is WorkspaceValidationResult {
  if (!isRecord(value)) return false;
  return (
    typeof value.surfaceId === 'string' &&
    typeof value.snapshotId === 'string' &&
    Array.isArray(value.diagnostics) &&
    typeof value.stale === 'boolean' &&
    typeof value.validationPassed === 'boolean'
  );
}

export function isWorkspaceDescribeResult(value: unknown): value is WorkspaceDescribeResult {
  if (!isRecord(value)) return false;
  return (
    typeof value.surfaceId === 'string' &&
    typeof value.snapshotId === 'string' &&
    Array.isArray(value.cachedDiagnostics) &&
    value.validationPassed === null &&
    value.validationRequired === true
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
