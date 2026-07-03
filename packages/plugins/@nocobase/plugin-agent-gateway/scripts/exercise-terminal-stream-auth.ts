/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

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
import type { TerminalErrorCode, TerminalFrame } from '../src/shared/terminalStreamProtocol';
import {
  JsonRecord,
  findOneByFilter,
  getListItems,
  getString,
  isRecord,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

type StreamAuthScenario = 'valid' | 'expired' | 'wrong-run' | 'wrong-user' | 'permission-revoked' | 'raw-write-aliases';
type RestorationStatus = 'not_needed' | 'restored' | 'failed';

interface StreamAuthArgs {
  baseUrl: string;
  wsUrl: string;
  adminEmail: string;
  adminPassword: string;
  runId: string;
  scenarios: StreamAuthScenario[];
  expectValidSuccess: boolean;
  expectRevokedError?: TerminalErrorCode;
  restoreOnly: boolean;
}

interface StreamTicket {
  ticket: string;
  ticketProof: string;
  authProof?: string;
  authenticator?: string;
  role?: string;
  ticketCreatedAt: string;
  expiresAt: string;
}

interface ScenarioResult {
  scenario: StreamAuthScenario;
  runId: string;
  actingUser: string;
  expectedCode: 'ACK' | TerminalErrorCode;
  actualFrameType: string;
  actualCode: 'ACK' | TerminalErrorCode | 'NO_CODE' | 'TIMEOUT' | 'SOCKET_ERROR' | 'PARSE_ERROR';
  ok: boolean;
  ticketCreatedAt: string;
  restorationStatus: RestorationStatus;
  permissionBeforeRevocation?: RolePermissionState;
  permissionAfterRevocation?: RolePermissionState;
  postRestorePermissionState?: RolePermissionState;
  rawWriteAliasResults?: RawWriteAliasResult[];
}

interface RawWriteAliasResult {
  frameType: string;
  requestId: string;
  actualFrameType: string;
  actualCode: TerminalErrorCode | 'NO_CODE' | 'TIMEOUT' | 'SOCKET_ERROR' | 'PARSE_ERROR';
}

function encodeWebSocketProtocolValue(value?: string) {
  if (!value) {
    return '';
  }
  return Buffer.from(value, 'utf8').toString('base64url');
}

function buildBrowserStreamProtocols(options: { ticket: StreamTicket }) {
  const protocols = [
    TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
    `${TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(options.ticket.ticket)}`,
    `${TERMINAL_STREAM_BROWSER_TICKET_PROOF_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(
      options.ticket.ticketProof,
    )}`,
    `${TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(
      options.ticket.authenticator || 'basic',
    )}`,
  ];
  if (options.ticket.authProof) {
    protocols.push(
      `${TERMINAL_STREAM_BROWSER_AUTH_PROOF_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(options.ticket.authProof)}`,
    );
  }
  if (options.ticket.role) {
    protocols.push(
      `${TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(options.ticket.role)}`,
    );
  }
  return protocols;
}

interface RolePermissionState {
  roleName: string;
  snippets: string[];
  hasReadTerminal: boolean;
}

const STREAM_AUTH_ROLE_NAME = 'agentGatewayStreamAuthHarness';
const STREAM_AUTH_OTHER_ROLE_NAME = 'agentGatewayStreamAuthOther';
const STREAM_AUTH_USER_EMAIL = 'agent-gateway-stream-auth@example.com';
const STREAM_AUTH_OTHER_EMAIL = 'agent-gateway-stream-auth-other@example.com';
const STREAM_AUTH_USER_PASSWORD = 'agentGateway123!';
const STREAM_AUTH_SNIPPETS = ['agentGateway.readRuns', 'agentGateway.readRunDetails', 'agentGateway.readTerminal'];
const STREAM_AUTH_REVOKED_SNIPPETS = ['agentGateway.readRuns', 'agentGateway.readRunDetails'];
const STREAM_AUTH_OTHER_SNIPPETS = ['agentGateway.readRuns'];
const RAW_WRITE_FRAME_TYPES = ['browser.input', 'browser.write', 'terminal.input', 'terminal.write'] as const;
const SCENARIOS = new Set<StreamAuthScenario>([
  'valid',
  'expired',
  'wrong-run',
  'wrong-user',
  'permission-revoked',
  'raw-write-aliases',
]);

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArgs(argv: string[]): StreamAuthArgs {
  const { flags, booleanFlags } = parseAdminFlags(argv);
  const baseUrl = getString(flags['base-url']).replace(/\/$/, '');
  const adminEmail = getString(flags['admin-email']);
  const adminPassword = getString(flags['admin-password']);
  const runId = getString(flags['run-id']);
  const scenarios = splitCsv(
    getString(flags.scenarios) || 'valid,expired,wrong-run,wrong-user,permission-revoked,raw-write-aliases',
  ).map((scenario) => {
    if (!SCENARIOS.has(scenario as StreamAuthScenario)) {
      throw new Error(`Unsupported --scenarios entry: ${scenario}`);
    }
    return scenario as StreamAuthScenario;
  });
  if (!baseUrl || !adminEmail || !adminPassword || (!runId && !booleanFlags.has('restore-only'))) {
    throw new Error('--base-url, --admin-email, --admin-password, and --run-id are required');
  }
  return {
    baseUrl,
    wsUrl: getString(flags['ws-url']) || getWebSocketUrl(baseUrl),
    adminEmail,
    adminPassword,
    runId,
    scenarios,
    expectValidSuccess: booleanFlags.has('expect-valid-success'),
    expectRevokedError: getString(flags['expect-revoked-error']) as TerminalErrorCode | undefined,
    restoreOnly: booleanFlags.has('restore-only'),
  };
}

function getWebSocketUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = TERMINAL_STREAM_WS_PATH;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function getResponseId(record: JsonRecord | null | undefined) {
  const id = getString(record?.id);
  if (!id) {
    throw new Error(`Expected record id, got ${JSON.stringify(record)}`);
  }
  return id;
}

async function signInUser(baseUrl: string, email: string, password: string) {
  const data = await requestJson<JsonRecord>(baseUrl, '/api/auth:signIn', {
    method: 'POST',
    body: {
      account: email,
      password,
    },
  });
  const token = getString(data.token);
  if (!token) {
    throw new Error(`Sign-in response did not include a token for ${email}`);
  }
  await requestJson<JsonRecord>(baseUrl, '/api/auth:check', {
    token,
  });
  return token;
}

async function upsertRole(baseUrl: string, token: string, roleName: string, title: string, snippets: string[]) {
  const values = {
    name: roleName,
    title,
    snippets,
    strategy: {
      actions: [],
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'roles', { name: roleName });
  if (existing) {
    await requestJson<JsonRecord>(baseUrl, `/api/roles:update/${encodeURIComponent(roleName)}`, {
      method: 'POST',
      token,
      body: values,
    });
    return;
  }
  await requestJson<JsonRecord>(baseUrl, '/api/roles:create', {
    method: 'POST',
    token,
    body: values,
  });
}

async function ensureDefaultRoleBinding(baseUrl: string, token: string, userId: string, roleName: string) {
  const filter = {
    userId,
    roleName,
  };
  const existing = await findOneByFilter(baseUrl, token, 'rolesUsers', filter);
  if (existing) {
    const search = new URLSearchParams();
    search.set('filter', JSON.stringify(filter));
    await requestJson<JsonRecord>(baseUrl, `/api/rolesUsers:update?${search.toString()}`, {
      method: 'POST',
      token,
      body: {
        default: true,
      },
    });
    return;
  }

  await requestJson<JsonRecord>(baseUrl, '/api/rolesUsers:create', {
    method: 'POST',
    token,
    body: {
      ...filter,
      default: true,
    },
  });
}

async function upsertUser(
  baseUrl: string,
  token: string,
  options: { email: string; username: string; nickname: string; roleName: string },
) {
  const baseValues = {
    email: options.email,
    username: options.username,
    nickname: options.nickname,
    roles: [options.roleName],
  };
  const existing = await findOneByFilter(baseUrl, token, 'users', { email: options.email });
  if (existing) {
    const userId = getResponseId(existing);
    await requestJson<JsonRecord>(baseUrl, `/api/users:update/${encodeURIComponent(userId)}`, {
      method: 'POST',
      token,
      body: baseValues,
    });
    await requestJson<JsonRecord>(baseUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
      method: 'POST',
      token,
      body: {
        values: [options.roleName],
      },
    });
    await ensureDefaultRoleBinding(baseUrl, token, userId, options.roleName);
    if (!(await canSignInUser(baseUrl, options.email))) {
      await resetUserPassword(baseUrl, token, userId);
    }
    return userId;
  }

  await requestJson<JsonRecord>(baseUrl, '/api/users:create', {
    method: 'POST',
    token,
    body: {
      ...baseValues,
      password: STREAM_AUTH_USER_PASSWORD,
    },
  });
  const created = await findOneByFilter(baseUrl, token, 'users', { email: options.email });
  const userId = getResponseId(created);
  await requestJson<JsonRecord>(baseUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
    method: 'POST',
    token,
    body: {
      values: [options.roleName],
    },
  });
  await ensureDefaultRoleBinding(baseUrl, token, userId, options.roleName);
  return userId;
}

async function resetUserPassword(baseUrl: string, token: string, userId: string) {
  await requestJson<JsonRecord>(baseUrl, `/api/users:update/${encodeURIComponent(userId)}`, {
    method: 'POST',
    token,
    body: {
      password: STREAM_AUTH_USER_PASSWORD,
    },
  });
  await waitForJwtIatAfterPasswordWrite();
}

async function waitForJwtIatAfterPasswordWrite() {
  const delayMs = 1100 - (Date.now() % 1000);
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function canSignInUser(baseUrl: string, email: string) {
  try {
    await signInUser(baseUrl, email, STREAM_AUTH_USER_PASSWORD);
    return true;
  } catch {
    return false;
  }
}

async function upsertScope(baseUrl: string, token: string, roleName: string, runId: string) {
  const name = `${roleName}-terminal-stream-auth-run`;
  const values = {
    resourceName: 'agRuns',
    name,
    scope: {
      id: runId,
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'dataSourcesRolesResourcesScopes', {
    resourceName: 'agRuns',
    name,
  });
  if (existing) {
    const scopeId = getResponseId(existing);
    await requestJson<JsonRecord>(
      baseUrl,
      `/api/dataSourcesRolesResourcesScopes:update/${encodeURIComponent(scopeId)}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
    return scopeId;
  }
  const created = await requestJson<JsonRecord>(baseUrl, '/api/dataSourcesRolesResourcesScopes:create', {
    method: 'POST',
    token,
    body: values,
  });
  return getResponseId(created);
}

async function listRoleResources(baseUrl: string, token: string, roleName: string) {
  const data = await requestJson<unknown>(baseUrl, `/api/roles/${encodeURIComponent(roleName)}/resources:list`, {
    token,
  });
  return getListItems(data);
}

async function grantRunScope(baseUrl: string, token: string, roleName: string, runId: string) {
  const scopeId = await upsertScope(baseUrl, token, roleName, runId);
  const scopeReference = Number.isFinite(Number(scopeId)) ? Number(scopeId) : scopeId;
  const values = {
    name: 'agRuns',
    usingActionsConfig: true,
    actions: [
      {
        name: 'view',
        scope: scopeReference,
      },
    ],
  };
  const existing = (await listRoleResources(baseUrl, token, roleName)).find(
    (resource) => getString(resource.name) === 'agRuns',
  );
  if (existing) {
    await requestJson<JsonRecord>(
      baseUrl,
      `/api/roles/${encodeURIComponent(roleName)}/resources:update/${encodeURIComponent(getResponseId(existing))}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
    return;
  }
  await requestJson<JsonRecord>(baseUrl, `/api/roles/${encodeURIComponent(roleName)}/resources:create`, {
    method: 'POST',
    token,
    body: values,
  });
}

async function ensureHarnessUsers(baseUrl: string, adminToken: string, runId: string) {
  await upsertRole(
    baseUrl,
    adminToken,
    STREAM_AUTH_ROLE_NAME,
    'Agent Gateway Stream Auth Harness',
    STREAM_AUTH_SNIPPETS,
  );
  await upsertRole(
    baseUrl,
    adminToken,
    STREAM_AUTH_OTHER_ROLE_NAME,
    'Agent Gateway Stream Auth Other',
    STREAM_AUTH_OTHER_SNIPPETS,
  );
  await grantRunScope(baseUrl, adminToken, STREAM_AUTH_ROLE_NAME, runId);
  await grantRunScope(baseUrl, adminToken, STREAM_AUTH_OTHER_ROLE_NAME, runId);

  await upsertUser(baseUrl, adminToken, {
    email: STREAM_AUTH_USER_EMAIL,
    username: 'agent-gateway-stream-auth',
    nickname: 'Agent Gateway Stream Auth',
    roleName: STREAM_AUTH_ROLE_NAME,
  });
  await upsertUser(baseUrl, adminToken, {
    email: STREAM_AUTH_OTHER_EMAIL,
    username: 'agent-gateway-stream-auth-other',
    nickname: 'Agent Gateway Stream Auth Other',
    roleName: STREAM_AUTH_OTHER_ROLE_NAME,
  });

  return {
    streamAuthToken: await signInUser(baseUrl, STREAM_AUTH_USER_EMAIL, STREAM_AUTH_USER_PASSWORD),
    otherToken: await signInUser(baseUrl, STREAM_AUTH_OTHER_EMAIL, STREAM_AUTH_USER_PASSWORD),
  };
}

async function getRolePermissionState(baseUrl: string, token: string, roleName: string): Promise<RolePermissionState> {
  const role = await findOneByFilter(baseUrl, token, 'roles', { name: roleName });
  const snippetsValue = role?.snippets;
  const snippets = Array.isArray(snippetsValue) ? snippetsValue.map(getString).filter(Boolean) : [];
  return {
    roleName,
    snippets,
    hasReadTerminal: snippets.includes('agentGateway.readTerminal'),
  };
}

async function createTicket(baseUrl: string, token: string, runId: string): Promise<StreamTicket> {
  const ticketCreatedAt = new Date().toISOString();
  const data = await requestJson<JsonRecord>(
    baseUrl,
    `/api/agent-gateway/runs/${encodeURIComponent(runId)}/terminal-stream-tickets:create`,
    {
      method: 'POST',
      token,
      body: {},
    },
  );
  const ticket = getString(data.ticket);
  const ticketProof = getString(data.ticketProof);
  const authProof = getString(data.authProof);
  const authenticator = getString(data.authenticator) || 'basic';
  const role = getString(data.role) || undefined;
  const expiresAt = getString(data.expiresAt);
  if (!ticket || !ticketProof || !expiresAt) {
    throw new Error('Stream ticket create response is invalid');
  }
  return {
    ticket,
    ticketProof,
    authProof,
    authenticator,
    role,
    ticketCreatedAt,
    expiresAt,
  };
}

async function expireTicket(baseUrl: string, adminToken: string, runId: string, ticket: StreamTicket) {
  const record = await findOneByFilter(baseUrl, adminToken, 'agTerminalStreamTickets', {
    runId,
    ticketLast4: ticket.ticket.slice(-4),
  });
  const ticketId = getResponseId(record);
  await requestJson<JsonRecord>(baseUrl, `/api/agTerminalStreamTickets:update/${encodeURIComponent(ticketId)}`, {
    method: 'POST',
    token: adminToken,
    body: {
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    },
  });
}

async function updateRoleSnippets(baseUrl: string, token: string, roleName: string, snippets: string[]) {
  const existing = await findOneByFilter(baseUrl, token, 'roles', { name: roleName });
  if (!existing) {
    throw new Error(`Role not found: ${roleName}`);
  }
  await requestJson<JsonRecord>(baseUrl, `/api/roles:update/${encodeURIComponent(roleName)}`, {
    method: 'POST',
    token,
    body: {
      name: roleName,
      title: getString(existing.title) || roleName,
      snippets,
      strategy: isRecord(existing.strategy) ? existing.strategy : { actions: [] },
    },
  });
}

function sendSubscribeFrame(
  socket: WebSocket,
  options: {
    requestId: string;
    runId: string;
    ticket: StreamTicket;
    roleName?: string;
  },
) {
  socket.send(
    JSON.stringify({
      type: 'browser.subscribe',
      protocol: TERMINAL_PROTOCOL,
      requestId: options.requestId,
      runId: options.runId,
      lastOffset: 0,
    }),
  );
}

async function subscribeOnce(
  wsUrl: string,
  options: {
    requestId: string;
    runId: string;
    authToken?: string;
    ticket: StreamTicket;
    roleName?: string;
  },
) {
  return await new Promise<TerminalFrame | { type: 'timeout' | 'socket-error' | 'parse-error' }>((resolve) => {
    const socket = new WebSocket(wsUrl, buildBrowserStreamProtocols(options));
    const timer = setTimeout(() => {
      socket.close();
      resolve({ type: 'timeout' });
    }, 8000);
    socket.on('open', () => {
      sendSubscribeFrame(socket, options);
    });
    socket.on('message', (data) => {
      let frame: unknown;
      try {
        frame = JSON.parse(String(data)) as unknown;
      } catch {
        clearTimeout(timer);
        socket.close();
        resolve({ type: 'parse-error' });
        return;
      }
      if (!isRecord(frame) || frame.requestId !== options.requestId) {
        return;
      }
      clearTimeout(timer);
      socket.close();
      resolve(frame as TerminalFrame);
    });
    socket.on('error', () => {
      clearTimeout(timer);
      resolve({ type: 'socket-error' });
    });
  });
}

function summarizeFrame(frame: TerminalFrame | { type: 'timeout' | 'socket-error' | 'parse-error' }) {
  if (frame.type === 'ack') {
    return {
      actualFrameType: frame.type,
      actualCode: 'ACK' as const,
    };
  }
  if (frame.type === 'error') {
    return {
      actualFrameType: frame.type,
      actualCode: frame.code,
    };
  }
  if (frame.type === 'timeout') {
    return {
      actualFrameType: frame.type,
      actualCode: 'TIMEOUT' as const,
    };
  }
  if (frame.type === 'socket-error') {
    return {
      actualFrameType: frame.type,
      actualCode: 'SOCKET_ERROR' as const,
    };
  }
  if (frame.type === 'parse-error') {
    return {
      actualFrameType: frame.type,
      actualCode: 'PARSE_ERROR' as const,
    };
  }
  return {
    actualFrameType: frame.type,
    actualCode: 'NO_CODE' as const,
  };
}

function assertNoTicketMaterialInValue(scenario: StreamAuthScenario, value: unknown, ticket: StreamTicket) {
  const serialized = JSON.stringify(value);
  if (
    serialized.includes(ticket.ticket) ||
    serialized.includes(ticket.ticketProof) ||
    (ticket.authProof && serialized.includes(ticket.authProof))
  ) {
    throw new Error(`${scenario} output exposed stream ticket material`);
  }
}

function assertNoAuthTokenInValue(scenario: StreamAuthScenario, value: unknown, authToken: string) {
  if (authToken && JSON.stringify(value).includes(authToken)) {
    throw new Error(`${scenario} output exposed browser auth token`);
  }
}

function assertNoRawWriteSecretInValue(scenario: StreamAuthScenario, value: unknown, secret: string) {
  if (JSON.stringify(value).includes(secret)) {
    throw new Error(`${scenario} output exposed raw terminal input`);
  }
}

async function runSubscribeScenario(
  args: StreamAuthArgs,
  options: {
    scenario: StreamAuthScenario;
    runId: string;
    authToken: string;
    actingUser: string;
    ticket: StreamTicket;
    expectedCode: 'ACK' | TerminalErrorCode;
    roleName?: string;
  },
): Promise<ScenarioResult> {
  const frame = await subscribeOnce(args.wsUrl, {
    requestId: `stream-auth-${options.scenario}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    runId: options.runId,
    authToken: options.authToken,
    ticket: options.ticket,
    roleName: options.roleName,
  });
  assertNoTicketMaterialInValue(options.scenario, frame, options.ticket);
  assertNoAuthTokenInValue(options.scenario, frame, options.authToken);
  const summary = summarizeFrame(frame);
  const result: ScenarioResult = {
    scenario: options.scenario,
    runId: options.runId,
    actingUser: options.actingUser,
    expectedCode: options.expectedCode,
    actualFrameType: summary.actualFrameType,
    actualCode: summary.actualCode,
    ok: summary.actualCode === options.expectedCode,
    ticketCreatedAt: options.ticket.ticketCreatedAt,
    restorationStatus: 'not_needed',
  };
  assertNoTicketMaterialInValue(options.scenario, result, options.ticket);
  assertNoAuthTokenInValue(options.scenario, result, options.authToken);
  return result;
}

async function subscribeAndExerciseRawWriteAliases(
  args: StreamAuthArgs,
  options: {
    runId: string;
    authToken: string;
    actingUser: string;
    ticket: StreamTicket;
    roleName?: string;
  },
): Promise<ScenarioResult> {
  const scenario: StreamAuthScenario = 'raw-write-aliases';
  const requestIdPrefix = `stream-auth-raw-write-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const aliasResults = await new Promise<RawWriteAliasResult[]>((resolve) => {
    const socket = new WebSocket(
      args.wsUrl,
      buildBrowserStreamProtocols({
        ticket: options.ticket,
      }),
    );
    const results: RawWriteAliasResult[] = [];
    let aliasIndex = 0;
    const timer = setTimeout(() => {
      socket.close();
      if (results.length < RAW_WRITE_FRAME_TYPES.length) {
        const frameType = RAW_WRITE_FRAME_TYPES[aliasIndex] || RAW_WRITE_FRAME_TYPES[RAW_WRITE_FRAME_TYPES.length - 1];
        results.push({
          frameType,
          requestId: `${requestIdPrefix}-${frameType.replace('.', '-')}`,
          actualFrameType: 'timeout',
          actualCode: 'TIMEOUT',
        });
      }
      resolve(results);
    }, 8000);

    const finish = () => {
      clearTimeout(timer);
      socket.close();
      resolve(results);
    };

    const sendNextAlias = () => {
      const frameType = RAW_WRITE_FRAME_TYPES[aliasIndex];
      if (!frameType) {
        finish();
        return;
      }
      const requestId = `${requestIdPrefix}-${frameType.replace('.', '-')}`;
      const secret = `STREAM_AUTH_RAW_SECRET_${frameType.replace('.', '_')}`;
      socket.send(
        JSON.stringify({
          type: frameType,
          protocol: TERMINAL_PROTOCOL,
          requestId,
          runId: options.runId,
          input: `password=${secret}`,
        }),
      );
    };

    socket.on('open', () => {
      sendSubscribeFrame(socket, {
        requestId: `${requestIdPrefix}-subscribe`,
        runId: options.runId,
        ticket: options.ticket,
        roleName: options.roleName,
      });
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
            frameType: RAW_WRITE_FRAME_TYPES[aliasIndex] || 'parse',
            requestId: `${requestIdPrefix}-parse`,
            actualFrameType: 'parse-error',
            actualCode: 'PARSE_ERROR',
          },
        ]);
        return;
      }
      assertNoTicketMaterialInValue(scenario, frame, options.ticket);
      assertNoAuthTokenInValue(scenario, frame, options.authToken);
      const record = isRecord(frame) ? frame : {};
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
              actualCode: (getString(record.code) as TerminalErrorCode) || 'NO_CODE',
            },
          ]);
          return;
        }
        sendNextAlias();
        return;
      }

      const expectedFrameType = RAW_WRITE_FRAME_TYPES[aliasIndex];
      const expectedRequestId = expectedFrameType ? `${requestIdPrefix}-${expectedFrameType.replace('.', '-')}` : '';
      if (!expectedFrameType || requestId !== expectedRequestId) {
        return;
      }
      const secret = `STREAM_AUTH_RAW_SECRET_${expectedFrameType.replace('.', '_')}`;
      assertNoRawWriteSecretInValue(scenario, frame, secret);
      results.push({
        frameType: expectedFrameType,
        requestId,
        actualFrameType: getString(record.type) || 'unknown',
        actualCode: (getString(record.code) as TerminalErrorCode) || 'NO_CODE',
      });
      aliasIndex += 1;
      sendNextAlias();
    });
    socket.on('error', () => {
      clearTimeout(timer);
      resolve([
        ...results,
        {
          frameType: RAW_WRITE_FRAME_TYPES[aliasIndex] || 'socket',
          requestId: `${requestIdPrefix}-socket`,
          actualFrameType: 'socket-error',
          actualCode: 'SOCKET_ERROR',
        },
      ]);
    });
  });

  const ok =
    aliasResults.length === RAW_WRITE_FRAME_TYPES.length &&
    aliasResults.every((result) => result.actualCode === 'TERMINAL_RAW_WRITE_DISABLED');
  const result: ScenarioResult = {
    scenario,
    runId: options.runId,
    actingUser: options.actingUser,
    expectedCode: 'TERMINAL_RAW_WRITE_DISABLED',
    actualFrameType: aliasResults.map((item) => item.actualFrameType).join(',') || 'none',
    actualCode: ok ? 'TERMINAL_RAW_WRITE_DISABLED' : aliasResults[0]?.actualCode || 'NO_CODE',
    ok,
    ticketCreatedAt: options.ticket.ticketCreatedAt,
    restorationStatus: 'not_needed',
    rawWriteAliasResults: aliasResults,
  };
  assertNoTicketMaterialInValue(scenario, result, options.ticket);
  assertNoAuthTokenInValue(scenario, result, options.authToken);
  return result;
}

async function runPermissionRevokedScenario(
  args: StreamAuthArgs,
  adminToken: string,
  streamAuthToken: string,
): Promise<ScenarioResult> {
  const ticket = await createTicket(args.baseUrl, streamAuthToken, args.runId);
  const permissionBeforeRevocation = await getRolePermissionState(args.baseUrl, adminToken, STREAM_AUTH_ROLE_NAME);
  let restorationStatus: RestorationStatus = 'failed';
  let permissionAfterRevocation: RolePermissionState | undefined;
  let postRestorePermissionState: RolePermissionState | undefined;
  let result: ScenarioResult | null = null;

  try {
    await updateRoleSnippets(args.baseUrl, adminToken, STREAM_AUTH_ROLE_NAME, STREAM_AUTH_REVOKED_SNIPPETS);
    permissionAfterRevocation = await getRolePermissionState(args.baseUrl, adminToken, STREAM_AUTH_ROLE_NAME);
    result = await runSubscribeScenario(args, {
      scenario: 'permission-revoked',
      runId: args.runId,
      authToken: streamAuthToken,
      actingUser: STREAM_AUTH_USER_EMAIL,
      ticket,
      roleName: STREAM_AUTH_ROLE_NAME,
      expectedCode: args.expectRevokedError || 'TERMINAL_PERMISSION_DENIED',
    });
    result = {
      ...result,
      permissionBeforeRevocation,
      permissionAfterRevocation,
    };
  } finally {
    try {
      await updateRoleSnippets(args.baseUrl, adminToken, STREAM_AUTH_ROLE_NAME, STREAM_AUTH_SNIPPETS);
      postRestorePermissionState = await getRolePermissionState(args.baseUrl, adminToken, STREAM_AUTH_ROLE_NAME);
      restorationStatus = postRestorePermissionState.hasReadTerminal ? 'restored' : 'failed';
    } catch {
      restorationStatus = 'failed';
    }
    if (result) {
      result.restorationStatus = restorationStatus;
      result.postRestorePermissionState = postRestorePermissionState;
    }
    if (restorationStatus !== 'restored') {
      const cleanupCommand =
        `yarn tsx packages/plugins/@nocobase/plugin-agent-gateway/scripts/exercise-terminal-stream-auth.ts ` +
        `--base-url ${args.baseUrl} --admin-email ${args.adminEmail} --admin-password <admin-password> ` +
        `--run-id ${args.runId} --restore-only`;
      process.stderr.write(`Permission restoration failed. Replay cleanup command: ${cleanupCommand}\n`);
    }
  }
  if (!result) {
    throw new Error('permission-revoked scenario did not produce a subscribe result');
  }
  return result;
}

async function restoreOnly(args: StreamAuthArgs, adminToken: string) {
  await updateRoleSnippets(args.baseUrl, adminToken, STREAM_AUTH_ROLE_NAME, STREAM_AUTH_SNIPPETS);
  const state = await getRolePermissionState(args.baseUrl, adminToken, STREAM_AUTH_ROLE_NAME);
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: state.hasReadTerminal,
        restorationStatus: state.hasReadTerminal ? 'restored' : 'failed',
        postRestorePermissionState: state,
      },
      null,
      2,
    )}\n`,
  );
}

async function runScenarios(args: StreamAuthArgs) {
  const adminToken = await signIn({
    baseUrl: args.baseUrl,
    adminEmail: args.adminEmail,
    adminPassword: args.adminPassword,
  });
  if (args.restoreOnly) {
    await restoreOnly(args, adminToken);
    return;
  }

  const { streamAuthToken, otherToken } = await ensureHarnessUsers(args.baseUrl, adminToken, args.runId);
  const results: ScenarioResult[] = [];

  for (const scenario of args.scenarios) {
    if (scenario === 'valid') {
      const ticket = await createTicket(args.baseUrl, adminToken, args.runId);
      results.push(
        await runSubscribeScenario(args, {
          scenario,
          runId: args.runId,
          authToken: adminToken,
          actingUser: args.adminEmail,
          ticket,
          expectedCode: 'ACK',
        }),
      );
    } else if (scenario === 'expired') {
      const ticket = await createTicket(args.baseUrl, adminToken, args.runId);
      await expireTicket(args.baseUrl, adminToken, args.runId, ticket);
      results.push(
        await runSubscribeScenario(args, {
          scenario,
          runId: args.runId,
          authToken: adminToken,
          actingUser: args.adminEmail,
          ticket,
          expectedCode: 'TERMINAL_STREAM_TICKET_EXPIRED',
        }),
      );
    } else if (scenario === 'wrong-run') {
      const ticket = await createTicket(args.baseUrl, adminToken, args.runId);
      results.push(
        await runSubscribeScenario(args, {
          scenario,
          runId: randomUUID(),
          authToken: adminToken,
          actingUser: args.adminEmail,
          ticket,
          expectedCode: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
        }),
      );
    } else if (scenario === 'wrong-user') {
      const ticket = await createTicket(args.baseUrl, adminToken, args.runId);
      results.push(
        await runSubscribeScenario(args, {
          scenario,
          runId: args.runId,
          authToken: otherToken,
          actingUser: STREAM_AUTH_OTHER_EMAIL,
          ticket,
          roleName: STREAM_AUTH_OTHER_ROLE_NAME,
          expectedCode: 'ACK',
        }),
      );
    } else if (scenario === 'permission-revoked') {
      results.push(await runPermissionRevokedScenario(args, adminToken, streamAuthToken));
    } else if (scenario === 'raw-write-aliases') {
      const ticket = await createTicket(args.baseUrl, adminToken, args.runId);
      results.push(
        await subscribeAndExerciseRawWriteAliases(args, {
          runId: args.runId,
          authToken: adminToken,
          actingUser: args.adminEmail,
          ticket,
        }),
      );
    }
  }

  for (const result of results) {
    if (!result.ok) {
      throw new Error(
        `${result.scenario} expected ${result.expectedCode} but received ${result.actualCode} (${result.actualFrameType})`,
      );
    }
    if (result.scenario === 'valid' && args.expectValidSuccess && result.actualCode !== 'ACK') {
      throw new Error(`valid scenario did not subscribe successfully: ${result.actualCode}`);
    }
    if (
      result.scenario === 'permission-revoked' &&
      args.expectRevokedError &&
      result.actualCode !== args.expectRevokedError
    ) {
      throw new Error(`permission-revoked expected ${args.expectRevokedError} but received ${result.actualCode}`);
    }
    if (result.scenario === 'permission-revoked' && result.restorationStatus !== 'restored') {
      throw new Error('permission-revoked scenario did not restore terminal permission');
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        runId: args.runId,
        wsUrl: args.wsUrl,
        scenarios: results,
      },
      null,
      2,
    )}\n`,
  );
}

const args = parseArgs(process.argv);
runScenarios(args).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
