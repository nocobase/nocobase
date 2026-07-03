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

import { AGENT_GATEWAY_ACTIONS, AGENT_GATEWAY_PERMISSIONS, redactObservabilityText } from '../security';
import { auditAgentActionBestEffort, auditMutatingAgentAction } from '../audit/agentActionAudit';
import {
  AGENT_GATEWAY_ERROR_CODES,
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getCurrentUserId,
  getModelJson,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  getVisibleRunFilter,
  matchStandardCollectionAction,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';
import { validateRunLease } from './runLifecycle';

const AGENT_SESSION_STATUSES = new Set(['active', 'idle', 'ended', 'unknown']);
const AGENT_SESSION_PROVIDERS = new Set(['codex', 'opencode', 'claude-code']);
const RESUMABLE_AGENT_SESSION_PROVIDERS = new Set(['codex']);
const TERMINAL_RUN_STATUSES = new Set(['succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const ACTIVE_CONTINUATION_RUN_STATUSES = new Set(['queued', 'claimed', 'syncing_skills', 'running', 'canceling']);
const STANDARD_AGENT_SESSION_COLLECTIONS = ['agAgentSessions'] as const;
const ROOT_RUN_RESOLUTION_MAX_DEPTH = 50;
const MAX_RESUME_MESSAGE_LENGTH = 16_000;
const RESUME_MESSAGE_PREVIEW_LENGTH = 240;

interface ResumeVisibilityAuditState {
  deniedAuditWritten: boolean;
}

interface MessageVisibilityAuditBase {
  action: 'message';
  sessionId: string;
  operatorId?: string | number;
  permissionKey: string;
  redactedPreview?: string;
  contentHash?: string;
  contentSize?: number;
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') {
    return '';
  }
  return getString((error as { code?: unknown }).code);
}

function isResourceNotVisibleError(error: unknown) {
  return getErrorCode(error) === AGENT_GATEWAY_ERROR_CODES.resourceNotVisible;
}

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

function getMessageAuditFields(message: string) {
  return {
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

function assertResumeSupported(ctx: Context, session: ModelRecord) {
  const provider = getModelString(session, 'provider');
  if (!RESUMABLE_AGENT_SESSION_PROVIDERS.has(provider)) {
    ctx.throw(409, 'Agent session provider does not support resume');
  }

  const capabilities = getRecord(getModelValue(session, 'capabilitiesJson'));
  if (capabilities.resumeWithMessage !== true) {
    ctx.throw(409, 'Agent session does not support resume with message');
  }

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

async function auditMessageSessionVisibilityDenied(options: {
  ctx: Context;
  auditBase: MessageVisibilityAuditBase;
  runId?: string | null;
  phase: string;
}) {
  await auditAgentActionBestEffort(options.ctx, {
    ...options.auditBase,
    runId: options.runId || null,
    resultStatus: 'denied',
    metadataJson: {
      phase: options.phase,
    },
  });
}

function throwResourceNotVisible(ctx: Context) {
  ctx.throw(404, {
    code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
    message: 'Run not found',
  });
}

async function getRunForResume(ctx: Context, runId: string, sessionId: string, transaction: Transaction) {
  const filter = await getVisibleRunFilter(
    ctx,
    {
      id: runId,
    },
    'get',
  );
  const run = (await ctx.db.getRepository('agRuns').findOne({
    filter,
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!run) {
    const existingRunForSession = (await ctx.db.getRepository('agRuns').findOne({
      filter: {
        id: runId,
        agentSessionId: sessionId,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
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
  if (!TERMINAL_RUN_STATUSES.has(status)) {
    ctx.throw(409, 'Agent session can only be resumed from an ended run');
  }

  return run;
}

async function resolveResumeSourceRun(
  ctx: Context,
  session: ModelRecord,
  sessionId: string,
  requestedRunId: string,
  transaction: Transaction,
) {
  const resumedFromRunId = requestedRunId || getModelString(session, 'latestRunId');
  if (!resumedFromRunId) {
    ctx.throw(409, 'Agent session does not have a resumable run');
  }

  return await getRunForResume(ctx, resumedFromRunId, sessionId, transaction);
}

function buildCodexResumePayload(options: {
  sourceRun: ModelRecord;
  providerSessionId: string;
  message: string;
  messageHash: string;
}) {
  const sourcePayload = getRecord(getModelValue(options.sourceRun, 'executionPayloadJson'));
  const cwd = getString(sourcePayload.cwd) || '.';
  const timeoutMs = sourcePayload.timeoutMs;
  return {
    mode: 'agent-session-resume',
    commandKey: 'codex',
    profileKey: getString(sourcePayload.profileKey) || 'codex',
    providerSessionId: options.providerSessionId,
    message: options.message,
    messageHash: options.messageHash,
    args: ['exec', 'resume', '--json', options.providerSessionId, options.message],
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
  sessionId: string;
  run: ModelRecord;
  continuationRequestKey: string;
  operatorId: string | number;
  visibilityAuditState: ResumeVisibilityAuditState;
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

  await auditAgentActionBestEffort(options.ctx, {
    action: 'resume',
    sessionId: options.sessionId,
    runId,
    operatorId: options.operatorId,
    permissionKey: AGENT_GATEWAY_PERMISSIONS.resumeAgentSession,
    resultStatus: 'denied',
    metadataJson: {
      continuationRequestKey: options.continuationRequestKey,
      phase: 'existing-run-visibility',
    },
  });
  options.visibilityAuditState.deniedAuditWritten = true;
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
  messageFields: ReturnType<typeof getMessageAuditFields>,
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
  provider: string,
  providerSessionId: string,
  transaction: Transaction,
) {
  if (!providerSessionId) {
    return null;
  }

  return (await ctx.db.getRepository('agAgentSessions').findOne({
    filter: {
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
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction);
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
    const existingSession = await findExistingSession(ctx, provider, providerSessionId, transaction);
    await assertExistingSessionLineage(ctx, existingSession, runId, transaction);
    const resolvedRootRunId = await resolveRunRootId(ctx, lease.run, runId, transaction);
    const latestRunId = await resolveLatestRunId(ctx, existingSession, runId, transaction);
    const sessionValues = {
      provider,
      providerSessionId,
      rootRunId: existingSession
        ? getModelString(existingSession, 'rootRunId') || resolvedRootRunId
        : resolvedRootRunId,
      latestRunId,
      status: getSessionStatus(values.status),
      capabilitiesJson: getRecord(values.capabilitiesJson || values.capabilities),
      metadataJson: getRecord(values.metadataJson || values.metadata),
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
        agentSessionProvider: provider,
        agentSessionProviderId: providerSessionId,
      },
      transaction,
    });

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
  messageFields: ReturnType<typeof getMessageAuditFields>;
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
      contentText: options.messageFields.redactedPreview,
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
  messageFields: ReturnType<typeof getMessageAuditFields>;
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
      executionPayloadJson: buildCodexResumePayload({
        sourceRun: options.sourceRun,
        providerSessionId: options.providerSessionId,
        message: options.message,
        messageHash: options.messageFields.contentHash,
      }),
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
      agentSessionProvider: options.provider,
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
  messageFields: ReturnType<typeof getMessageAuditFields>;
  idempotencyKey: string;
  resumedFromRunId: string;
  continuationRequestKey: string;
  operatorId: string | number;
  visibilityAuditState: ResumeVisibilityAuditState;
}) {
  try {
    return await options.ctx.db.sequelize.transaction(async (transaction) => {
      const session = await getSessionForResume(options.ctx, options.sessionId, transaction);
      await assertResumeSessionVisible(options.ctx, options.sessionId, transaction);
      const existingRun = await findContinuationByRequestKey(options.ctx, options.continuationRequestKey, transaction);
      if (existingRun) {
        const visibleRun = await assertExistingContinuationVisible({
          ctx: options.ctx,
          sessionId: options.sessionId,
          run: existingRun,
          continuationRequestKey: options.continuationRequestKey,
          operatorId: options.operatorId,
          visibilityAuditState: options.visibilityAuditState,
          transaction,
        });
        assertResumeSupported(options.ctx, session);
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
      const { provider, providerSessionId } = assertResumeSupported(options.ctx, session);
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
      sessionId: options.sessionId,
      run: existingRun,
      continuationRequestKey: options.continuationRequestKey,
      operatorId: options.operatorId,
      visibilityAuditState: options.visibilityAuditState,
    });
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

function getResumeAuditBase(ctx: Context, sessionId: string, messageFields?: ReturnType<typeof getMessageAuditFields>) {
  return {
    action: 'resume' as const,
    sessionId,
    operatorId: getCurrentUserId(ctx) || undefined,
    permissionKey: AGENT_GATEWAY_PERMISSIONS.resumeAgentSession,
    redactedPreview: messageFields?.redactedPreview,
    contentHash: messageFields?.contentHash,
    contentSize: messageFields?.contentSize,
  };
}

async function resumeAgentSession(ctx: Context, sessionId: string) {
  const values = getBodyValues(ctx);
  try {
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.resumeAgentSession,
      'Agent Gateway resume permission required',
    );
  } catch (error) {
    const rawMessage = getRawString(values.message);
    await auditAgentActionBestEffort(ctx, {
      ...getResumeAuditBase(ctx, sessionId, rawMessage ? getMessageAuditFields(rawMessage) : undefined),
      resultStatus: 'denied',
    });
    throw error;
  }

  const message = getResumeMessage(ctx, values.message);
  const messageFields = getMessageAuditFields(message);
  const idempotencyKey = getRequiredIdempotencyKey(ctx, values.idempotencyKey);
  const operatorId = getCurrentUserId(ctx);
  if (!operatorId) {
    ctx.throw(401, 'Authentication required');
  }
  const continuationRequestKey = getContinuationRequestKey(sessionId, operatorId, idempotencyKey);
  const auditBase = getResumeAuditBase(ctx, sessionId, messageFields);

  await auditMutatingAgentAction(ctx, {
    ...auditBase,
    resultStatus: 'accepted',
    metadataJson: {
      resumedFromRunId: getString(values.resumedFromRunId) || null,
      continuationRequestKey,
    },
  });

  const visibilityAuditState: ResumeVisibilityAuditState = {
    deniedAuditWritten: false,
  };
  try {
    const result = await createOrFindContinuationRun({
      ctx,
      sessionId,
      message,
      messageFields,
      idempotencyKey,
      resumedFromRunId: getString(values.resumedFromRunId),
      continuationRequestKey,
      operatorId,
      visibilityAuditState,
    });
    await auditAgentActionBestEffort(ctx, {
      ...auditBase,
      runId: getModelTargetKey(result.run, 'id'),
      provider: getModelString(result.run, 'agentSessionProvider') || undefined,
      resultStatus: 'succeeded',
      metadataJson: {
        deduped: result.deduped,
        continuationRequestKey,
        parentRunId: getOptionalModelTargetKey(result.run, 'parentRunId') || null,
        resumedFromRunId: getOptionalModelTargetKey(result.run, 'resumedFromRunId') || null,
      },
    });
    ctx.body = serializeResumeResponse(result.run, sessionId, result.deduped);
  } catch (error) {
    if (!visibilityAuditState.deniedAuditWritten) {
      if (isResourceNotVisibleError(error)) {
        await auditAgentActionBestEffort(ctx, {
          ...auditBase,
          resultStatus: 'denied',
          metadataJson: {
            continuationRequestKey,
            phase: 'source-run-visibility',
            resumedFromRunId: getString(values.resumedFromRunId) || null,
          },
        });
        visibilityAuditState.deniedAuditWritten = true;
      } else {
        await auditAgentActionBestEffort(ctx, {
          ...auditBase,
          resultStatus: 'failed',
          metadataJson: {
            continuationRequestKey,
            errorName: error instanceof Error ? error.name : 'UnknownError',
          },
        });
      }
    }
    throw error;
  }
}

async function messageAgentSession(ctx: Context, sessionId: string) {
  const values = getBodyValues(ctx);
  const rawMessage = getRawString(values.message);
  const messageFields = rawMessage ? getMessageAuditFields(rawMessage) : undefined;
  const getMessageAuditBase = () => ({
    ...getResumeAuditBase(ctx, sessionId, messageFields),
    action: 'message' as const,
    permissionKey: AGENT_GATEWAY_PERMISSIONS.messageAgentSession,
  });
  try {
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.messageAgentSession,
      'Agent Gateway message permission required',
    );
  } catch (error) {
    await auditAgentActionBestEffort(ctx, {
      ...getMessageAuditBase(),
      resultStatus: 'denied',
    });
    throw error;
  }

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
        await auditMessageSessionVisibilityDenied({
          ctx,
          auditBase: getMessageAuditBase(),
          runId: latestRunId,
          phase: 'latest-run-visibility',
        });
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
      await auditMessageSessionVisibilityDenied({
        ctx,
        auditBase: getMessageAuditBase(),
        phase: 'session-run-visibility',
      });
      throwResourceNotVisible(ctx);
    }
  }

  const capabilities = getRecord(getModelValue(session, 'capabilitiesJson'));
  await auditAgentActionBestEffort(ctx, {
    ...getMessageAuditBase(),
    provider: getModelString(session, 'provider') || undefined,
    resultStatus: 'denied',
    metadataJson: {
      reason: 'unsupported-capability',
      liveSemanticMessage: capabilities.liveSemanticMessage === true,
      stdinMessage: capabilities.stdinMessage === true,
    },
  });
  ctx.throw(409, {
    code: 'AGENT_GATEWAY_ACTION_UNSUPPORTED',
    message: 'Agent session live message is not supported',
  });
}

export function registerAgentSessionRoutes(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (matchStandardCollectionAction(ctx.path, STANDARD_AGENT_SESSION_COLLECTIONS)) {
        await requireManagePermission(ctx);
      }

      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const upsertMatch = routePath.match(/^\/nodes\/([^/]+)\/runs\/([^/]+)\/agent-session:upsert$/);
      const resumeMatch = routePath.match(/^\/agent-sessions\/([^/]+)\/resume$/);
      const messageMatch = routePath.match(/^\/agent-sessions\/([^/]+)\/message$/);

      if (ctx.method === 'POST' && upsertMatch) {
        await upsertAgentSession(ctx, upsertMatch[1], upsertMatch[2]);
        return;
      }

      if (ctx.method === 'POST' && resumeMatch) {
        await resumeAgentSession(ctx, resumeMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && messageMatch) {
        await messageAgentSession(ctx, messageMatch[1]);
        return;
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
