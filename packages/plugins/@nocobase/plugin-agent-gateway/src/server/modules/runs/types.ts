/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Transaction } from 'sequelize';
import {
  JsonRecord,
  ModelRecord,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  hasModelGetter,
} from '../../actions/utils';
import { TERMINAL_CONTROL_RUN_STATUSES } from '../../../shared/runState';

export const DEFAULT_CLAIM_LEASE_SECONDS = 60;

export const DEFAULT_CLAIM_LEASE_TTL_MS = DEFAULT_CLAIM_LEASE_SECONDS * 1000;

export const DEFAULT_MAX_CONCURRENCY = 1;

export const DEFAULT_TASK_RUN_PROFILE_KEY = 'codex';

export const UI_BUILD_SOURCE_TYPE = 'ui-build';

export const TASK_RUN_SOURCE_TYPE = 'task-run';

export const UI_BUILD_REROUTE_SOURCE_TYPES = new Set([UI_BUILD_SOURCE_TYPE, 'manual-ui-build']);

export const RUNNER_ONLINE_THRESHOLD_MS = 120_000;

export const TASK_RUN_INITIAL_EVENT_SOURCE = 'agent-gateway-task';

export const LEASE_RECOVERY_BATCH_LIMIT = 100;

export const LEASE_RECOVERY_STALLED_GRACE_MS = 5 * 60 * 1000;

export const TOKEN_USAGE_EVENT_BATCH_SIZE = 100;

export const TERMINAL_TOKEN_TAIL_ROW_LIMIT = 32;

export const TERMINAL_TOKEN_TAIL_BYTE_LIMIT = 64 * 1024;

export const MAX_REMOTE_EXECUTION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export const FORBIDDEN_REMOTE_EXECUTION_FIELDS = new Set([
  'args',
  'extraArgs',
  'env',
  'executable',
  'command',
  'commandKey',
  'profileKey',
  'provider',
  'workspaceRoot',
  'additionalWritableDirs',
  'config',
  'hooks',
  'permissionMode',
  'terminalBackend',
]);

export const CLAIM_PROFILE_CAPABILITY_KEYS = [
  'structuredEvents',
  'terminalOutput',
  'resumeSession',
  'detectSessionId',
  'resumeWithMessage',
  'liveSemanticMessage',
  'stdinMessage',
  'interrupt',
  'terminate',
  'artifacts',
  'supportsExecDriver',
] as const;

export const CONTROL_RUN_STATUSES = new Set<string>(TERMINAL_CONTROL_RUN_STATUSES);

export function assertSafeRemoteExecutionPayload(ctx: Context, payload: JsonRecord) {
  const forbiddenField = Object.keys(payload).find((field) => FORBIDDEN_REMOTE_EXECUTION_FIELDS.has(field));
  if (forbiddenField) {
    ctx.throw(400, `Execution field is not allowed: ${forbiddenField}`);
  }
  if (!getString(payload.executionPolicyKey)) {
    ctx.throw(400, 'executionPolicyKey is required');
  }
  const cwd = getString(payload.cwd);
  if (cwd.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(cwd)) {
    ctx.throw(400, 'cwd must be relative to the execution policy workspace');
  }
  const timeoutMs = Number(payload.timeoutMs);
  if (
    payload.timeoutMs !== undefined &&
    (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_REMOTE_EXECUTION_TIMEOUT_MS)
  ) {
    ctx.throw(400, `timeoutMs must be between 1 and ${MAX_REMOTE_EXECUTION_TIMEOUT_MS}`);
  }
}

export function serializeClaimProfileCapabilities(value: unknown) {
  const capabilities = getRecord(value);
  return Object.fromEntries(
    CLAIM_PROFILE_CAPABILITY_KEYS.flatMap((key) =>
      typeof capabilities[key] === 'boolean' ? [[key, capabilities[key]]] : [],
    ),
  );
}

export interface RunLease {
  run: ModelRecord;
  claimAttempt: number;
  leaseVersion: number;
  requestedLeaseVersion: number;
}

export interface ClaimCandidate {
  run: ModelRecord;
  profile: ModelRecord;
}

export interface SkillVersionPayload extends JsonRecord {
  skillVersionId: string;
  skillId?: string;
  versionLabel: string;
  status: string;
  source: JsonRecord;
}

export interface BuildRunnerSelection {
  node: ModelRecord;
  profile: ModelRecord;
}

export interface BuildRunnerCandidate {
  node: ModelRecord;
  profile: ModelRecord;
  online: boolean;
}

export interface TaskRunSkillVersionOption {
  id: string;
  skillId?: string;
  skillKey?: string;
  displayName?: string;
  versionLabel: string;
  status: string;
}

export interface TaskRunTemplateOption {
  id: string;
  templateKey: string;
  displayName: string;
  description?: string;
  defaultTitle?: string;
  defaultPrompt?: string;
  cwd?: string;
  skillVersionIds: string[];
  artifactRoot?: string;
  artifacts: JsonRecord[];
}

export interface RunTaskTemplateSummary {
  id: string;
  templateKey: string;
  displayName: string;
  skillVersionIds: string[];
  skills: TaskRunSkillVersionOption[];
}

export interface ValidatedTaskRunSkillSelection {
  skillVersionId: string;
  skillKey?: string;
}

export interface MutableModelRecord extends ModelRecord {
  set(key: string, value: unknown): void;
}

export interface HookOptions {
  transaction?: Transaction;
}

export function getOptionalTargetKey(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export function isMutableModelRecord(model: ModelRecord): model is MutableModelRecord {
  return typeof (model as ModelRecord & { set?: unknown }).set === 'function';
}

export function getRequiredInteger(ctx: Context, value: unknown, name: string) {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && !value.trim())
  ) {
    ctx.throw(400, `${name} is required`);
  }

  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    ctx.throw(400, `${name} is required`);
  }
  return numberValue;
}

export function getPositiveNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

export function getBoolean(value: unknown) {
  return value === true;
}

export function getDateFromModel(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isRecentDate(date: Date | null, now = new Date()) {
  return Boolean(date && now.getTime() - date.getTime() <= RUNNER_ONLINE_THRESHOLD_MS);
}

export function getNodeOnlineReason(node: ModelRecord, lastHeartbeatAt: Date | null, now = new Date()) {
  if (getModelString(node, 'status') !== 'active') {
    return 'node-disabled';
  }
  if (!lastHeartbeatAt) {
    return 'missing-heartbeat';
  }
  if (!isRecentDate(lastHeartbeatAt, now)) {
    return 'heartbeat-stale';
  }
  return null;
}

export function getRunnerOnlineState(node: ModelRecord | null, profile: ModelRecord | null, now = new Date()) {
  if (!node) {
    return {
      online: false,
      reason: 'missing-node',
    };
  }
  if (getModelString(node, 'status') !== 'active') {
    return {
      online: false,
      reason: 'node-inactive',
    };
  }
  if (!profile) {
    return {
      online: false,
      reason: 'missing-profile',
    };
  }
  if (getModelString(profile, 'status') !== 'active') {
    return {
      online: false,
      reason: 'profile-inactive',
    };
  }
  if (!isRecentDate(getDateFromModel(node, 'lastHeartbeatAt'), now)) {
    return {
      online: false,
      reason: 'heartbeat-stale',
    };
  }
  return {
    online: true,
    reason: 'ready',
  };
}

export function getLeaseExpiresAt(now: Date) {
  return new Date(now.getTime() + DEFAULT_CLAIM_LEASE_SECONDS * 1000);
}

export function getMaxConcurrency(capabilities: JsonRecord, fallback = DEFAULT_MAX_CONCURRENCY) {
  const rawValue = capabilities.maxConcurrency;
  const numberValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return fallback;
  }

  return numberValue;
}

export function getTaskRunSkillVersionIds(values: JsonRecord) {
  return [...new Set(getStringList(values.skillVersionIds))];
}

export function isCodexLikeProfile(profile: ModelRecord) {
  return getModelString(profile, 'provider') === 'codex' || getModelString(profile, 'profileKey') === 'codex';
}

export function serializeBuildRunnerProfile(profile: ModelRecord) {
  return {
    id: getModelTargetKey(profile, 'id'),
    nodeId: getModelString(profile, 'nodeId'),
    profileKey: getModelString(profile, 'profileKey'),
    displayName: getModelString(profile, 'displayName') || getModelString(profile, 'profileKey'),
    provider: getModelString(profile, 'provider') || null,
    agentType: getModelString(profile, 'agentType'),
    driver: getModelString(profile, 'driver'),
    status: getModelString(profile, 'status'),
  };
}

export function serializeBuildRunnerNode(node: ModelRecord, profiles: ModelRecord[], now = new Date()) {
  const lastHeartbeatAt = getDateFromModel(node, 'lastHeartbeatAt');
  const onlineReason = getNodeOnlineReason(node, lastHeartbeatAt, now);
  return {
    id: getModelTargetKey(node, 'id'),
    nodeKey: getModelString(node, 'nodeKey'),
    displayName: getModelString(node, 'displayName') || getModelString(node, 'nodeKey'),
    status: getModelString(node, 'status'),
    lastHeartbeatAt: lastHeartbeatAt ? lastHeartbeatAt.toISOString() : null,
    online: !onlineReason,
    onlineReason,
    profiles: profiles.map(serializeBuildRunnerProfile),
  };
}

export function compareBuildRunnerCandidates(
  first: BuildRunnerCandidate,
  second: BuildRunnerCandidate,
  requestedProfileKey: string,
) {
  const firstProfileKey = getModelString(first.profile, 'profileKey');
  const secondProfileKey = getModelString(second.profile, 'profileKey');
  const firstExact = firstProfileKey === requestedProfileKey;
  const secondExact = secondProfileKey === requestedProfileKey;
  if (first.online !== second.online) {
    return first.online ? -1 : 1;
  }
  if (firstExact !== secondExact) {
    return firstExact ? -1 : 1;
  }
  const firstCodexLike = isCodexLikeProfile(first.profile);
  const secondCodexLike = isCodexLikeProfile(second.profile);
  if (firstCodexLike !== secondCodexLike) {
    return firstCodexLike ? -1 : 1;
  }
  return (
    getModelString(first.node, 'nodeKey').localeCompare(getModelString(second.node, 'nodeKey')) ||
    firstProfileKey.localeCompare(secondProfileKey)
  );
}

export function compareBuildRunnerNodes(
  first: ReturnType<typeof serializeBuildRunnerNode>,
  second: ReturnType<typeof serializeBuildRunnerNode>,
) {
  if (first.online !== second.online) {
    return first.online ? -1 : 1;
  }
  if (first.status !== second.status) {
    return first.status === 'active' ? -1 : 1;
  }
  if (Boolean(first.profiles.length) !== Boolean(second.profiles.length)) {
    return first.profiles.length ? -1 : 1;
  }
  return first.nodeKey.localeCompare(second.nodeKey);
}

export function getRelatedSkillString(skillVersion: ModelRecord, key: string) {
  const skill = getModelValue(skillVersion, 'skill');
  if (hasModelGetter(skill)) {
    return getModelString(skill, key);
  }
  return getString(getRecord(skill)[key]);
}

export function serializeTaskRunSkillVersion(skillVersion: ModelRecord): TaskRunSkillVersionOption | null {
  const skillStatus = getRelatedSkillString(skillVersion, 'status');
  if (skillStatus && skillStatus !== 'active') {
    return null;
  }
  const skillKey = getRelatedSkillString(skillVersion, 'skillKey');
  return {
    id: String(getModelTargetKey(skillVersion, 'id')),
    skillId: getOptionalTargetKey(skillVersion, 'skillId') || undefined,
    skillKey: skillKey || undefined,
    displayName: getRelatedSkillString(skillVersion, 'displayName') || skillKey || undefined,
    versionLabel: getModelString(skillVersion, 'versionLabel'),
    status: getModelString(skillVersion, 'status') || 'active',
  };
}

export function getStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item)) : [];
}

export function getTaskRunArtifactDeclarations(value: unknown) {
  const result: JsonRecord[] = [];
  if (!Array.isArray(value)) {
    return result;
  }
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      result.push({ path: item.trim() });
      continue;
    }
    const declaration = getRecord(item);
    const artifactPath = getString(declaration.path || declaration.filePath);
    const glob = getString(declaration.glob || declaration.pattern);
    if (!artifactPath && !glob) {
      continue;
    }
    result.push({
      ...(artifactPath ? { path: artifactPath } : {}),
      ...(glob ? { glob } : {}),
      ...(getString(declaration.groupKey) ? { groupKey: getString(declaration.groupKey) } : {}),
      ...(getString(declaration.groupLabel || declaration.group)
        ? { groupLabel: getString(declaration.groupLabel || declaration.group) }
        : {}),
      ...(getString(declaration.artifactKey || declaration.key)
        ? { artifactKey: getString(declaration.artifactKey || declaration.key) }
        : {}),
      ...(getString(declaration.artifactType || declaration.type)
        ? { artifactType: getString(declaration.artifactType || declaration.type) }
        : {}),
      ...(getString(declaration.mimeType) ? { mimeType: getString(declaration.mimeType) } : {}),
    });
  }
  return result;
}

export function serializeTaskRunTemplate(template: ModelRecord): TaskRunTemplateOption {
  return {
    id: String(getModelTargetKey(template, 'id')),
    templateKey: getModelString(template, 'templateKey'),
    displayName: getModelString(template, 'displayName') || getModelString(template, 'templateKey'),
    description: getModelString(template, 'description') || undefined,
    defaultTitle: getModelString(template, 'defaultTitle') || undefined,
    defaultPrompt: getString(getModelValue(template, 'defaultPrompt')) || undefined,
    cwd: getModelString(template, 'cwd') || undefined,
    skillVersionIds: getStringList(getModelValue(template, 'skillVersionIdsJson')),
    artifactRoot: getModelString(template, 'artifactRoot') || undefined,
    artifacts: getTaskRunArtifactDeclarations(getModelValue(template, 'artifactsJson')),
  };
}

export function serializeRunTaskTemplateFilterOption(template: ModelRecord) {
  return {
    id: String(getModelTargetKey(template, 'id')),
    templateKey: getModelString(template, 'templateKey'),
    displayName: getModelString(template, 'displayName') || getModelString(template, 'templateKey'),
  };
}

export function serializeRunTaskTemplateSummary(
  taskTemplate: ModelRecord,
  skillsById: Map<string, TaskRunSkillVersionOption>,
): RunTaskTemplateSummary {
  const skillVersionIds = getStringList(getModelValue(taskTemplate, 'skillVersionIdsJson'));
  return {
    ...serializeRunTaskTemplateFilterOption(taskTemplate),
    skillVersionIds,
    skills: skillVersionIds
      .map((skillVersionId) => skillsById.get(skillVersionId))
      .filter((skillVersion): skillVersion is TaskRunSkillVersionOption => Boolean(skillVersion)),
  };
}
