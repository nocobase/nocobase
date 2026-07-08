/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction, UniqueConstraintError } from 'sequelize';

import { AGENT_GATEWAY_ACTIONS, authenticateNodeToken } from '../security';
import { AgentTranscriptEvent, buildAgentTranscript, getAgentTranscriptToolStats } from '../../shared/agentTranscript';
import { COMMAND_CONTENT_JSON_LIMIT_CHARS, COMMAND_DETAIL_STRING_LIMIT_CHARS } from '../../shared/conversationLimits';
import {
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getArray,
  getBodyValues,
  getCurrentUserId,
  getModelJson,
  getModelString,
  getModelTargetKey,
  getRecord,
  getString,
  getCurrentRoleNames,
  hasModelGetter,
  matchStandardCollectionAction,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';
import { validateRunLease } from './runLifecycle';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CONVERSATION_EVENTS_PER_BATCH = 100;
const MAX_CONTENT_TEXT_LENGTH = 8000;
const MAX_CONTENT_JSON_CHARS = 32 * 1024;
const TOOL_CALL_STATS_DEFAULT_RUN_LIMIT = 100;
const TOOL_CALL_STATS_MAX_RUN_LIMIT = 500;
const STANDARD_CONVERSATION_COLLECTIONS = ['agAgentConversationEvents'] as const;
const CONVERSATION_WRITE_RUN_STATUSES = ['claimed', 'syncing_skills', 'running', 'finalizing', 'stalled'] as const;
const ACTIVE_RUN_STATUSES = new Set([
  'queued',
  'claimed',
  'syncing_skills',
  'running',
  'finalizing',
  'canceling',
  'stalled',
]);
const DANGLING_TOOL_LIVE_RUN_STATUSES = new Set([
  'queued',
  'claimed',
  'syncing_skills',
  'running',
  'finalizing',
  'canceling',
]);

interface CollectionLike {
  hasField?(name: string): boolean;
  getField?(name: string): unknown;
}

interface DatabaseWithCollections {
  getCollection?(name: string): CollectionLike | undefined;
}

function serializeModel(model: ModelRecord): JsonRecord {
  const event = getModelJson(model);
  const eventType = getString(event.eventType);
  const contentJson =
    event.contentJson === undefined ? event.contentJson : getStoredContentJson(eventType, getRecord(event.contentJson));
  const commandContentText = getCommandEventContentText({
    ...event,
    contentJson,
  });
  return {
    ...event,
    contentText: commandContentText || event.contentText,
    contentJson,
  };
}

function toTranscriptEvent(event: JsonRecord): AgentTranscriptEvent {
  const sequence = getOptionalInteger(event.sequence);
  return {
    id: getString(event.id),
    source: getString(event.source) || undefined,
    sequence: sequence ?? undefined,
    eventType: getString(event.eventType) || undefined,
    providerEventId: getString(event.providerEventId) || null,
    correlationId: getString(event.correlationId) || null,
    contentText: typeof event.contentText === 'string' ? event.contentText : null,
    contentJson: getRecord(event.contentJson),
    createdAt: getString(event.createdAt) || undefined,
  };
}

function toTranscriptEvents(events: JsonRecord[]) {
  return events.map(toTranscriptEvent).filter((event) => event.id);
}

function shouldCloseDanglingToolCalls(run: ModelRecord | JsonRecord) {
  const status = hasModelGetter(run) ? getModelString(run, 'status') : getString(run.status);
  return !DANGLING_TOOL_LIVE_RUN_STATUSES.has(status);
}

function getCommandEventContentText(event: JsonRecord) {
  const eventType = getString(event.eventType);
  if (eventType === 'agent.command.started') {
    return 'Command started';
  }
  if (eventType === 'agent.command.failed') {
    return 'Command failed';
  }
  if (eventType === 'agent.command.completed') {
    const contentJson = getRecord(event.contentJson);
    const exitCode = getOptionalInteger(contentJson.exitCode ?? contentJson.exit_code);
    return getString(contentJson.status) === 'failed' || (exitCode !== null && exitCode !== 0)
      ? 'Command failed'
      : 'Command completed';
  }
  return null;
}

function isDetailedToolEvent(eventType: string) {
  return eventType.startsWith('agent.command.') || eventType.startsWith('agent.tool.');
}

function isVerboseTranscriptEvent(eventType: string) {
  return (
    eventType === 'agent.message' ||
    eventType === 'agent.reasoning' ||
    eventType === 'agent.progress' ||
    eventType === 'agent.raw'
  );
}

function getRequiredString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (!stringValue) {
    ctx.throw(400, `${name} is required`);
  }
  return stringValue;
}

function getRequiredNonNegativeInteger(ctx: Context, value: unknown, name: string) {
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

function getOptionalConfidence(ctx: Context, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0 || numberValue > 1) {
    ctx.throw(400, 'confidence must be a number between 0 and 1');
  }
  return numberValue;
}

function getContentText(ctx: Context, value: unknown, maxLength = MAX_CONTENT_TEXT_LENGTH) {
  const contentText = typeof value === 'string' ? value : '';
  if (contentText.length > maxLength) {
    ctx.throw(413, 'Conversation event contentText is too large');
  }
  return contentText || null;
}

function getContentJson(ctx: Context, value: unknown): JsonRecord {
  const rawValue = value === undefined ? {} : value;
  const rawSerialized = JSON.stringify(rawValue) || '';
  if (rawSerialized.length > MAX_CONTENT_JSON_CHARS) {
    ctx.throw(413, 'Conversation event contentJson is too large');
  }

  return getRecord(rawValue);
}

function truncateCommandDetailValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length <= COMMAND_DETAIL_STRING_LIMIT_CHARS) {
      return value;
    }
    return value.slice(0, COMMAND_DETAIL_STRING_LIMIT_CHARS);
  }
  if (Array.isArray(value)) {
    return value.map((item) => truncateCommandDetailValue(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const record: JsonRecord = {};
  for (const [key, entryValue] of Object.entries(value)) {
    record[key] = truncateCommandDetailValue(entryValue);
  }
  return record;
}

function copyDetailField(stored: JsonRecord, key: string, value: unknown, targetKey = key) {
  stored[targetKey] = truncateCommandDetailValue(value);
  if (typeof value === 'string' && value.length > COMMAND_DETAIL_STRING_LIMIT_CHARS) {
    stored[`${targetKey}Truncated`] = true;
    stored[`${targetKey}OriginalLength`] = value.length;
  }
}

function getDetailedToolContentJson(ctx: Context, eventType: string, value: unknown): JsonRecord {
  const storedContentJson = getStoredContentJson(eventType, getRecord(value));
  const storedSerialized = JSON.stringify(storedContentJson) || '';
  if (storedSerialized.length > COMMAND_CONTENT_JSON_LIMIT_CHARS) {
    ctx.throw(413, 'Conversation event tool details are too large');
  }
  return storedContentJson;
}

function getIncomingContentJson(ctx: Context, eventType: string, value: unknown) {
  if (isDetailedToolEvent(eventType) || isVerboseTranscriptEvent(eventType)) {
    return getDetailedToolContentJson(ctx, eventType, value);
  }
  return getContentJson(ctx, value);
}

function getOptionalInteger(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }
  return Number(trimmed);
}

function getStoredContentJson(eventType: string, contentJson: JsonRecord): JsonRecord {
  if (!isDetailedToolEvent(eventType) && !isVerboseTranscriptEvent(eventType)) {
    return contentJson;
  }

  const stored: JsonRecord = {};
  for (const [key, value] of Object.entries(contentJson)) {
    copyDetailField(stored, key, value);
  }

  const status = getString(contentJson.status);
  if (status) {
    stored.status = status;
  }

  const exitCode = getOptionalInteger(contentJson.exitCode ?? contentJson.exit_code);
  if (exitCode !== null) {
    stored.exitCode = exitCode;
  }

  if (!Object.prototype.hasOwnProperty.call(stored, 'durationMs')) {
    const durationMs = getOptionalInteger(contentJson.duration_ms);
    if (durationMs !== null) {
      stored.durationMs = durationMs;
    }
  }

  return stored;
}

function getStoredContentText(ctx: Context, rawEvent: JsonRecord, eventType: string, contentJson: JsonRecord) {
  const commandContentText = getCommandEventContentText({
    ...rawEvent,
    eventType,
    contentJson,
  });
  if (commandContentText) {
    return commandContentText;
  }
  return getContentText(
    ctx,
    rawEvent.contentText || rawEvent.message,
    isVerboseTranscriptEvent(eventType) ? COMMAND_DETAIL_STRING_LIMIT_CHARS : MAX_CONTENT_TEXT_LENGTH,
  );
}

function getEventEntries(ctx: Context) {
  const values = getBodyValues(ctx);
  const rawEvents = getArray(values.events);
  const entries = rawEvents.length ? rawEvents : [values];
  if (entries.length > MAX_CONVERSATION_EVENTS_PER_BATCH) {
    ctx.throw(413, 'Too many conversation events in one batch');
  }
  return entries.map((entry) => getRecord(entry));
}

async function assertRunReadable(ctx: Context, runId: string, transaction?: Transaction) {
  const visibilityFilter = await getRunVisibilityFilter(ctx);
  const filter = visibilityFilter
    ? {
        $and: [
          {
            id: runId,
          },
          visibilityFilter,
        ],
      }
    : {
        id: runId,
      };
  const run = (await ctx.db.getRepository('agRuns').findOne({
    filter,
    transaction,
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, 'Run not found');
  }
  return run;
}

async function assertSessionExists(ctx: Context, sessionId: string) {
  const session = (await ctx.db.getRepository('agAgentSessions').findOne({
    filterByTk: sessionId,
  })) as ModelRecord | null;
  if (!session) {
    ctx.throw(404, 'Agent session not found');
  }
  return session;
}

async function requireConversationRead(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readSessionMessages,
    'Agent Gateway session message read permission required',
  );
}

async function findReadableSessionRunIds(ctx: Context, sessionId: string) {
  const visibilityFilter = await getRunVisibilityFilter(ctx);
  const filter = visibilityFilter
    ? {
        $and: [
          {
            agentSessionId: sessionId,
          },
          visibilityFilter,
        ],
      }
    : {
        agentSessionId: sessionId,
      };

  const runs = (await ctx.db.getRepository('agRuns').find({
    filter,
    sort: ['-createdAt'],
  })) as ModelRecord[];
  const runIds = runs.map((run) => String(getModelTargetKey(run, 'id')));
  if (!runIds.length) {
    ctx.throw(404, 'Agent session run not found');
  }
  return runIds;
}

function getToolCallStatsRunLimit(ctx: Context) {
  const rawLimit = getString(getRecord(ctx.query).limit);
  const limit = rawLimit ? Number(rawLimit) : TOOL_CALL_STATS_DEFAULT_RUN_LIMIT;
  if (!Number.isInteger(limit) || limit <= 0) {
    ctx.throw(400, 'limit must be a positive integer');
  }
  return Math.min(limit, TOOL_CALL_STATS_MAX_RUN_LIMIT);
}

function getCollection(ctx: Context, collectionName: string) {
  const collection = (ctx.db as unknown as DatabaseWithCollections).getCollection?.(collectionName);
  if (!collection) {
    ctx.throw(400, `Collection not found: ${collectionName}`);
  }
  return collection;
}

async function getRunVisibilityFilter(ctx: Context) {
  const roles = await getCurrentRoleNames(ctx);
  const permission = ctx.app.acl.can({
    roles,
    resource: 'agRuns',
    action: 'get',
  });

  if (!permission || typeof permission !== 'object') {
    ctx.throw(403, 'Agent Gateway run detail read permission required');
  }

  const params = getRecord(permission.params);
  const rawFilter = params.filter;
  if (rawFilter === undefined || rawFilter === null) {
    return null;
  }

  const collection = getCollection(ctx, 'agRuns');
  try {
    checkFilterParams(collection, rawFilter);
  } catch (error) {
    if (error instanceof NoPermissionError) {
      ctx.throw(403, 'Agent Gateway run detail read permission required');
    }
    throw error;
  }

  const parsedParams = getRecord(
    await parseJsonTemplate(params, {
      state: ctx.state,
      timezone: ctx.get('x-timezone'),
      userProvider: createUserProvider({
        db: ctx.db,
        currentUser: ctx.state.currentUser,
      }),
    }),
  );
  const parsedFilter = getRecord(parsedParams.filter);
  return Object.keys(parsedFilter).length ? parsedFilter : null;
}

async function findExistingConversationEvent(
  ctx: Context,
  values: { runId: string; source: string; providerEventId: string | null; sequence: number },
  transaction: Transaction,
) {
  const repo = ctx.db.getRepository('agAgentConversationEvents');
  const filter = values.providerEventId
    ? {
        runId: values.runId,
        source: values.source,
        providerEventId: values.providerEventId,
      }
    : {
        runId: values.runId,
        source: values.source,
        sequence: values.sequence,
      };

  return (await repo.findOne({
    filter,
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
}

export async function createConversationEvent(
  ctx: Context,
  run: ModelRecord,
  runId: string,
  rawEvent: JsonRecord,
  transaction: Transaction,
) {
  const source = getRequiredString(ctx, rawEvent.source, 'source');
  const sequence = getRequiredNonNegativeInteger(ctx, rawEvent.sequence, 'sequence');
  const providerEventId = getString(rawEvent.providerEventId) || null;
  const runSessionId = getModelString(run, 'agentSessionId') || null;
  const suppliedSessionId = getString(rawEvent.sessionId) || null;
  if (suppliedSessionId && suppliedSessionId !== runSessionId) {
    ctx.throw(400, 'sessionId must match the leased run');
  }
  const existingEvent = await findExistingConversationEvent(
    ctx,
    {
      runId,
      source,
      providerEventId,
      sequence,
    },
    transaction,
  );
  if (existingEvent) {
    return {
      ...serializeModel(existingEvent),
      idempotent: true,
    };
  }

  const eventType = getRequiredString(ctx, rawEvent.eventType || rawEvent.type, 'eventType');
  const redactedContentJson = getIncomingContentJson(
    ctx,
    eventType,
    rawEvent.contentJson || rawEvent.payloadJson || rawEvent.payload,
  );
  const storedContentJson = getStoredContentJson(eventType, redactedContentJson);
  let event: ModelRecord;
  try {
    event = (await ctx.db.getRepository('agAgentConversationEvents').create({
      values: {
        id: randomUUID(),
        sessionId: runSessionId,
        runId,
        sequence,
        eventType,
        source,
        providerEventId,
        correlationId: getString(rawEvent.correlationId) || null,
        confidence: getOptionalConfidence(ctx, rawEvent.confidence),
        contentText: getStoredContentText(ctx, rawEvent, eventType, storedContentJson),
        contentJson: storedContentJson,
        createdById: getCurrentUserId(ctx),
      },
      transaction,
    })) as ModelRecord;
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) {
      throw error;
    }
    const concurrentEvent = await findExistingConversationEvent(
      ctx,
      {
        runId,
        source,
        providerEventId,
        sequence,
      },
      transaction,
    );
    if (!concurrentEvent) {
      throw error;
    }
    return {
      ...serializeModel(concurrentEvent),
      idempotent: true,
    };
  }

  return {
    ...serializeModel(event),
    idempotent: false,
  };
}

async function touchRunTerminalLastActivity(ctx: Context, runId: string, transaction: Transaction) {
  await ctx.db.getRepository('agRuns').update({
    filterByTk: runId,
    values: {
      terminalLastActivityAt: new Date(),
    },
    transaction,
  });
}

async function appendConversationEvents(ctx: Context, runId: string) {
  const values = getBodyValues(ctx);
  const auth = await authenticateNodeToken(ctx);
  const nodeId = String(auth.subject.nodeId);

  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowExpiredLeaseStatuses: ['finalizing', 'stalled'],
      allowStaleLeaseVersion: true,
      allowedStatuses: CONVERSATION_WRITE_RUN_STATUSES,
    });
    if (!lease) {
      return null;
    }

    const events = [];
    for (const rawEvent of getEventEntries(ctx)) {
      events.push(await createConversationEvent(ctx, lease.run, runId, rawEvent, transaction));
    }
    if (events.some((event) => event.idempotent !== true)) {
      await touchRunTerminalLastActivity(ctx, runId, transaction);
    }

    return {
      events,
    };
  });

  if (result) {
    ctx.body = result;
  }
}

async function listRunConversationEvents(ctx: Context, runId: string) {
  await requireConversationRead(ctx);
  await assertRunReadable(ctx, runId);

  const events = (await ctx.db.getRepository('agAgentConversationEvents').find({
    filter: {
      runId,
    },
    sort: ['createdAt', 'sequence'],
  })) as ModelRecord[];

  ctx.body = events.map(serializeModel);
}

async function listRunToolCalls(ctx: Context, runId: string) {
  await requireConversationRead(ctx);
  const run = await assertRunReadable(ctx, runId);

  const events = (await ctx.db.getRepository('agAgentConversationEvents').find({
    filter: {
      runId,
    },
    sort: ['createdAt', 'sequence'],
  })) as ModelRecord[];
  const serializedEvents = events.map(serializeModel);
  const transcript = buildAgentTranscript(toTranscriptEvents(serializedEvents), {
    closeDanglingToolCalls: shouldCloseDanglingToolCalls(run),
  });

  ctx.body = {
    toolCalls: transcript.toolCalls,
    stats: transcript.stats,
  };
}

async function listToolCallStats(ctx: Context) {
  await requireConversationRead(ctx);
  const limit = getToolCallStatsRunLimit(ctx);
  const visibilityFilter = await getRunVisibilityFilter(ctx);

  const runs = (await ctx.db.getRepository('agRuns').find({
    filter: visibilityFilter || {},
    sort: ['-createdAt'],
    limit,
  })) as ModelRecord[];
  const runIds = runs.map((run) => String(getModelTargetKey(run, 'id')));
  if (!runIds.length) {
    ctx.body = {
      runCount: 0,
      toolCallCount: 0,
      stats: buildAgentTranscript([]).stats,
      runs: [],
    };
    return;
  }

  const events = (await ctx.db.getRepository('agAgentConversationEvents').find({
    filter: {
      runId: {
        $in: runIds,
      },
    },
    sort: ['runId', 'createdAt', 'sequence'],
  })) as ModelRecord[];
  const eventsByRunId = new Map<string, JsonRecord[]>();
  const serializedEvents = events.map(serializeModel);
  for (const event of serializedEvents) {
    const eventRunId = getString(event.runId);
    if (!eventRunId) {
      continue;
    }
    const runEvents = eventsByRunId.get(eventRunId) || [];
    runEvents.push(event);
    eventsByRunId.set(eventRunId, runEvents);
  }

  const runSummaries = runs.map((run) => {
    const runId = String(getModelTargetKey(run, 'id'));
    const transcript = buildAgentTranscript(toTranscriptEvents(eventsByRunId.get(runId) || []), {
      closeDanglingToolCalls: shouldCloseDanglingToolCalls(run),
    });
    return {
      runId,
      runCode: getModelString(run, 'runCode'),
      status: getModelString(run, 'status'),
      toolCallCount: transcript.toolCalls.length,
      stats: transcript.stats,
    };
  });
  const allToolCalls = runSummaries.flatMap((summary) =>
    (eventsByRunId.get(summary.runId)
      ? buildAgentTranscript(toTranscriptEvents(eventsByRunId.get(summary.runId) || []), {
          closeDanglingToolCalls: !DANGLING_TOOL_LIVE_RUN_STATUSES.has(summary.status),
        }).toolCalls
      : []
    ).map((toolCall) => ({
      ...toolCall,
      runId: summary.runId,
      runCode: summary.runCode,
    })),
  );
  const aggregateStats = getAgentTranscriptToolStats(allToolCalls);

  ctx.body = {
    runCount: runs.length,
    toolCallCount: allToolCalls.length,
    stats: aggregateStats,
    runs: runSummaries,
    toolCalls: allToolCalls,
  };
}

async function listSessionConversationEvents(ctx: Context, sessionId: string) {
  await requireConversationRead(ctx);
  await assertSessionExists(ctx, sessionId);
  const readableRunIds = await findReadableSessionRunIds(ctx, sessionId);

  const events = (await ctx.db.getRepository('agAgentConversationEvents').find({
    filter: {
      sessionId,
      runId: {
        $in: readableRunIds,
      },
    },
    sort: ['createdAt', 'sequence'],
  })) as ModelRecord[];

  ctx.body = events.map(serializeModel);
}

export function registerConversationEventRoutes(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (matchStandardCollectionAction(ctx.path, STANDARD_CONVERSATION_COLLECTIONS)) {
        await requireManagePermission(ctx);
        await next();
        return;
      }

      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const appendMatch = routePath.match(/^\/runs\/([^/]+)\/conversation-events:append$/);
      const runListMatch = routePath.match(/^\/runs\/([^/]+)\/conversation-events:list$/);
      const runToolCallsMatch = routePath.match(/^\/runs\/([^/]+)\/tool-calls:list$/);
      const sessionListMatch = routePath.match(/^\/agent-sessions\/([^/]+)\/conversation-events:list$/);

      if (ctx.method === 'POST' && appendMatch) {
        const [, runId] = appendMatch;
        if (!UUID_PATTERN.test(runId)) {
          ctx.throw(400, 'runId must be a valid UUID');
        }
        await appendConversationEvents(ctx, runId);
        return;
      }

      if (ctx.method === 'GET' && runListMatch) {
        const [, runId] = runListMatch;
        if (!UUID_PATTERN.test(runId)) {
          ctx.throw(400, 'runId must be a valid UUID');
        }
        await listRunConversationEvents(ctx, runId);
        return;
      }

      if (ctx.method === 'GET' && runToolCallsMatch) {
        const [, runId] = runToolCallsMatch;
        if (!UUID_PATTERN.test(runId)) {
          ctx.throw(400, 'runId must be a valid UUID');
        }
        await listRunToolCalls(ctx, runId);
        return;
      }

      if (ctx.method === 'GET' && routePath === '/tool-calls:stats') {
        await listToolCallStats(ctx);
        return;
      }

      if (ctx.method === 'GET' && sessionListMatch) {
        const [, sessionId] = sessionListMatch;
        if (!UUID_PATTERN.test(sessionId)) {
          ctx.throw(400, 'sessionId must be a valid UUID');
        }
        await listSessionConversationEvents(ctx, sessionId);
        return;
      }

      await next();
    },
    {
      tag: 'agentGatewayConversationEventRoutes',
      after: 'agentGatewayAgentSessionRoutes',
      before: 'dataSource',
    },
  );
}
