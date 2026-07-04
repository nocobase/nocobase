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
  AGENT_GATEWAY_PERMISSIONS,
  AGENT_GATEWAY_RESOURCE,
  createClaimToken,
  extractNodeToken,
  redactRunErrorSummary,
  redactRunResultSummary,
  toStoredTokenFields,
  verifyClaimToken,
  verifyNodeToken,
} from '../security';
import {
  AGENT_GATEWAY_STANDARD_COLLECTIONS,
  API_PREFIX,
  AGENT_GATEWAY_ERROR_CODES,
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getCurrentUserId,
  getDate,
  getModelJson,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  getCurrentRoleNames,
  getVisibleRunFilter,
  matchStandardCollectionAction,
  normalizeNocoBaseApiPath,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';
import { serializeSkillVersionSourceForNode } from './skillVersions';
import { auditAgentActionBestEffort, auditMutatingAgentAction } from '../audit/agentActionAudit';
import { AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } from '../../shared/runControl';
import { getRunProviderCapabilitySummary, isRunCapabilitySupported } from './capabilityUtils';

const DEFAULT_CLAIM_LEASE_SECONDS = 60;
const DEFAULT_MAX_CONCURRENCY = 1;
const CLAIM_CANDIDATE_PAGE_SIZE = 50;
const DEFAULT_UI_BUILD_PROFILE_KEY = 'codex';
const UI_BUILD_SOURCE_TYPE = 'ui-build';
const UI_BUILD_REROUTE_SOURCE_TYPES = new Set([UI_BUILD_SOURCE_TYPE, 'manual-ui-build']);
const RUNNER_ONLINE_THRESHOLD_MS = 120_000;

const ACTIVE_RUN_STATUSES = ['claimed', 'syncing_skills', 'running', 'canceling'] as const;
const CLAIMABLE_RUN_STATUS = 'queued';
const CONTROL_RUN_STATUSES = new Set(['claimed', 'syncing_skills', 'running']);
const TERMINAL_RUN_STATUSES = ['succeeded', 'failed', 'canceled', 'timeout', 'abandoned'] as const;
const HEARTBEAT_RUN_STATUSES = ['claimed', 'syncing_skills', 'running'] as const;
const NODE_OWNED_INLINE_SKILL_SOURCE_TYPES = new Set(['opencode-smoke']);

type ActiveRunStatus = (typeof ACTIVE_RUN_STATUSES)[number];
type TerminalRunStatus = (typeof TERMINAL_RUN_STATUSES)[number];
type HeartbeatRunStatus = (typeof HEARTBEAT_RUN_STATUSES)[number];

export interface RunLease {
  run: ModelRecord;
  claimAttempt: number;
  leaseVersion: number;
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

function isActiveRunStatus(status: string): status is ActiveRunStatus {
  return ACTIVE_RUN_STATUSES.includes(status as ActiveRunStatus);
}

function isTerminalRunStatus(status: string): status is TerminalRunStatus {
  return TERMINAL_RUN_STATUSES.includes(status as TerminalRunStatus);
}

function isHeartbeatRunStatus(status: string): status is HeartbeatRunStatus {
  return HEARTBEAT_RUN_STATUSES.includes(status as HeartbeatRunStatus);
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

async function auditRunDetailReadDenied(
  ctx: Context,
  runId: string,
  options: { permissionKey: string; routeAction: string; phase: 'permission' | 'visibility'; reason?: string },
) {
  await auditAgentActionBestEffort(ctx, {
    action: 'readRunDetails',
    runId,
    operatorId: getCurrentUserId(ctx) || undefined,
    permissionKey: options.permissionKey,
    resultStatus: 'denied',
    metadataJson: {
      routeAction: options.routeAction,
      phase: options.phase,
      ...(options.reason ? { reason: options.reason } : {}),
    },
  });
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
    readAudit: Boolean(
      ctx.app.acl.can({
        roles,
        resource: AGENT_GATEWAY_RESOURCE,
        action: AGENT_GATEWAY_ACTIONS.readAudit,
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
  return {
    id: getModelTargetKey(node, 'id'),
    nodeKey: getModelString(node, 'nodeKey'),
    displayName: getModelString(node, 'displayName') || getModelString(node, 'nodeKey'),
    status: getModelString(node, 'status'),
    lastHeartbeatAt: lastHeartbeatAt ? lastHeartbeatAt.toISOString() : null,
    online: getModelString(node, 'status') === 'active' && isRecentDate(lastHeartbeatAt, now),
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

async function listBuildRunOptions(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.dispatch,
    'Agent Gateway dispatch permission required',
  );

  const [nodes, profiles] = (await Promise.all([
    ctx.db.getRepository('agNodes').find({
      sort: ['nodeKey'],
    }),
    ctx.db.getRepository('agAgentProfiles').find({
      filter: {
        status: 'active',
      },
      sort: ['profileKey'],
    }),
  ])) as [ModelRecord[], ModelRecord[]];
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
    defaultProfileKey: DEFAULT_UI_BUILD_PROFILE_KEY,
    defaultCwd: '.',
    nodes: serializedNodes,
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
    DEFAULT_UI_BUILD_PROFILE_KEY
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
  const profileKey = options.profileKey || DEFAULT_UI_BUILD_PROFILE_KEY;
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
  const requestedProfileKey = getString(values.profileKey) || DEFAULT_UI_BUILD_PROFILE_KEY;

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
      return {
        node,
        profile,
        online: getRunnerOnlineState(node, profile).online,
      };
    })
    .filter((candidate): candidate is BuildRunnerCandidate => Boolean(candidate))
    .sort((first, second) => compareBuildRunnerCandidates(first, second, requestedProfileKey));
  const candidate = candidates[0];
  if (!candidate) {
    ctx.throw(400, 'No active Agent Gateway runner profile is available');
  }
  return {
    node: candidate.node,
    profile: candidate.profile,
  };
}

function buildUiBuildPrompt(values: JsonRecord) {
  const prompt = getString(values.prompt);
  if (!prompt) {
    return '';
  }
  const title = getString(values.title);
  return [
    '请在当前 NocoBase 环境中完成以下搭建任务。',
    '要求：',
    '- 不要清空已有数据，除非任务明确要求。',
    '- 如果搭建需要补齐字段、区块配置或数据模型，请按任务需要处理，并在最终结果中说明。',
    '- 执行过程中持续输出关键步骤，完成后验证页面可以打开。',
    '',
    title ? `任务标题：${title}` : '',
    '搭建指令：',
    prompt,
  ]
    .filter((line) => line !== '')
    .join('\n');
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

async function getRunnerControlCapabilityDecision(ctx: Context, run: ModelRecord, action: 'interrupt' | 'terminate') {
  const decisions: Array<boolean | null> = [];
  const nodeId = getOptionalTargetKey(run, 'nodeId');
  if (nodeId) {
    const node = (await ctx.db.getRepository('agNodes').findOne({
      filterByTk: nodeId,
    })) as ModelRecord | null;
    if (node) {
      decisions.push(getControlCapabilityDecision(getRecord(getModelValue(node, 'capabilitiesJson')), action));
    }
  }

  const agentProfileId = getOptionalTargetKey(run, 'agentProfileId');
  if (agentProfileId) {
    const profile = (await ctx.db.getRepository('agAgentProfiles').findOne({
      filterByTk: agentProfileId,
    })) as ModelRecord | null;
    if (profile) {
      decisions.push(getControlCapabilityDecision(getRecord(getModelValue(profile, 'capabilitiesJson')), action));
    }
  }

  if (decisions.includes(false)) {
    return false;
  }
  return decisions.includes(true) ? true : null;
}

async function getRunControlCapability(
  ctx: Context,
  run: ModelRecord,
  session: ModelRecord | null,
  action: 'interrupt' | 'terminate',
) {
  if (!hasActiveTmuxControlSurface(run)) {
    return false;
  }
  const capabilitySummary = await getRunProviderCapabilitySummary(ctx, run, session);
  if (capabilitySummary.providerSource === 'fallback') {
    const runnerCapabilityDecision = await getRunnerControlCapabilityDecision(ctx, run, action);
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
  return (await getRunnerControlCapabilityDecision(ctx, run, action)) === true;
}

async function getRunRunnerStatus(ctx: Context, run: ModelRecord) {
  const nodeId = getOptionalTargetKey(run, 'nodeId');
  const profileId = getOptionalTargetKey(run, 'agentProfileId');
  const [node, profile] = (await Promise.all([
    nodeId
      ? ctx.db.getRepository('agNodes').findOne({
          filterByTk: nodeId,
        })
      : null,
    profileId
      ? ctx.db.getRepository('agAgentProfiles').findOne({
          filterByTk: profileId,
        })
      : null,
  ])) as [ModelRecord | null, ModelRecord | null];
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

async function serializeRunForManagement(ctx: Context, run: ModelRecord) {
  const json = serializeRunForUser(run);
  const agentSessionId = getOptionalTargetKey(run, 'agentSessionId');
  const session = agentSessionId
    ? ((await ctx.db.getRepository('agAgentSessions').findOne({
        filterByTk: agentSessionId,
      })) as ModelRecord | null)
    : null;
  const capabilitySummary = await getRunProviderCapabilitySummary(ctx, run, session);
  const actionPermissions = await getAgentGatewayActionPermissions(ctx);
  const interruptCapable = await getRunControlCapability(ctx, run, session, 'interrupt');
  const terminateCapable = await getRunControlCapability(ctx, run, session, 'terminate');
  return {
    ...json,
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
      readAudit: actionPermissions.readAudit,
      interruptRun: actionPermissions.interruptRun,
      terminateRun: actionPermissions.terminateRun,
      cancelRun: actionPermissions.cancelRun,
    },
    agentGatewayControlActionsJson: {
      interruptRun: actionPermissions.interruptRun && interruptCapable,
      terminateRun: actionPermissions.terminateRun && terminateCapable,
    },
    runnerStatusJson: await getRunRunnerStatus(ctx, run),
  };
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
  const value = Number(getQueryValue(ctx, 'limit') || 50);
  if (!Number.isInteger(value) || value <= 0) {
    return 50;
  }
  return Math.min(value, 100);
}

function getRunListFilter(ctx: Context) {
  const filter: JsonRecord = {};
  const status = getQueryString(ctx, 'status');
  const nodeId = getQueryString(ctx, 'nodeId');
  const agentProfileId = getQueryString(ctx, 'agentProfileId');
  const createdAtFrom = getDate(getQueryValue(ctx, 'createdAtFrom'));
  const createdAtTo = getDate(getQueryValue(ctx, 'createdAtTo'));

  if (status) {
    filter.status = status.includes(',')
      ? {
          $in: status
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }
      : status;
  }
  if (nodeId) {
    filter.nodeId = nodeId;
  }
  if (agentProfileId) {
    filter.agentProfileId = agentProfileId;
  }
  if (createdAtFrom || createdAtTo) {
    filter.createdAt = {
      ...(createdAtFrom ? { $gte: createdAtFrom } : {}),
      ...(createdAtTo ? { $lte: createdAtTo } : {}),
    };
  }

  return filter;
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
      dispatchBindingId: getString(values.dispatchBindingId) || null,
    },
  })) as ModelRecord;

  ctx.body = serializeCreatedRunForUser(run);
}

async function createUiBuildRun(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.dispatch,
    'Agent Gateway dispatch permission required',
  );

  const values = getBodyValues(ctx);
  const renderedPrompt = buildUiBuildPrompt(values);
  if (!renderedPrompt) {
    ctx.throw(400, 'prompt is required');
  }

  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const selection = await resolveBuildRunnerSelection(ctx, values, transaction);
    const nodeId = String(getModelTargetKey(selection.node, 'id'));
    const agentProfileId = String(getModelTargetKey(selection.profile, 'id'));
    const profileKey = getModelString(selection.profile, 'profileKey');
    const provider = getModelString(selection.profile, 'provider') || undefined;
    const cwd = getString(values.cwd) || '.';
    const now = new Date();
    const executionPayloadJson = {
      scenario: 'nocobase-ui-build',
      source: 'agent-gateway-ui',
      title: getString(values.title) || null,
      prompt: renderedPrompt,
      profileKey,
      commandKey: getString(values.commandKey) || profileKey,
      ...(provider ? { provider } : {}),
      cwd,
      terminalBackend: 'tmux',
    };
    const run = (await ctx.db.getRepository('agRuns').create({
      values: {
        runCode: getString(values.runCode) || `run_ui_build_${randomUUID()}`,
        status: CLAIMABLE_RUN_STATUS,
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        promptSnapshot: {
          templateKey: 'agent-gateway-ui-build',
          templateText: '{{prompt}}',
          renderedPrompt,
          variables: {
            title: getString(values.title) || null,
            prompt: getString(values.prompt),
          },
          renderedAt: now.toISOString(),
        },
        executionPayloadJson,
        resultSummaryJson: {
          title: getString(values.title) || null,
          requestedFrom: 'agent-gateway-ui',
        },
        sourceType: UI_BUILD_SOURCE_TYPE,
        requestedAt: now,
        queuedAt: now,
        requestedById: getCurrentUserId(ctx) || null,
        nodeId,
        agentProfileId,
      },
      transaction,
    })) as ModelRecord;

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

  const runs = (await ctx.db.getRepository('agRuns').find({
    filter,
    sort: ['-createdAt'],
    limit: getQueryLimit(ctx),
  })) as ModelRecord[];

  ctx.body = await Promise.all(runs.map((run) => serializeRunForManagement(ctx, run)));
}

async function getRun(ctx: Context, runId: string) {
  try {
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.readRunDetails,
      'Agent Gateway run detail read permission required',
    );
  } catch (error) {
    await auditRunDetailReadDenied(ctx, runId, {
      permissionKey: AGENT_GATEWAY_PERMISSIONS.readRunDetails,
      routeAction: 'runs:get',
      phase: 'permission',
      reason: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

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
    await auditRunDetailReadDenied(ctx, runId, {
      permissionKey: AGENT_GATEWAY_PERMISSIONS.readRunDetails,
      routeAction: 'runs:get',
      phase: 'visibility',
      reason: 'Run not found',
    });
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
  try {
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.readRun,
      'Agent Gateway run standard get permission required',
    );
  } catch (error) {
    await auditRunDetailReadDenied(ctx, runId, {
      permissionKey: AGENT_GATEWAY_PERMISSIONS.readRun,
      routeAction: 'agRuns:get',
      phase: 'permission',
      reason: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
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
    await auditRunDetailReadDenied(ctx, runId, {
      permissionKey: AGENT_GATEWAY_PERMISSIONS.readRun,
      routeAction: 'agRuns:get',
      phase: 'visibility',
      reason: 'Run not found',
    });
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
        $in: [...ACTIVE_RUN_STATUSES],
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
  const profileIds = profiles.map((profile) => String(getModelTargetKey(profile, 'id')));
  const profileById = new Map(profiles.map((profile) => [String(getModelTargetKey(profile, 'id')), profile]));
  const capacityCache = new Map<string, boolean>();
  const filter = getClaimableRunFilter(nodeId, profileIds, runId);
  let offset = 0;
  let profileConcurrencyBlocked = false;
  let hasMoreCandidates = true;

  while (hasMoreCandidates) {
    const candidates = (await ctx.db.getRepository('agRuns').find({
      filter,
      sort: ['queuedAt', 'createdAt', 'id'],
      limit: CLAIM_CANDIDATE_PAGE_SIZE,
      offset,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord[];
    if (!candidates.length) {
      break;
    }

    for (const run of candidates) {
      const profile = await pickCandidateProfile(
        ctx,
        run,
        profiles,
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
      profileConcurrencyBlocked = true;
    }

    if (candidates.length < CLAIM_CANDIDATE_PAGE_SIZE) {
      hasMoreCandidates = false;
    } else {
      offset += CLAIM_CANDIDATE_PAGE_SIZE;
    }
  }

  return {
    candidate: null,
    reason: profileConcurrencyBlocked ? 'profile_concurrency_full' : 'no_claimable_run',
  };
}

async function claimRun(ctx: Context, nodeId: string) {
  const values = getBodyValues(ctx);
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
      claimToken: claimToken.token,
      tokenLast4: claimToken.tokenLast4,
      heartbeatIntervalSeconds: Math.min(DEFAULT_CLAIM_LEASE_SECONDS, 30),
      profileKey: getModelString(candidate.profile, 'profileKey'),
      profileProvider: getModelString(candidate.profile, 'provider') || undefined,
      nodeCapabilities: getRecord(getModelValue(node, 'capabilitiesJson')),
      profileCapabilities: getRecord(getModelValue(candidate.profile, 'capabilitiesJson')),
      run: await serializeRunForNodeClaim(ctx, candidate.run, transaction),
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
  if (getModelNumber(run, 'leaseVersion') !== leaseVersion) {
    return respondLeaseLost(ctx, 'Lease version is stale');
  }
  if (!verifyClaimToken(claimToken, getModelString(run, 'claimTokenHash'))) {
    return respondLeaseLost(ctx, 'Claim token is stale');
  }

  const status = getModelString(run, 'status');
  if (!isActiveRunStatus(status)) {
    return respondLeaseLost(ctx, 'Run is no longer active');
  }

  const claimExpiresAt = getDateFromModel(run, 'claimExpiresAt');
  if (!claimExpiresAt || claimExpiresAt.getTime() <= Date.now()) {
    return respondLeaseLost(ctx, 'Run lease has expired');
  }

  return {
    run,
    claimAttempt,
    leaseVersion,
  };
}

function getHeartbeatStatus(ctx: Context, currentStatus: string, requestedStatus: string) {
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
  };
  return statusOrder[requestedStatus] > statusOrder[currentStatus] ? requestedStatus : currentStatus;
}

async function runHeartbeat(ctx: Context, nodeId: string, runId: string) {
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction);
    if (!lease) {
      return null;
    }

    const now = new Date();
    const nextLeaseVersion = lease.leaseVersion + 1;
    const status = getHeartbeatStatus(ctx, getModelString(lease.run, 'status'), getString(values.status));
    const claimExpiresAt = getLeaseExpiresAt(now);
    await ctx.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        status,
        leaseVersion: nextLeaseVersion,
        claimExpiresAt,
        lastRunHeartbeatAt: now,
        startedAt:
          status === 'running' && !getModelValue(lease.run, 'startedAt') ? now : getModelValue(lease.run, 'startedAt'),
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
  allowedStatuses: readonly ActiveRunStatus[],
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

async function finishRun(
  ctx: Context,
  nodeId: string,
  runId: string,
  terminalStatus: TerminalRunStatus,
  terminalValues: (values: JsonRecord, now: Date) => JsonRecord,
  allowedStatuses: readonly ActiveRunStatus[],
) {
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction);
    if (!lease) {
      return null;
    }
    const terminalAllowed = assertTerminalAllowed(ctx, lease.run, terminalStatus, allowedStatuses);
    if (terminalAllowed !== true) {
      return null;
    }

    const now = new Date();
    const nextLeaseVersion = lease.leaseVersion + 1;
    await ctx.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        status: terminalStatus,
        leaseVersion: nextLeaseVersion,
        claimExpiresAt: null,
        finishedAt: now,
        ...terminalValues(values, now),
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
    (values, now) => ({
      resultSummaryJson: getRecord(redactRunResultSummary(values.resultSummaryJson || values.resultSummary)),
      completedAt: now,
    }),
    ['running'],
  );
}

async function failRun(ctx: Context, nodeId: string, runId: string) {
  await finishRun(
    ctx,
    nodeId,
    runId,
    'failed',
    (values, now) => ({
      resultSummaryJson: getRecord(redactRunResultSummary(values.resultSummaryJson || values.resultSummary)),
      errorSummary: getString(values.errorSummary) ? redactRunErrorSummary(getString(values.errorSummary)) : null,
      failedAt: now,
    }),
    ['claimed', 'syncing_skills', 'running'],
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
    ['running'],
  );
}

function getCancelAuditFields(ctx: Context, run: ModelRecord | null, runId: string) {
  return {
    action: 'cancel' as const,
    runId: run ? getModelString(run, 'id') : runId,
    sessionId: run ? getModelString(run, 'agentSessionId') || undefined : undefined,
    operatorId: getCurrentUserId(ctx) || undefined,
    permissionKey: AGENT_GATEWAY_PERMISSIONS.cancelRun,
    provider: run ? getModelString(run, 'agentSessionProvider') || undefined : undefined,
  };
}

async function auditCancelRun(
  ctx: Context,
  run: ModelRecord | null,
  runId: string,
  resultStatus: 'accepted' | 'denied' | 'failed' | 'succeeded',
  metadataJson: JsonRecord = {},
) {
  const input = {
    ...getCancelAuditFields(ctx, run, runId),
    resultStatus,
    metadataJson,
  };
  if (resultStatus === 'accepted') {
    await auditMutatingAgentAction(ctx, input);
    return;
  }
  await auditAgentActionBestEffort(ctx, input);
}

export async function cancelRun(ctx: Context, runId: string, options: { requirePermission?: boolean } = {}) {
  const shouldAudit = options.requirePermission !== false;
  let deniedAuditWritten = false;
  if (options.requirePermission !== false) {
    try {
      await requireAgentGatewayPermission(
        ctx,
        AGENT_GATEWAY_ACTIONS.cancelRun,
        'Agent Gateway cancel permission required',
      );
    } catch (error) {
      await auditCancelRun(ctx, null, runId, 'denied');
      throw error;
    }
  }
  const visibleRunFilter = shouldAudit
    ? await getVisibleRunFilter(
        ctx,
        {
          id: runId,
        },
        'get',
      )
    : null;

  let auditRun: ModelRecord | null = null;
  try {
    const updatedRun = await ctx.db.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const run = shouldAudit
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
        if (shouldAudit) {
          await auditCancelRun(ctx, null, runId, 'denied', {
            phase: 'visibility',
          });
          deniedAuditWritten = true;
          ctx.throw(404, {
            code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
            message: 'Run not found',
          });
        }
        ctx.throw(404, 'Run not found');
      }
      auditRun = run;

      const status = getModelString(run, 'status');
      if (isTerminalRunStatus(status)) {
        ctx.throw(409, `Run is already ${status}`);
      }

      if (shouldAudit) {
        await auditCancelRun(ctx, run, runId, 'accepted', {
          previousStatus: status,
        });
      }

      const values: JsonRecord = {
        cancelRequested: true,
        cancelRequestedAt: getModelValue(run, 'cancelRequestedAt') || now,
      };
      if (status === CLAIMABLE_RUN_STATUS) {
        values.status = 'canceled';
        values.canceledAt = now;
        values.finishedAt = now;
        values.claimExpiresAt = null;
      } else if (isActiveRunStatus(status)) {
        values.status = 'canceling';
      } else {
        ctx.throw(409, `Run cannot be canceled from ${status}`);
      }

      await ctx.db.getRepository('agRuns').update({
        filterByTk: runId,
        values,
        transaction,
      });

      return (await ctx.db.getRepository('agRuns').findOne({
        filterByTk: runId,
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord;
    });
    ctx.body = serializeRunForUser(updatedRun);
    if (shouldAudit) {
      await auditCancelRun(ctx, updatedRun, runId, 'succeeded', {
        status: getModelString(updatedRun, 'status'),
      });
    }
  } catch (error) {
    if (shouldAudit) {
      if (!deniedAuditWritten) {
        await auditCancelRun(ctx, auditRun, runId, 'failed');
      }
    }
    throw error;
  }
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

async function expireLeases(ctx: Context) {
  await requireManagePermission(ctx);

  const now = new Date();
  const expiredRuns = (await ctx.db.getRepository('agRuns').find({
    filter: {
      status: {
        $in: [...ACTIVE_RUN_STATUSES],
      },
      claimExpiresAt: {
        $lte: now,
      },
    },
    sort: ['claimExpiresAt'],
    limit: 100,
  })) as ModelRecord[];

  let abandonedCount = 0;
  for (const run of expiredRuns) {
    const abandoned = await ctx.db.sequelize.transaction(async (transaction) => {
      const lockedRun = (await ctx.db.getRepository('agRuns').findOne({
        filterByTk: getModelTargetKey(run, 'id'),
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord | null;
      if (!lockedRun || !isActiveRunStatus(getModelString(lockedRun, 'status'))) {
        return false;
      }

      const claimExpiresAt = getDateFromModel(lockedRun, 'claimExpiresAt');
      if (!claimExpiresAt || claimExpiresAt.getTime() > now.getTime()) {
        return false;
      }

      await ctx.db.getRepository('agRuns').update({
        filterByTk: getModelTargetKey(lockedRun, 'id'),
        values: {
          status: 'abandoned',
          claimExpiresAt: null,
          finishedAt: now,
        },
        transaction,
      });
      await failOpenControlRequestsForFinishedRun({
        ctx,
        run: lockedRun,
        runId: String(getModelTargetKey(lockedRun, 'id')),
        terminalStatus: 'abandoned',
        now,
        transaction,
      });
      return true;
    });

    if (abandoned) {
      abandonedCount += 1;
    }
  }

  ctx.body = {
    abandonedCount,
    scannedAt: now.toISOString(),
  };
}

function createRunLifecycleHookContext(plugin: Plugin): Context {
  return {
    app: plugin.app,
    db: plugin.db,
  } as unknown as Context;
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

      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const smokeCreateMatch = routePath.match(/^\/nodes\/([^/]+)\/smoke-runs:create$/);
      const claimMatch = routePath.match(/^\/nodes\/([^/]+)\/runs:claim$/);
      const runNodeActionMatch = routePath.match(
        /^\/nodes\/([^/]+)\/runs\/([^/]+)\/(heartbeat|complete|fail|timeout|cancel-ack)$/,
      );
      const runSkipMatch = routePath.match(/^\/nodes\/([^/]+)\/runs\/([^/]+)\/skip$/);
      const cancelMatch = routePath.match(/^\/runs\/([^/]+)\/cancel$/);
      const getRunMatch = routePath.match(/^\/runs:get\/([^/]+)$/);

      if (ctx.method === 'GET' && routePath === '/build-runs:options') {
        await listBuildRunOptions(ctx);
        return;
      }

      if (ctx.method === 'POST' && routePath === '/build-runs:create') {
        await createUiBuildRun(ctx);
        return;
      }

      if (ctx.method === 'GET' && routePath === '/runs:list') {
        await listRuns(ctx);
        return;
      }

      if (ctx.method === 'GET' && getRunMatch) {
        await getRun(ctx, getRunMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && routePath === '/runs:create') {
        await createRun(ctx);
        return;
      }

      if (ctx.method === 'POST' && smokeCreateMatch) {
        await createSmokeRun(ctx, smokeCreateMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && claimMatch) {
        await claimRun(ctx, claimMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && runNodeActionMatch) {
        const [, nodeId, runId, action] = runNodeActionMatch;
        if (action === 'heartbeat') {
          await runHeartbeat(ctx, nodeId, runId);
          return;
        }
        if (action === 'complete') {
          await completeRun(ctx, nodeId, runId);
          return;
        }
        if (action === 'fail') {
          await failRun(ctx, nodeId, runId);
          return;
        }
        if (action === 'timeout') {
          await timeoutRun(ctx, nodeId, runId);
          return;
        }
        if (action === 'cancel-ack') {
          await ackCancelRun(ctx, nodeId, runId);
          return;
        }
      }

      if (ctx.method === 'POST' && runSkipMatch) {
        await skipSmokeRun(ctx, runSkipMatch[1], runSkipMatch[2]);
        return;
      }

      if (ctx.method === 'POST' && cancelMatch) {
        await cancelRun(ctx, cancelMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && routePath === '/runs:expire-leases') {
        await expireLeases(ctx);
        return;
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
