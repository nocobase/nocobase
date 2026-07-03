/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFileSync } from 'fs';

import WebSocket from 'ws';

import {
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_AUTH_PROOF_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROOF_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
  TERMINAL_STREAM_WS_PATH,
} from '../src/shared/terminalStreamProtocol';
import {
  JsonRecord,
  getListItems,
  getString,
  parseAdminFlags,
  requestJson,
} from './terminal-stream-smoke-script-utils';

type DenialAction =
  | 'dispatch'
  | 'resume'
  | 'cancel'
  | 'interrupt'
  | 'terminate'
  | 'message'
  | 'raw-write'
  | 'raw-write-legacy'
  | 'raw-write-ws-aliases'
  | 'terminal'
  | 'artifacts'
  | 'raw-logs'
  | 'session-messages'
  | 'run-details'
  | 'hidden-run';

interface DenialArgs {
  baseUrl: string;
  email: string;
  password: string;
  runId: string;
  hiddenRunId: string;
  sessionId: string;
  dispatchBindingId: string;
  dispatchCollection: string;
  dispatchRecordId: string;
  actions: DenialAction[];
  expectDenied: boolean;
  expectNoControlRequest: boolean;
  adminEmail?: string;
  adminPassword?: string;
  expectedAccess: ExpectedAccessEntry[];
}

interface RawResult {
  status: number;
  body: unknown;
  text: string;
}

interface AttemptResult {
  action: string;
  routeOrFrame: string;
  httpStatus: number;
  expectedHttpStatus?: number;
  responseErrorCode?: string;
  expectedApplicationErrorCode?: string | null;
  expectedAuditAction?: string;
  expectedAuditStatus?: string;
  auditExpected?: boolean;
  auditFilter?: JsonRecord;
  auditCountBefore?: number | null;
  auditCountAfter?: number | null;
  auditCheck?: string;
  controlRequestCount?: number | null;
  controlRequestCheck?: string;
  dispatchRunCountBefore?: number | null;
  dispatchRunCountAfter?: number | null;
  dispatchRunCheck?: string;
  sensitiveDataAppeared: boolean;
}

interface ExpectedAccessEntry {
  userEmail: string;
  action: string;
  target?: string;
  expectedHttpStatus: number;
  expectedApplicationErrorCode?: string | null;
  auditExpected?: boolean;
  controlRequestCountMustRemainZero?: boolean;
  dispatchRunCreationMustRemainZero?: boolean;
}

interface AuditMarker {
  count: number;
  latestKey: string;
}

const ACTIONS = new Set<DenialAction>([
  'dispatch',
  'resume',
  'cancel',
  'interrupt',
  'terminate',
  'message',
  'raw-write',
  'raw-write-legacy',
  'raw-write-ws-aliases',
  'terminal',
  'artifacts',
  'raw-logs',
  'session-messages',
  'run-details',
  'hidden-run',
]);

const CONTROL_ACTIONS = new Set(['interrupt', 'terminate']);
const SENSITIVE_PATTERNS = [/ag_(?:node|claim|stream|inv)_[A-Za-z0-9._~+/-]+=*/i, /password=/i, /SECRET/];
const RAW_WRITE_WS_FRAME_TYPES = ['browser.input', 'browser.write', 'terminal.input', 'terminal.write'] as const;

function encodeWebSocketProtocolValue(value?: string) {
  if (!value) {
    return '';
  }
  return Buffer.from(value, 'utf8').toString('base64url');
}

function buildBrowserStreamProtocols(options: {
  ticket: string;
  ticketProof: string;
  authProof?: string;
  authenticator?: string;
  role?: string;
}) {
  const protocols = [
    TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
    `${TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(options.ticket)}`,
    `${TERMINAL_STREAM_BROWSER_TICKET_PROOF_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(options.ticketProof)}`,
    `${TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(
      options.authenticator || 'basic',
    )}`,
  ];
  if (options.authProof) {
    protocols.push(
      `${TERMINAL_STREAM_BROWSER_AUTH_PROOF_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(options.authProof)}`,
    );
  }
  if (options.role) {
    protocols.push(`${TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(options.role)}`);
  }
  return protocols;
}

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArgs(argv: string[]): DenialArgs {
  const { flags, booleanFlags } = parseAdminFlags(argv);
  const baseUrl = getString(flags['base-url']).replace(/\/$/, '');
  const email = getString(flags.email);
  const password = getString(flags.password);
  const runId = getString(flags['run-id']);
  const hiddenRunId = getString(flags['hidden-run-id']);
  const sessionId = getString(flags['session-id']);
  const dispatchBindingId = getString(flags['dispatch-binding-id']);
  const dispatchCollection = getString(flags['dispatch-collection']);
  const dispatchRecordId = getString(flags['dispatch-record-id']);
  const expectedAccess = parseExpectedAccess(flags);
  const actions = splitCsv(getString(flags.actions)).map((action) => {
    if (!ACTIONS.has(action as DenialAction)) {
      throw new Error(`Unsupported --actions entry: ${action}`);
    }
    return action as DenialAction;
  });
  if (!baseUrl || !email || !password || !runId || !sessionId || !actions.length) {
    throw new Error('--base-url, --email, --password, --run-id, --session-id, and --actions are required');
  }
  return {
    baseUrl,
    email,
    password,
    runId,
    hiddenRunId,
    sessionId,
    dispatchBindingId,
    dispatchCollection,
    dispatchRecordId,
    actions,
    expectDenied: booleanFlags.has('expect-denied'),
    expectNoControlRequest: booleanFlags.has('expect-no-control-request'),
    adminEmail: getString(flags['admin-email']) || undefined,
    adminPassword: getString(flags['admin-password']) || undefined,
    expectedAccess,
  };
}

function parseExpectedAccess(flags: Record<string, string>): ExpectedAccessEntry[] {
  const expectedAccessJson = getString(flags['expected-access-json']);
  const expectedAccessFile = getString(flags['expected-access-file']);
  const rawValue = expectedAccessFile ? readFileSync(expectedAccessFile, 'utf8') : expectedAccessJson;
  if (!rawValue) {
    return [];
  }
  const parsed = JSON.parse(rawValue) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('--expected-access-json/--expected-access-file must contain a JSON array');
  }
  return parsed.map((entry) => {
    const record = getRecord(entry);
    const userEmail = getString(record.userEmail);
    const action = getString(record.action);
    const expectedHttpStatus = Number(record.expectedHttpStatus);
    if (!userEmail || !action || !Number.isInteger(expectedHttpStatus)) {
      throw new Error(`Invalid expected access entry: ${JSON.stringify(entry)}`);
    }
    return {
      userEmail,
      action,
      target: getString(record.target) || undefined,
      expectedHttpStatus,
      expectedApplicationErrorCode:
        record.expectedApplicationErrorCode === null ? null : getString(record.expectedApplicationErrorCode),
      auditExpected: Object.prototype.hasOwnProperty.call(record, 'auditExpected')
        ? Boolean(record.auditExpected)
        : undefined,
      controlRequestCountMustRemainZero: Boolean(record.controlRequestCountMustRemainZero),
      dispatchRunCreationMustRemainZero: Boolean(record.dispatchRunCreationMustRemainZero),
    };
  });
}

async function requestRaw(
  baseUrl: string,
  path: string,
  options: { method?: 'GET' | 'POST'; token?: string; body?: JsonRecord } = {},
): Promise<RawResult> {
  const response = await fetch(new URL(path, baseUrl), {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'X-Authenticator': 'basic',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let body: unknown = {};
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = {
        raw: text,
      };
    }
  }
  return {
    status: response.status,
    body,
    text,
  };
}

async function signIn(baseUrl: string, email: string, password: string) {
  const result = await requestRaw(baseUrl, '/api/auth:signIn', {
    method: 'POST',
    body: {
      account: email,
      password,
    },
  });
  if (result.status !== 200) {
    throw new Error(`Sign-in failed for ${email}: HTTP ${result.status} ${result.text}`);
  }
  const data = getRecord(getRecord(result.body).data) || getRecord(result.body);
  const token = getString(data.token);
  if (!token) {
    throw new Error(`Sign-in response did not include a token for ${email}`);
  }
  return token;
}

function getRecord(value: unknown): JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]' ? (value as JsonRecord) : {};
}

function getNestedRecord(value: unknown, key: string) {
  return getRecord(getRecord(value)[key]);
}

function getResponseErrorCode(result: RawResult) {
  const body = getRecord(result.body);
  const data = getNestedRecord(body, 'data');
  const error = getNestedRecord(body, 'error');
  const firstError = Array.isArray(body.errors) ? getRecord(body.errors[0]) : {};
  return (
    getString(body.code) ||
    getString(data.code) ||
    getString(error.code) ||
    getString(firstError.code) ||
    getString(body.message) ||
    getString(data.message) ||
    getString(error.message) ||
    getString(firstError.message)
  );
}

function getWebSocketUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = TERMINAL_STREAM_WS_PATH;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function assertNoValueLeak(action: DenialAction, value: unknown, patterns: string[]) {
  const serialized = JSON.stringify(value);
  for (const pattern of patterns) {
    if (pattern && serialized.includes(pattern)) {
      throw new Error(`${action} output exposed sensitive validation material`);
    }
  }
}

function containsSensitiveData(result: RawResult, args: DenialArgs) {
  const serialized = JSON.stringify(result.body);
  if (args.hiddenRunId && serialized.includes(args.hiddenRunId)) {
    return true;
  }
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(serialized)) {
      return true;
    }
  }
  return false;
}

function getAuditExpectation(action: DenialAction) {
  if (action === 'dispatch') {
    return {
      expectedAuditAction: 'dispatch',
      expectedAuditStatus: 'denied',
    };
  }
  if (action === 'raw-write' || action === 'raw-write-legacy' || action === 'raw-write-ws-aliases') {
    return {
      expectedAuditAction: 'rawTerminalWriteDenied',
      expectedAuditStatus: 'denied',
    };
  }
  if (action === 'terminal') {
    return {
      expectedAuditAction: 'readTerminal',
      expectedAuditStatus: 'denied',
    };
  }
  if (action === 'artifacts') {
    return {
      expectedAuditAction: 'readArtifacts',
      expectedAuditStatus: 'denied',
    };
  }
  if (action === 'raw-logs') {
    return {
      expectedAuditAction: 'readRawLogs',
      expectedAuditStatus: 'denied',
    };
  }
  if (action === 'session-messages') {
    return {
      expectedAuditAction: 'readSessionMessages',
      expectedAuditStatus: 'denied',
    };
  }
  if (action === 'run-details' || action === 'hidden-run') {
    return {
      expectedAuditAction: 'readRunDetails',
      expectedAuditStatus: 'denied',
    };
  }
  return {
    expectedAuditAction: action,
    expectedAuditStatus: 'denied',
  };
}

function findExpectedAccess(args: DenialArgs, action: DenialAction) {
  return args.expectedAccess.find((entry) => entry.userEmail === args.email && entry.action === action);
}

function expectedActions(args: DenialArgs) {
  return args.actions.map((action) => ({ action, expected: findExpectedAccess(args, action) }));
}

function assertExpectedAccessCoverage(args: DenialArgs) {
  if (!args.expectDenied) {
    return;
  }
  if (!args.expectedAccess.length) {
    throw new Error('--expect-denied requires --expected-access-json or --expected-access-file from the seed output');
  }
  const missingActions = expectedActions(args)
    .filter(({ expected }) => !expected)
    .map(({ action }) => action);
  if (missingActions.length) {
    throw new Error(`Missing expected-access entries for ${args.email}: ${missingActions.join(', ')}`);
  }
}

function requiresAdminCounts(args: DenialArgs) {
  if (args.expectNoControlRequest) {
    return true;
  }
  return expectedActions(args).some(({ expected }) =>
    Boolean(
      expected &&
        (expected.auditExpected !== undefined ||
          expected.controlRequestCountMustRemainZero ||
          expected.dispatchRunCreationMustRemainZero),
    ),
  );
}

async function findOperatorId(args: DenialArgs, adminToken: string | null) {
  if (!adminToken) {
    return null;
  }
  const search = new URLSearchParams();
  search.set(
    'filter',
    JSON.stringify({
      email: args.email,
    }),
  );
  const data = await requestJson<unknown>(args.baseUrl, `/api/users:list?${search.toString()}`, {
    token: adminToken,
  });
  const operator = getListItems(data)[0];
  return getString(operator?.id) || null;
}

function getAuditTargetFilter(args: DenialArgs, action: DenialAction) {
  if (action === 'dispatch') {
    return {};
  }
  if (action === 'resume' || action === 'message') {
    return {
      sessionId: args.sessionId,
    };
  }
  if (action === 'raw-write' || action === 'raw-write-legacy' || action === 'raw-write-ws-aliases') {
    return {};
  }
  if (action === 'hidden-run') {
    return {
      runId: args.hiddenRunId,
    };
  }
  if (action === 'run-details') {
    return {
      runId: args.runId,
    };
  }
  return {
    runId: args.runId,
  };
}

function getAuditFilter(args: DenialArgs, action: DenialAction, operatorId: string | null) {
  const audit = getAuditExpectation(action);
  return {
    action: audit.expectedAuditAction,
    resultStatus: audit.expectedAuditStatus,
    ...(operatorId ? { operatorId } : {}),
    ...getAuditTargetFilter(args, action),
  };
}

function buildAttempt(action: DenialAction, args: DenialArgs) {
  const idempotencyKey = `denial-${action}-${Date.now()}`;
  if (action === 'dispatch') {
    if (!args.dispatchBindingId || !args.dispatchCollection || !args.dispatchRecordId) {
      throw new Error(
        '--dispatch-binding-id, --dispatch-collection, and --dispatch-record-id are required for dispatch',
      );
    }
    return {
      route: `/api/agent-gateway/dispatch-bindings/${encodeURIComponent(args.dispatchBindingId)}/dispatch`,
      method: 'POST' as const,
      body: {
        recordId: args.dispatchRecordId,
        expectedCollectionName: args.dispatchCollection,
        idempotencyKey,
      },
    };
  }
  if (action === 'resume') {
    return {
      route: `/api/agent-gateway/agent-sessions/${encodeURIComponent(args.sessionId)}/resume`,
      method: 'POST' as const,
      body: {
        message: 'denied resume message password=DENIAL_RESUME_SECRET',
        idempotencyKey,
      },
    };
  }
  if (action === 'message') {
    return {
      route: `/api/agent-gateway/agent-sessions/${encodeURIComponent(args.sessionId)}/message`,
      method: 'POST' as const,
      body: {
        message: 'denied live message password=DENIAL_MESSAGE_SECRET',
      },
    };
  }
  if (action === 'interrupt' || action === 'terminate') {
    return {
      route: `/api/agent-gateway/runs/${encodeURIComponent(args.runId)}/terminal:${action}`,
      method: 'POST' as const,
      body: {
        idempotencyKey,
      },
    };
  }
  if (action === 'cancel') {
    return {
      route: `/api/agent-gateway/runs/${encodeURIComponent(args.runId)}/cancel`,
      method: 'POST' as const,
    };
  }
  if (action === 'raw-write') {
    return {
      route: `/api/agent-gateway/runs/${encodeURIComponent(args.runId)}/terminal:send`,
      method: 'POST' as const,
      body: {
        input: 'denied raw input password=DENIAL_RAW_SECRET',
      },
    };
  }
  if (action === 'raw-write-legacy') {
    return {
      route: `/api/agent-gateway/runs/${encodeURIComponent(args.runId)}/terminal:write`,
      method: 'POST' as const,
      body: {
        input: 'denied legacy raw input password=DENIAL_LEGACY_RAW_SECRET',
      },
    };
  }
  if (action === 'raw-write-ws-aliases') {
    return {
      route: `ws:${getWebSocketUrl(args.baseUrl)}`,
      method: 'POST' as const,
    };
  }
  if (action === 'terminal') {
    return {
      route: `/api/agent-gateway/runs/${encodeURIComponent(args.runId)}/terminal:snapshot`,
      method: 'GET' as const,
    };
  }
  if (action === 'artifacts') {
    return {
      route: `/api/agent-gateway/runs/${encodeURIComponent(args.runId)}/artifacts:list`,
      method: 'GET' as const,
    };
  }
  if (action === 'raw-logs') {
    return {
      route: `/api/agent-gateway/runs/${encodeURIComponent(args.runId)}/events:list`,
      method: 'GET' as const,
    };
  }
  if (action === 'session-messages') {
    return {
      route: `/api/agent-gateway/runs/${encodeURIComponent(args.runId)}/conversation-events:list`,
      method: 'GET' as const,
    };
  }
  if (action === 'run-details') {
    return {
      route: `/api/agent-gateway/runs:get/${encodeURIComponent(args.runId)}`,
      method: 'GET' as const,
    };
  }
  return {
    route: `/api/agent-gateway/runs:get/${encodeURIComponent(args.hiddenRunId)}`,
    method: 'GET' as const,
  };
}

async function requestWsRawWriteAliases(args: DenialArgs, token: string): Promise<RawResult> {
  const ticketResponse = await requestRaw(
    args.baseUrl,
    `/api/agent-gateway/runs/${encodeURIComponent(args.runId)}/terminal-stream-tickets:create`,
    {
      method: 'POST',
      token,
      body: {},
    },
  );
  if (ticketResponse.status >= 400) {
    return ticketResponse;
  }
  const ticketBody = getRecord(getRecord(ticketResponse.body).data) || getRecord(ticketResponse.body);
  const ticket = getString(ticketBody.ticket);
  const ticketProof = getString(ticketBody.ticketProof);
  const authProof = getString(ticketBody.authProof);
  const authenticator = getString(ticketBody.authenticator) || 'basic';
  const role = getString(ticketBody.role);
  if (!ticket || !ticketProof) {
    return {
      status: 500,
      body: {
        code: 'INVALID_STREAM_TICKET_RESPONSE',
      },
      text: 'Invalid stream ticket response',
    };
  }

  const wsUrl = getWebSocketUrl(args.baseUrl);
  const requestIdPrefix = `denial-raw-write-ws-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const aliasResults = await new Promise<JsonRecord[]>((resolve) => {
    const socket = new WebSocket(
      wsUrl,
      buildBrowserStreamProtocols({
        ticket,
        ticketProof,
        authProof,
        authenticator,
        role,
      }),
    );
    const results: JsonRecord[] = [];
    let aliasIndex = 0;
    const timer = setTimeout(() => {
      socket.close();
      results.push({
        frameType: RAW_WRITE_WS_FRAME_TYPES[aliasIndex] || 'timeout',
        requestId: `${requestIdPrefix}-timeout`,
        actualFrameType: 'timeout',
        actualCode: 'TIMEOUT',
      });
      resolve(results);
    }, 8000);

    const finish = () => {
      clearTimeout(timer);
      socket.close();
      resolve(results);
    };

    const sendAlias = () => {
      const frameType = RAW_WRITE_WS_FRAME_TYPES[aliasIndex];
      if (!frameType) {
        finish();
        return;
      }
      const requestId = `${requestIdPrefix}-${frameType.replace('.', '-')}`;
      const secret = `DENIAL_WS_RAW_SECRET_${frameType.replace('.', '_')}`;
      socket.send(
        JSON.stringify({
          type: frameType,
          protocol: TERMINAL_PROTOCOL,
          requestId,
          runId: args.runId,
          input: `password=${secret}`,
        }),
      );
    };

    socket.on('open', () => {
      socket.send(
        JSON.stringify({
          type: 'browser.subscribe',
          protocol: TERMINAL_PROTOCOL,
          requestId: `${requestIdPrefix}-subscribe`,
          runId: args.runId,
          lastOffset: 0,
        }),
      );
    });
    socket.on('message', (data) => {
      let frame: unknown;
      try {
        frame = JSON.parse(String(data)) as unknown;
      } catch {
        clearTimeout(timer);
        socket.close();
        resolve([
          ...results,
          {
            frameType: RAW_WRITE_WS_FRAME_TYPES[aliasIndex] || 'parse',
            requestId: `${requestIdPrefix}-parse`,
            actualFrameType: 'parse-error',
            actualCode: 'PARSE_ERROR',
          },
        ]);
        return;
      }
      assertNoValueLeak('raw-write-ws-aliases', frame, [ticket, ticketProof, authProof, token]);
      const record = getRecord(frame);
      const requestId = getString(record.requestId);
      if (requestId === `${requestIdPrefix}-subscribe`) {
        if (record.type !== 'ack') {
          clearTimeout(timer);
          socket.close();
          resolve([
            {
              frameType: 'browser.subscribe',
              requestId,
              actualFrameType: getString(record.type) || 'unknown',
              actualCode: getString(record.code) || 'NO_CODE',
            },
          ]);
          return;
        }
        sendAlias();
        return;
      }

      const frameType = RAW_WRITE_WS_FRAME_TYPES[aliasIndex];
      const expectedRequestId = frameType ? `${requestIdPrefix}-${frameType.replace('.', '-')}` : '';
      if (!frameType || requestId !== expectedRequestId) {
        return;
      }
      const secret = `DENIAL_WS_RAW_SECRET_${frameType.replace('.', '_')}`;
      assertNoValueLeak('raw-write-ws-aliases', frame, [secret]);
      results.push({
        frameType,
        requestId,
        actualFrameType: getString(record.type) || 'unknown',
        actualCode: getString(record.code) || 'NO_CODE',
      });
      aliasIndex += 1;
      sendAlias();
    });
    socket.on('error', () => {
      clearTimeout(timer);
      resolve([
        ...results,
        {
          frameType: RAW_WRITE_WS_FRAME_TYPES[aliasIndex] || 'socket',
          requestId: `${requestIdPrefix}-socket`,
          actualFrameType: 'socket-error',
          actualCode: 'SOCKET_ERROR',
        },
      ]);
    });
  });
  const allDisabled =
    aliasResults.length === RAW_WRITE_WS_FRAME_TYPES.length &&
    aliasResults.every((result) => getString(result.actualCode) === 'TERMINAL_RAW_WRITE_DISABLED');
  return {
    status: allDisabled ? 403 : 500,
    body: {
      code: allDisabled ? 'TERMINAL_RAW_WRITE_DISABLED' : getString(aliasResults[0]?.actualCode) || 'NO_CODE',
      aliases: aliasResults,
    },
    text: JSON.stringify(aliasResults),
  };
}

async function countControlRequests(args: DenialArgs, adminToken: string | null, action: DenialAction) {
  if (!adminToken || !CONTROL_ACTIONS.has(action)) {
    return null;
  }
  return await countCollection(args, adminToken, 'agRunControlRequests', {
    runId: args.runId,
    action,
  });
}

async function countDispatchRuns(args: DenialArgs, adminToken: string | null, action: DenialAction) {
  if (!adminToken || action !== 'dispatch' || !args.dispatchRecordId) {
    return null;
  }
  return await countCollection(args, adminToken, 'agRuns', {
    sourceType: 'dispatch',
    sourceRecordId: args.dispatchRecordId,
  });
}

async function countCollection(args: DenialArgs, adminToken: string, collection: string, filter: JsonRecord) {
  const records = await listCollection(args, adminToken, collection, filter);
  return records.length;
}

async function listCollection(args: DenialArgs, adminToken: string, collection: string, filter: JsonRecord) {
  const search = new URLSearchParams();
  search.set('filter', JSON.stringify(filter));
  search.set('pageSize', '5000');
  const result = await requestRaw(args.baseUrl, `/api/${collection}:list?${search.toString()}`, {
    token: adminToken,
  });
  if (result.status >= 400) {
    throw new Error(`Count query failed for ${collection}: HTTP ${result.status} ${result.text}`);
  }
  return getListItems(result.body).filter((item) => matchesFilter(item, filter));
}

async function getAuditMarker(
  adminToken: string | null,
  args: DenialArgs,
  action: DenialAction,
  operatorId: string | null,
) {
  if (!adminToken) {
    return null;
  }
  const records = await listCollection(
    args,
    adminToken,
    'agAgentActionAudits',
    getAuditFilter(args, action, operatorId),
  );
  return {
    count: records.length,
    latestKey: getRecordKey(records[0]),
  };
}

function getRecordKey(record: JsonRecord | undefined) {
  if (!record) {
    return '';
  }
  return `${getString(record.createdAt)}:${getString(record.id)}`;
}

function matchesFilter(item: JsonRecord, filter: JsonRecord) {
  return Object.entries(filter).every(([key, expected]) => matchesFilterValue(item[key], expected));
}

function matchesFilterValue(actual: unknown, expected: unknown): boolean {
  if (getRecord(expected).$eq !== undefined) {
    return matchesFilterValue(actual, getRecord(expected).$eq);
  }
  if (actual === expected) {
    return true;
  }
  if (
    (typeof actual === 'number' || typeof actual === 'string') &&
    (typeof expected === 'number' || typeof expected === 'string')
  ) {
    return String(actual) === String(expected);
  }
  return false;
}

function assertExpectedAccess(
  action: DenialAction,
  expected: ExpectedAccessEntry | undefined,
  attemptResult: AttemptResult,
) {
  if (!expected) {
    return;
  }
  if (attemptResult.httpStatus !== expected.expectedHttpStatus) {
    throw new Error(
      `${action} expected HTTP ${expected.expectedHttpStatus} but returned HTTP ${attemptResult.httpStatus}`,
    );
  }
  const expectedCode = expected.expectedApplicationErrorCode || '';
  const actualCode = attemptResult.responseErrorCode || '';
  if (expectedCode && actualCode !== expectedCode) {
    throw new Error(`${action} expected error code ${expectedCode} but returned ${actualCode || '<empty>'}`);
  }
  if (!expectedCode && actualCode) {
    throw new Error(`${action} expected no application error code but returned ${actualCode}`);
  }
  if (
    expected.auditExpected !== undefined &&
    (attemptResult.auditCountBefore === null || attemptResult.auditCountAfter === null)
  ) {
    throw new Error(`${action} expected auditExpected=${expected.auditExpected} but audit count was not checked`);
  }
  if (expected.auditExpected !== undefined) {
    const auditIncreased = attemptResult.auditCheck === 'recorded';
    if (Boolean(expected.auditExpected) !== auditIncreased) {
      throw new Error(
        `${action} expected auditExpected=${expected.auditExpected} but audit count changed from ` +
          `${auditCountBefore} to ${auditCountAfter}`,
      );
    }
  }
  if (expected.controlRequestCountMustRemainZero && attemptResult.controlRequestCount === null) {
    throw new Error(`${action} expected zero control requests but control request count was not checked`);
  }
  if (expected.controlRequestCountMustRemainZero) {
    const controlRequestCount = attemptResult.controlRequestCount || 0;
    if (controlRequestCount > 0) {
      throw new Error(`${action} created ${controlRequestCount} control request(s)`);
    }
  }
  if (
    expected.dispatchRunCreationMustRemainZero &&
    (attemptResult.dispatchRunCountBefore === null || attemptResult.dispatchRunCountAfter === null)
  ) {
    throw new Error(`${action} expected zero dispatch runs but dispatch run count was not checked`);
  }
  if (
    expected.dispatchRunCreationMustRemainZero &&
    attemptResult.dispatchRunCountAfter !== attemptResult.dispatchRunCountBefore
  ) {
    const dispatchRunCountBefore = attemptResult.dispatchRunCountBefore || 0;
    const dispatchRunCountAfter = attemptResult.dispatchRunCountAfter || 0;
    throw new Error(`${action} created ${dispatchRunCountAfter - dispatchRunCountBefore} dispatch run(s)`);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  assertExpectedAccessCoverage(args);
  const token = await signIn(args.baseUrl, args.email, args.password);
  const adminToken =
    args.adminEmail && args.adminPassword ? await signIn(args.baseUrl, args.adminEmail, args.adminPassword) : null;
  if (args.expectDenied && !adminToken) {
    throw new Error('Admin credentials are required with --expect-denied to verify audit and side-effect counts.');
  }
  if (!adminToken && requiresAdminCounts(args)) {
    throw new Error(
      'Admin credentials are required to verify expected audit and side-effect counts. Pass --admin-email and --admin-password.',
    );
  }
  const operatorId = await findOperatorId(args, adminToken);
  if (adminToken && !operatorId) {
    throw new Error(`Could not find operator user id for ${args.email}`);
  }
  const attempts: AttemptResult[] = [];

  for (const action of args.actions) {
    const attempt = buildAttempt(action, args);
    const expected = findExpectedAccess(args, action);
    const dispatchRunCountBefore = await countDispatchRuns(args, adminToken, action);
    const auditMarkerBefore = await getAuditMarker(adminToken, args, action, operatorId);
    const result =
      action === 'raw-write-ws-aliases'
        ? await requestWsRawWriteAliases(args, token)
        : await requestRaw(args.baseUrl, attempt.route, {
            method: attempt.method,
            token,
            body: attempt.body,
          });
    const auditMarkerAfter = await getAuditMarker(adminToken, args, action, operatorId);
    const controlRequestCount = await countControlRequests(args, adminToken, action);
    const dispatchRunCountAfter = await countDispatchRuns(args, adminToken, action);
    const auditExpected = expected?.auditExpected ?? getAuditExpectation(action).expectedAuditStatus === 'denied';
    const auditRecorded = Boolean(
      auditMarkerBefore && auditMarkerAfter && auditMarkerAfter.latestKey !== auditMarkerBefore.latestKey,
    );
    const attemptResult: AttemptResult = {
      action,
      routeOrFrame: attempt.route,
      httpStatus: result.status,
      expectedHttpStatus: expected?.expectedHttpStatus,
      responseErrorCode: getResponseErrorCode(result) || undefined,
      expectedApplicationErrorCode: expected?.expectedApplicationErrorCode,
      ...getAuditExpectation(action),
      auditExpected,
      auditFilter: getAuditFilter(args, action, operatorId),
      auditCountBefore: auditMarkerBefore?.count ?? null,
      auditCountAfter: auditMarkerAfter?.count ?? null,
      auditCheck:
        auditMarkerBefore === null || auditMarkerAfter === null
          ? 'not_checked'
          : auditRecorded
            ? 'recorded'
            : 'not_recorded',
      controlRequestCount,
      controlRequestCheck:
        controlRequestCount === null
          ? 'not_checked'
          : controlRequestCount === 0
            ? 'none'
            : `${controlRequestCount} control request(s) found`,
      dispatchRunCountBefore,
      dispatchRunCountAfter,
      dispatchRunCheck:
        dispatchRunCountBefore === null || dispatchRunCountAfter === null
          ? 'not_checked'
          : dispatchRunCountBefore === dispatchRunCountAfter
            ? 'none_created'
            : `${dispatchRunCountAfter - dispatchRunCountBefore} dispatch run(s) created`,
      sensitiveDataAppeared: containsSensitiveData(result, args),
    };
    attempts.push(attemptResult);
    if (args.expectDenied && result.status < 400) {
      throw new Error(`${action} was expected to be denied but returned HTTP ${result.status}`);
    }
    assertExpectedAccess(action, expected, attemptResult);
    if (args.expectNoControlRequest && CONTROL_ACTIONS.has(action) && controlRequestCount === null) {
      throw new Error(`${action} expected no control request but control request count was not checked`);
    }
    if (args.expectNoControlRequest && controlRequestCount !== null && controlRequestCount > 0) {
      throw new Error(`${action} created ${controlRequestCount} control request(s)`);
    }
    if (
      args.expectNoControlRequest &&
      action === 'dispatch' &&
      (dispatchRunCountBefore === null || dispatchRunCountAfter === null)
    ) {
      throw new Error(`${action} expected no dispatch run but dispatch run count was not checked`);
    }
    if (
      args.expectNoControlRequest &&
      dispatchRunCountBefore !== null &&
      dispatchRunCountAfter !== null &&
      dispatchRunCountAfter !== dispatchRunCountBefore
    ) {
      throw new Error(`${action} created ${dispatchRunCountAfter - dispatchRunCountBefore} dispatch run(s)`);
    }
    if (attemptResult.sensitiveDataAppeared) {
      throw new Error(`${action} response exposed sensitive data`);
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        operator: args.email,
        attempts,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
