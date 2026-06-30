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
  createClaimToken,
  extractNodeToken,
  toStoredTokenFields,
  verifyClaimToken,
  verifyNodeToken,
} from '../security';
import {
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getModelJson,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';

const DEFAULT_CLAIM_LEASE_SECONDS = 60;
const DEFAULT_MAX_CONCURRENCY = 1;
const CLAIM_CANDIDATE_PAGE_SIZE = 50;

const ACTIVE_RUN_STATUSES = ['claimed', 'syncing_skills', 'running', 'canceling'] as const;
const CLAIMABLE_RUN_STATUS = 'queued';
const TERMINAL_RUN_STATUSES = ['succeeded', 'failed', 'canceled', 'timeout', 'abandoned'] as const;
const HEARTBEAT_RUN_STATUSES = ['claimed', 'syncing_skills', 'running'] as const;

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

function getOptionalTargetKey(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
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
  return json;
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
    AGENT_GATEWAY_ACTIONS.dispatch,
    'Agent Gateway dispatch permission required',
  );

  const values = getBodyValues(ctx);
  const now = new Date();
  const run = (await ctx.db.getRepository('agRuns').create({
    values: {
      runCode: getString(values.runCode) || `run_${randomUUID()}`,
      status: CLAIMABLE_RUN_STATUS,
      claimAttempt: 0,
      leaseVersion: 0,
      cancelRequested: false,
      promptSnapshot: getRecord(values.promptSnapshot),
      executionPayloadJson: getRecord(values.executionPayloadJson || values.executionPayload),
      sourceType: getString(values.sourceType) || 'manual',
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

  ctx.body = serializeRun(run);
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

function getClaimableRunFilter(nodeId: string, profileIds: string[]) {
  return {
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
) {
  const profileIds = profiles.map((profile) => String(getModelTargetKey(profile, 'id')));
  const profileById = new Map(profiles.map((profile) => [String(getModelTargetKey(profile, 'id')), profile]));
  const capacityCache = new Map<string, boolean>();
  const filter = getClaimableRunFilter(nodeId, profileIds);
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

    const { candidate, reason } = await findClaimableCandidate(ctx, nodeId, profiles, nodeMaxConcurrency, transaction);
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
      nodeCapabilities: getRecord(getModelValue(node, 'capabilitiesJson')),
      profileCapabilities: getRecord(getModelValue(candidate.profile, 'capabilitiesJson')),
    };
  });

  ctx.body = claimResult;
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

    return {
      runId,
      status,
      claimAttempt: lease.claimAttempt,
      leaseVersion: nextLeaseVersion,
      claimExpiresAt: claimExpiresAt.toISOString(),
      cancelRequested: getBoolean(getModelValue(lease.run, 'cancelRequested')) || status === 'canceling',
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
      resultSummaryJson: getRecord(values.resultSummaryJson || values.resultSummary),
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
      resultSummaryJson: getRecord(values.resultSummaryJson || values.resultSummary),
      errorSummary: getString(values.errorSummary) || null,
      failedAt: now,
    }),
    ['claimed', 'syncing_skills', 'running'],
  );
}

async function timeoutRun(ctx: Context, nodeId: string, runId: string) {
  await finishRun(
    ctx,
    nodeId,
    runId,
    'timeout',
    (values) => ({
      errorSummary: getString(values.errorSummary) || 'Process timeout confirmed by daemon',
    }),
    ['running'],
  );
}

async function cancelRun(ctx: Context, runId: string) {
  await requireAgentGatewayPermission(ctx, AGENT_GATEWAY_ACTIONS.cancelRun, 'Agent Gateway cancel permission required');

  const updatedRun = await ctx.db.sequelize.transaction(async (transaction) => {
    const now = new Date();
    const run = (await ctx.db.getRepository('agRuns').findOne({
      filterByTk: runId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!run) {
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
  ctx.body = serializeRun(updatedRun);
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

export function registerRunLifecycleRoutes(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const claimMatch = routePath.match(/^\/nodes\/([^/]+)\/runs:claim$/);
      const runNodeActionMatch = routePath.match(
        /^\/nodes\/([^/]+)\/runs\/([^/]+)\/(heartbeat|complete|fail|timeout|cancel-ack)$/,
      );
      const cancelMatch = routePath.match(/^\/runs\/([^/]+)\/cancel$/);

      if (ctx.method === 'POST' && routePath === '/runs:create') {
        await createRun(ctx);
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
