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
  createClaimToken,
  extractNodeToken,
  toStoredTokenFields,
  verifyClaimToken,
  verifyNodeToken,
} from '../../security';
import {
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
} from '../../actions/utils';
import { CLAIMABLE_RUN_STATUS, LEASE_OWNING_RUN_STATUSES, isActiveRunStatus } from '../../../shared/runState';
import { reconcileExpiredRunLeases } from './leaseRecovery';
import { serializeRunForNodeClaim } from './serialization';
import {
  ClaimCandidate,
  DEFAULT_CLAIM_LEASE_SECONDS,
  DEFAULT_CLAIM_LEASE_TTL_MS,
  RunLease,
  getDateFromModel,
  getLeaseExpiresAt,
  getMaxConcurrency,
  getOptionalTargetKey,
  getRequiredInteger,
  serializeClaimProfileCapabilities,
} from './types';

export interface RunLeaseFenceInput {
  nodeId: string;
  leasedNodeId: string;
  claimAttempt: number;
  currentClaimAttempt: number;
  requestedLeaseVersion: number;
  currentLeaseVersion: number;
  claimTokenMatches: boolean;
  status: string;
  claimExpiresAt: Date | null;
  now?: Date;
}

export interface RunLeaseValidationOptions {
  allowExpiredLease?: boolean;
  allowExpiredLeaseStatuses?: readonly string[];
  allowStaleLeaseVersion?: boolean;
  allowPreviousLeaseVersion?: boolean;
  allowedStatuses?: readonly string[];
}

export function getRunLeaseFenceFailure(
  input: RunLeaseFenceInput,
  options: RunLeaseValidationOptions = {},
): string | null {
  if (input.leasedNodeId !== input.nodeId) {
    return 'Run is not leased by this node';
  }
  if (input.currentClaimAttempt !== input.claimAttempt) {
    return 'Claim attempt is stale';
  }
  const leaseVersionMatches = input.currentLeaseVersion === input.requestedLeaseVersion;
  const staleLeaseVersionAllowed =
    options.allowStaleLeaseVersion && input.requestedLeaseVersion < input.currentLeaseVersion;
  const previousLeaseVersionAllowed =
    options.allowPreviousLeaseVersion && input.requestedLeaseVersion === input.currentLeaseVersion - 1;
  if (!leaseVersionMatches && !staleLeaseVersionAllowed && !previousLeaseVersionAllowed) {
    return 'Lease version is stale';
  }
  if (!input.claimTokenMatches) {
    return 'Claim token is stale';
  }
  const statusAllowed = isActiveRunStatus(input.status) || Boolean(options.allowedStatuses?.includes(input.status));
  if (!statusAllowed) {
    return 'Run is no longer active';
  }
  const allowExpiredLease =
    options.allowExpiredLease || Boolean(options.allowExpiredLeaseStatuses?.includes(input.status));
  if (
    !allowExpiredLease &&
    (!input.claimExpiresAt || input.claimExpiresAt.getTime() <= (input.now || new Date()).getTime())
  ) {
    return 'Run lease has expired';
  }
  return null;
}

export function respondLeaseLost(ctx: Context, message: string) {
  ctx.status = 409;
  ctx.body = {
    code: 'lease_lost',
    message,
  };
  return null;
}

export async function authenticateNodeForRun(
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

export async function getActiveProfiles(ctx: Context, nodeId: string, values: JsonRecord, transaction: Transaction) {
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

export async function countActiveRuns(ctx: Context, filter: JsonRecord, transaction: Transaction) {
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

export async function validateNodeConcurrency(ctx: Context, node: ModelRecord, now: Date, transaction: Transaction) {
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

export async function hasProfileCapacity(
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

export function getClaimableRunFilter(nodeId: string, profileIds: string[], runId?: string) {
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

export async function pickCandidateProfile(
  ctx: Context,
  run: ModelRecord,
  profiles: ModelRecord[],
  profileById: Map<string, ModelRecord>,
  nodeMaxConcurrency: number,
  transaction: Transaction,
  capacityCache: Map<string, boolean>,
) {
  const executionPolicyKey = getString(getRecord(getModelValue(run, 'executionPayloadJson')).executionPolicyKey);
  const targetProfileId = getOptionalTargetKey(run, 'agentProfileId');
  if (targetProfileId) {
    const profile = profileById.get(targetProfileId);
    if (
      profile &&
      getModelString(profile, 'profileKey') === executionPolicyKey &&
      (await hasProfileCapacity(ctx, profile, nodeMaxConcurrency, transaction, capacityCache))
    ) {
      return profile;
    }
    return null;
  }

  for (const profile of profiles) {
    if (getModelString(profile, 'profileKey') !== executionPolicyKey) {
      continue;
    }
    if (await hasProfileCapacity(ctx, profile, nodeMaxConcurrency, transaction, capacityCache)) {
      return profile;
    }
  }

  return null;
}

export async function findClaimableCandidate(
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

export async function claimRun(ctx: Context, nodeId: string) {
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
      executionPolicyKey: getModelString(claimedRun, 'executionPolicyKey'),
      profileCapabilities: serializeClaimProfileCapabilities(getModelValue(claimedRun, 'capabilitiesSnapshotJson')),
      run: await serializeRunForNodeClaim(ctx, claimedRun, transaction),
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
  options: RunLeaseValidationOptions = {},
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

  const currentLeaseVersion = getModelNumber(run, 'leaseVersion');
  const status = getModelString(run, 'status');
  const claimExpiresAt = getDateFromModel(run, 'claimExpiresAt');
  const fenceFailure = getRunLeaseFenceFailure(
    {
      nodeId,
      leasedNodeId: getOptionalTargetKey(run, 'nodeId'),
      claimAttempt,
      currentClaimAttempt: getModelNumber(run, 'claimAttempt'),
      requestedLeaseVersion: leaseVersion,
      currentLeaseVersion,
      claimTokenMatches: verifyClaimToken(claimToken, getModelString(run, 'claimTokenHash')),
      status,
      claimExpiresAt,
    },
    options,
  );
  if (fenceFailure) {
    return respondLeaseLost(ctx, fenceFailure);
  }

  return {
    run,
    claimAttempt,
    leaseVersion: currentLeaseVersion,
    requestedLeaseVersion: leaseVersion,
  };
}
