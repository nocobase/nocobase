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
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getModelJson,
  getModelString,
  getModelTargetKey,
  getRecord,
  getString,
  matchStandardCollectionAction,
  requireManagePermission,
} from './utils';
import { validateRunLease } from './runLifecycle';

const AGENT_SESSION_STATUSES = new Set(['active', 'idle', 'ended', 'unknown']);
const AGENT_SESSION_PROVIDERS = new Set(['codex', 'opencode', 'claude-code']);
const STANDARD_AGENT_SESSION_COLLECTIONS = ['agAgentSessions'] as const;
const ROOT_RUN_RESOLUTION_MAX_DEPTH = 50;

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

      if (ctx.method === 'POST' && upsertMatch) {
        await upsertAgentSession(ctx, upsertMatch[1], upsertMatch[2]);
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
