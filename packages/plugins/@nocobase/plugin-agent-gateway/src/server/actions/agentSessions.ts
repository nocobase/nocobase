/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction, UniqueConstraintError } from 'sequelize';

import { AGENT_GATEWAY_ACTIONS, authenticateNodeToken, redactObservabilityText } from '../security';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../shared/apiContract';
import {
  AGENT_GATEWAY_ERROR_CODES,
  JsonRecord,
  ModelRecord,
  asActionContext,
  getBodyValues,
  getCurrentUserId,
  getModelJson,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  getActionTargetKey,
  getVisibleRunFilter,
  matchStandardCollectionAction,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';
import { validateRunLease } from './runLifecycle';
import {
  AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
  getUnsupportedCapabilityMessage,
  normalizeAgentProviderCapabilities,
} from '../../shared/providerCapabilities';
import { CLAIMABLE_RUN_STATUS, LEASE_OWNING_RUN_STATUSES, TERMINAL_RUN_STATUSES } from '../../shared/runState';
import { getRunProviderCapabilitySummary, isRunCapabilitySupported } from './capabilityUtils';
import { getConversationSessionIngestScope, reserveEventIngestRange } from '../services/eventIngestCursor';

const AGENT_SESSION_STATUSES = new Set(['active', 'idle', 'ended', 'unknown']);
const AGENT_SESSION_PROVIDERS = new Set(['codex', 'opencode', 'claude-code', 'generic-cli']);
const TERMINAL_RUN_STATUS_SET = new Set<string>(TERMINAL_RUN_STATUSES);
const ACTIVE_CONTINUATION_RUN_STATUSES = new Set<string>([CLAIMABLE_RUN_STATUS, ...LEASE_OWNING_RUN_STATUSES]);
const STANDARD_AGENT_SESSION_COLLECTIONS = ['agAgentSessions'] as const;
const ROOT_RUN_RESOLUTION_MAX_DEPTH = 50;
const MAX_RESUME_MESSAGE_LENGTH = 16_000;
const RESUME_MESSAGE_PREVIEW_LENGTH = 240;

function serializeModel(model: ModelRecord) {
  return getModelJson(model);
}

function getSessionStatus(value: unknown) {
  const status = getString(value) || 'active';
  return AGENT_SESSION_STATUSES.has(status) ? status : 'unknown';
}

function getProvider(ctx: Context, value: unknown) {
  const provider = getString(value);
  if (!AGENT_SESSION_PROVIDERS.has(provider)) {
    ctx.throw(400, 'Unsupported agent session provider');
  }
  return provider;
}

function getResumeMessage(ctx: Context, value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    ctx.throw(400, 'message is required');
  }
  if (value.length > MAX_RESUME_MESSAGE_LENGTH) {
    ctx.throw(413, 'message is too large');
  }
  return value;
}

function getRequiredIdempotencyKey(ctx: Context, value: unknown) {
  const idempotencyKey = getString(value);
  if (!idempotencyKey) {
    ctx.throw(400, 'idempotencyKey is required');
  }
  return idempotencyKey;
}

function hashText(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

async function linkRunConversationEventsToSession(
  ctx: Context,
  runId: string,
  sessionId: string,
  transaction: Transaction,
) {
  const repository = ctx.db.getRepository('agAgentConversationEvents');
  const events = (await repository.find({
    filter: {
      runId,
      sessionId: null,
    },
    sort: ['ingestId'],
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord[];
  if (!events.length) {
    return;
  }

  const range = await reserveEventIngestRange(
    ctx.db,
    getConversationSessionIngestScope(sessionId),
    events.length,
    transaction,
  );
  for (const [index, event] of events.entries()) {
    await repository.update({
      filterByTk: getModelTargetKey(event, 'id'),
      values: {
        sessionId,
        sessionIngestId: (range.start + BigInt(index)).toString(),
      },
      transaction,
    });
  }
}

function getResumeMessageFields(message: string) {
  return {
    contentText: message,
    redactedPreview: redactObservabilityText(message).slice(0, RESUME_MESSAGE_PREVIEW_LENGTH),
    contentHash: hashText(message),
    contentSize: Buffer.byteLength(message),
  };
}

function getContinuationRequestKey(sessionId: string, createdById: string | number, idempotencyKey: string) {
  return `resume:${sessionId}:${createdById}:provided:${hashText(idempotencyKey)}`;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof UniqueConstraintError ||
    getString((error as { name?: unknown } | null)?.name) === 'SequelizeUniqueConstraintError'
  );
}

function getRawString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getOptionalModelTargetKey(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

async function assertResumeSupported(ctx: Context, session: ModelRecord, sourceRun: ModelRecord) {
  const capabilitySummary = await getRunProviderCapabilitySummary(ctx, sourceRun, session);
  if (
    !isRunCapabilitySupported(capabilitySummary, 'resumeSession') ||
    capabilitySummary.capabilities.resumeWithMessage !== true
  ) {
    ctx.throw(409, {
      code: AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
      message: getUnsupportedCapabilityMessage('resumeSession'),
    });
  }

  const provider = capabilitySummary.provider;
  const providerSessionId = getModelString(session, 'providerSessionId');
  if (!providerSessionId) {
    ctx.throw(409, 'Agent session does not have a provider session id');
  }

  return {
    provider,
    providerSessionId,
  };
}

async function getSessionForResume(ctx: Context, sessionId: string, transaction: Transaction) {
  const session = (await ctx.db.getRepository('agAgentSessions').findOne({
    filterByTk: sessionId,
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!session) {
    ctx.throw(404, 'Agent session not found');
  }
  return session;
}

async function assertResumeSessionVisible(ctx: Context, sessionId: string, transaction: Transaction) {
  const visibleRun = (await ctx.db.getRepository('agRuns').findOne({
    filter: await getVisibleRunFilter(
      ctx,
      {
        agentSessionId: sessionId,
      },
      'get',
    ),
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (visibleRun) {
    return;
  }

  const existingRun = (await ctx.db.getRepository('agRuns').findOne({
    filter: {
      agentSessionId: sessionId,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (existingRun) {
    ctx.throw(404, {
      code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
      message: 'Run not found',
    });
  }
}

function throwResourceNotVisible(ctx: Context) {
  ctx.throw(404, {
    code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
    message: 'Run not found',
  });
}

async function getRunForResume(ctx: Context, runId: string, sessionId: string, transaction?: Transaction) {
  const filter = await getVisibleRunFilter(
    ctx,
    {
      id: runId,
    },
    'get',
  );
  const run = (await ctx.db.getRepository('agRuns').findOne({
    filter,
    ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
  })) as ModelRecord | null;
  if (!run) {
    const existingRunForSession = (await ctx.db.getRepository('agRuns').findOne({
      filter: {
        id: runId,
        agentSessionId: sessionId,
      },
      ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
    })) as ModelRecord | null;
    if (existingRunForSession) {
      throwResourceNotVisible(ctx);
    }
    ctx.throw(400, 'resumedFromRunId must belong to the agent session');
  }
  if (getModelString(run, 'agentSessionId') !== sessionId) {
    ctx.throw(400, 'resumedFromRunId must belong to the agent session');
  }

  const status = getModelString(run, 'status');
  if (!TERMINAL_RUN_STATUS_SET.has(status)) {
    ctx.throw(409, 'Agent session can only be resumed from an ended run');
  }

  return run;
}

async function resolveResumeSourceRun(
  ctx: Context,
  session: ModelRecord,
  sessionId: string,
  requestedRunId: string,
  transaction?: Transaction,
) {
  const resumedFromRunId = requestedRunId || getModelString(session, 'latestRunId');
  if (!resumedFromRunId) {
    ctx.throw(409, 'Agent session does not have a resumable run');
  }

  return await getRunForResume(ctx, resumedFromRunId, sessionId, transaction);
}

async function resolveResumeSourceRunForContinuation(options: {
  ctx: Context;
  session: ModelRecord;
  sessionId: string;
  continuationRun: ModelRecord;
  requestedRunId: string;
  transaction?: Transaction;
}) {
  return await resolveResumeSourceRun(
    options.ctx,
    options.session,
    options.sessionId,
    options.requestedRunId || getModelString(options.continuationRun, 'resumedFromRunId'),
    options.transaction,
  );
}

function buildResumePayload(options: {
  sourceRun: ModelRecord;
  provider: string;
  providerSessionId: string;
  message: string;
  messageHash: string;
}) {
  const sourcePayload = getRecord(getModelValue(options.sourceRun, 'executionPayloadJson'));
  const cwd = getString(sourcePayload.cwd) || '.';
  const timeoutMs = sourcePayload.timeoutMs;
  return {
    mode: 'agent-session-resume',
    executionPolicyKey: getString(sourcePayload.executionPolicyKey),
    providerSessionId: options.providerSessionId,
    message: options.message,
    messageHash: options.messageHash,
    cwd,
    ...(typeof timeoutMs === 'number' ? { timeoutMs } : {}),
  };
}

function serializeResumeResponse(run: ModelRecord, sessionId: string, deduped: boolean) {
  return {
    runId: getModelTargetKey(run, 'id'),
    runCode: getModelString(run, 'runCode') || undefined,
    agentSessionId: sessionId,
    parentRunId: getOptionalModelTargetKey(run, 'parentRunId') || undefined,
    resumedFromRunId: getOptionalModelTargetKey(run, 'resumedFromRunId') || undefined,
    deduped,
  };
}

async function findContinuationByRequestKey(ctx: Context, continuationRequestKey: string, transaction?: Transaction) {
  return (await ctx.db.getRepository('agRuns').findOne({
    filter: {
      continuationRequestKey,
    },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  })) as ModelRecord | null;
}

async function assertExistingContinuationVisible(options: {
  ctx: Context;
  run: ModelRecord;
  transaction?: Transaction;
}) {
  const runId = String(getModelTargetKey(options.run, 'id'));
  const visibleRun = (await options.ctx.db.getRepository('agRuns').findOne({
    filter: await getVisibleRunFilter(
      options.ctx,
      {
        id: runId,
      },
      'get',
    ),
    transaction: options.transaction,
    ...(options.transaction ? { lock: options.transaction.LOCK.UPDATE } : {}),
  })) as ModelRecord | null;

  if (visibleRun) {
    return visibleRun;
  }

  options.ctx.throw(404, {
    code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
    message: 'Run not found',
  });
}

async function assertNoActiveContinuationForSource(
  ctx: Context,
  sessionId: string,
  resumedFromRunId: string,
  transaction: Transaction,
) {
  const existingRun = (await ctx.db.getRepository('agRuns').findOne({
    filter: {
      agentSessionId: sessionId,
      resumedFromRunId,
      continuationReason: 'user-message',
      status: {
        $in: [...ACTIVE_CONTINUATION_RUN_STATUSES],
      },
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (existingRun) {
    ctx.throw(409, 'Agent session source run already has an active continuation');
  }
}

function assertIdempotentContinuationRequestMatches(
  ctx: Context,
  run: ModelRecord,
  messageFields: ReturnType<typeof getResumeMessageFields>,
  resumedFromRunId: string,
) {
  const storedHash = getModelString(run, 'continuationMessageHash');
  if (storedHash && storedHash !== messageFields.contentHash) {
    ctx.throw(409, 'idempotencyKey has already been used for a different resume message');
  }
  const storedResumedFromRunId = getModelString(run, 'resumedFromRunId');
  if (storedResumedFromRunId && storedResumedFromRunId !== resumedFromRunId) {
    ctx.throw(409, 'idempotencyKey has already been used for a different resume source run');
  }
}

async function findExistingSession(
  ctx: Context,
  nodeId: string,
  provider: string,
  providerSessionId: string,
  transaction: Transaction,
) {
  if (!providerSessionId) {
    return null;
  }

  return (await ctx.db.getRepository('agAgentSessions').findOne({
    filter: {
      nodeId,
      provider,
      providerSessionId,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
}

async function getRunSessionRootId(ctx: Context, run: ModelRecord, transaction: Transaction) {
  const agentSessionId = getModelString(run, 'agentSessionId');
  if (!agentSessionId) {
    return '';
  }

  const session = (await ctx.db.getRepository('agAgentSessions').findOne({
    filterByTk: agentSessionId,
    transaction,
  })) as ModelRecord | null;
  return session ? getModelString(session, 'rootRunId') : '';
}

async function resolveRunRootId(ctx: Context, run: ModelRecord, runId: string, transaction: Transaction) {
  let currentRun: ModelRecord | null = run;
  let rootRunId = runId;
  const visitedRunIds = new Set([runId]);

  for (let depth = 0; currentRun && depth < ROOT_RUN_RESOLUTION_MAX_DEPTH; depth += 1) {
    const sessionRootId = await getRunSessionRootId(ctx, currentRun, transaction);
    if (sessionRootId) {
      return sessionRootId;
    }

    const parentRunId = getModelString(currentRun, 'parentRunId') || getModelString(currentRun, 'resumedFromRunId');
    if (!parentRunId || visitedRunIds.has(parentRunId)) {
      return rootRunId;
    }

    visitedRunIds.add(parentRunId);
    rootRunId = parentRunId;
    currentRun = (await ctx.db.getRepository('agRuns').findOne({
      filterByTk: parentRunId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
  }

  return rootRunId;
}

async function isAncestorRun(ctx: Context, ancestorRunId: string, descendantRunId: string, transaction: Transaction) {
  if (!ancestorRunId || !descendantRunId) {
    return false;
  }
  if (ancestorRunId === descendantRunId) {
    return true;
  }

  let currentRunId = descendantRunId;
  const visitedRunIds = new Set<string>();
  for (let depth = 0; currentRunId && depth < ROOT_RUN_RESOLUTION_MAX_DEPTH; depth += 1) {
    if (visitedRunIds.has(currentRunId)) {
      return false;
    }
    visitedRunIds.add(currentRunId);

    const currentRun = (await ctx.db.getRepository('agRuns').findOne({
      filterByTk: currentRunId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!currentRun) {
      return false;
    }

    const parentRunId = getModelString(currentRun, 'parentRunId') || getModelString(currentRun, 'resumedFromRunId');
    if (!parentRunId) {
      return false;
    }
    if (parentRunId === ancestorRunId) {
      return true;
    }
    currentRunId = parentRunId;
  }

  return false;
}

async function resolveLatestRunId(
  ctx: Context,
  existingSession: ModelRecord | null,
  runId: string,
  transaction: Transaction,
) {
  if (!existingSession) {
    return runId;
  }

  const existingLatestRunId = getModelString(existingSession, 'latestRunId');
  if (!existingLatestRunId || existingLatestRunId === runId) {
    return runId;
  }

  const currentRunDescendsFromLatest = await isAncestorRun(ctx, existingLatestRunId, runId, transaction);
  return currentRunDescendsFromLatest ? runId : existingLatestRunId;
}

async function assertExistingSessionLineage(
  ctx: Context,
  existingSession: ModelRecord | null,
  runId: string,
  transaction: Transaction,
) {
  if (!existingSession) {
    return;
  }

  const rootRunId = getModelString(existingSession, 'rootRunId');
  if (rootRunId && (await isAncestorRun(ctx, rootRunId, runId, transaction))) {
    return;
  }

  const latestRunId = getModelString(existingSession, 'latestRunId');
  if (latestRunId && (await isAncestorRun(ctx, latestRunId, runId, transaction))) {
    return;
  }

  ctx.throw(409, 'Provider session already belongs to another run lineage');
}

async function upsertAgentSession(ctx: Context, nodeId: string, runId: string) {
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowStaleLeaseVersion: true,
    });
    if (!lease) {
      return null;
    }

    const provider = getProvider(ctx, values.provider);
    const providerSessionId = getString(values.providerSessionId);
    if (!providerSessionId) {
      ctx.throw(400, 'providerSessionId is required');
    }

    const now = new Date();
    const sessionRepo = ctx.db.getRepository('agAgentSessions');
    const existingSession = await findExistingSession(ctx, nodeId, provider, providerSessionId, transaction);
    await assertExistingSessionLineage(ctx, existingSession, runId, transaction);
    const resolvedRootRunId = await resolveRunRootId(ctx, lease.run, runId, transaction);
    const latestRunId = await resolveLatestRunId(ctx, existingSession, runId, transaction);
    const sessionValues = {
      nodeId,
      provider,
      providerSessionId,
      rootRunId: existingSession
        ? getModelString(existingSession, 'rootRunId') || resolvedRootRunId
        : resolvedRootRunId,
      latestRunId,
      status: getSessionStatus(values.status),
      capabilitiesJson: normalizeAgentProviderCapabilities(provider, values.capabilitiesJson),
      metadataJson: getRecord(values.metadataJson),
    };
    let session: ModelRecord;
    let idempotent = false;

    if (existingSession) {
      idempotent =
        getModelString(existingSession, 'latestRunId') === latestRunId &&
        getModelString(lease.run, 'agentSessionProviderId') === providerSessionId;
      await sessionRepo.update({
        filterByTk: getModelTargetKey(existingSession, 'id'),
        values: sessionValues,
        transaction,
      });
      session = (await sessionRepo.findOne({
        filterByTk: getModelTargetKey(existingSession, 'id'),
        transaction,
      })) as ModelRecord;
    } else {
      session = (await sessionRepo.create({
        values: {
          id: randomUUID(),
          ...sessionValues,
        },
        transaction,
      })) as ModelRecord;
    }

    await ctx.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        agentSessionId: getModelTargetKey(session, 'id'),
        agentSessionProviderId: providerSessionId,
      },
      transaction,
    });
    await linkRunConversationEventsToSession(ctx, runId, String(getModelTargetKey(session, 'id')), transaction);

    return {
      session: serializeModel(session),
      runId,
      provider,
      providerSessionId,
      linkedAt: now.toISOString(),
      idempotent,
    };
  });

  if (result) {
    ctx.body = result;
  }
}

async function createResumeConversationEvent(options: {
  ctx: Context;
  run: ModelRecord;
  sessionId: string;
  messageFields: ReturnType<typeof getResumeMessageFields>;
  operatorId: string | number;
  transaction: Transaction;
}) {
  await options.ctx.db.getRepository('agAgentConversationEvents').create({
    values: {
      id: randomUUID(),
      sessionId: options.sessionId,
      runId: getModelTargetKey(options.run, 'id'),
      sequence: 0,
      eventType: 'agent.user.message',
      source: 'agent-gateway',
      providerEventId: `resume.message:${getModelTargetKey(options.run, 'id')}`,
      correlationId: getString(options.messageFields.contentHash).slice(0, 32) || null,
      confidence: 1,
      contentText: options.messageFields.contentText,
      contentJson: {
        contentHash: options.messageFields.contentHash,
        contentSize: options.messageFields.contentSize,
        resumedFromRunId: getOptionalModelTargetKey(options.run, 'resumedFromRunId') || null,
      },
      createdById: options.operatorId,
    },
    transaction: options.transaction,
  });
}

async function createContinuationRun(options: {
  ctx: Context;
  session: ModelRecord;
  sessionId: string;
  sourceRun: ModelRecord;
  provider: string;
  providerSessionId: string;
  message: string;
  messageFields: ReturnType<typeof getResumeMessageFields>;
  idempotencyKey: string;
  continuationRequestKey: string;
  operatorId: string | number;
  transaction: Transaction;
}) {
  const now = new Date();
  const sourceRunId = String(getModelTargetKey(options.sourceRun, 'id'));
  const run = (await options.ctx.db.getRepository('agRuns').create({
    values: {
      id: randomUUID(),
      runCode: `resume_${randomUUID()}`,
      status: 'queued',
      claimAttempt: 0,
      leaseVersion: 0,
      cancelRequested: false,
      promptSnapshot: {
        type: 'agent-session-resume',
        text: options.messageFields.redactedPreview,
        messageHash: options.messageFields.contentHash,
        messageSize: options.messageFields.contentSize,
        provider: options.provider,
        providerSessionId: options.providerSessionId,
        resumedFromRunId: sourceRunId,
      },
      executionPayloadJson: buildResumePayload({
        sourceRun: options.sourceRun,
        provider: options.provider,
        providerSessionId: options.providerSessionId,
        message: options.message,
        messageHash: options.messageFields.contentHash,
      }),
      provider: getModelString(options.sourceRun, 'provider'),
      capabilitiesSnapshotJson: getRecord(getModelValue(options.sourceRun, 'capabilitiesSnapshotJson')),
      executionPolicyKey: getModelString(options.sourceRun, 'executionPolicyKey'),
      sourceType: 'agent-session-resume',
      requestedAt: now,
      queuedAt: now,
      nodeId: getOptionalModelTargetKey(options.sourceRun, 'nodeId') || null,
      agentProfileId: getOptionalModelTargetKey(options.sourceRun, 'agentProfileId') || null,
      agentSessionId: options.sessionId,
      parentRunId: sourceRunId,
      resumedFromRunId: sourceRunId,
      continuationReason: 'user-message',
      continuationMessagePreview: options.messageFields.redactedPreview,
      continuationMessageHash: options.messageFields.contentHash,
      continuationIdempotencyKey: options.idempotencyKey,
      continuationRequestKey: options.continuationRequestKey,
      continuationRequestedById: options.operatorId,
      continuationRequestedAt: now,
      agentSessionProviderId: options.providerSessionId,
    },
    transaction: options.transaction,
  })) as ModelRecord;

  await options.ctx.db.getRepository('agAgentSessions').update({
    filterByTk: options.sessionId,
    values: {
      latestRunId: getModelTargetKey(run, 'id'),
      status: 'active',
    },
    transaction: options.transaction,
  });

  await createResumeConversationEvent({
    ctx: options.ctx,
    run,
    sessionId: options.sessionId,
    messageFields: options.messageFields,
    operatorId: options.operatorId,
    transaction: options.transaction,
  });

  return run;
}

async function createOrFindContinuationRun(options: {
  ctx: Context;
  sessionId: string;
  message: string;
  messageFields: ReturnType<typeof getResumeMessageFields>;
  idempotencyKey: string;
  resumedFromRunId: string;
  continuationRequestKey: string;
  operatorId: string | number;
}) {
  try {
    return await options.ctx.db.sequelize.transaction(async (transaction) => {
      const session = await getSessionForResume(options.ctx, options.sessionId, transaction);
      await assertResumeSessionVisible(options.ctx, options.sessionId, transaction);
      const existingRun = await findContinuationByRequestKey(options.ctx, options.continuationRequestKey, transaction);
      if (existingRun) {
        const visibleRun = await assertExistingContinuationVisible({
          ctx: options.ctx,
          run: existingRun,
          transaction,
        });
        const sourceRun = await resolveResumeSourceRunForContinuation({
          ctx: options.ctx,
          session,
          sessionId: options.sessionId,
          continuationRun: visibleRun,
          requestedRunId: options.resumedFromRunId,
          transaction,
        });
        await assertResumeSupported(options.ctx, session, sourceRun);
        assertIdempotentContinuationRequestMatches(
          options.ctx,
          visibleRun,
          options.messageFields,
          options.resumedFromRunId || getModelString(visibleRun, 'resumedFromRunId'),
        );
        return {
          run: visibleRun,
          deduped: true,
        };
      }

      const sourceRun = await resolveResumeSourceRun(
        options.ctx,
        session,
        options.sessionId,
        options.resumedFromRunId,
        transaction,
      );
      const { provider, providerSessionId } = await assertResumeSupported(options.ctx, session, sourceRun);
      await assertNoActiveContinuationForSource(
        options.ctx,
        options.sessionId,
        String(getModelTargetKey(sourceRun, 'id')),
        transaction,
      );
      const run = await createContinuationRun({
        ctx: options.ctx,
        session,
        sessionId: options.sessionId,
        sourceRun,
        provider,
        providerSessionId,
        message: options.message,
        messageFields: options.messageFields,
        idempotencyKey: options.idempotencyKey,
        continuationRequestKey: options.continuationRequestKey,
        operatorId: options.operatorId,
        transaction,
      });
      return {
        run,
        deduped: false,
      };
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
    const existingRun = await findContinuationByRequestKey(options.ctx, options.continuationRequestKey);
    if (!existingRun) {
      throw error;
    }
    const visibleRun = await assertExistingContinuationVisible({
      ctx: options.ctx,
      run: existingRun,
    });
    const session = (await options.ctx.db.getRepository('agAgentSessions').findOne({
      filterByTk: options.sessionId,
    })) as ModelRecord | null;
    if (!session) {
      options.ctx.throw(404, 'Agent session not found');
    }
    const sourceRun = await resolveResumeSourceRunForContinuation({
      ctx: options.ctx,
      session,
      sessionId: options.sessionId,
      continuationRun: visibleRun,
      requestedRunId: options.resumedFromRunId,
    });
    await assertResumeSupported(options.ctx, session, sourceRun);
    assertIdempotentContinuationRequestMatches(
      options.ctx,
      visibleRun,
      options.messageFields,
      options.resumedFromRunId || getModelString(visibleRun, 'resumedFromRunId'),
    );
    return {
      run: visibleRun,
      deduped: true,
    };
  }
}

async function resumeAgentSession(ctx: Context, sessionId: string) {
  const values = getBodyValues(ctx);
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.resumeAgentSession,
    'Agent Gateway resume permission required',
  );

  const message = getResumeMessage(ctx, values.message);
  const messageFields = getResumeMessageFields(message);
  const idempotencyKey = getRequiredIdempotencyKey(ctx, values.idempotencyKey);
  const operatorId = getCurrentUserId(ctx);
  if (!operatorId) {
    ctx.throw(401, 'Authentication required');
  }
  const continuationRequestKey = getContinuationRequestKey(sessionId, operatorId, idempotencyKey);

  const result = await createOrFindContinuationRun({
    ctx,
    sessionId,
    message,
    messageFields,
    idempotencyKey,
    resumedFromRunId: getString(values.resumedFromRunId),
    continuationRequestKey,
    operatorId,
  });
  ctx.body = serializeResumeResponse(result.run, sessionId, result.deduped);
}

async function messageAgentSession(ctx: Context, sessionId: string) {
  const values = getBodyValues(ctx);
  const rawMessage = getRawString(values.message);
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.messageAgentSession,
    'Agent Gateway message permission required',
  );

  if (!rawMessage.trim()) {
    ctx.throw(400, 'message is required');
  }
  if (rawMessage.length > MAX_RESUME_MESSAGE_LENGTH) {
    ctx.throw(413, 'message is too large');
  }

  const session = (await ctx.db.getRepository('agAgentSessions').findOne({
    filterByTk: sessionId,
  })) as ModelRecord | null;
  if (!session) {
    ctx.throw(404, 'Agent session not found');
  }
  const latestRunId = getModelString(session, 'latestRunId');
  if (latestRunId) {
    const visibleRunFilter = await getVisibleRunFilter(
      ctx,
      {
        id: latestRunId,
      },
      'get',
    );
    const latestRun = await ctx.db.getRepository('agRuns').findOne({
      filter: visibleRunFilter,
    });
    if (!latestRun) {
      const existingLatestRun = await ctx.db.getRepository('agRuns').findOne({
        filterByTk: latestRunId,
      });
      if (existingLatestRun) {
        throwResourceNotVisible(ctx);
      }
      ctx.throw(404, 'Run not found');
    }
  } else {
    const visibleSessionRun = await ctx.db.getRepository('agRuns').findOne({
      filter: await getVisibleRunFilter(
        ctx,
        {
          agentSessionId: sessionId,
        },
        'get',
      ),
    });
    if (!visibleSessionRun) {
      throwResourceNotVisible(ctx);
    }
  }

  ctx.throw(409, {
    code: AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
    message: getUnsupportedCapabilityMessage('liveSemanticMessage'),
  });
}

export function registerAgentSessionRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.upsertAgentSession)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await upsertAgentSession(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await resumeAgentSession(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.messageAgentSession)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await messageAgentSession(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
  });

  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (matchStandardCollectionAction(ctx.path, STANDARD_AGENT_SESSION_COLLECTIONS)) {
        await requireManagePermission(ctx);
      }
      await next();
    },
    {
      tag: 'agentGatewayAgentSessionRoutes',
      after: 'agentGatewayRunLifecycleRoutes',
      before: 'dataSource',
    },
  );
}
