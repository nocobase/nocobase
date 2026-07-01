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

import { AGENT_GATEWAY_ACTIONS, authenticateNodeToken, redactEventPayload, redactObservabilityText } from '../security';
import {
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getArray,
  getBodyValues,
  getCurrentUserId,
  getModelJson,
  getModelString,
  getRecord,
  getString,
  getCurrentRoleNames,
  matchStandardCollectionAction,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';
import { validateRunLease } from './runLifecycle';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CONVERSATION_EVENTS_PER_BATCH = 100;
const MAX_CONTENT_TEXT_LENGTH = 8000;
const MAX_CONTENT_JSON_CHARS = 32 * 1024;
const STANDARD_CONVERSATION_COLLECTIONS = ['agAgentConversationEvents'] as const;

interface CollectionLike {
  hasField?(name: string): boolean;
  getField?(name: string): unknown;
}

interface DatabaseWithCollections {
  getCollection?(name: string): CollectionLike | undefined;
}

function serializeModel(model: ModelRecord) {
  return redactConversationEvent(getModelJson(model));
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

function redactConversationEvent(event: JsonRecord) {
  const contentJson =
    event.contentJson === undefined
      ? event.contentJson
      : getStoredContentJson(getString(event.eventType), getRecord(redactEventPayload(event.contentJson)));
  const commandContentText = getCommandEventContentText({
    ...event,
    contentJson,
  });
  return {
    ...event,
    contentText:
      commandContentText ||
      (typeof event.contentText === 'string' ? redactObservabilityText(event.contentText) : event.contentText),
    contentJson,
  };
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

function getContentText(ctx: Context, value: unknown) {
  const contentText = typeof value === 'string' ? value : '';
  if (contentText.length > MAX_CONTENT_TEXT_LENGTH) {
    ctx.throw(413, 'Conversation event contentText is too large');
  }
  return contentText ? redactObservabilityText(contentText) : null;
}

function getContentJson(ctx: Context, value: unknown): JsonRecord {
  const rawValue = value === undefined ? {} : value;
  const rawSerialized = JSON.stringify(rawValue) || '';
  if (rawSerialized.length > MAX_CONTENT_JSON_CHARS) {
    ctx.throw(413, 'Conversation event contentJson is too large');
  }

  const redactedValue = getRecord(redactEventPayload(rawValue));
  const redactedSerialized = JSON.stringify(redactedValue) || '';
  if (redactedSerialized.length > MAX_CONTENT_JSON_CHARS) {
    ctx.throw(413, 'Conversation event contentJson is too large');
  }
  return redactedValue;
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
  if (!eventType.startsWith('agent.command.')) {
    return contentJson;
  }

  const stored: JsonRecord = {};
  const status = getString(contentJson.status);
  if (status) {
    stored.status = status;
  }

  const exitCode = getOptionalInteger(contentJson.exitCode ?? contentJson.exit_code);
  if (exitCode !== null) {
    stored.exitCode = exitCode;
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
  return getContentText(ctx, rawEvent.contentText || rawEvent.message);
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
    AGENT_GATEWAY_ACTIONS.readRunDetails,
    'Agent Gateway run detail read permission required',
  );
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readSessionMessages,
    'Agent Gateway session message read permission required',
  );
}

async function assertSessionReadableViaRun(ctx: Context, sessionId: string) {
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

  const run = (await ctx.db.getRepository('agRuns').findOne({
    filter,
    sort: ['-createdAt'],
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, 'Agent session run not found');
  }
  return run;
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

async function createConversationEvent(
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
  const redactedContentJson = getContentJson(ctx, rawEvent.contentJson || rawEvent.payloadJson || rawEvent.payload);
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

async function appendConversationEvents(ctx: Context, runId: string) {
  const values = getBodyValues(ctx);
  const auth = await authenticateNodeToken(ctx);
  const nodeId = String(auth.subject.nodeId);

  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction);
    if (!lease) {
      return null;
    }

    const events = [];
    for (const rawEvent of getEventEntries(ctx)) {
      events.push(await createConversationEvent(ctx, lease.run, runId, rawEvent, transaction));
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

async function listSessionConversationEvents(ctx: Context, sessionId: string) {
  await requireConversationRead(ctx);
  await assertSessionExists(ctx, sessionId);
  await assertSessionReadableViaRun(ctx, sessionId);

  const events = (await ctx.db.getRepository('agAgentConversationEvents').find({
    filter: {
      sessionId,
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
