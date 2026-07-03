/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs/promises';

import { chromium, Page } from 'playwright';

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
  findOneByFilter,
  getString,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

type LimitMode = 'per-user' | 'per-run';

interface StressBrowserArgs {
  serverUrl: string;
  runId: string;
  adminEmail?: string;
  adminPassword?: string;
  sessionToken?: string;
  cookieFile?: string;
  limitMode: LimitMode;
  subscriptions: number;
  tempUserCount: number;
  subscriptionsPerUser: number;
  expectError: string;
  headed: boolean;
}

interface BrowserSubscriptionResult {
  requested: number;
  ackCount: number;
  errorCodes: string[];
  timedOut: number;
}

const STRESS_ROLE_NAME = 'agentGatewayTerminalStress';
const STRESS_USER_ROLE_NAME = STRESS_ROLE_NAME;
const STRESS_USER_PASSWORD = 'AgentGatewayStress123!';
const JWT_IAT_SAFETY_DELAY_MS = 1100;

function parseInteger(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv: string[]): StressBrowserArgs {
  const { booleanFlags, flags } = parseAdminFlags(argv);
  const serverUrl = getString(flags['server-url'] || flags['base-url']).replace(/\/$/, '');
  const runId = getString(flags['run-id']);
  const limitMode = getString(flags['limit-mode']) as LimitMode;
  const expectError = getString(flags['expect-error']);
  if (!serverUrl || !runId || !['per-user', 'per-run'].includes(limitMode) || !expectError) {
    throw new Error('--server-url, --run-id, --limit-mode, and --expect-error are required');
  }
  return {
    serverUrl,
    runId,
    adminEmail: getString(flags['admin-email']) || undefined,
    adminPassword: getString(flags['admin-password']) || undefined,
    sessionToken: getString(flags['session-token']) || undefined,
    cookieFile: getString(flags['cookie-file']) || undefined,
    limitMode,
    subscriptions: parseInteger(getString(flags.subscriptions), 9),
    tempUserCount: parseInteger(getString(flags['temp-user-count']), 5),
    subscriptionsPerUser: parseInteger(getString(flags['subscriptions-per-user']), 7),
    expectError,
    headed: booleanFlags.has('headed'),
  };
}

interface StreamTicket {
  ticket: string;
  ticketProof: string;
  authProof?: string;
  authenticator?: string;
  role?: string;
}

function buildWsUrl(serverUrl: string) {
  const url = new URL(TERMINAL_STREAM_WS_PATH, serverUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

async function loadTokenFromCookieFile(args: StressBrowserArgs) {
  if (!args.cookieFile) {
    return '';
  }
  const content = await fs.readFile(args.cookieFile, 'utf8');
  const parsed = JSON.parse(content) as unknown;
  const record = Object.prototype.toString.call(parsed) === '[object Object]' ? (parsed as JsonRecord) : {};
  const directToken = getString(record.NOCOBASE_TOKEN || record.token || record.sessionToken);
  if (directToken) {
    return directToken;
  }
  const origins = Array.isArray(record.origins) ? record.origins : [];
  for (const origin of origins) {
    const originRecord = Object.prototype.toString.call(origin) === '[object Object]' ? (origin as JsonRecord) : {};
    const localStorageItems = Array.isArray(originRecord.localStorage) ? originRecord.localStorage : [];
    for (const item of localStorageItems) {
      const itemRecord = Object.prototype.toString.call(item) === '[object Object]' ? (item as JsonRecord) : {};
      if (getString(itemRecord.name) === 'NOCOBASE_TOKEN') {
        return getString(itemRecord.value);
      }
    }
  }
  const cookies = Array.isArray(record.cookies) ? record.cookies : [];
  for (const cookie of cookies) {
    const cookieRecord = Object.prototype.toString.call(cookie) === '[object Object]' ? (cookie as JsonRecord) : {};
    if (['NOCOBASE_TOKEN', 'token'].includes(getString(cookieRecord.name))) {
      return getString(cookieRecord.value);
    }
  }
  return '';
}

async function getAdminToken(args: StressBrowserArgs) {
  if (args.sessionToken) {
    return args.sessionToken;
  }
  const cookieToken = await loadTokenFromCookieFile(args);
  if (cookieToken) {
    return cookieToken;
  }
  if (!args.adminEmail || !args.adminPassword) {
    throw new Error('--admin-email/--admin-password, --session-token, or --cookie-file is required');
  }
  return await signIn({
    baseUrl: args.serverUrl,
    adminEmail: args.adminEmail,
    adminPassword: args.adminPassword,
  });
}

async function ensureStressRole(serverUrl: string, adminToken: string) {
  const values = {
    name: STRESS_ROLE_NAME,
    title: 'Agent Gateway Terminal Stress',
    snippets: ['agentGateway.readRuns', 'agentGateway.readRunDetails', 'agentGateway.readTerminal'],
    strategy: {
      actions: [],
    },
  };
  const existing = await findOneByFilter(serverUrl, adminToken, 'roles', { name: STRESS_ROLE_NAME });
  if (existing) {
    await requestJson<JsonRecord>(serverUrl, `/api/roles:update/${encodeURIComponent(STRESS_ROLE_NAME)}`, {
      method: 'POST',
      token: adminToken,
      body: values,
    });
    return;
  }
  await requestJson<JsonRecord>(serverUrl, '/api/roles:create', {
    method: 'POST',
    token: adminToken,
    body: values,
  });
}

async function waitForJwtIatAfterPasswordWrite() {
  const delayMs = JWT_IAT_SAFETY_DELAY_MS - (Date.now() % 1000);
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function signInStressUser(serverUrl: string, email: string) {
  const data = await requestJson<JsonRecord>(serverUrl, '/api/auth:signIn', {
    method: 'POST',
    body: {
      account: email,
      password: STRESS_USER_PASSWORD,
    },
  });
  const token = getString(data.token);
  if (!token) {
    throw new Error(`Stress user ${email} sign-in did not return a token`);
  }
  await requestJson<JsonRecord>(serverUrl, '/api/auth:check', {
    token,
  });
  return token;
}

async function canSignInStressUser(serverUrl: string, email: string) {
  try {
    await signInStressUser(serverUrl, email);
    return true;
  } catch {
    return false;
  }
}

async function ensureStressUser(serverUrl: string, adminToken: string, index: number) {
  const email = `agent-gateway-terminal-stress-${index}@example.com`;
  const username = `agent-gateway-terminal-stress-${index}`;
  const baseValues = {
    email,
    username,
    nickname: `Agent Gateway Terminal Stress ${index}`,
    roles: [STRESS_USER_ROLE_NAME],
  };
  const existing = await findOneByFilter(serverUrl, adminToken, 'users', { email });
  let userId = getString(existing?.id);
  let passwordWasWritten = false;
  if (existing) {
    await requestJson<JsonRecord>(serverUrl, `/api/users:update/${encodeURIComponent(userId)}`, {
      method: 'POST',
      token: adminToken,
      body: baseValues,
    });
    if (!(await canSignInStressUser(serverUrl, email))) {
      await requestJson<JsonRecord>(serverUrl, `/api/users:update/${encodeURIComponent(userId)}`, {
        method: 'POST',
        token: adminToken,
        body: {
          password: STRESS_USER_PASSWORD,
        },
      });
      passwordWasWritten = true;
    }
  } else {
    await requestJson<JsonRecord>(serverUrl, '/api/users:create', {
      method: 'POST',
      token: adminToken,
      body: {
        ...baseValues,
        password: STRESS_USER_PASSWORD,
      },
    });
    passwordWasWritten = true;
    const created = await findOneByFilter(serverUrl, adminToken, 'users', { email });
    userId = getString(created?.id);
  }
  if (!userId) {
    throw new Error(`Stress user ${index} could not be read back`);
  }
  await requestJson<JsonRecord>(serverUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
    method: 'POST',
    token: adminToken,
    body: {
      values: [STRESS_USER_ROLE_NAME],
    },
  });
  const bindingFilter = {
    userId,
    roleName: STRESS_USER_ROLE_NAME,
  };
  const existingBinding = await findOneByFilter(serverUrl, adminToken, 'rolesUsers', bindingFilter);
  if (existingBinding) {
    const search = new URLSearchParams();
    search.set('filter', JSON.stringify(bindingFilter));
    await requestJson<JsonRecord>(serverUrl, `/api/rolesUsers:update?${search.toString()}`, {
      method: 'POST',
      token: adminToken,
      body: {
        default: true,
      },
    });
  } else {
    await requestJson<JsonRecord>(serverUrl, '/api/rolesUsers:create', {
      method: 'POST',
      token: adminToken,
      body: {
        ...bindingFilter,
        default: true,
      },
    });
  }
  if (passwordWasWritten) {
    await waitForJwtIatAfterPasswordWrite();
  }
  return await signInStressUser(serverUrl, email);
}

async function createStreamTickets(serverUrl: string, token: string, runId: string, count: number) {
  return await Promise.all(
    Array.from({ length: count }, async (_value, index) => {
      const ticket = await requestJson<JsonRecord>(
        serverUrl,
        `/api/agent-gateway/runs/${encodeURIComponent(runId)}/terminal-stream-tickets:create`,
        {
          method: 'POST',
          token,
          body: {},
        },
      );
      const ticketValue = getString(ticket.ticket);
      const ticketProof = getString(ticket.ticketProof);
      const authProof = getString(ticket.authProof);
      const authenticator = getString(ticket.authenticator) || 'basic';
      const role = getString(ticket.role) || undefined;
      if (!ticketValue || !ticketProof) {
        const missingFields = [ticketValue ? '' : 'ticket', ticketProof ? '' : 'ticketProof'].filter(Boolean);
        throw new Error(
          `Stream ticket create response is invalid for run ${runId} at index ${index}: missing ${missingFields.join(
            ', ',
          )}`,
        );
      }
      return {
        ticket: ticketValue,
        ticketProof,
        authProof,
        authenticator,
        role,
      };
    }),
  );
}

async function openSubscriptions(page: Page, options: { wsUrl: string; runId: string; tickets: StreamTicket[] }) {
  return await page.evaluate(
    async ({
      browserAuthenticatorProtocolPrefix,
      browserAuthProofProtocolPrefix,
      browserRoleProtocolPrefix,
      browserSubprotocol,
      browserTicketProofProtocolPrefix,
      browserTicketProtocolPrefix,
      protocol,
      wsUrl,
      runId,
      tickets,
    }) => {
      type StoredSocketWindow = Window & {
        __agentGatewayStressSockets?: WebSocket[];
      };
      const encodeProtocolValue = (value: string) => {
        const bytes = new TextEncoder().encode(value);
        let binary = '';
        for (const byte of bytes) {
          binary += String.fromCharCode(byte);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      };
      const storedWindow = window as StoredSocketWindow;
      storedWindow.__agentGatewayStressSockets = storedWindow.__agentGatewayStressSockets || [];
      const results = await Promise.all(
        tickets.map(async (ticket, index) => {
          return await new Promise<{ type: string; code?: string }>((resolve) => {
            const protocols = [
              browserSubprotocol,
              `${browserTicketProtocolPrefix}${encodeProtocolValue(ticket.ticket)}`,
              `${browserTicketProofProtocolPrefix}${encodeProtocolValue(ticket.ticketProof)}`,
              `${browserAuthenticatorProtocolPrefix}${encodeProtocolValue(ticket.authenticator || 'basic')}`,
            ];
            if (ticket.authProof) {
              protocols.push(`${browserAuthProofProtocolPrefix}${encodeProtocolValue(ticket.authProof)}`);
            }
            if (ticket.role) {
              protocols.push(`${browserRoleProtocolPrefix}${encodeProtocolValue(ticket.role)}`);
            }
            const socket = new WebSocket(wsUrl, protocols);
            storedWindow.__agentGatewayStressSockets?.push(socket);
            const requestId = `stress-subscribe-${Date.now()}-${Math.random().toString(16).slice(2)}-${index}`;
            const timer = window.setTimeout(() => {
              resolve({ type: 'timeout' });
            }, 8000);
            socket.onopen = () => {
              socket.send(
                JSON.stringify({
                  type: 'browser.subscribe',
                  protocol,
                  requestId,
                  runId,
                  lastOffset: 0,
                }),
              );
            };
            socket.onmessage = (event) => {
              let frame: { type?: string; requestId?: string; code?: string } = {};
              try {
                frame = JSON.parse(String(event.data)) as { type?: string; requestId?: string; code?: string };
              } catch {
                return;
              }
              if (frame.requestId !== requestId) {
                return;
              }
              window.clearTimeout(timer);
              resolve({
                type: frame.type || 'unknown',
                code: frame.code,
              });
            };
            socket.onerror = () => {
              window.clearTimeout(timer);
              resolve({ type: 'socket-error' });
            };
          });
        }),
      );
      return {
        requested: tickets.length,
        ackCount: results.filter((result) => result.type === 'ack').length,
        errorCodes: results.map((result) => result.code).filter(Boolean) as string[],
        timedOut: results.filter((result) => result.type === 'timeout').length,
      };
    },
    {
      browserAuthenticatorProtocolPrefix: TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX,
      browserAuthProofProtocolPrefix: TERMINAL_STREAM_BROWSER_AUTH_PROOF_PROTOCOL_PREFIX,
      browserRoleProtocolPrefix: TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX,
      browserTicketProtocolPrefix: TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
      browserTicketProofProtocolPrefix: TERMINAL_STREAM_BROWSER_TICKET_PROOF_PROTOCOL_PREFIX,
      browserSubprotocol: TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
      protocol: TERMINAL_PROTOCOL,
      wsUrl: options.wsUrl,
      runId: options.runId,
      tickets: options.tickets,
    },
  );
}

async function closePageSockets(page: Page) {
  await page.evaluate(() => {
    type StoredSocketWindow = Window & {
      __agentGatewayStressSockets?: WebSocket[];
    };
    const storedWindow = window as StoredSocketWindow;
    for (const socket of storedWindow.__agentGatewayStressSockets || []) {
      socket.close();
    }
    storedWindow.__agentGatewayStressSockets = [];
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const adminToken = await getAdminToken(args);
  const browser = await chromium.launch({ headless: !args.headed });
  const pages: Page[] = [];
  const results: BrowserSubscriptionResult[] = [];

  try {
    if (args.limitMode === 'per-run') {
      await ensureStressRole(args.serverUrl, adminToken);
    }
    const userTokens =
      args.limitMode === 'per-user'
        ? [adminToken]
        : await Promise.all(
            Array.from({ length: args.tempUserCount }, async (_value, index) => {
              return await ensureStressUser(args.serverUrl, adminToken, index + 1);
            }),
          );
    for (const [index, token] of userTokens.entries()) {
      const context = await browser.newContext();
      const page = await context.newPage();
      pages.push(page);
      await page.goto(args.serverUrl, { waitUntil: 'domcontentloaded' });
      const count = args.limitMode === 'per-user' ? args.subscriptions : args.subscriptionsPerUser;
      const tickets = await createStreamTickets(args.serverUrl, token, args.runId, count);
      const result = await openSubscriptions(page, {
        wsUrl: buildWsUrl(args.serverUrl),
        runId: args.runId,
        tickets,
      });
      results.push(result);
      if (result.errorCodes.includes(args.expectError)) {
        break;
      }
      if (args.limitMode === 'per-user' && index === 0) {
        break;
      }
    }
    const observedErrors = results.flatMap((result) => result.errorCodes);
    const output = {
      runId: args.runId,
      limitMode: args.limitMode,
      requestedSubscriptions: results.reduce((sum, result) => sum + result.requested, 0),
      ackCount: results.reduce((sum, result) => sum + result.ackCount, 0),
      timedOut: results.reduce((sum, result) => sum + result.timedOut, 0),
      observedErrors,
      expectError: args.expectError,
      passed: observedErrors.includes(args.expectError),
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    if (!output.passed) {
      throw new Error(`Expected ${args.expectError}, observed ${observedErrors.join(', ') || 'no errors'}`);
    }
  } finally {
    await Promise.all(pages.map((page) => closePageSockets(page).catch(() => {})));
    await browser.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
