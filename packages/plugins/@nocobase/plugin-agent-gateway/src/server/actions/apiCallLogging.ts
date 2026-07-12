/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';

import { createApiCallLogSummary, redactDaemonErrorSummary, redactText } from '../security';
import {
  AGENT_GATEWAY_API_ACTIONS,
  AGENT_GATEWAY_API_RESOURCE,
  AGENT_GATEWAY_MACHINE_API_ACTIONS,
  AgentGatewayApiAction,
} from '../../shared/apiContract';
import { getRecord, getString } from './utils';

const DAEMON_API_DIRECTION = 'daemon_to_nocobase';
const USER_API_DIRECTION = 'user_to_nocobase';
const API_LOG_PATH_MAX_CHARS = 240;
const API_LOG_FIELD_SUMMARY_MAX_CHARS = 1000;
const API_LOG_STRUCTURED_VALUE_MAX_CHARS = 4000;
const RESOURCE_API_PREFIXES = [`/api/${AGENT_GATEWAY_API_RESOURCE}:`, `/${AGENT_GATEWAY_API_RESOURCE}:`];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const API_LOG_OMITTED_KEY_FRAGMENTS = ['content', 'metadata', 'payload', 'prompt', 'snapshot'];
const LOGGED_API_ACTIONS = new Set<AgentGatewayApiAction>([
  ...AGENT_GATEWAY_MACHINE_API_ACTIONS,
  AGENT_GATEWAY_API_ACTIONS.resumeAgentSession,
  AGENT_GATEWAY_API_ACTIONS.messageAgentSession,
  AGENT_GATEWAY_API_ACTIONS.importExternalRun,
  AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations,
]);
const NODE_TARGET_API_ACTIONS = new Set<AgentGatewayApiAction>([
  AGENT_GATEWAY_API_ACTIONS.heartbeatNode,
  AGENT_GATEWAY_API_ACTIONS.claimRun,
  AGENT_GATEWAY_API_ACTIONS.createSmokeRun,
  AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall,
]);
const SESSION_TARGET_API_ACTIONS = new Set<AgentGatewayApiAction>([
  AGENT_GATEWAY_API_ACTIONS.resumeAgentSession,
  AGENT_GATEWAY_API_ACTIONS.messageAgentSession,
]);
const USER_API_ACTIONS = new Set<AgentGatewayApiAction>([
  ...SESSION_TARGET_API_ACTIONS,
  AGENT_GATEWAY_API_ACTIONS.importExternalRun,
  AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations,
]);

interface MatchedApiRoute {
  action: string;
  direction?: string;
  nodeId?: string;
  runId?: string;
  sessionId?: string;
}

interface ErrorWithStatus {
  status?: unknown;
  statusCode?: unknown;
  message?: unknown;
}

interface RequestContextWithId extends Context {
  reqId?: unknown;
}

function getErrorStatus(error: unknown) {
  const statusCarrier = error as ErrorWithStatus | null;
  const status = statusCarrier?.status || statusCarrier?.statusCode;
  return typeof status === 'number' ? status : 500;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return getString((error as ErrorWithStatus | null)?.message) || String(error);
}

function normalizeSummaryKey(key: string) {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getSerializedLength(value: unknown) {
  const serializedValue = JSON.stringify(value);
  return serializedValue ? serializedValue.length : 0;
}

function getValueType(value: unknown) {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

function getOmittedValueSummary(value: unknown, reason: string) {
  const summary: Record<string, unknown> = {
    omitted: true,
    reason,
    valueType: getValueType(value),
    charLength: getSerializedLength(value),
  };

  if (typeof value === 'string') {
    summary.byteLength = Buffer.byteLength(value);
  }
  if (Array.isArray(value)) {
    summary.itemCount = value.length;
  }
  if (isPlainObject(value)) {
    summary.keyCount = Object.keys(value).length;
  }

  return summary;
}

function shouldOmitBodyField(key: string) {
  const normalizedKey = normalizeSummaryKey(key);
  return API_LOG_OMITTED_KEY_FRAGMENTS.some((fragment) => normalizedKey.includes(fragment));
}

function summarizeApiLogValue(value: unknown, key?: string, depth = 0): unknown {
  if (key && shouldOmitBodyField(key)) {
    return getOmittedValueSummary(value, 'field_omitted');
  }

  if (typeof value === 'string') {
    return value.length > API_LOG_FIELD_SUMMARY_MAX_CHARS
      ? redactText(value, { maxStringLength: API_LOG_FIELD_SUMMARY_MAX_CHARS })
      : value;
  }

  if (Array.isArray(value)) {
    if (getSerializedLength(value) > API_LOG_STRUCTURED_VALUE_MAX_CHARS) {
      return getOmittedValueSummary(value, 'large_array');
    }
    return value.map((item) => summarizeApiLogValue(item, undefined, depth + 1));
  }

  if (isPlainObject(value)) {
    if (depth > 0 && getSerializedLength(value) > API_LOG_STRUCTURED_VALUE_MAX_CHARS) {
      return getOmittedValueSummary(value, 'large_object');
    }

    const summarizedValue: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(value)) {
      summarizedValue[entryKey] = summarizeApiLogValue(entryValue, entryKey, depth + 1);
    }
    return summarizedValue;
  }

  return value;
}

function getUuidForeignKey(value: unknown) {
  const stringValue = getString(value);
  return UUID_PATTERN.test(stringValue) ? stringValue : '';
}

function matchResourceApiRoute(pathname: string): MatchedApiRoute | null {
  const resourcePrefix = RESOURCE_API_PREFIXES.find((prefix) => pathname.startsWith(prefix));
  if (!resourcePrefix) {
    return null;
  }

  const [rawAction, rawTarget] = pathname.slice(resourcePrefix.length).split('/');
  const action = rawAction as AgentGatewayApiAction;
  if (!LOGGED_API_ACTIONS.has(action)) {
    return null;
  }
  const target = rawTarget ? decodeURIComponent(rawTarget) : undefined;
  return {
    action,
    direction: USER_API_ACTIONS.has(action) ? USER_API_DIRECTION : DAEMON_API_DIRECTION,
    ...(target && NODE_TARGET_API_ACTIONS.has(action) ? { nodeId: target } : {}),
    ...(target && SESSION_TARGET_API_ACTIONS.has(action) ? { sessionId: target } : {}),
    ...(target && !NODE_TARGET_API_ACTIONS.has(action) && !SESSION_TARGET_API_ACTIONS.has(action)
      ? { runId: target }
      : {}),
  };
}

function matchApiRoute(ctx: Context): MatchedApiRoute | null {
  if (ctx.method !== 'POST') {
    return null;
  }

  return matchResourceApiRoute(ctx.path);
}

function getBodyRecordValue(body: unknown, key: string) {
  const bodyRecord = getRecord(body);
  const value = bodyRecord[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function getStateNodeId(ctx: Context) {
  const subject = getRecord(ctx.state.agentGatewaySubject);
  const nodeId = subject.nodeId;
  return typeof nodeId === 'string' || typeof nodeId === 'number' ? String(nodeId) : '';
}

function getRequestId(ctx: Context) {
  const requestId = getString((ctx as RequestContextWithId).reqId) || getString(ctx.get('X-Request-Id'));
  return requestId ? redactText(requestId, { maxStringLength: 255 }) : null;
}

function getPersistedPath(ctx: Context, route: MatchedApiRoute) {
  let path = ctx.path;
  for (const routeValue of [route.nodeId, route.runId, route.sessionId]) {
    if (routeValue && !UUID_PATTERN.test(routeValue)) {
      path = path.replace(routeValue, '[REDACTED]');
    }
  }
  return redactText(path, { maxStringLength: API_LOG_PATH_MAX_CHARS });
}

async function writeApiCallLog(ctx: Context, route: MatchedApiRoute, startedAt: number, error?: unknown) {
  const durationMs = Date.now() - startedAt;
  const statusCode = error ? getErrorStatus(error) : ctx.status;
  const responseBody = error
    ? {
        error: getErrorMessage(error),
      }
    : ctx.body;
  const runId = getUuidForeignKey(route.runId) || getUuidForeignKey(getBodyRecordValue(ctx.body, 'runId')) || null;
  const nodeId =
    getUuidForeignKey(route.nodeId) ||
    getUuidForeignKey(getStateNodeId(ctx)) ||
    getUuidForeignKey(getBodyRecordValue(ctx.body, 'nodeId')) ||
    null;
  const persistedPath = getPersistedPath(ctx, route);
  const requestSummaryJson = {
    action: route.action,
    ...createApiCallLogSummary({
      method: ctx.method,
      path: persistedPath,
      headers: ctx.headers,
      query: ctx.query,
      body: summarizeApiLogValue(ctx.request.body),
    }),
  };
  const responseSummaryJson = createApiCallLogSummary({
    method: ctx.method,
    path: persistedPath,
    statusCode,
    durationMs,
    body: summarizeApiLogValue(responseBody),
  });

  await ctx.db.getRepository('agApiCallLogs').create({
    values: {
      runId,
      nodeId,
      direction: route.direction || DAEMON_API_DIRECTION,
      requestId: getRequestId(ctx),
      method: ctx.method,
      path: persistedPath,
      statusCode,
      durationMs,
      requestSummaryJson,
      responseSummaryJson,
      errorSummary: error ? redactDaemonErrorSummary(getErrorMessage(error)) : null,
    },
  });
}

async function safelyWriteApiCallLog(ctx: Context, route: MatchedApiRoute, startedAt: number, error?: unknown) {
  try {
    await writeApiCallLog(ctx, route, startedAt, error);
  } catch (logError) {
    ctx.logger.warn('Failed to write Agent Gateway API call log', {
      err: logError,
      method: ctx.method,
      path: getPersistedPath(ctx, route),
    });
  }
}

export function registerApiCallLogMiddleware(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      const route = matchApiRoute(ctx);
      if (!route) {
        await next();
        return;
      }

      const startedAt = Date.now();
      try {
        await next();
      } catch (error) {
        await safelyWriteApiCallLog(ctx, route, startedAt, error);
        throw error;
      }

      await safelyWriteApiCallLog(ctx, route, startedAt);
    },
    {
      tag: 'agentGatewayApiCallLogMiddleware',
      after: 'dataWrapping',
      before: 'agentGatewayNodeLifecycleRoutes',
    },
  );
}
