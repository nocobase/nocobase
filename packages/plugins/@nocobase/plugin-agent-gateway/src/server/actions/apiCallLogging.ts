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
import { API_PREFIX, getRecord, getString } from './utils';

const DAEMON_API_DIRECTION = 'daemon_to_nocobase';
const API_LOG_PATH_MAX_CHARS = 240;
const API_LOG_FIELD_SUMMARY_MAX_CHARS = 1000;
const API_LOG_STRUCTURED_VALUE_MAX_CHARS = 4000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const API_LOG_OMITTED_KEY_FRAGMENTS = ['content', 'metadata', 'payload', 'prompt', 'snapshot'];

interface MatchedDaemonRoute {
  action: string;
  nodeId?: string;
  runId?: string;
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

function matchDaemonRoute(ctx: Context): MatchedDaemonRoute | null {
  if (ctx.method !== 'POST' || !ctx.path.startsWith(API_PREFIX)) {
    return null;
  }

  const routePath = ctx.path.slice(API_PREFIX.length);
  if (routePath === '/nodes:register') {
    return {
      action: 'register',
    };
  }

  const nodeHeartbeatMatch = routePath.match(/^\/nodes\/([^/]+)\/heartbeat$/);
  if (nodeHeartbeatMatch) {
    return {
      action: 'node-heartbeat',
      nodeId: nodeHeartbeatMatch[1],
    };
  }

  const claimMatch = routePath.match(/^\/nodes\/([^/]+)\/runs:claim$/);
  if (claimMatch) {
    return {
      action: 'claim',
      nodeId: claimMatch[1],
    };
  }

  const smokeCreateMatch = routePath.match(/^\/nodes\/([^/]+)\/smoke-runs:create$/);
  if (smokeCreateMatch) {
    return {
      action: 'smoke-runs:create',
      nodeId: smokeCreateMatch[1],
    };
  }

  const skillInstallMatch = routePath.match(/^\/nodes\/([^/]+)\/skill-installs:upsert$/);
  if (skillInstallMatch) {
    return {
      action: 'skill-installs:upsert',
      nodeId: skillInstallMatch[1],
    };
  }

  const agentSessionUpsertMatch = routePath.match(/^\/nodes\/([^/]+)\/runs\/([^/]+)\/agent-session:upsert$/);
  if (agentSessionUpsertMatch) {
    return {
      action: 'agent-session:upsert',
      nodeId: agentSessionUpsertMatch[1],
      runId: agentSessionUpsertMatch[2],
    };
  }

  const runNodeActionMatch = routePath.match(
    /^\/nodes\/([^/]+)\/runs\/([^/]+)\/(heartbeat|complete|fail|timeout|cancel-ack)$/,
  );
  if (runNodeActionMatch) {
    return {
      action: `run-${runNodeActionMatch[3]}`,
      nodeId: runNodeActionMatch[1],
      runId: runNodeActionMatch[2],
    };
  }

  const runSkipMatch = routePath.match(/^\/nodes\/([^/]+)\/runs\/([^/]+)\/skip$/);
  if (runSkipMatch) {
    return {
      action: 'run-skip',
      nodeId: runSkipMatch[1],
      runId: runSkipMatch[2],
    };
  }

  const runObservationMatch = routePath.match(
    /^\/runs\/([^/]+)\/(events:append|artifacts:register|snapshots:register)$/,
  );
  if (runObservationMatch) {
    return {
      action: runObservationMatch[2],
      runId: runObservationMatch[1],
    };
  }

  return null;
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

function getPersistedPath(ctx: Context, route: MatchedDaemonRoute) {
  let path = ctx.path;
  for (const routeValue of [route.nodeId, route.runId]) {
    if (routeValue && !UUID_PATTERN.test(routeValue)) {
      path = path.replace(routeValue, '[REDACTED]');
    }
  }
  return redactText(path, { maxStringLength: API_LOG_PATH_MAX_CHARS });
}

async function writeApiCallLog(ctx: Context, route: MatchedDaemonRoute, startedAt: number, error?: unknown) {
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
      direction: DAEMON_API_DIRECTION,
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

async function safelyWriteApiCallLog(ctx: Context, route: MatchedDaemonRoute, startedAt: number, error?: unknown) {
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
      const route = matchDaemonRoute(ctx);
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
