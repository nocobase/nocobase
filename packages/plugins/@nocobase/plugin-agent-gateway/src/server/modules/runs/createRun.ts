/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';
import { Context } from '@nocobase/actions';
import { Transaction } from 'sequelize';
import { AGENT_GATEWAY_ACTIONS, redactEventPayload } from '../../security';
import {
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getCurrentUserId,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  requireAgentGatewayPermission,
} from '../../actions/utils';
import {
  ensureDefaultTaskTemplates,
  findActiveTaskTemplateForRun,
  getTaskTemplateDefaults,
  TaskTemplateDefaults,
} from '../../actions/taskTemplates';
import { getExplicitAgentProviderKey, normalizeAgentProviderCapabilities } from '../../../shared/providerCapabilities';
import { CLAIMABLE_RUN_STATUS } from '../../../shared/runState';
import { serializeCreatedRunForUser } from '../../services/runSerialization';
import { serializeRunForManagement, serializeSkillVersionPayload } from './serialization';
import {
  BuildRunnerCandidate,
  BuildRunnerSelection,
  DEFAULT_TASK_RUN_PROFILE_KEY,
  FORBIDDEN_REMOTE_EXECUTION_FIELDS,
  MAX_REMOTE_EXECUTION_TIMEOUT_MS,
  MutableModelRecord,
  TASK_RUN_INITIAL_EVENT_SOURCE,
  TASK_RUN_SOURCE_TYPE,
  TaskRunSkillVersionOption,
  UI_BUILD_REROUTE_SOURCE_TYPES,
  ValidatedTaskRunSkillSelection,
  assertSafeRemoteExecutionPayload,
  compareBuildRunnerCandidates,
  compareBuildRunnerNodes,
  getDateFromModel,
  getOptionalTargetKey,
  getPositiveNumber,
  getRelatedSkillString,
  getRunnerOnlineState,
  getStringList,
  getTaskRunArtifactDeclarations,
  getTaskRunSkillVersionIds,
  serializeBuildRunnerNode,
  serializeRunTaskTemplateFilterOption,
  serializeTaskRunSkillVersion,
  serializeTaskRunTemplate,
} from './types';

export async function listRunTaskTemplateFilterOptions(ctx: Context) {
  const templates = (await ctx.db.getRepository('agTaskTemplates').find({
    sort: ['templateKey'],
  })) as ModelRecord[];
  return templates.map(serializeRunTaskTemplateFilterOption);
}

export async function listBuildRunOptions(ctx: Context) {
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

export async function findActiveNode(ctx: Context, nodeId: string, transaction: Transaction | undefined) {
  if (!nodeId) {
    return null;
  }
  return (await ctx.db.getRepository('agNodes').findOne({
    filterByTk: nodeId,
    transaction,
  })) as ModelRecord | null;
}

export async function findActiveProfile(ctx: Context, profileId: string, transaction: Transaction | undefined) {
  if (!profileId) {
    return null;
  }
  return (await ctx.db.getRepository('agAgentProfiles').findOne({
    filterByTk: profileId,
    transaction,
  })) as ModelRecord | null;
}

export function getBuildRunProfileKeyFromRun(run: ModelRecord, profile: ModelRecord | null) {
  return getModelString(run, 'executionPolicyKey') || (profile ? getModelString(profile, 'profileKey') : '');
}

export function getBuildRunProviderFromRun(run: ModelRecord) {
  return getModelString(run, 'provider');
}

export async function findOnlineBuildRunnerFallback(
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

export async function findCurrentRunRunner(
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

export async function findFallbackForQueuedBuildRun(
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
  const provider = getBuildRunProviderFromRun(run);
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

export function applyBuildRunnerFallbackToRun(run: MutableModelRecord, fallback: BuildRunnerSelection) {
  const profileKey = getModelString(fallback.profile, 'profileKey');
  const payload = getRecord(getModelValue(run, 'executionPayloadJson'));
  run.set('nodeId', getModelTargetKey(fallback.node, 'id'));
  run.set('agentProfileId', getModelTargetKey(fallback.profile, 'id'));
  run.set('executionPayloadJson', { ...payload, executionPolicyKey: profileKey });
  run.set('executionPolicyKey', profileKey);
}

export async function resolveBuildRunnerSelection(
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

export function getTaskInstruction(values: JsonRecord) {
  return getString(values.instruction) || getString(values.prompt);
}

export function hasOwnKey(values: JsonRecord, key: string) {
  return Object.prototype.hasOwnProperty.call(values, key);
}

export function applyTaskTemplateDefaults(values: JsonRecord, taskTemplate: TaskTemplateDefaults) {
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

export async function getTaskRunValuesWithTemplateDefaults(ctx: Context, values: JsonRecord, transaction: Transaction) {
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

export function getTaskRunArtifactPayload(values: JsonRecord) {
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

export function getTaskRunResolvedSkills(values: JsonRecord) {
  const skillVersionIds = getTaskRunSkillVersionIds(values);
  if (!skillVersionIds.length) {
    return undefined;
  }
  return skillVersionIds.map((skillVersionId) => ({ skillVersionId }));
}

export function getTaskRunTimeoutMs(ctx: Context, values: JsonRecord) {
  const timeoutMs = getPositiveNumber(values.timeoutMs);
  if (values.timeoutMs !== undefined && (!timeoutMs || timeoutMs > MAX_REMOTE_EXECUTION_TIMEOUT_MS)) {
    ctx.throw(400, `timeoutMs must be between 1 and ${MAX_REMOTE_EXECUTION_TIMEOUT_MS}`);
  }
  return timeoutMs;
}

export async function createInitialTaskConversationEvent(
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

export async function assertTaskRunSkillVersionActive(
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

export async function createRun(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.manage,
    'Agent Gateway management permission required',
  );

  const values = getBodyValues(ctx);
  const sourceType = getString(values.sourceType) || 'manual';
  const provider = getExplicitAgentProviderKey(values.provider);
  if (!provider) {
    ctx.throw(400, 'provider is required');
  }
  const executionPolicyKey = getString(values.executionPolicyKey);
  if (!executionPolicyKey) {
    ctx.throw(400, 'executionPolicyKey is required');
  }
  const now = new Date();
  const promptSnapshot = getRecord(values.promptSnapshot);
  const rawExecutionPayload = getRecord(values.executionPayloadJson);
  assertSafeRemoteExecutionPayload(ctx, rawExecutionPayload);
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
      provider,
      capabilitiesSnapshotJson: normalizeAgentProviderCapabilities(
        provider,
        getRecord(values.capabilitiesSnapshotJson),
      ),
      executionPolicyKey,
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

export async function createTaskRun(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.dispatch,
    'Agent Gateway dispatch permission required',
  );

  const bodyValues = getBodyValues(ctx);
  for (const field of FORBIDDEN_REMOTE_EXECUTION_FIELDS) {
    if (bodyValues[field] !== undefined) {
      ctx.throw(400, `Execution field is not allowed: ${field}`);
    }
  }
  const requestedCwd = getString(bodyValues.cwd);
  if (requestedCwd.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(requestedCwd)) {
    ctx.throw(400, 'cwd must be relative to the execution policy workspace');
  }

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
    const provider = getExplicitAgentProviderKey(getModelString(selection.profile, 'provider'));
    if (!provider) {
      ctx.throw(409, 'Selected agent profile provider is invalid');
    }
    const capabilitiesSnapshotJson = normalizeAgentProviderCapabilities(
      provider,
      getRecord(getModelValue(selection.profile, 'capabilitiesJson')),
    );
    const cwd = getString(values.cwd) || '.';
    const now = new Date();
    const artifactPayload = getTaskRunArtifactPayload(values);
    const resolvedSkills = getTaskRunResolvedSkills(values);
    const timeoutMs = getTaskRunTimeoutMs(ctx, values);
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
      executionPolicyKey: profileKey,
      cwd,
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
        provider,
        capabilitiesSnapshotJson,
        executionPolicyKey: profileKey,
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
