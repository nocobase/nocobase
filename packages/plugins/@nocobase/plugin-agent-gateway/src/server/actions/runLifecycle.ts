/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import {
  AGENT_GATEWAY_ACTIONS,
  AGENT_GATEWAY_RESOURCE,
  authenticateNodeToken,
  createClaimToken,
  extractNodeToken,
  redactEventPayload,
  redactRunErrorSummary,
  redactRunResultSummary,
  toStoredTokenFields,
  verifyClaimToken,
  verifyNodeToken,
} from '../security';
import {
  AGENT_GATEWAY_STANDARD_COLLECTIONS,
  AGENT_GATEWAY_API_RESOURCE,
  AGENT_GATEWAY_ERROR_CODES,
  JsonRecord,
  ModelRecord,
  asActionContext,
  getBodyValues,
  getActionTargetKey,
  getCurrentUserId,
  getDate,
  getModelJson,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  hasModelGetter,
  getCurrentRoleNames,
  getVisibleRunFilter,
  matchStandardCollectionAction,
  normalizeNocoBaseApiPath,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';
import { serializeSkillVersionSourceForNode } from './skillVersions';
import {
  ensureDefaultTaskTemplates,
  findActiveTaskTemplateForRun,
  getTaskTemplateDefaults,
  TaskTemplateDefaults,
} from './taskTemplates';
import { AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } from '../../shared/runControl';
import { EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY } from '../../shared/externalRunImport';
import {
  ACTIVE_RUN_STATUSES,
  ActiveRunStatus,
  CLAIMABLE_RUN_STATUS,
  HEARTBEAT_RUN_STATUSES,
  HeartbeatRunStatus,
  IMPORTING_RUN_STATUS,
  LEASE_OWNING_RUN_STATUSES,
  STALLED_RUN_STATUS,
  TERMINAL_CONTROL_RUN_STATUSES,
  TERMINAL_RUN_STATUSES,
  TerminalRunStatus,
  isActiveRunStatus,
  isHeartbeatRunStatus,
  isTerminalRunStatus,
} from '../../shared/runState';
import { getRunProviderCapabilitySummary, isRunCapabilitySupported } from './capabilityUtils';
import { getRunTokenUsageSummary, TokenUsageSummary } from '../services/observationRollup';

const DEFAULT_CLAIM_LEASE_SECONDS = 60;
const DEFAULT_CLAIM_LEASE_TTL_MS = DEFAULT_CLAIM_LEASE_SECONDS * 1000;
const DEFAULT_MAX_CONCURRENCY = 1;
const DEFAULT_RUN_LIST_PAGE_SIZE = 50;
const MAX_RUN_LIST_PAGE_SIZE = 100;
const DEFAULT_TASK_RUN_PROFILE_KEY = 'codex';
const UI_BUILD_SOURCE_TYPE = 'ui-build';
const TASK_RUN_SOURCE_TYPE = 'task-run';
const UI_BUILD_REROUTE_SOURCE_TYPES = new Set([UI_BUILD_SOURCE_TYPE, 'manual-ui-build']);
const RUNNER_ONLINE_THRESHOLD_MS = 120_000;
const TASK_RUN_INITIAL_EVENT_SOURCE = 'agent-gateway-task';
const LEASE_RECOVERY_BATCH_LIMIT = 100;
const LEASE_RECOVERY_STALLED_GRACE_MS = 5 * 60 * 1000;
const TOKEN_USAGE_EVENT_BATCH_SIZE = 100;
const TERMINAL_TOKEN_TAIL_ROW_LIMIT = 32;
const TERMINAL_TOKEN_TAIL_BYTE_LIMIT = 64 * 1024;

const CONTROL_RUN_STATUSES = new Set<string>(TERMINAL_CONTROL_RUN_STATUSES);
const NODE_OWNED_INLINE_SKILL_SOURCE_TYPES = new Set(['opencode-smoke']);
const RUN_LIST_SORT_FIELD_MAP: Record<string, string> = {
  runCode: 'runCode',
  status: 'status',
  sourceType: 'sourceType',
  taskTemplateId: 'taskTemplateId',
  startedAt: 'startedAt',
  finishedAt: 'finishedAt',
  requestedAt: 'requestedAt',
  queuedAt: 'queuedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

export interface RunLease {
  run: ModelRecord;
  claimAttempt: number;
  leaseVersion: number;
  requestedLeaseVersion: number;
}

interface ClaimCandidate {
  run: ModelRecord;
  profile: ModelRecord;
}

interface SkillVersionPayload extends JsonRecord {
  skillVersionId: string;
  skillId?: string;
  versionLabel: string;
  status: string;
  source: JsonRecord;
}

interface BuildRunnerSelection {
  node: ModelRecord;
  profile: ModelRecord;
}

interface BuildRunnerCandidate {
  node: ModelRecord;
  profile: ModelRecord;
  online: boolean;
}

interface TaskRunSkillVersionOption {
  id: string;
  skillId?: string;
  skillKey?: string;
  displayName?: string;
  versionLabel: string;
  status: string;
}

interface TaskRunTemplateOption {
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

interface RunTaskTemplateSummary {
  id: string;
  templateKey: string;
  displayName: string;
  skillVersionIds: string[];
  skills: TaskRunSkillVersionOption[];
}

interface ValidatedTaskRunSkillSelection {
  skillVersionId: string;
  skillKey?: string;
}

interface MutableModelRecord extends ModelRecord {
  set(key: string, value: unknown): void;
}

interface HookOptions {
  transaction?: Transaction;
}

function getOptionalTargetKey(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function isMutableModelRecord(model: ModelRecord): model is MutableModelRecord {
  return typeof (model as ModelRecord & { set?: unknown }).set === 'function';
}

function getRequiredInteger(ctx: Context, value: unknown, name: string) {
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

function getPositiveNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function getBoolean(value: unknown) {
  return value === true;
}

function getDateFromModel(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isRecentDate(date: Date | null, now = new Date()) {
  return Boolean(date && now.getTime() - date.getTime() <= RUNNER_ONLINE_THRESHOLD_MS);
}

function getNodeOnlineReason(node: ModelRecord, lastHeartbeatAt: Date | null, now = new Date()) {
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

function getRunnerOnlineState(node: ModelRecord | null, profile: ModelRecord | null, now = new Date()) {
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

function getLeaseExpiresAt(now: Date) {
  return new Date(now.getTime() + DEFAULT_CLAIM_LEASE_SECONDS * 1000);
}

function getMaxConcurrency(capabilities: JsonRecord, fallback = DEFAULT_MAX_CONCURRENCY) {
  const rawValue = capabilities.maxConcurrency;
  const numberValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return fallback;
  }

  return numberValue;
}

function serializeRun(run: ModelRecord) {
  const json = getModelJson(run);
  delete json.claimTokenHash;
  delete json.promptSnapshot;
  delete json.executionPayloadJson;
  delete json.observabilityRollupJson;
  return json;
}

function serializeRunForUser(run: ModelRecord) {
  const json = serializeRun(run);
  delete json.claimAttempt;
  delete json.leaseVersion;
  delete json.claimTokenLast4;
  delete json.claimExpiresAt;
  delete json.terminalSessionName;
  return json;
}

function serializeCreatedRunForUser(run: ModelRecord) {
  return {
    ...serializeRunForUser(run),
    claimAttempt: getModelNumber(run, 'claimAttempt'),
    leaseVersion: getModelNumber(run, 'leaseVersion'),
  };
}

function getRunTaskTitle(run: ModelRecord, options: { includeRunCode?: boolean } = {}) {
  const resultSummary = getRecord(getModelValue(run, 'resultSummaryJson'));
  const executionPayload = getRecord(getModelValue(run, 'executionPayloadJson'));
  const promptSnapshot = getRecord(getModelValue(run, 'promptSnapshot'));
  const promptVariables = getRecord(promptSnapshot.variables);
  const title =
    getString(resultSummary.title) ||
    getString(executionPayload.title) ||
    getString(promptVariables.title) ||
    getString(promptSnapshot.title);
  if (title || options.includeRunCode === false) {
    return title;
  }
  return getModelString(run, 'runCode');
}

function mergeTerminalResultSummary(run: ModelRecord, value: unknown) {
  const resultSummary = getRecord(redactRunResultSummary(value));
  if (getString(resultSummary.title)) {
    return resultSummary;
  }
  const existingTitle = getRunTaskTitle(run, { includeRunCode: false });
  if (existingTitle) {
    resultSummary.title = existingTitle;
  }
  return resultSummary;
}

function getTaskRunSkillVersionIds(values: JsonRecord) {
  const result = new Set<string>();
  const legacySkillVersionId = getString(values.skillVersionId);
  if (legacySkillVersionId) {
    result.add(legacySkillVersionId);
  }
  for (const skillVersionId of getStringList(values.skillVersionIds)) {
    result.add(skillVersionId);
  }
  return Array.from(result);
}

async function getAgentGatewayActionPermissions(ctx: Context) {
  const roles = await getCurrentRoleNames(ctx);
  return {
    resumeAgentSession: Boolean(
      ctx.app.acl.can({
        roles,
        resource: AGENT_GATEWAY_RESOURCE,
        action: AGENT_GATEWAY_ACTIONS.resumeAgentSession,
      }),
    ),
    readSessionMessages: Boolean(
      ctx.app.acl.can({
        roles,
        resource: AGENT_GATEWAY_RESOURCE,
        action: AGENT_GATEWAY_ACTIONS.readSessionMessages,
      }),
    ),
    readTerminal: Boolean(
      ctx.app.acl.can({
        roles,
        resource: AGENT_GATEWAY_RESOURCE,
        action: AGENT_GATEWAY_ACTIONS.readTerminal,
      }),
    ),
    readArtifacts: Boolean(
      ctx.app.acl.can({
        roles,
        resource: AGENT_GATEWAY_RESOURCE,
        action: AGENT_GATEWAY_ACTIONS.readArtifacts,
      }),
    ),
    readRawLogs: Boolean(
      ctx.app.acl.can({
        roles,
        resource: AGENT_GATEWAY_RESOURCE,
        action: AGENT_GATEWAY_ACTIONS.readRawLogs,
      }),
    ),
    interruptRun: Boolean(
      ctx.app.acl.can({
        roles,
        resource: AGENT_GATEWAY_RESOURCE,
        action: AGENT_GATEWAY_ACTIONS.interruptRun,
      }),
    ),
    terminateRun: Boolean(
      ctx.app.acl.can({
        roles,
        resource: AGENT_GATEWAY_RESOURCE,
        action: AGENT_GATEWAY_ACTIONS.terminateRun,
      }),
    ),
    cancelRun: Boolean(
      ctx.app.acl.can({
        roles,
        resource: AGENT_GATEWAY_RESOURCE,
        action: AGENT_GATEWAY_ACTIONS.cancelRun,
      }),
    ),
  };
}

function isCodexLikeProfile(profile: ModelRecord) {
  return getModelString(profile, 'provider') === 'codex' || getModelString(profile, 'profileKey') === 'codex';
}

function serializeBuildRunnerProfile(profile: ModelRecord) {
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

function serializeBuildRunnerNode(node: ModelRecord, profiles: ModelRecord[], now = new Date()) {
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

function compareBuildRunnerCandidates(
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

function compareBuildRunnerNodes(
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

function getRelatedSkillString(skillVersion: ModelRecord, key: string) {
  const skill = getModelValue(skillVersion, 'skill');
  if (hasModelGetter(skill)) {
    return getModelString(skill, key);
  }
  return getString(getRecord(skill)[key]);
}

function serializeTaskRunSkillVersion(skillVersion: ModelRecord): TaskRunSkillVersionOption | null {
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

function serializeTaskRunTemplate(template: ModelRecord): TaskRunTemplateOption {
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

function serializeRunTaskTemplateFilterOption(template: ModelRecord) {
  return {
    id: String(getModelTargetKey(template, 'id')),
    templateKey: getModelString(template, 'templateKey'),
    displayName: getModelString(template, 'displayName') || getModelString(template, 'templateKey'),
  };
}

function serializeRunTaskTemplateSummary(
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

async function listRunTaskTemplateFilterOptions(ctx: Context) {
  const templates = (await ctx.db.getRepository('agTaskTemplates').find({
    sort: ['templateKey'],
  })) as ModelRecord[];
  return templates.map(serializeRunTaskTemplateFilterOption);
}

async function listBuildRunOptions(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.dispatch,
    'Agent Gateway dispatch permission required',
  );

  await ensureDefaultTaskTemplates(ctx);
  const [nodes, profiles, skillVersions, taskTemplates] = (await Promise.all([
    ctx.db.getRepository('agNodes').find({
      sort: ['nodeKey'],
    }),
    ctx.db.getRepository('agAgentProfiles').find({
      filter: {
        status: 'active',
      },
      sort: ['profileKey'],
    }),
    ctx.db.getRepository('agSkillVersions').find({
      filter: {
        status: 'active',
      },
      appends: ['skill'],
      sort: ['-createdAt'],
    }),
    ctx.db.getRepository('agTaskTemplates').find({
      filter: {
        status: 'active',
      },
      sort: ['sort', 'templateKey'],
    }),
  ])) as [ModelRecord[], ModelRecord[], ModelRecord[], ModelRecord[]];
  const now = new Date();
  const profilesByNodeId = new Map<string, ModelRecord[]>();
  for (const profile of profiles) {
    const nodeId = getModelString(profile, 'nodeId');
    if (!nodeId) {
      continue;
    }
    const nodeProfiles = profilesByNodeId.get(nodeId) || [];
    nodeProfiles.push(profile);
    profilesByNodeId.set(nodeId, nodeProfiles);
  }

  const serializedNodes = nodes
    .map((node) => serializeBuildRunnerNode(node, profilesByNodeId.get(getModelString(node, 'id')) || [], now))
    .sort(compareBuildRunnerNodes);

  ctx.body = {
    defaultProfileKey: DEFAULT_TASK_RUN_PROFILE_KEY,
    defaultCwd: '.',
    nodes: serializedNodes,
    skillVersions: skillVersions
      .map(serializeTaskRunSkillVersion)
      .filter((skillVersion): skillVersion is TaskRunSkillVersionOption => Boolean(skillVersion)),
    taskTemplates: taskTemplates.map(serializeTaskRunTemplate),
  };
}

async function findActiveNode(ctx: Context, nodeId: string, transaction: Transaction | undefined) {
  if (!nodeId) {
    return null;
  }
  return (await ctx.db.getRepository('agNodes').findOne({
    filterByTk: nodeId,
    transaction,
  })) as ModelRecord | null;
}

async function findActiveProfile(ctx: Context, profileId: string, transaction: Transaction | undefined) {
  if (!profileId) {
    return null;
  }
  return (await ctx.db.getRepository('agAgentProfiles').findOne({
    filterByTk: profileId,
    transaction,
  })) as ModelRecord | null;
}

function getBuildRunProfileKeyFromRun(run: ModelRecord, profile: ModelRecord | null) {
  const payload = getRecord(getModelValue(run, 'executionPayloadJson'));
  return (
    getString(payload.profileKey) ||
    getString(payload.commandKey) ||
    (profile ? getModelString(profile, 'profileKey') : '') ||
    DEFAULT_TASK_RUN_PROFILE_KEY
  );
}

function getBuildRunProviderFromRun(run: ModelRecord, profile: ModelRecord | null) {
  const payload = getRecord(getModelValue(run, 'executionPayloadJson'));
  return (
    getString(payload.provider) ||
    getString(payload.agentProvider) ||
    (profile ? getModelString(profile, 'provider') : '')
  );
}

async function findOnlineBuildRunnerFallback(
  ctx: Context,
  options: { profileKey: string; provider?: string },
  transaction: Transaction | undefined,
): Promise<BuildRunnerSelection | null> {
  const profileKey = options.profileKey || DEFAULT_TASK_RUN_PROFILE_KEY;
  const profiles = (await ctx.db.getRepository('agAgentProfiles').find({
    filter: {
      profileKey,
      status: 'active',
    },
    sort: ['profileKey'],
    transaction,
  })) as ModelRecord[];
  if (!profiles.length) {
    return null;
  }

  const nodeIds = [...new Set(profiles.map((profile) => getModelString(profile, 'nodeId')).filter(Boolean))];
  const nodes = (await ctx.db.getRepository('agNodes').find({
    filter: {
      id: {
        $in: nodeIds,
      },
      status: 'active',
    },
    sort: ['nodeKey'],
    transaction,
  })) as ModelRecord[];
  const nodeById = new Map(nodes.map((node) => [getModelString(node, 'id'), node]));
  const candidates = profiles
    .map((profile): BuildRunnerCandidate | null => {
      const node = nodeById.get(getModelString(profile, 'nodeId'));
      if (!node) {
        return null;
      }
      const online = getRunnerOnlineState(node, profile).online;
      return online
        ? {
            node,
            profile,
            online,
          }
        : null;
    })
    .filter((candidate): candidate is BuildRunnerCandidate => Boolean(candidate))
    .sort((first, second) => {
      if (options.provider) {
        const firstProviderExact = getModelString(first.profile, 'provider') === options.provider;
        const secondProviderExact = getModelString(second.profile, 'provider') === options.provider;
        if (firstProviderExact !== secondProviderExact) {
          return firstProviderExact ? -1 : 1;
        }
      }
      return compareBuildRunnerCandidates(first, second, profileKey);
    });
  const candidate = candidates[0];
  return candidate
    ? {
        node: candidate.node,
        profile: candidate.profile,
      }
    : null;
}

async function findCurrentRunRunner(
  ctx: Context,
  run: ModelRecord,
  transaction: Transaction | undefined,
): Promise<BuildRunnerSelection & { profileId: string; nodeId: string }> {
  const profileId = getOptionalTargetKey(run, 'agentProfileId');
  const requestedNodeId = getOptionalTargetKey(run, 'nodeId');
  const profile = profileId ? await findActiveProfile(ctx, profileId, transaction) : null;
  const nodeId = requestedNodeId || (profile ? getModelString(profile, 'nodeId') : '');
  const node = nodeId ? await findActiveNode(ctx, nodeId, transaction) : null;
  return {
    node: node as ModelRecord,
    profile: profile as ModelRecord,
    nodeId,
    profileId,
  };
}

async function findFallbackForQueuedBuildRun(
  ctx: Context,
  run: ModelRecord,
  transaction: Transaction | undefined,
): Promise<BuildRunnerSelection | null> {
  const sourceType = getModelString(run, 'sourceType');
  if (!UI_BUILD_REROUTE_SOURCE_TYPES.has(sourceType)) {
    return null;
  }
  if (getModelString(run, 'status') !== CLAIMABLE_RUN_STATUS) {
    return null;
  }
  if (getModelNumber(run, 'claimAttempt') > 0 || getDateFromModel(run, 'claimedAt')) {
    return null;
  }

  const currentRunner = await findCurrentRunRunner(ctx, run, transaction);
  if (getRunnerOnlineState(currentRunner.node, currentRunner.profile).online) {
    return null;
  }

  const profileKey = getBuildRunProfileKeyFromRun(run, currentRunner.profile);
  const provider = getBuildRunProviderFromRun(run, currentRunner.profile);
  const fallback = await findOnlineBuildRunnerFallback(ctx, { profileKey, provider }, transaction);
  if (!fallback) {
    return null;
  }
  const fallbackNodeId = getModelString(fallback.node, 'id');
  const fallbackProfileId = getModelString(fallback.profile, 'id');
  if (fallbackNodeId === currentRunner.nodeId && fallbackProfileId === currentRunner.profileId) {
    return null;
  }
  return fallback;
}

function applyBuildRunnerFallbackToRun(run: MutableModelRecord, fallback: BuildRunnerSelection) {
  const profileKey = getModelString(fallback.profile, 'profileKey');
  const provider = getModelString(fallback.profile, 'provider');
  const payload = getRecord(getModelValue(run, 'executionPayloadJson'));
  run.set('nodeId', getModelTargetKey(fallback.node, 'id'));
  run.set('agentProfileId', getModelTargetKey(fallback.profile, 'id'));
  run.set('executionPayloadJson', {
    ...payload,
    profileKey: getString(payload.profileKey) || profileKey,
    commandKey: getString(payload.commandKey) || profileKey,
    ...(provider ? { provider } : {}),
  });
}

async function resolveBuildRunnerSelection(
  ctx: Context,
  values: JsonRecord,
  transaction: Transaction,
): Promise<BuildRunnerSelection> {
  const requestedNodeId = getString(values.nodeId);
  const requestedProfileId = getString(values.agentProfileId);
  const requestedProfileKey = getString(values.profileKey) || DEFAULT_TASK_RUN_PROFILE_KEY;

  if (requestedProfileId) {
    const profile = await findActiveProfile(ctx, requestedProfileId, transaction);
    if (!profile || getModelString(profile, 'status') !== 'active') {
      ctx.throw(400, 'Selected agent profile is not active');
    }
    if (requestedNodeId && getModelString(profile, 'nodeId') !== requestedNodeId) {
      ctx.throw(400, 'Selected agent profile does not belong to the selected node');
    }
    const node = await findActiveNode(ctx, getModelString(profile, 'nodeId'), transaction);
    if (!node || getModelString(node, 'status') !== 'active') {
      ctx.throw(400, 'Selected node is not active');
    }
    if (!getRunnerOnlineState(node, profile).online) {
      const fallback = await findOnlineBuildRunnerFallback(
        ctx,
        {
          profileKey: getModelString(profile, 'profileKey') || requestedProfileKey,
          provider: getModelString(profile, 'provider'),
        },
        transaction,
      );
      if (fallback) {
        return fallback;
      }
      ctx.throw(409, 'Selected Agent Gateway runner is offline; start or reconnect the daemon');
    }
    return {
      node,
      profile,
    };
  }

  const profiles = (await ctx.db.getRepository('agAgentProfiles').find({
    filter: {
      ...(requestedNodeId ? { nodeId: requestedNodeId } : {}),
      status: 'active',
    },
    sort: ['profileKey'],
    transaction,
  })) as ModelRecord[];
  const nodes = (await ctx.db.getRepository('agNodes').find({
    filter: {
      status: 'active',
      ...(requestedNodeId ? { id: requestedNodeId } : {}),
    },
    sort: ['nodeKey'],
    transaction,
  })) as ModelRecord[];
  const nodeById = new Map(nodes.map((node) => [getModelString(node, 'id'), node]));
  const candidates = profiles
    .map((profile): BuildRunnerCandidate | null => {
      const node = nodeById.get(getModelString(profile, 'nodeId'));
      if (!node) {
        return null;
      }
      const online = getRunnerOnlineState(node, profile).online;
      if (!online) {
        return null;
      }
      return {
        node,
        profile,
        online,
      };
    })
    .filter((candidate): candidate is BuildRunnerCandidate => Boolean(candidate))
    .sort((first, second) => compareBuildRunnerCandidates(first, second, requestedProfileKey));
  const candidate = candidates[0];
  if (!candidate) {
    ctx.throw(409, 'No online Agent Gateway runner is available; start or reconnect the daemon');
  }
  return {
    node: candidate.node,
    profile: candidate.profile,
  };
}

function getTaskInstruction(values: JsonRecord) {
  return getString(values.instruction) || getString(values.prompt);
}

function hasOwnKey(values: JsonRecord, key: string) {
  return Object.prototype.hasOwnProperty.call(values, key);
}

function applyTaskTemplateDefaults(values: JsonRecord, taskTemplate: TaskTemplateDefaults) {
  const merged: JsonRecord = {
    ...values,
    taskTemplateId: taskTemplate.taskTemplateId,
  };
  if (!getString(values.title) && taskTemplate.title) {
    merged.title = taskTemplate.title;
  }
  if (!getTaskInstruction(values) && taskTemplate.prompt) {
    merged.prompt = taskTemplate.prompt;
  }
  if (!getString(values.cwd) && taskTemplate.cwd) {
    merged.cwd = taskTemplate.cwd;
  }
  if (!getTaskRunSkillVersionIds(values).length && taskTemplate.skillVersionIds.length) {
    merged.skillVersionIds = taskTemplate.skillVersionIds;
  }
  if (!getString(values.artifactRoot) && taskTemplate.artifactRoot) {
    merged.artifactRoot = taskTemplate.artifactRoot;
  }
  if (!hasOwnKey(values, 'artifacts') && taskTemplate.artifacts.length) {
    merged.artifacts = taskTemplate.artifacts;
  }
  return merged;
}

async function getTaskRunValuesWithTemplateDefaults(ctx: Context, values: JsonRecord, transaction: Transaction) {
  const taskTemplateIdentifier = getString(values.taskTemplateId) || getString(values.taskTemplateKey);
  if (!taskTemplateIdentifier) {
    return {
      values,
      taskTemplate: null,
    };
  }

  const template = await findActiveTaskTemplateForRun(ctx, taskTemplateIdentifier, transaction);
  const taskTemplate = getTaskTemplateDefaults(template);
  return {
    values: applyTaskTemplateDefaults(values, taskTemplate),
    taskTemplate,
  };
}

function getStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item)) : [];
}

function getTaskRunArtifactDeclarations(value: unknown) {
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

function getTaskRunArtifactPayload(values: JsonRecord) {
  const artifactRoot = getString(values.artifactRoot);
  const artifactPaths = getStringList(values.artifactPaths);
  const artifactGlobs = getStringList(values.artifactGlobs);
  const artifacts = getTaskRunArtifactDeclarations(values.artifacts);
  const maxArtifactUploads = getPositiveNumber(values.maxArtifactUploads);
  const maxArtifactScanEntries = getPositiveNumber(values.maxArtifactScanEntries);
  return {
    ...(artifactRoot ? { artifactRoot } : {}),
    ...(artifactPaths.length ? { artifactPaths } : {}),
    ...(artifactGlobs.length ? { artifactGlobs } : {}),
    ...(artifacts.length ? { artifacts } : {}),
    ...(maxArtifactUploads ? { maxArtifactUploads } : {}),
    ...(maxArtifactScanEntries ? { maxArtifactScanEntries } : {}),
    ...(values.includeOlderArtifacts === true ? { includeOlderArtifacts: true } : {}),
  };
}

function getTaskRunResolvedSkills(values: JsonRecord) {
  const skillVersionIds = getTaskRunSkillVersionIds(values);
  if (!skillVersionIds.length) {
    return undefined;
  }
  return skillVersionIds.map((skillVersionId) => ({ skillVersionId }));
}

function getTaskRunTimeoutMs(values: JsonRecord) {
  return getPositiveNumber(values.timeoutMs);
}

async function createInitialTaskConversationEvent(
  ctx: Context,
  options: {
    runId: string;
    renderedPrompt: string;
    title?: string;
    transaction: Transaction;
  },
) {
  await ctx.db.getRepository('agAgentConversationEvents').create({
    values: {
      id: randomUUID(),
      runId: options.runId,
      sequence: 0,
      eventType: 'agent.user.message',
      source: TASK_RUN_INITIAL_EVENT_SOURCE,
      providerEventId: 'initial-task',
      correlationId: null,
      confidence: 1,
      contentText: options.renderedPrompt,
      contentJson: getRecord(
        redactEventPayload({
          ...(options.title ? { title: options.title } : {}),
          participant: {
            id: 'user:requester',
            type: 'user',
            name: 'You',
          },
        }),
      ),
      createdById: getCurrentUserId(ctx),
    },
    transaction: options.transaction,
  });
}

async function assertTaskRunSkillVersionActive(
  ctx: Context,
  skillVersionId: string,
  transaction: Transaction,
): Promise<ValidatedTaskRunSkillSelection> {
  const skillVersion = (await ctx.db.getRepository('agSkillVersions').findOne({
    filter: {
      id: skillVersionId,
      status: 'active',
    },
    appends: ['skill'],
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!skillVersion) {
    ctx.throw(409, 'Selected Agent Gateway skill version is not active');
    throw new Error('Selected Agent Gateway skill version is not active');
  }
  const skillStatus = getRelatedSkillString(skillVersion, 'status');
  if (skillStatus && skillStatus !== 'active') {
    ctx.throw(409, 'Selected Agent Gateway skill is not active');
  }
  if (!serializeSkillVersionPayload(ctx, skillVersion)) {
    ctx.throw(409, 'Selected Agent Gateway skill version has no installable source');
  }
  return {
    skillVersionId,
    skillKey: getRelatedSkillString(skillVersion, 'skillKey') || undefined,
  };
}

function getControlCapabilityDecision(capabilities: JsonRecord, action: 'interrupt' | 'terminate') {
  if (capabilities[action] === true) {
    return true;
  }
  if (capabilities[action] === false) {
    return false;
  }

  for (const key of ['terminal', 'terminalControl']) {
    const scopedCapabilities = getRecord(capabilities[key]);
    if (scopedCapabilities[action] === true) {
      return true;
    }
    if (scopedCapabilities[action] === false) {
      return false;
    }
  }

  return null;
}

function hasActiveTmuxControlSurface(run: ModelRecord) {
  return (
    CONTROL_RUN_STATUSES.has(getModelString(run, 'status')) &&
    getModelString(run, 'terminalBackend') === 'tmux' &&
    getModelString(run, 'terminalStatus') === 'active' &&
    Boolean(getModelString(run, 'terminalSessionName'))
  );
}

function getRunnerControlCapabilityDecisionFromModels(
  node: ModelRecord | null,
  profile: ModelRecord | null,
  action: 'interrupt' | 'terminate',
) {
  const decisions: Array<boolean | null> = [];
  if (node) {
    decisions.push(getControlCapabilityDecision(getRecord(getModelValue(node, 'capabilitiesJson')), action));
  }
  if (profile) {
    decisions.push(getControlCapabilityDecision(getRecord(getModelValue(profile, 'capabilitiesJson')), action));
  }
  if (decisions.includes(false)) {
    return false;
  }
  return decisions.includes(true) ? true : null;
}

async function getRunnerControlCapabilityDecision(ctx: Context, run: ModelRecord, action: 'interrupt' | 'terminate') {
  const nodeId = getOptionalTargetKey(run, 'nodeId');
  const agentProfileId = getOptionalTargetKey(run, 'agentProfileId');
  const [node, profile] = (await Promise.all([
    nodeId ? ctx.db.getRepository('agNodes').findOne({ filterByTk: nodeId }) : null,
    agentProfileId ? ctx.db.getRepository('agAgentProfiles').findOne({ filterByTk: agentProfileId }) : null,
  ])) as [ModelRecord | null, ModelRecord | null];
  return getRunnerControlCapabilityDecisionFromModels(node, profile, action);
}

async function getRunControlCapability(
  ctx: Context,
  run: ModelRecord,
  session: ModelRecord | null,
  action: 'interrupt' | 'terminate',
  preloaded?: {
    node: ModelRecord | null;
    profile: ModelRecord | null;
    capabilitySummary: Awaited<ReturnType<typeof getRunProviderCapabilitySummary>>;
  },
) {
  if (!hasActiveTmuxControlSurface(run)) {
    return false;
  }
  const capabilitySummary = preloaded?.capabilitySummary || (await getRunProviderCapabilitySummary(ctx, run, session));
  if (capabilitySummary.providerSource === 'fallback') {
    const runnerCapabilityDecision = preloaded
      ? getRunnerControlCapabilityDecisionFromModels(preloaded.node, preloaded.profile, action)
      : await getRunnerControlCapabilityDecision(ctx, run, action);
    if (runnerCapabilityDecision !== null) {
      return runnerCapabilityDecision;
    }
    return false;
  }
  if (capabilitySummary.enforceCapabilities) {
    return isRunCapabilitySupported(capabilitySummary, action);
  }
  if (session) {
    return true;
  }
  return (
    (preloaded
      ? getRunnerControlCapabilityDecisionFromModels(preloaded.node, preloaded.profile, action)
      : await getRunnerControlCapabilityDecision(ctx, run, action)) === true
  );
}

async function getRunRunnerStatus(
  ctx: Context,
  run: ModelRecord,
  preloaded?: { node: ModelRecord | null; profile: ModelRecord | null },
) {
  const nodeId = getOptionalTargetKey(run, 'nodeId');
  const profileId = getOptionalTargetKey(run, 'agentProfileId');
  const [node, profile] = preloaded
    ? [preloaded.node, preloaded.profile]
    : ((await Promise.all([
        nodeId ? ctx.db.getRepository('agNodes').findOne({ filterByTk: nodeId }) : null,
        profileId ? ctx.db.getRepository('agAgentProfiles').findOne({ filterByTk: profileId }) : null,
      ])) as [ModelRecord | null, ModelRecord | null]);
  const state = getRunnerOnlineState(node, profile);
  const lastHeartbeatAt = node ? getDateFromModel(node, 'lastHeartbeatAt') : null;
  return {
    ...state,
    nodeId: nodeId || null,
    nodeKey: node ? getModelString(node, 'nodeKey') : null,
    nodeStatus: node ? getModelString(node, 'status') : null,
    lastHeartbeatAt: lastHeartbeatAt ? lastHeartbeatAt.toISOString() : null,
    agentProfileId: profileId || null,
    profileKey: profile ? getModelString(profile, 'profileKey') : null,
    profileProvider: profile ? getModelString(profile, 'provider') || null : null,
    profileStatus: profile ? getModelString(profile, 'status') : null,
  };
}

interface RunManagementSerializationContext {
  actionPermissions: Awaited<ReturnType<typeof getAgentGatewayActionPermissions>>;
  sessionsById: Map<string, ModelRecord>;
  profilesById: Map<string, ModelRecord>;
  nodesById: Map<string, ModelRecord>;
  taskTemplatesById: Map<string, ModelRecord>;
  skillsById: Map<string, TaskRunSkillVersionOption>;
  tokenUsageByRunId: Map<string, TokenUsageSummary | null>;
}

interface PrepareRunManagementSerializationContextOptions {
  includeTokenEventFallback?: boolean;
}

function indexModelsById(models: ModelRecord[]) {
  const result = new Map<string, ModelRecord>();
  for (const model of models) {
    const id = getOptionalTargetKey(model, 'id');
    if (id) {
      result.set(id, model);
    }
  }
  return result;
}

function getMappedModel(models: Map<string, ModelRecord>, id: string) {
  return id ? models.get(id) || null : null;
}

async function findModelsByIds(ctx: Context, collectionName: string, ids: Set<string>) {
  if (!ids.size) {
    return [] as ModelRecord[];
  }
  return (await ctx.db.getRepository(collectionName).find({
    filter: {
      id: {
        $in: [...ids],
      },
    },
  })) as ModelRecord[];
}

async function prepareRunManagementSerializationContext(
  ctx: Context,
  runs: ModelRecord[],
  options: PrepareRunManagementSerializationContextOptions = {},
): Promise<RunManagementSerializationContext> {
  const sessionIds = new Set<string>();
  const profileIds = new Set<string>();
  const nodeIds = new Set<string>();
  const taskTemplateIds = new Set<string>();
  for (const run of runs) {
    const sessionId = getOptionalTargetKey(run, 'agentSessionId');
    if (sessionId) {
      sessionIds.add(sessionId);
    }
    const profileId = getOptionalTargetKey(run, 'agentProfileId');
    if (profileId) {
      profileIds.add(profileId);
    }
    const nodeId = getOptionalTargetKey(run, 'nodeId');
    if (nodeId) {
      nodeIds.add(nodeId);
    }
    const taskTemplateId = getOptionalTargetKey(run, 'taskTemplateId');
    if (taskTemplateId) {
      taskTemplateIds.add(taskTemplateId);
    }
  }

  const tokenUsageByRunId = new Map<string, TokenUsageSummary | null>();
  const tokenFallbackRunIds: string[] = [];
  for (const run of runs) {
    const runId = getOptionalTargetKey(run, 'id');
    if (!runId) {
      continue;
    }
    const persistedSummary = getRunTokenUsageSummary(run, []);
    tokenUsageByRunId.set(runId, persistedSummary);
    if (options.includeTokenEventFallback !== false && !persistedSummary) {
      tokenFallbackRunIds.push(runId);
    }
  }

  const [actionPermissions, sessions, profiles, nodes, taskTemplates, tokenFallbackSummaries] = await Promise.all([
    getAgentGatewayActionPermissions(ctx),
    findModelsByIds(ctx, 'agAgentSessions', sessionIds),
    findModelsByIds(ctx, 'agAgentProfiles', profileIds),
    findModelsByIds(ctx, 'agNodes', nodeIds),
    findModelsByIds(ctx, 'agTaskTemplates', taskTemplateIds),
    Promise.all(
      tokenFallbackRunIds.map(async (runId) => [runId, await getBoundedRunTokenUsageSummary(ctx, runId)] as const),
    ),
  ]);

  const skillVersionIds = new Set<string>();
  for (const template of taskTemplates) {
    for (const skillVersionId of getStringList(getModelValue(template, 'skillVersionIdsJson'))) {
      skillVersionIds.add(skillVersionId);
    }
  }
  const skillVersions = skillVersionIds.size
    ? ((await ctx.db.getRepository('agSkillVersions').find({
        filter: {
          id: {
            $in: [...skillVersionIds],
          },
        },
        appends: ['skill'],
      })) as ModelRecord[])
    : [];
  const skillsById = new Map<string, TaskRunSkillVersionOption>();
  for (const skillVersion of skillVersions) {
    const serialized = serializeTaskRunSkillVersion(skillVersion);
    if (serialized) {
      skillsById.set(serialized.id, serialized);
    }
  }

  for (const [runId, summary] of tokenFallbackSummaries) {
    tokenUsageByRunId.set(runId, summary);
  }

  return {
    actionPermissions,
    sessionsById: indexModelsById(sessions),
    profilesById: indexModelsById(profiles),
    nodesById: indexModelsById(nodes),
    taskTemplatesById: indexModelsById(taskTemplates),
    skillsById,
    tokenUsageByRunId,
  };
}

function getRunTaskTemplateSummaryFromContext(run: ModelRecord, context: RunManagementSerializationContext) {
  const taskTemplateId = getOptionalTargetKey(run, 'taskTemplateId');
  if (!taskTemplateId) {
    return null;
  }
  const taskTemplate = context.taskTemplatesById.get(taskTemplateId);
  if (!taskTemplate) {
    return {
      id: taskTemplateId,
      templateKey: taskTemplateId,
      displayName: taskTemplateId,
      skillVersionIds: [],
      skills: [],
    };
  }
  return serializeRunTaskTemplateSummary(taskTemplate, context.skillsById);
}

export async function serializeRunForManagement(
  ctx: Context,
  run: ModelRecord,
  suppliedContext?: RunManagementSerializationContext,
) {
  const context = suppliedContext || (await prepareRunManagementSerializationContext(ctx, [run]));
  const json = serializeRunForUser(run);
  const agentSessionId = getOptionalTargetKey(run, 'agentSessionId');
  const agentProfileId = getOptionalTargetKey(run, 'agentProfileId');
  const nodeId = getOptionalTargetKey(run, 'nodeId');
  const runId = getOptionalTargetKey(run, 'id');
  const session = getMappedModel(context.sessionsById, agentSessionId);
  const profile = getMappedModel(context.profilesById, agentProfileId);
  const node = getMappedModel(context.nodesById, nodeId);
  const taskTemplateJson = getRunTaskTemplateSummaryFromContext(run, context);
  const capabilitySummary = await getRunProviderCapabilitySummary(ctx, run, session, profile);
  const preloadedControlContext = {
    node,
    profile,
    capabilitySummary,
  };
  const interruptCapable = await getRunControlCapability(ctx, run, session, 'interrupt', preloadedControlContext);
  const terminateCapable = await getRunControlCapability(ctx, run, session, 'terminate', preloadedControlContext);
  const actionPermissions = context.actionPermissions;
  return {
    ...json,
    taskTitle: getRunTaskTitle(run) || null,
    taskTemplateJson,
    tokenUsageJson: runId ? context.tokenUsageByRunId.get(runId) || null : null,
    ...(session
      ? {
          agentSessionCapabilitiesJson: capabilitySummary.capabilities,
        }
      : {}),
    agentProvider: capabilitySummary.provider,
    agentProviderCapabilitySource: capabilitySummary.providerSource,
    agentProviderCapabilitiesJson: capabilitySummary.capabilities,
    agentGatewayActionPermissionsJson: {
      resumeAgentSession: actionPermissions.resumeAgentSession,
      readSessionMessages: actionPermissions.readSessionMessages,
      readTerminal: actionPermissions.readTerminal,
      readArtifacts: actionPermissions.readArtifacts,
      readRawLogs: actionPermissions.readRawLogs,
      interruptRun: actionPermissions.interruptRun,
      terminateRun: actionPermissions.terminateRun,
      cancelRun: actionPermissions.cancelRun,
    },
    agentGatewayControlActionsJson: {
      interruptRun: actionPermissions.interruptRun && interruptCapable,
      terminateRun: actionPermissions.terminateRun && terminateCapable,
    },
    runnerStatusJson: await getRunRunnerStatus(ctx, run, { node, profile }),
  };
}

async function serializeRunsForManagement(ctx: Context, runs: ModelRecord[]) {
  const context = await prepareRunManagementSerializationContext(ctx, runs, {
    includeTokenEventFallback: false,
  });
  return await Promise.all(runs.map((run) => serializeRunForManagement(ctx, run, context)));
}

function isRecordWithValues(value: JsonRecord) {
  return Object.keys(value).length > 0;
}

function collectResolvedSkillVersionIds(value: unknown, result = new Set<string>()) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectResolvedSkillVersionIds(item, result);
    }
    return result;
  }
  const record = getRecord(value);
  if (!isRecordWithValues(record)) {
    return result;
  }
  const skillVersionId = getString(record.skillVersionId);
  if (skillVersionId) {
    result.add(skillVersionId);
  }
  for (const entryValue of Object.values(record)) {
    if (typeof entryValue === 'object' && entryValue !== null) {
      collectResolvedSkillVersionIds(entryValue, result);
    }
  }
  return result;
}

function serializeSkillVersionPayload(ctx: Context, skillVersion: ModelRecord): SkillVersionPayload | null {
  const metadata = getRecord(getModelValue(skillVersion, 'metadataJson'));
  const skillVersionId = String(getModelTargetKey(skillVersion, 'id'));
  const source = serializeSkillVersionSourceForNode(ctx, skillVersionId, getRecord(metadata.source));
  if (!source || !isRecordWithValues(source)) {
    return null;
  }

  return {
    skillVersionId,
    skillId: getOptionalTargetKey(skillVersion, 'skillId') || undefined,
    versionLabel: getModelString(skillVersion, 'versionLabel'),
    status: getModelString(skillVersion, 'status'),
    source,
  };
}

async function getClaimSkillVersionPayloads(ctx: Context, payload: JsonRecord, transaction: Transaction) {
  const skillVersionIds = Array.from(collectResolvedSkillVersionIds(payload.resolvedSkills));
  if (!skillVersionIds.length) {
    return [];
  }

  const skillVersions = (await ctx.db.getRepository('agSkillVersions').find({
    filter: {
      id: {
        $in: skillVersionIds,
      },
    },
    transaction,
  })) as ModelRecord[];

  return skillVersions
    .map((skillVersion) => serializeSkillVersionPayload(ctx, skillVersion))
    .filter((skillVersion): skillVersion is SkillVersionPayload => Boolean(skillVersion));
}

function stripInlineSkillVersionSources(payload: JsonRecord) {
  const sanitizedPayload = {
    ...payload,
  };
  delete sanitizedPayload.skillVersion;
  delete sanitizedPayload.skillVersions;
  if (sanitizedPayload.resolvedSkills !== undefined) {
    sanitizedPayload.resolvedSkills = stripResolvedSkillSources(sanitizedPayload.resolvedSkills);
  }
  return sanitizedPayload;
}

function stripResolvedSkillSources(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripResolvedSkillSources(item));
  }
  const record = getRecord(value);
  if (!isRecordWithValues(record)) {
    return value;
  }

  const sanitizedRecord: JsonRecord = {
    ...record,
  };
  if (getString(sanitizedRecord.skillVersionId)) {
    delete sanitizedRecord.source;
  }
  for (const [key, entryValue] of Object.entries(sanitizedRecord)) {
    if (typeof entryValue === 'object' && entryValue !== null) {
      sanitizedRecord[key] = stripResolvedSkillSources(entryValue);
    }
  }
  return sanitizedRecord;
}

function canPreserveInlineSkillVersionSources(run: ModelRecord) {
  return NODE_OWNED_INLINE_SKILL_SOURCE_TYPES.has(getModelString(run, 'sourceType'));
}

async function serializeRunForNodeClaim(ctx: Context, run: ModelRecord, transaction: Transaction) {
  const json = serializeRun(run);
  const executionPayloadJson = getRecord(getModelValue(run, 'executionPayloadJson'));
  const skillVersions = await getClaimSkillVersionPayloads(ctx, executionPayloadJson, transaction);
  const baseExecutionPayloadJson = canPreserveInlineSkillVersionSources(run)
    ? executionPayloadJson
    : stripInlineSkillVersionSources(executionPayloadJson);
  return {
    ...json,
    claimAttempt: getModelNumber(run, 'claimAttempt'),
    leaseVersion: getModelNumber(run, 'leaseVersion'),
    promptSnapshot: getRecord(getModelValue(run, 'promptSnapshot')),
    executionPayloadJson: skillVersions.length
      ? {
          ...baseExecutionPayloadJson,
          skillVersions,
        }
      : baseExecutionPayloadJson,
  };
}

function getQueryValue(ctx: Context, key: string) {
  const value = getRecord(ctx.query)[key];
  return Array.isArray(value) ? value[0] : value;
}

function getQueryString(ctx: Context, key: string) {
  return getString(getQueryValue(ctx, key));
}

function getQueryLimit(ctx: Context) {
  const value = Number(getQueryValue(ctx, 'limit') || DEFAULT_RUN_LIST_PAGE_SIZE);
  if (!Number.isInteger(value) || value <= 0) {
    return DEFAULT_RUN_LIST_PAGE_SIZE;
  }
  return Math.min(value, MAX_RUN_LIST_PAGE_SIZE);
}

function getPositiveQueryInteger(ctx: Context, key: string, defaultValue: number, maxValue?: number) {
  const value = Number(getQueryValue(ctx, key) || defaultValue);
  if (!Number.isInteger(value) || value <= 0) {
    return defaultValue;
  }
  return maxValue ? Math.min(value, maxValue) : value;
}

function getRunListPagination(ctx: Context) {
  const page = getPositiveQueryInteger(ctx, 'page', 1);
  const pageSizeValue = getQueryValue(ctx, 'pageSize') ?? getQueryValue(ctx, 'limit');
  const pageSize = Number(pageSizeValue || DEFAULT_RUN_LIST_PAGE_SIZE);
  const normalizedPageSize =
    Number.isInteger(pageSize) && pageSize > 0
      ? Math.min(pageSize, MAX_RUN_LIST_PAGE_SIZE)
      : DEFAULT_RUN_LIST_PAGE_SIZE;
  return {
    page,
    pageSize: normalizedPageSize,
    offset: (page - 1) * normalizedPageSize,
  };
}

function normalizeRunListSortItem(value: unknown) {
  const rawSort = getString(value).trim();
  if (!rawSort) {
    return null;
  }
  const descending = rawSort.startsWith('-');
  const requestedField = descending ? rawSort.slice(1) : rawSort;
  const sortField = RUN_LIST_SORT_FIELD_MAP[requestedField];
  if (!sortField) {
    return null;
  }
  return `${descending ? '-' : ''}${sortField}`;
}

function getRunListSort(ctx: Context) {
  const rawSort = getRecord(ctx.query).sort;
  let sortValues: unknown[] = Array.isArray(rawSort) ? rawSort : [rawSort];
  if (typeof rawSort === 'string') {
    const trimmed = rawSort.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        sortValues = Array.isArray(parsed) ? parsed : [rawSort];
      } catch {
        sortValues = [rawSort];
      }
    } else if (trimmed.includes(',')) {
      sortValues = trimmed.split(',');
    }
  }

  const sort = sortValues.map(normalizeRunListSortItem).filter((item): item is string => Boolean(item));
  if (!sort.length) {
    return ['-createdAt'];
  }
  if (!sort.includes('createdAt') && !sort.includes('-createdAt')) {
    sort.push('-createdAt');
  }
  return sort;
}

function getTotalPage(count: number, pageSize: number) {
  return Math.ceil(count / pageSize);
}

function hasFilterValues(filter: JsonRecord) {
  return Object.keys(filter).length > 0;
}

function getQueryFilter(ctx: Context) {
  const filter = getQueryValue(ctx, 'filter');
  if (typeof filter === 'string') {
    if (!filter.trim()) {
      return {};
    }
    try {
      return getRecord(JSON.parse(filter));
    } catch {
      return {};
    }
  }
  return getRecord(filter);
}

function mergeRunFilters(filters: JsonRecord[]) {
  const activeFilters = filters.filter(hasFilterValues);
  if (!activeFilters.length) {
    return {};
  }
  if (activeFilters.length === 1) {
    return activeFilters[0];
  }
  return {
    $and: activeFilters,
  };
}

function getRunListFilter(ctx: Context) {
  const compiledFilter = getQueryFilter(ctx);
  const legacyFilter: JsonRecord = {};
  const status = getQueryString(ctx, 'status');
  const nodeId = getQueryString(ctx, 'nodeId');
  const agentProfileId = getQueryString(ctx, 'agentProfileId');
  const taskTemplateId = getQueryString(ctx, 'taskTemplateId');
  const createdAtFrom = getDate(getQueryValue(ctx, 'createdAtFrom'));
  const createdAtTo = getDate(getQueryValue(ctx, 'createdAtTo'));

  if (status) {
    legacyFilter.status = status.includes(',')
      ? {
          $in: status
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }
      : status;
  }
  if (nodeId) {
    legacyFilter.nodeId = nodeId;
  }
  if (agentProfileId) {
    legacyFilter.agentProfileId = agentProfileId;
  }
  if (taskTemplateId) {
    legacyFilter.taskTemplateId = taskTemplateId;
  }
  if (createdAtFrom || createdAtTo) {
    legacyFilter.createdAt = {
      ...(createdAtFrom ? { $gte: createdAtFrom } : {}),
      ...(createdAtTo ? { $lte: createdAtTo } : {}),
    };
  }

  return mergeRunFilters([compiledFilter, legacyFilter]);
}

function respondLeaseLost(ctx: Context, message: string) {
  ctx.status = 409;
  ctx.body = {
    code: 'lease_lost',
    message,
  };
  return null;
}

async function authenticateNodeForRun(
  ctx: Context,
  nodeId: string,
  transaction: Transaction,
  options: { lock?: boolean } = {},
) {
  const token = extractNodeToken(ctx);
  if (!token) {
    ctx.throw(401, 'Missing Agent Gateway node token');
  }

  const node = (await ctx.db.getRepository('agNodes').findOne({
    filterByTk: nodeId,
    transaction,
    lock: options.lock === false ? undefined : transaction.LOCK.UPDATE,
  })) as ModelRecord | null;

  if (!node || !verifyNodeToken(token, getModelString(node, 'nodeTokenHash'))) {
    ctx.throw(401, 'Invalid Agent Gateway node token');
  }

  if (getModelString(node, 'status') !== 'active') {
    ctx.throw(403, 'Agent Gateway node is not active');
  }

  ctx.state.agentGatewaySubject = {
    type: 'machine',
    nodeId: getModelTargetKey(node, 'id'),
    nodeKey: getModelString(node, 'nodeKey'),
    tokenLast4: getModelString(node, 'tokenLast4') || undefined,
  };
  ctx.state.agentGatewayNode = node;
  ctx.state.agentGatewayAuth = {
    authenticatedBy: 'node-token',
    subject: ctx.state.agentGatewaySubject,
  };

  return {
    node,
  };
}

async function createRun(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.manage,
    'Agent Gateway management permission required',
  );

  const values = getBodyValues(ctx);
  const sourceType = getString(values.sourceType) || 'manual';
  if (NODE_OWNED_INLINE_SKILL_SOURCE_TYPES.has(sourceType)) {
    ctx.throw(400, `${sourceType} runs must be created by the Agent Gateway node smoke API`);
  }
  const now = new Date();
  const promptSnapshot = getRecord(values.promptSnapshot);
  const rawExecutionPayload = getRecord(values.executionPayloadJson || values.executionPayload);
  const hasExecutionPrompt = Boolean(getString(rawExecutionPayload.prompt) || getString(rawExecutionPayload.message));
  const renderedPrompt = hasExecutionPrompt ? '' : getString(promptSnapshot.renderedPrompt);
  const executionPayloadJson = renderedPrompt
    ? {
        ...rawExecutionPayload,
        prompt: renderedPrompt,
      }
    : rawExecutionPayload;
  const run = (await ctx.db.getRepository('agRuns').create({
    values: {
      runCode: getString(values.runCode) || `run_${randomUUID()}`,
      status: CLAIMABLE_RUN_STATUS,
      claimAttempt: 0,
      leaseVersion: 0,
      cancelRequested: false,
      promptSnapshot,
      executionPayloadJson,
      sourceType,
      sourceCollection: getString(values.sourceCollection) || null,
      sourceRecordId: getString(values.sourceRecordId) || null,
      requestedAt: now,
      queuedAt: now,
      nodeId: getString(values.nodeId) || null,
      agentProfileId: getString(values.agentProfileId) || null,
      promptTemplateId: getString(values.promptTemplateId) || null,
      taskTemplateId: getString(values.taskTemplateId) || null,
      dispatchBindingId: getString(values.dispatchBindingId) || null,
    },
  })) as ModelRecord;

  ctx.body = serializeCreatedRunForUser(run);
}

async function createTaskRun(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.dispatch,
    'Agent Gateway dispatch permission required',
  );

  const bodyValues = getBodyValues(ctx);

  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const { values, taskTemplate } = await getTaskRunValuesWithTemplateDefaults(ctx, bodyValues, transaction);
    const renderedPrompt = getTaskInstruction(values);
    if (!renderedPrompt) {
      ctx.throw(400, 'instruction is required');
    }
    const selection = await resolveBuildRunnerSelection(ctx, values, transaction);
    const nodeId = String(getModelTargetKey(selection.node, 'id'));
    const agentProfileId = String(getModelTargetKey(selection.profile, 'id'));
    const profileKey = getModelString(selection.profile, 'profileKey');
    const provider = getModelString(selection.profile, 'provider') || undefined;
    const cwd = getString(values.cwd) || '.';
    const now = new Date();
    const artifactPayload = getTaskRunArtifactPayload(values);
    const resolvedSkills = getTaskRunResolvedSkills(values);
    const timeoutMs = getTaskRunTimeoutMs(values);
    if (resolvedSkills) {
      for (const skillSelection of resolvedSkills) {
        await assertTaskRunSkillVersionActive(ctx, skillSelection.skillVersionId, transaction);
      }
    }
    const executionPayloadJson = {
      source: 'agent-gateway-ui',
      title: getString(values.title) || null,
      prompt: renderedPrompt,
      instruction: getTaskInstruction(values),
      profileKey,
      commandKey: getString(values.commandKey) || profileKey,
      ...(provider ? { provider } : {}),
      cwd,
      terminalBackend: 'tmux',
      ...(timeoutMs ? { timeoutMs } : {}),
      ...artifactPayload,
      ...(resolvedSkills ? { resolvedSkills } : {}),
      ...(taskTemplate
        ? {
            taskTemplate: {
              id: taskTemplate.taskTemplateId,
              key: taskTemplate.taskTemplateKey,
              displayName: taskTemplate.taskTemplateDisplayName,
            },
          }
        : {}),
    };
    const run = (await ctx.db.getRepository('agRuns').create({
      values: {
        runCode: getString(values.runCode) || `run_task_${randomUUID()}`,
        status: CLAIMABLE_RUN_STATUS,
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        promptSnapshot: {
          templateKey: 'agent-gateway-task-run',
          templateText: '{{prompt}}',
          renderedPrompt,
          variables: {
            title: getString(values.title) || null,
            instruction: getTaskInstruction(values),
            ...(taskTemplate ? { taskTemplateKey: taskTemplate.taskTemplateKey } : {}),
          },
          renderedAt: now.toISOString(),
        },
        executionPayloadJson,
        resultSummaryJson: {
          title: getString(values.title) || null,
          requestedFrom: 'agent-gateway-ui',
          ...(taskTemplate ? { taskTemplateKey: taskTemplate.taskTemplateKey } : {}),
        },
        sourceType: TASK_RUN_SOURCE_TYPE,
        requestedAt: now,
        queuedAt: now,
        requestedById: getCurrentUserId(ctx) || null,
        nodeId,
        agentProfileId,
        taskTemplateId: taskTemplate?.taskTemplateId || null,
      },
      transaction,
    })) as ModelRecord;
    await createInitialTaskConversationEvent(ctx, {
      runId: String(getModelTargetKey(run, 'id')),
      renderedPrompt,
      title: getString(values.title) || undefined,
      transaction,
    });

    return {
      run,
      node: selection.node,
      profile: selection.profile,
    };
  });

  ctx.body = {
    runId: getModelTargetKey(result.run, 'id'),
    runCode: getModelString(result.run, 'runCode'),
    run: await serializeRunForManagement(ctx, result.run),
    runnerStatus: getRunnerOnlineState(result.node, result.profile),
  };
}

async function listRuns(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRuns,
    'Agent Gateway run read permission required',
  );
  const filter = await getVisibleRunFilter(ctx, getRunListFilter(ctx), 'list');
  const { page, pageSize, offset } = getRunListPagination(ctx);
  const sort = getRunListSort(ctx);
  const runRepo = ctx.db.getRepository('agRuns');

  const [count, runs, taskTemplates] = await Promise.all([
    runRepo.count({
      filter,
    }),
    runRepo.find({
      filter,
      sort,
      limit: pageSize,
      offset,
    }) as Promise<ModelRecord[]>,
    listRunTaskTemplateFilterOptions(ctx),
  ]);

  ctx.body = {
    rows: await serializeRunsForManagement(ctx, runs),
    count,
    page,
    pageSize,
    totalPage: getTotalPage(count, pageSize),
    taskTemplates,
  };
}

async function getRun(ctx: Context, runId: string) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRunDetails,
    'Agent Gateway run detail read permission required',
  );

  const filter = await getVisibleRunFilter(
    ctx,
    {
      id: runId,
    },
    'get',
  );
  const run = (await ctx.db.getRepository('agRuns').findOne({
    filter,
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, {
      code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
      message: 'Run not found',
    });
  }

  ctx.body = await serializeRunForManagement(ctx, run);
}

function getStandardAgRunsTargetKey(ctx: Context, action: 'get') {
  const normalizedPath = normalizeNocoBaseApiPath(ctx.path);
  const prefix = `/agRuns:${action}/`;
  const pathValue = normalizedPath.startsWith(prefix) ? normalizedPath.slice(prefix.length).split('/')[0] : '';
  const query = getRecord(ctx.query);
  const rawRunId = pathValue || getString(query.filterByTk);
  if (!rawRunId) {
    return '';
  }
  try {
    return decodeURIComponent(rawRunId);
  } catch {
    return rawRunId;
  }
}

async function listStandardRuns(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRuns,
    'Agent Gateway run read permission required',
  );
  const filter = await getVisibleRunFilter(ctx, getRunListFilter(ctx), 'list');
  const runs = (await ctx.db.getRepository('agRuns').find({
    filter,
    sort: ['-createdAt'],
    limit: getQueryLimit(ctx),
  })) as ModelRecord[];

  ctx.body = runs.map((run) => serializeRunForUser(run));
}

async function getStandardRun(ctx: Context) {
  const runId = getStandardAgRunsTargetKey(ctx, 'get');
  if (!runId) {
    ctx.throw(400, 'Agent Gateway run id is required');
  }
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRun,
    'Agent Gateway run standard get permission required',
  );
  const filter = await getVisibleRunFilter(
    ctx,
    {
      id: runId,
    },
    'get',
  );
  const run = (await ctx.db.getRepository('agRuns').findOne({
    filter,
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, {
      code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
      message: 'Run not found',
    });
  }

  ctx.body = serializeRunForUser(run);
}

async function getActiveProfiles(ctx: Context, nodeId: string, values: JsonRecord, transaction: Transaction) {
  const profileId = getString(values.agentProfileId || values.profileId);
  const profileKey = getString(values.profileKey);
  const filter: JsonRecord = {
    nodeId,
    status: 'active',
  };
  if (profileId) {
    filter.id = profileId;
  }
  if (profileKey) {
    filter.profileKey = profileKey;
  }

  const profiles = (await ctx.db.getRepository('agAgentProfiles').find({
    filter,
    sort: ['profileKey'],
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord[];

  if ((profileId || profileKey) && !profiles.length) {
    ctx.throw(409, 'Requested Agent Gateway profile is not active on this node');
  }

  return profiles;
}

async function countActiveRuns(ctx: Context, filter: JsonRecord, transaction: Transaction) {
  return await ctx.db.getRepository('agRuns').count({
    filter: {
      ...filter,
      status: {
        $in: [...LEASE_OWNING_RUN_STATUSES],
      },
      claimExpiresAt: {
        $gt: new Date(),
      },
    },
    transaction,
  });
}

async function validateNodeConcurrency(ctx: Context, node: ModelRecord, now: Date, transaction: Transaction) {
  const nodeId = String(getModelTargetKey(node, 'id'));
  const nodeMaxConcurrency = getMaxConcurrency(getRecord(getModelValue(node, 'capabilitiesJson')));
  const activeNodeRuns = await countActiveRuns(ctx, { nodeId }, transaction);
  if (activeNodeRuns >= nodeMaxConcurrency) {
    ctx.body = {
      claimed: false,
      reason: 'node_concurrency_full',
      checkedAt: now.toISOString(),
    };
    return null;
  }

  return nodeMaxConcurrency;
}

async function hasProfileCapacity(
  ctx: Context,
  profile: ModelRecord,
  nodeMaxConcurrency: number,
  transaction: Transaction,
  capacityCache: Map<string, boolean>,
) {
  const profileId = String(getModelTargetKey(profile, 'id'));
  if (capacityCache.has(profileId)) {
    return Boolean(capacityCache.get(profileId));
  }

  const profileMaxConcurrency = getMaxConcurrency(
    getRecord(getModelValue(profile, 'capabilitiesJson')),
    nodeMaxConcurrency,
  );
  const activeProfileRuns = await countActiveRuns(ctx, { agentProfileId: profileId }, transaction);
  const hasCapacity = activeProfileRuns < profileMaxConcurrency;
  capacityCache.set(profileId, hasCapacity);
  return hasCapacity;
}

function getClaimableRunFilter(nodeId: string, profileIds: string[], runId?: string) {
  return {
    ...(runId ? { id: runId } : {}),
    status: CLAIMABLE_RUN_STATUS,
    cancelRequested: false,
    $and: [
      {
        $or: [
          {
            nodeId,
          },
          {
            nodeId: null,
          },
        ],
      },
      {
        $or: [
          {
            agentProfileId: null,
          },
          {
            agentProfileId: {
              $in: profileIds,
            },
          },
        ],
      },
    ],
  };
}

async function pickCandidateProfile(
  ctx: Context,
  run: ModelRecord,
  profiles: ModelRecord[],
  profileById: Map<string, ModelRecord>,
  nodeMaxConcurrency: number,
  transaction: Transaction,
  capacityCache: Map<string, boolean>,
) {
  const targetProfileId = getOptionalTargetKey(run, 'agentProfileId');
  if (targetProfileId) {
    const profile = profileById.get(targetProfileId);
    if (profile && (await hasProfileCapacity(ctx, profile, nodeMaxConcurrency, transaction, capacityCache))) {
      return profile;
    }
    return null;
  }

  for (const profile of profiles) {
    if (await hasProfileCapacity(ctx, profile, nodeMaxConcurrency, transaction, capacityCache)) {
      return profile;
    }
  }

  return null;
}

async function findClaimableCandidate(
  ctx: Context,
  nodeId: string,
  profiles: ModelRecord[],
  nodeMaxConcurrency: number,
  transaction: Transaction,
  runId?: string,
) {
  const capacityCache = new Map<string, boolean>();
  const availableProfiles: ModelRecord[] = [];
  for (const profile of profiles) {
    if (await hasProfileCapacity(ctx, profile, nodeMaxConcurrency, transaction, capacityCache)) {
      availableProfiles.push(profile);
    }
  }
  if (!availableProfiles.length) {
    return {
      candidate: null,
      reason: 'profile_concurrency_full',
    };
  }

  const profileIds = availableProfiles.map((profile) => String(getModelTargetKey(profile, 'id')));
  const profileById = new Map(availableProfiles.map((profile) => [String(getModelTargetKey(profile, 'id')), profile]));
  const candidates = (await ctx.db.getRepository('agRuns').find({
    filter: getClaimableRunFilter(nodeId, profileIds, runId),
    sort: ['queuedAt', 'createdAt', 'id'],
    limit: 1,
    transaction,
    lock: transaction.LOCK.UPDATE,
    skipLocked: true,
  })) as ModelRecord[];
  const run = candidates[0];
  if (!run) {
    return {
      candidate: null,
      reason: 'no_claimable_run',
    };
  }
  const profile = await pickCandidateProfile(
    ctx,
    run,
    availableProfiles,
    profileById,
    nodeMaxConcurrency,
    transaction,
    capacityCache,
  );
  if (profile) {
    return {
      candidate: {
        run,
        profile,
      } as ClaimCandidate,
    };
  }

  return {
    candidate: null,
    reason: 'profile_concurrency_full',
  };
}

async function claimRun(ctx: Context, nodeId: string) {
  const values = getBodyValues(ctx);
  await reconcileExpiredRunLeases(ctx, {
    recoveryReason: 'before-claim',
  });
  const claimResult = await ctx.db.sequelize.transaction(async (transaction) => {
    const { node } = await authenticateNodeForRun(ctx, nodeId, transaction);
    const now = new Date();
    const profiles = await getActiveProfiles(ctx, nodeId, values, transaction);
    if (!profiles.length) {
      ctx.throw(409, 'No active Agent Gateway profile is available on this node');
    }

    const nodeMaxConcurrency = await validateNodeConcurrency(ctx, node, now, transaction);
    if (nodeMaxConcurrency === null) {
      return ctx.body;
    }

    const targetRunId = getString(values.runId);
    const { candidate, reason } = await findClaimableCandidate(
      ctx,
      nodeId,
      profiles,
      nodeMaxConcurrency,
      transaction,
      targetRunId,
    );
    if (!candidate) {
      return {
        claimed: false,
        reason,
        checkedAt: now.toISOString(),
      };
    }

    const claimToken = createClaimToken();
    const claimAttempt = getModelNumber(candidate.run, 'claimAttempt') + 1;
    const leaseVersion = 1;
    const claimExpiresAt = getLeaseExpiresAt(now);
    await ctx.db.getRepository('agRuns').update({
      filterByTk: getModelTargetKey(candidate.run, 'id'),
      values: {
        status: 'claimed',
        claimAttempt,
        leaseVersion,
        ...toStoredTokenFields(claimToken, 'claimTokenHash', 'claimTokenLast4'),
        claimExpiresAt,
        claimedAt: now,
        nodeId,
        agentProfileId: getModelTargetKey(candidate.profile, 'id'),
      },
      transaction,
    });

    const claimedRun = (await ctx.db.getRepository('agRuns').findOne({
      filterByTk: getModelTargetKey(candidate.run, 'id'),
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord;

    return {
      claimed: true,
      runId: getModelTargetKey(candidate.run, 'id'),
      runCode: getModelString(candidate.run, 'runCode'),
      status: 'claimed',
      nodeId,
      agentProfileId: getModelTargetKey(candidate.profile, 'id'),
      claimAttempt,
      leaseVersion,
      claimExpiresAt: claimExpiresAt.toISOString(),
      leaseTtlMs: DEFAULT_CLAIM_LEASE_TTL_MS,
      serverTime: now.toISOString(),
      claimToken: claimToken.token,
      tokenLast4: claimToken.tokenLast4,
      heartbeatIntervalSeconds: Math.min(DEFAULT_CLAIM_LEASE_SECONDS, 30),
      profileKey: getModelString(candidate.profile, 'profileKey'),
      profileProvider: getModelString(candidate.profile, 'provider') || undefined,
      nodeCapabilities: getRecord(getModelValue(node, 'capabilitiesJson')),
      profileCapabilities: getRecord(getModelValue(candidate.profile, 'capabilitiesJson')),
      run: await serializeRunForNodeClaim(ctx, claimedRun, transaction),
    };
  });

  ctx.body = claimResult;
}

async function findActiveProfileId(ctx: Context, nodeId: string, profileKey: string, transaction: Transaction) {
  if (!profileKey) {
    return null;
  }
  const profile = (await ctx.db.getRepository('agAgentProfiles').findOne({
    filter: {
      nodeId,
      profileKey,
      status: 'active',
    },
    transaction,
  })) as ModelRecord | null;
  return profile ? getModelTargetKey(profile, 'id') : null;
}

async function createSmokeRun(ctx: Context, nodeId: string) {
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    await authenticateNodeForRun(ctx, nodeId, transaction, { lock: false });

    const rawExecutionPayload = getRecord(values.executionPayloadJson || values.executionPayload);
    const profileKey = getString(values.profileKey || rawExecutionPayload.profileKey) || 'opencode';
    const agentProfileId = await findActiveProfileId(ctx, nodeId, profileKey, transaction);
    const now = new Date();
    const run = (await ctx.db.getRepository('agRuns').create({
      values: {
        runCode: getString(values.runCode) || `smoke_${randomUUID()}`,
        status: CLAIMABLE_RUN_STATUS,
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        promptSnapshot: getRecord(values.promptSnapshot),
        executionPayloadJson: {
          ...rawExecutionPayload,
          profileKey,
        },
        sourceType: 'opencode-smoke',
        requestedAt: now,
        queuedAt: now,
        nodeId,
        agentProfileId,
      },
      transaction,
    })) as ModelRecord;

    return {
      runId: getModelTargetKey(run, 'id'),
      status: getModelString(run, 'status'),
      nodeId,
      agentProfileId,
    };
  });

  ctx.body = result;
}

export async function validateRunLease(
  ctx: Context,
  nodeId: string,
  runId: string,
  values: JsonRecord,
  transaction: Transaction,
  options: {
    allowExpiredLease?: boolean;
    allowExpiredLeaseStatuses?: readonly string[];
    allowStaleLeaseVersion?: boolean;
    allowPreviousLeaseVersion?: boolean;
    allowedStatuses?: readonly string[];
  } = {},
): Promise<RunLease | null> {
  await authenticateNodeForRun(ctx, nodeId, transaction, { lock: false });
  const claimToken = getString(values.claimToken);
  const claimAttempt = getRequiredInteger(ctx, values.claimAttempt, 'claimAttempt');
  const leaseVersion = getRequiredInteger(ctx, values.leaseVersion, 'leaseVersion');
  if (!claimToken) {
    ctx.throw(400, 'claimToken is required');
  }

  const run = (await ctx.db.getRepository('agRuns').findOne({
    filterByTk: runId,
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, 'Run not found');
  }

  if (getOptionalTargetKey(run, 'nodeId') !== nodeId) {
    return respondLeaseLost(ctx, 'Run is not leased by this node');
  }
  if (getModelNumber(run, 'claimAttempt') !== claimAttempt) {
    return respondLeaseLost(ctx, 'Claim attempt is stale');
  }
  const currentLeaseVersion = getModelNumber(run, 'leaseVersion');
  const leaseVersionMatches = currentLeaseVersion === leaseVersion;
  const staleLeaseVersionAllowed = options.allowStaleLeaseVersion && leaseVersion < currentLeaseVersion;
  const previousLeaseVersionAllowed = options.allowPreviousLeaseVersion && leaseVersion === currentLeaseVersion - 1;
  if (!leaseVersionMatches && !staleLeaseVersionAllowed && !previousLeaseVersionAllowed) {
    return respondLeaseLost(ctx, 'Lease version is stale');
  }
  if (!verifyClaimToken(claimToken, getModelString(run, 'claimTokenHash'))) {
    return respondLeaseLost(ctx, 'Claim token is stale');
  }

  const status = getModelString(run, 'status');
  const statusAllowed = isActiveRunStatus(status) || Boolean(options.allowedStatuses?.includes(status));
  if (!statusAllowed) {
    return respondLeaseLost(ctx, 'Run is no longer active');
  }

  const claimExpiresAt = getDateFromModel(run, 'claimExpiresAt');
  const allowExpiredLease = options.allowExpiredLease || Boolean(options.allowExpiredLeaseStatuses?.includes(status));
  if (!allowExpiredLease && (!claimExpiresAt || claimExpiresAt.getTime() <= Date.now())) {
    return respondLeaseLost(ctx, 'Run lease has expired');
  }

  return {
    run,
    claimAttempt,
    leaseVersion: currentLeaseVersion,
    requestedLeaseVersion: leaseVersion,
  };
}

function getHeartbeatStatus(ctx: Context, currentStatus: string, requestedStatus: string) {
  if (currentStatus === STALLED_RUN_STATUS) {
    if (!requestedStatus) {
      return 'running';
    }
    if (!isHeartbeatRunStatus(requestedStatus)) {
      ctx.throw(400, 'Unsupported heartbeat status');
    }
    return requestedStatus;
  }
  if (!requestedStatus) {
    return currentStatus;
  }

  if (!isHeartbeatRunStatus(requestedStatus)) {
    ctx.throw(400, 'Unsupported heartbeat status');
  }
  if (currentStatus === 'canceling') {
    return currentStatus;
  }

  if (!isHeartbeatRunStatus(currentStatus)) {
    return currentStatus;
  }

  const statusOrder: Record<HeartbeatRunStatus, number> = {
    claimed: 0,
    syncing_skills: 1,
    running: 2,
    finalizing: 3,
  };
  return statusOrder[requestedStatus] > statusOrder[currentStatus] ? requestedStatus : currentStatus;
}

async function runHeartbeat(ctx: Context, nodeId: string, runId: string) {
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowedStatuses: [STALLED_RUN_STATUS],
      allowPreviousLeaseVersion: true,
    });
    if (!lease) {
      return null;
    }

    const now = new Date();
    const heartbeatRetry = lease.requestedLeaseVersion !== lease.leaseVersion;
    const nextLeaseVersion = heartbeatRetry ? lease.leaseVersion : lease.leaseVersion + 1;
    const status = heartbeatRetry
      ? getModelString(lease.run, 'status')
      : getHeartbeatStatus(ctx, getModelString(lease.run, 'status'), getString(values.status));
    const claimExpiresAt = heartbeatRetry ? getDateFromModel(lease.run, 'claimExpiresAt') : getLeaseExpiresAt(now);
    if (!claimExpiresAt) {
      return respondLeaseLost(ctx, 'Run lease has expired');
    }
    if (!heartbeatRetry) {
      await ctx.db.getRepository('agRuns').update({
        filterByTk: runId,
        values: {
          status,
          leaseVersion: nextLeaseVersion,
          claimExpiresAt,
          lastRunHeartbeatAt: now,
          startedAt:
            status === 'running' && !getModelValue(lease.run, 'startedAt')
              ? now
              : getModelValue(lease.run, 'startedAt'),
        },
        transaction,
      });
      await ctx.db.getRepository('agNodes').update({
        filterByTk: nodeId,
        values: {
          lastHeartbeatAt: now,
        },
        transaction,
      });
    }
    const cancelRequested = getBoolean(getModelValue(lease.run, 'cancelRequested')) || status === 'canceling';
    const activeTerminateControl = cancelRequested
      ? ((await ctx.db.getRepository('agRunControlRequests').findOne({
          filter: {
            runId,
            action: 'terminate',
            status: ['accepted', 'delivered'],
          },
          transaction,
        })) as ModelRecord | null)
      : null;

    return {
      runId,
      status,
      claimAttempt: lease.claimAttempt,
      leaseVersion: nextLeaseVersion,
      claimExpiresAt: claimExpiresAt.toISOString(),
      leaseTtlMs: Math.max(0, claimExpiresAt.getTime() - now.getTime()),
      serverTime: now.toISOString(),
      cancelRequested,
      ...(activeTerminateControl ? { cancelReason: AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } : {}),
    };
  });

  if (result) {
    ctx.body = result;
  }
}

function assertTerminalAllowed(
  ctx: Context,
  run: ModelRecord,
  terminalStatus: TerminalRunStatus,
  allowedStatuses: readonly string[],
) {
  const currentStatus = getModelString(run, 'status');
  if (isTerminalRunStatus(currentStatus)) {
    return respondLeaseLost(ctx, `Run is already ${currentStatus}`);
  }
  if (currentStatus === 'canceling' && terminalStatus !== 'canceled') {
    return respondLeaseLost(ctx, 'Run is canceling');
  }
  if (!allowedStatuses.includes(currentStatus as ActiveRunStatus)) {
    return respondLeaseLost(ctx, `Run cannot become ${terminalStatus} from ${currentStatus}`);
  }

  return true;
}

async function appendTerminalControlFailedEvent(options: {
  ctx: Context;
  run: ModelRecord;
  request: ModelRecord;
  terminalStatus: TerminalRunStatus;
  transaction: Transaction;
}) {
  const runId = String(getModelTargetKey(options.run, 'id'));
  const source = 'terminal-control';
  const action = getModelString(options.request, 'action');
  if (action !== 'interrupt' && action !== 'terminate') {
    return;
  }
  const latestEvent = (await options.ctx.db.getRepository('agRunEvents').findOne({
    filter: {
      runId,
      source,
    },
    sort: ['-sequence'],
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  const sequence = (latestEvent ? getModelNumber(latestEvent, 'sequence') : 0) + 1;
  const eventType = `terminal.${action}.failed`;
  await options.ctx.db.getRepository('agRunEvents').create({
    values: {
      id: randomUUID(),
      runId,
      claimAttempt: getModelNumber(options.run, 'claimAttempt'),
      source,
      sequence,
      level: 'info',
      eventType,
      message: eventType,
      payloadJson: {
        controlRequestId: getModelTargetKey(options.request, 'id'),
        reason: 'run-finished',
        terminalStatus: options.terminalStatus,
      },
      emittedAt: new Date(),
    },
    transaction: options.transaction,
  });
}

async function failOpenControlRequestsForFinishedRun(options: {
  ctx: Context;
  run: ModelRecord;
  runId: string;
  terminalStatus: TerminalRunStatus;
  now: Date;
  transaction: Transaction;
}) {
  const requests = (await options.ctx.db.getRepository('agRunControlRequests').find({
    filter: {
      runId: options.runId,
      status: ['accepted', 'delivered'],
    },
    sort: ['createdAt', 'id'],
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord[];
  for (const request of requests) {
    await options.ctx.db.getRepository('agRunControlRequests').update({
      filterByTk: getModelTargetKey(request, 'id'),
      values: {
        status: 'failed',
        resultMessage: 'Run finished before control request completed',
        completedAt: options.now,
      },
      transaction: options.transaction,
    });
    await appendTerminalControlFailedEvent({
      ctx: options.ctx,
      run: options.run,
      request,
      terminalStatus: options.terminalStatus,
      transaction: options.transaction,
    });
  }
}

const EMPTY_TOKEN_USAGE_RUN: ModelRecord = {
  get() {
    return undefined;
  },
};

function mergeTokenUsageSummary(target: TokenUsageSummary, next: TokenUsageSummary) {
  for (const key of [
    'inputTokens',
    'cachedInputTokens',
    'outputTokens',
    'reasoningOutputTokens',
    'totalTokens',
  ] as const) {
    const value = next[key];
    if (typeof value === 'number') {
      target[key] = (target[key] || 0) + value;
    }
  }
}

function projectModelValues(model: ModelRecord, values: JsonRecord): ModelRecord {
  return {
    get(key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : model.get(key);
    },
  };
}

function getUtf8Tail(value: string, maxBytes: number) {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length <= maxBytes) {
    return value;
  }
  let start = bytes.length - maxBytes;
  while (start < bytes.length && (bytes[start] & 0xc0) === 0x80) {
    start += 1;
  }
  return bytes.subarray(start).toString('utf8');
}

function getBoundedTerminalTokenEvents(eventsNewestFirst: ModelRecord[]) {
  const selectedNewestFirst: ModelRecord[] = [];
  let remainingBytes = TERMINAL_TOKEN_TAIL_BYTE_LIMIT;
  for (const event of eventsNewestFirst) {
    const separatorBytes = selectedNewestFirst.length ? 1 : 0;
    if (remainingBytes <= separatorBytes) {
      break;
    }
    remainingBytes -= separatorBytes;
    const contentText = getModelString(event, 'contentText');
    const boundedText = getUtf8Tail(contentText, remainingBytes);
    remainingBytes -= Buffer.byteLength(boundedText, 'utf8');
    selectedNewestFirst.push(projectModelValues(event, { contentText: boundedText }));
    if (remainingBytes <= 0) {
      break;
    }
  }
  return selectedNewestFirst.reverse();
}

async function getStructuredTokenUsageSummary(
  ctx: Context,
  runId: string,
  transaction?: Transaction,
): Promise<TokenUsageSummary | null> {
  const total: TokenUsageSummary = {};
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const events = (await ctx.db.getRepository('agAgentConversationEvents').find({
      filter: {
        runId,
        eventType: 'agent.turn.completed',
      },
      fields: ['id', 'eventType', 'contentJson', 'sequence'],
      sort: ['sequence', 'id'],
      limit: TOKEN_USAGE_EVENT_BATCH_SIZE,
      offset,
      transaction,
    })) as ModelRecord[];
    const pageSummary = getRunTokenUsageSummary(EMPTY_TOKEN_USAGE_RUN, events);
    if (pageSummary) {
      mergeTokenUsageSummary(total, pageSummary);
    }
    hasMore = events.length === TOKEN_USAGE_EVENT_BATCH_SIZE;
    offset += events.length;
  }
  return Object.keys(total).length ? total : null;
}

async function getTerminalTokenUsageSummary(ctx: Context, runId: string, transaction?: Transaction) {
  const terminalEvents = (await ctx.db.getRepository('agAgentConversationEvents').find({
    filter: {
      runId,
      eventType: 'agent.message',
      source: 'terminal-live',
    },
    fields: ['id', 'eventType', 'source', 'contentText', 'sequence'],
    sort: ['-sequence', '-id'],
    limit: TERMINAL_TOKEN_TAIL_ROW_LIMIT,
    transaction,
  })) as ModelRecord[];
  return getRunTokenUsageSummary(EMPTY_TOKEN_USAGE_RUN, getBoundedTerminalTokenEvents(terminalEvents));
}

async function getBoundedRunTokenUsageSummary(ctx: Context, runId: string, transaction?: Transaction) {
  const structuredSummary = await getStructuredTokenUsageSummary(ctx, runId, transaction);
  if (structuredSummary) {
    return structuredSummary;
  }
  return await getTerminalTokenUsageSummary(ctx, runId, transaction);
}

async function getTerminalizedRunTokenUsageSummary(options: {
  ctx: Context;
  run: ModelRecord;
  runId: string;
  values: JsonRecord;
  transaction: Transaction;
}) {
  const projectedRun = projectModelValues(options.run, options.values);
  const existingSummary = getRunTokenUsageSummary(projectedRun, []);
  if (existingSummary) {
    return existingSummary;
  }
  return await getBoundedRunTokenUsageSummary(options.ctx, options.runId, options.transaction);
}

async function addTerminalTokenUsageToRunValues(options: {
  ctx: Context;
  run: ModelRecord;
  runId: string;
  values: JsonRecord;
  transaction: Transaction;
}) {
  const tokenUsageJson = await getTerminalizedRunTokenUsageSummary(options);
  if (!tokenUsageJson) {
    return options.values;
  }
  return {
    ...options.values,
    resultSummaryJson: {
      ...getRecord(options.values.resultSummaryJson || getModelValue(options.run, 'resultSummaryJson')),
      tokenUsageJson,
    },
  };
}

async function finishRun(
  ctx: Context,
  nodeId: string,
  runId: string,
  terminalStatus: TerminalRunStatus,
  terminalValues: (values: JsonRecord, now: Date, run: ModelRecord) => JsonRecord,
  allowedStatuses: readonly string[],
) {
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowExpiredLease: true,
      allowStaleLeaseVersion: true,
      allowedStatuses: [...allowedStatuses, STALLED_RUN_STATUS],
    });
    if (!lease) {
      return null;
    }
    const terminalAllowed = assertTerminalAllowed(ctx, lease.run, terminalStatus, [
      ...allowedStatuses,
      STALLED_RUN_STATUS,
    ]);
    if (terminalAllowed !== true) {
      return null;
    }

    const now = new Date();
    const nextLeaseVersion = lease.leaseVersion + 1;
    const nextRunValues = await addTerminalTokenUsageToRunValues({
      ctx,
      run: lease.run,
      runId,
      values: terminalValues(values, now, lease.run),
      transaction,
    });
    await ctx.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        status: terminalStatus,
        leaseVersion: nextLeaseVersion,
        claimExpiresAt: null,
        finishedAt: now,
        ...nextRunValues,
      },
      transaction,
    });
    await failOpenControlRequestsForFinishedRun({
      ctx,
      run: lease.run,
      runId,
      terminalStatus,
      now,
      transaction,
    });

    return {
      runId,
      status: terminalStatus,
      claimAttempt: lease.claimAttempt,
      leaseVersion: nextLeaseVersion,
      finishedAt: now.toISOString(),
    };
  });

  if (result) {
    ctx.body = result;
  }
}

async function completeRun(ctx: Context, nodeId: string, runId: string) {
  await finishRun(
    ctx,
    nodeId,
    runId,
    'succeeded',
    (values, now, run) => ({
      resultSummaryJson: mergeTerminalResultSummary(run, values.resultSummaryJson || values.resultSummary),
      completedAt: now,
    }),
    ['running', 'finalizing'],
  );
}

async function failRun(ctx: Context, nodeId: string, runId: string) {
  await finishRun(
    ctx,
    nodeId,
    runId,
    'failed',
    (values, now, run) => ({
      resultSummaryJson: mergeTerminalResultSummary(run, values.resultSummaryJson || values.resultSummary),
      errorSummary: getString(values.errorSummary) ? redactRunErrorSummary(getString(values.errorSummary)) : null,
      failedAt: now,
    }),
    ['claimed', 'syncing_skills', 'running', 'finalizing'],
  );
}

async function skipSmokeRun(ctx: Context, nodeId: string, runId: string) {
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    await authenticateNodeForRun(ctx, nodeId, transaction, { lock: false });
    const run = (await ctx.db.getRepository('agRuns').findOne({
      filterByTk: runId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!run) {
      ctx.throw(404, 'Run not found');
    }
    if (getOptionalTargetKey(run, 'nodeId') !== nodeId || getModelString(run, 'sourceType') !== 'opencode-smoke') {
      ctx.throw(403, 'Only node-owned OpenCode smoke runs can be skipped by daemon nodes');
    }

    const status = getModelString(run, 'status');
    if (isTerminalRunStatus(status)) {
      ctx.throw(409, `Run is already ${status}`);
    }
    if (status !== CLAIMABLE_RUN_STATUS) {
      ctx.throw(409, `Run cannot be skipped from ${status}`);
    }

    const now = new Date();
    const reason = getString(values.reason) || 'OpenCode smoke was skipped';
    await ctx.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        status: 'failed',
        resultSummaryJson: getRecord(
          redactRunResultSummary({
            ...getRecord(values.resultSummary),
            skipped: true,
          }),
        ),
        errorSummary: redactRunErrorSummary(reason),
        failedAt: now,
        finishedAt: now,
        claimExpiresAt: null,
      },
      transaction,
    });

    return {
      runId,
      status: 'failed',
      skipped: true,
      finishedAt: now.toISOString(),
    };
  });

  ctx.body = result;
}

async function timeoutRun(ctx: Context, nodeId: string, runId: string) {
  await finishRun(
    ctx,
    nodeId,
    runId,
    'timeout',
    (values) => ({
      errorSummary: getString(values.errorSummary)
        ? redactRunErrorSummary(getString(values.errorSummary))
        : 'Process timeout confirmed by daemon',
    }),
    ['running', 'finalizing'],
  );
}

export async function cancelRun(ctx: Context, runId: string, options: { requirePermission?: boolean } = {}) {
  if (options.requirePermission !== false) {
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.cancelRun,
      'Agent Gateway cancel permission required',
    );
  }
  const visibleRunFilter =
    options.requirePermission !== false
      ? await getVisibleRunFilter(
          ctx,
          {
            id: runId,
          },
          'get',
        )
      : null;

  const updatedRun = await ctx.db.sequelize.transaction(async (transaction) => {
    const now = new Date();
    const run =
      options.requirePermission !== false
        ? ((await ctx.db.getRepository('agRuns').findOne({
            filter: visibleRunFilter || {
              id: runId,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          })) as ModelRecord | null)
        : ((await ctx.db.getRepository('agRuns').findOne({
            filterByTk: runId,
            transaction,
            lock: transaction.LOCK.UPDATE,
          })) as ModelRecord | null);
    if (!run) {
      if (options.requirePermission !== false) {
        ctx.throw(404, {
          code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
          message: 'Run not found',
        });
      }
      ctx.throw(404, 'Run not found');
    }

    const status = getModelString(run, 'status');
    if (isTerminalRunStatus(status)) {
      ctx.throw(409, `Run is already ${status}`);
    }

    const values: JsonRecord = {
      cancelRequested: true,
      cancelRequestedAt: getModelValue(run, 'cancelRequestedAt') || now,
    };
    if (status === CLAIMABLE_RUN_STATUS || status === IMPORTING_RUN_STATUS) {
      values.status = 'canceled';
      values.canceledAt = now;
      values.finishedAt = now;
      values.claimExpiresAt = null;
      Object.assign(
        values,
        await addTerminalTokenUsageToRunValues({
          ctx,
          run,
          runId,
          values,
          transaction,
        }),
      );
    } else if (isActiveRunStatus(status) || status === STALLED_RUN_STATUS) {
      values.status = 'canceling';
    } else {
      ctx.throw(409, `Run cannot be canceled from ${status}`);
    }

    await ctx.db.getRepository('agRuns').update({
      filterByTk: runId,
      values,
      transaction,
    });
    if (status === IMPORTING_RUN_STATUS) {
      await ctx.db.getRepository('agExternalImportBatches').update({
        filter: {
          runId,
          status: {
            $in: ['processing', 'failed'],
          },
        },
        values: {
          status: 'failed',
          errorSummary: EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY,
          completedAt: null,
          lastAttemptAt: now,
        },
        transaction,
      });
    }

    return (await ctx.db.getRepository('agRuns').findOne({
      filterByTk: runId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord;
  });
  ctx.body = serializeRunForUser(updatedRun);
}

async function ackCancelRun(ctx: Context, nodeId: string, runId: string) {
  await finishRun(
    ctx,
    nodeId,
    runId,
    'canceled',
    (_values, now) => ({
      cancelRequested: true,
      cancelAckAt: now,
      canceledAt: now,
    }),
    ['canceling'],
  );
}

async function appendRunLeaseRecoveryEvent(options: {
  ctx: Context;
  run: ModelRecord;
  now: Date;
  reason: string;
  eventType: 'run.lease.stalled' | 'run.lease.failed' | 'run.lease.canceled';
  message: string;
  nextStatus: string;
  transaction: Transaction;
}) {
  const runId = String(getModelTargetKey(options.run, 'id'));
  const latestEvent = (await options.ctx.db.getRepository('agRunEvents').findOne({
    filter: {
      runId,
      source: 'agent-gateway',
    },
    sort: ['-sequence'],
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;

  await options.ctx.db.getRepository('agRunEvents').create({
    values: {
      id: randomUUID(),
      runId,
      claimAttempt: getModelNumber(options.run, 'claimAttempt'),
      source: 'agent-gateway',
      sequence: (latestEvent ? getModelNumber(latestEvent, 'sequence') : 0) + 1,
      level: 'warn',
      eventType: options.eventType,
      message: options.message,
      payloadJson: {
        reason: options.reason,
        previousStatus: getModelString(options.run, 'status'),
        nextStatus: options.nextStatus,
        leaseVersion: getModelNumber(options.run, 'leaseVersion'),
        claimExpiresAt: getDateFromModel(options.run, 'claimExpiresAt')?.toISOString() || null,
      },
      emittedAt: options.now,
    },
    transaction: options.transaction,
  });
}

async function reconcileExpiredRunLeases(
  ctx: Context,
  options: { requirePermission?: boolean; limit?: number; recoveryReason?: string } = {},
) {
  if (options.requirePermission) {
    await requireManagePermission(ctx);
  }
  const now = new Date();
  const expiredRuns = (await ctx.db.getRepository('agRuns').find({
    filter: {
      status: {
        $in: [...ACTIVE_RUN_STATUSES, STALLED_RUN_STATUS],
      },
      claimExpiresAt: {
        $lte: now,
      },
    },
    sort: ['claimExpiresAt'],
    limit: options.limit || LEASE_RECOVERY_BATCH_LIMIT,
  })) as ModelRecord[];

  let stalledCount = 0;
  let failedCount = 0;
  let canceledCount = 0;
  for (const run of expiredRuns) {
    const recoveryResult = await ctx.db.sequelize.transaction(async (transaction) => {
      const lockedRun = (await ctx.db.getRepository('agRuns').findOne({
        filterByTk: getModelTargetKey(run, 'id'),
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord | null;
      const currentStatus = lockedRun ? getModelString(lockedRun, 'status') : '';
      if (!lockedRun || (!isActiveRunStatus(currentStatus) && currentStatus !== STALLED_RUN_STATUS)) {
        return null;
      }

      const claimExpiresAt = getDateFromModel(lockedRun, 'claimExpiresAt');
      if (!claimExpiresAt || claimExpiresAt.getTime() > now.getTime()) {
        return null;
      }

      if (currentStatus === 'canceling' || getBoolean(getModelValue(lockedRun, 'cancelRequested'))) {
        const terminalValues = await addTerminalTokenUsageToRunValues({
          ctx,
          run: lockedRun,
          runId: String(getModelTargetKey(lockedRun, 'id')),
          values: {
            status: 'canceled',
            cancelRequested: true,
            cancelRequestedAt: getModelValue(lockedRun, 'cancelRequestedAt') || now,
            claimExpiresAt: null,
            canceledAt: now,
            finishedAt: now,
            terminalEndedAt: now,
          },
          transaction,
        });
        await ctx.db.getRepository('agRuns').update({
          filterByTk: getModelTargetKey(lockedRun, 'id'),
          values: terminalValues,
          transaction,
        });
        await appendRunLeaseRecoveryEvent({
          ctx,
          run: lockedRun,
          now,
          reason: options.recoveryReason || 'lease-expired',
          eventType: 'run.lease.canceled',
          message: 'Run lease expired after cancellation was requested and the run was marked canceled',
          nextStatus: 'canceled',
          transaction,
        });
        await failOpenControlRequestsForFinishedRun({
          ctx,
          run: lockedRun,
          runId: String(getModelTargetKey(lockedRun, 'id')),
          terminalStatus: 'canceled',
          now,
          transaction,
        });
        return 'canceled' as const;
      }

      if (currentStatus !== STALLED_RUN_STATUS) {
        const stalledUntil = new Date(now.getTime() + LEASE_RECOVERY_STALLED_GRACE_MS);
        await ctx.db.getRepository('agRuns').update({
          filterByTk: getModelTargetKey(lockedRun, 'id'),
          values: {
            status: STALLED_RUN_STATUS,
            claimExpiresAt: stalledUntil,
          },
          transaction,
        });
        await appendRunLeaseRecoveryEvent({
          ctx,
          run: lockedRun,
          now,
          reason: options.recoveryReason || 'lease-expired',
          eventType: 'run.lease.stalled',
          message: 'Run lease expired and was marked stalled',
          nextStatus: STALLED_RUN_STATUS,
          transaction,
        });
        return 'stalled' as const;
      }

      const terminalValues = await addTerminalTokenUsageToRunValues({
        ctx,
        run: lockedRun,
        runId: String(getModelTargetKey(lockedRun, 'id')),
        values: {
          status: 'failed',
          claimExpiresAt: null,
          failedAt: now,
          finishedAt: now,
          terminalEndedAt: now,
          errorSummary: redactRunErrorSummary('Runner lost after lease stalled grace period'),
        },
        transaction,
      });
      await ctx.db.getRepository('agRuns').update({
        filterByTk: getModelTargetKey(lockedRun, 'id'),
        values: terminalValues,
        transaction,
      });
      await appendRunLeaseRecoveryEvent({
        ctx,
        run: lockedRun,
        now,
        reason: options.recoveryReason || 'lease-expired',
        eventType: 'run.lease.failed',
        message: 'Run lease remained stalled and was marked failed',
        nextStatus: 'failed',
        transaction,
      });
      await failOpenControlRequestsForFinishedRun({
        ctx,
        run: lockedRun,
        runId: String(getModelTargetKey(lockedRun, 'id')),
        terminalStatus: 'failed',
        now,
        transaction,
      });
      return 'failed' as const;
    });

    if (recoveryResult === 'stalled') {
      stalledCount += 1;
    }
    if (recoveryResult === 'failed') {
      failedCount += 1;
    }
    if (recoveryResult === 'canceled') {
      canceledCount += 1;
    }
  }

  return {
    stalledCount,
    failedCount,
    canceledCount,
    scannedAt: now.toISOString(),
  };
}

async function expireLeases(ctx: Context) {
  ctx.body = await reconcileExpiredRunLeases(ctx, {
    requirePermission: true,
    recoveryReason: 'manual-expire-leases',
  });
}

function createRunLifecycleHookContext(plugin: Plugin): Context {
  return {
    app: plugin.app,
    db: plugin.db,
  } as unknown as Context;
}

export async function recoverExpiredRunLeases(plugin: Plugin, recoveryReason = 'server-startup') {
  return await reconcileExpiredRunLeases(createRunLifecycleHookContext(plugin), {
    recoveryReason,
  });
}

export function registerRunLifecycleHooks(plugin: Plugin) {
  plugin.db.on('agRuns.beforeSave', async (model: ModelRecord, options: HookOptions) => {
    if (!isMutableModelRecord(model)) {
      return;
    }
    const fallback = await findFallbackForQueuedBuildRun(
      createRunLifecycleHookContext(plugin),
      model,
      options?.transaction,
    );
    if (fallback) {
      applyBuildRunnerFallbackToRun(model, fallback);
    }
  });
}

export function registerRunLifecycleRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [`${AGENT_GATEWAY_API_RESOURCE}:listRunOptions`]: async (ctx, next) => {
      await listBuildRunOptions(asActionContext(ctx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:createTaskRun`]: async (ctx, next) => {
      await createTaskRun(asActionContext(ctx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:listRuns`]: async (ctx, next) => {
      await listRuns(asActionContext(ctx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:getRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await getRun(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:createRun`]: async (ctx, next) => {
      await createRun(asActionContext(ctx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:createSmokeRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await createSmokeRun(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:claimRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await claimRun(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:heartbeatRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await runHeartbeat(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:completeRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await completeRun(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:failRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await failRun(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:timeoutRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await timeoutRun(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:ackCancelRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await ackCancelRun(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:skipRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await skipSmokeRun(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:cancelRun`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await cancelRun(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:expireRunLeases`]: async (ctx, next) => {
      await expireLeases(asActionContext(ctx));
      await next();
    },
  });

  plugin.app.use(
    async (ctx: Context, next: Next) => {
      const standardCollectionAction = matchStandardCollectionAction(ctx.path, AGENT_GATEWAY_STANDARD_COLLECTIONS);
      if (standardCollectionAction?.collectionName === 'agRuns') {
        if (ctx.method === 'GET' && standardCollectionAction.action === 'list') {
          await listStandardRuns(ctx);
          return;
        } else if (ctx.method === 'GET' && standardCollectionAction.action === 'get') {
          await getStandardRun(ctx);
          return;
        } else {
          await requireManagePermission(ctx);
        }
      } else if (standardCollectionAction) {
        await requireManagePermission(ctx);
      }

      await next();
    },
    {
      tag: 'agentGatewayRunLifecycleRoutes',
      after: 'agentGatewayNodeLifecycleRoutes',
      before: 'dataSource',
    },
  );
}
