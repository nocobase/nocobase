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
import { AGENT_GATEWAY_ACTIONS, AGENT_GATEWAY_RESOURCE } from '../../security';
import {
  JsonRecord,
  ModelRecord,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  getCurrentRoleNames,
} from '../../actions/utils';
import { serializeSkillVersionSourceForNode, SkillVersionSourceAccess } from '../../actions/skillVersions';
import { issueSkillDownloadCapability, revokeSkillDownloadCapabilitiesForRun } from '../../actions/skillCapabilities';
import { getRunProviderCapabilitySummary, isRunCapabilitySupported } from '../../actions/capabilityUtils';
import { getRunTokenUsageSummary, TokenUsageSummary } from '../../services/observationRollup';
import { getRunTaskTitle, serializeRun, serializeRunForUser } from '../../services/runSerialization';
import {
  CONTROL_RUN_STATUSES,
  FORBIDDEN_REMOTE_EXECUTION_FIELDS,
  SkillVersionPayload,
  TERMINAL_TOKEN_TAIL_BYTE_LIMIT,
  TERMINAL_TOKEN_TAIL_ROW_LIMIT,
  TOKEN_USAGE_EVENT_BATCH_SIZE,
  TaskRunSkillVersionOption,
  assertSafeRemoteExecutionPayload,
  getDateFromModel,
  getOptionalTargetKey,
  getRunnerOnlineState,
  getStringList,
  serializeRunTaskTemplateSummary,
  serializeTaskRunSkillVersion,
} from './types';

export async function getAgentGatewayActionPermissions(ctx: Context) {
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

export function getControlCapabilityDecision(capabilities: JsonRecord, action: 'interrupt' | 'terminate') {
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

export function hasActiveTmuxControlSurface(run: ModelRecord) {
  return (
    CONTROL_RUN_STATUSES.has(getModelString(run, 'status')) &&
    getModelString(run, 'terminalBackend') === 'tmux' &&
    getModelString(run, 'terminalStatus') === 'active' &&
    Boolean(getModelString(run, 'terminalSessionName'))
  );
}

export function getRunnerControlCapabilityDecisionFromModels(
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

export async function getRunnerControlCapabilityDecision(
  ctx: Context,
  run: ModelRecord,
  action: 'interrupt' | 'terminate',
) {
  const nodeId = getOptionalTargetKey(run, 'nodeId');
  const agentProfileId = getOptionalTargetKey(run, 'agentProfileId');
  const [node, profile] = (await Promise.all([
    nodeId ? ctx.db.getRepository('agNodes').findOne({ filterByTk: nodeId }) : null,
    agentProfileId ? ctx.db.getRepository('agAgentProfiles').findOne({ filterByTk: agentProfileId }) : null,
  ])) as [ModelRecord | null, ModelRecord | null];
  return getRunnerControlCapabilityDecisionFromModels(node, profile, action);
}

export async function getRunControlCapability(
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

export async function getRunRunnerStatus(
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

export interface RunManagementSerializationContext {
  actionPermissions: Awaited<ReturnType<typeof getAgentGatewayActionPermissions>>;
  sessionsById: Map<string, ModelRecord>;
  profilesById: Map<string, ModelRecord>;
  nodesById: Map<string, ModelRecord>;
  taskTemplatesById: Map<string, ModelRecord>;
  skillsById: Map<string, TaskRunSkillVersionOption>;
  tokenUsageByRunId: Map<string, TokenUsageSummary | null>;
}

export interface PrepareRunManagementSerializationContextOptions {
  includeTokenEventFallback?: boolean;
}

export function indexModelsById(models: ModelRecord[]) {
  const result = new Map<string, ModelRecord>();
  for (const model of models) {
    const id = getOptionalTargetKey(model, 'id');
    if (id) {
      result.set(id, model);
    }
  }
  return result;
}

export function getMappedModel(models: Map<string, ModelRecord>, id: string) {
  return id ? models.get(id) || null : null;
}

export async function findModelsByIds(ctx: Context, collectionName: string, ids: Set<string>) {
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

export async function prepareRunManagementSerializationContext(
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

export function getRunTaskTemplateSummaryFromContext(run: ModelRecord, context: RunManagementSerializationContext) {
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
    provider: capabilitySummary.provider,
    capabilitySource: capabilitySummary.providerSource,
    capabilitiesSnapshotJson: capabilitySummary.capabilities,
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

export async function serializeRunsForManagement(ctx: Context, runs: ModelRecord[]) {
  const context = await prepareRunManagementSerializationContext(ctx, runs, {
    includeTokenEventFallback: false,
  });
  return await Promise.all(runs.map((run) => serializeRunForManagement(ctx, run, context)));
}

export function isRecordWithValues(value: JsonRecord) {
  return Object.keys(value).length > 0;
}

export function collectResolvedSkillVersionIds(value: unknown, result = new Set<string>()) {
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

export function serializeSkillVersionPayload(
  ctx: Context,
  skillVersion: ModelRecord,
  access?: SkillVersionSourceAccess,
): SkillVersionPayload | null {
  const metadata = getRecord(getModelValue(skillVersion, 'metadataJson'));
  const skillVersionId = String(getModelTargetKey(skillVersion, 'id'));
  const source = serializeSkillVersionSourceForNode(ctx, skillVersionId, getRecord(metadata.source), access);
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

export async function getClaimSkillVersionPayloads(
  ctx: Context,
  run: ModelRecord,
  payload: JsonRecord,
  transaction: Transaction,
) {
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

  const runId = String(getModelTargetKey(run, 'id'));
  const nodeId = getOptionalTargetKey(run, 'nodeId');
  const claimAttempt = getModelNumber(run, 'claimAttempt');
  const expiresAt = getDateFromModel(run, 'claimExpiresAt');
  const payloads: SkillVersionPayload[] = [];
  for (const skillVersion of skillVersions) {
    const source = getRecord(getRecord(getModelValue(skillVersion, 'metadataJson')).source);
    const sha256 = getString(source.sha256);
    const access =
      nodeId && claimAttempt > 0 && expiresAt && sha256
        ? await issueSkillDownloadCapability(
            ctx,
            {
              nodeId,
              runId,
              claimAttempt,
              skillVersionId: String(getModelTargetKey(skillVersion, 'id')),
              sha256,
              expiresAt,
            },
            transaction,
          )
        : undefined;
    const serialized = serializeSkillVersionPayload(ctx, skillVersion, access);
    if (serialized) {
      payloads.push(serialized);
    }
  }
  return payloads;
}

export function stripInlineSkillVersionSources(payload: JsonRecord) {
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

export function stripResolvedSkillSources(value: unknown): unknown {
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

export async function serializeRunForNodeClaim(ctx: Context, run: ModelRecord, transaction: Transaction) {
  const json = serializeRun(run);
  const executionPayloadJson = getRecord(getModelValue(run, 'executionPayloadJson'));
  assertSafeRemoteExecutionPayload(ctx, executionPayloadJson);
  await revokeSkillDownloadCapabilitiesForRun(ctx, String(getModelTargetKey(run, 'id')), transaction);
  const skillVersions = await getClaimSkillVersionPayloads(ctx, run, executionPayloadJson, transaction);
  const baseExecutionPayloadJson = stripInlineSkillVersionSources(executionPayloadJson);
  for (const field of FORBIDDEN_REMOTE_EXECUTION_FIELDS) {
    delete baseExecutionPayloadJson[field];
  }
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

export const EMPTY_TOKEN_USAGE_RUN: ModelRecord = {
  get() {
    return undefined;
  },
};

export function mergeTokenUsageSummary(target: TokenUsageSummary, next: TokenUsageSummary) {
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

export function projectModelValues(model: ModelRecord, values: JsonRecord): ModelRecord {
  return {
    get(key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : model.get(key);
    },
  };
}

export function getUtf8Tail(value: string, maxBytes: number) {
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

export function getBoundedTerminalTokenEvents(eventsNewestFirst: ModelRecord[]) {
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

export async function getStructuredTokenUsageSummary(
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

export async function getTerminalTokenUsageSummary(ctx: Context, runId: string, transaction?: Transaction) {
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

export async function getBoundedRunTokenUsageSummary(ctx: Context, runId: string, transaction?: Transaction) {
  const structuredSummary = await getStructuredTokenUsageSummary(ctx, runId, transaction);
  if (structuredSummary) {
    return structuredSummary;
  }
  return await getTerminalTokenUsageSummary(ctx, runId, transaction);
}

export async function getTerminalizedRunTokenUsageSummary(options: {
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

export async function addTerminalTokenUsageToRunValues(options: {
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
