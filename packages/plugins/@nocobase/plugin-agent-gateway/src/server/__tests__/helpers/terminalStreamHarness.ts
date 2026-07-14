/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import http from 'http';
import { AddressInfo } from 'net';

import type { MockServer } from '@nocobase/test';
import jwt from 'jsonwebtoken';
import WebSocket from 'ws';

import {
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
  TERMINAL_STREAM_WS_PATH,
  TerminalFrame,
} from '../../../shared/terminalStreamProtocol';
import { TerminalStreamBroker } from '../../actions/terminalStreamBroker';
import type { TerminalStreamTransport } from '../../services/terminalStreamTransport';
import { createNodeToken, toStoredTokenFields } from '../../security';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../../shared/apiContract';

function getTestApiPath(action: Parameters<typeof getAgentGatewayApiUrl>[0], targetKey?: unknown) {
  return `/${getAgentGatewayApiUrl(action, targetKey === undefined ? undefined : String(targetKey))}`;
}

export interface TestRunner {
  nodeId: string;
  nodeToken: string;
  profileId: string;
}

export interface ClaimedRun {
  runId: string;
  runCode: string;
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
}

export interface TestBrowserAuthSession {
  authToken: string;
  authenticator: string;
  role?: string;
}

interface TestTokenInfo {
  jti: string;
}

interface TestTokenConfig {
  tokenExpirationTime: string | number;
}

interface TestAuthManager {
  tokenController: {
    add(options: { userId: string | number }): Promise<TestTokenInfo>;
    getConfig(): Promise<TestTokenConfig>;
  };
  jwt: {
    secret(): string;
  };
}

function getRecord(value: unknown) {
  return Object.prototype.toString.call(value) === '[object Object]' ? (value as Record<string, unknown>) : {};
}

function getResponseData(response: { body: { data?: unknown } }) {
  const body = getRecord(response.body);
  const data = body.data;
  if (
    Object.prototype.toString.call(data) === '[object Object]' &&
    Object.prototype.hasOwnProperty.call(data, 'data')
  ) {
    return getRecord(data).data;
  }
  return data === undefined ? body : data;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value);
}

function getTestAuthManager(app: MockServer) {
  return app.authManager as unknown as TestAuthManager;
}

export async function createBrowserAuthSession(
  app: MockServer,
  options: { userId: string | number; roleName?: string },
): Promise<TestBrowserAuthSession> {
  const authManager = getTestAuthManager(app);
  const tokenInfo = await authManager.tokenController.add({ userId: options.userId });
  const config = await authManager.tokenController.getConfig();
  const authToken = jwt.sign(
    {
      userId: options.userId,
      temp: true,
      roleName: options.roleName,
      signInTime: Date.now(),
    },
    authManager.jwt.secret(),
    {
      jwtid: tokenInfo.jti,
      expiresIn: config.tokenExpirationTime,
    },
  );
  return {
    authToken,
    authenticator: 'basic',
    role: options.roleName,
  };
}

function encodeWebSocketProtocolValue(value?: string) {
  if (!value) {
    return '';
  }
  return Buffer.from(value, 'utf8').toString('base64url');
}

function buildBrowserStreamProtocols(streamTicket?: { ticket: string }) {
  const protocols = [TERMINAL_STREAM_BROWSER_SUBPROTOCOL];
  if (streamTicket?.ticket) {
    protocols.push(
      `${TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(streamTicket.ticket)}`,
    );
  }
  return protocols;
}

export async function createBrowserStreamTicket(
  app: MockServer,
  options: { userId: string | number; runId: string; roleName?: string },
) {
  const browserAuthSession = await createBrowserAuthSession(app, {
    userId: options.userId,
    roleName: options.roleName,
  });
  const agent = app
    .agent()
    .auth(browserAuthSession.authToken, { type: 'bearer' })
    .set('X-Authenticator', browserAuthSession.authenticator);
  let request = agent.post(
    getTestApiPath(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, encodeURIComponent(options.runId)),
  );
  if (options.roleName) {
    request = request.set('X-Role', options.roleName);
  }
  const response = await request.send({});
  if (response.status !== 200) {
    throw new Error(`Stream ticket create failed with HTTP ${response.status}: ${JSON.stringify(response.body)}`);
  }
  const data = getRecord(getResponseData(response));
  const ticket = getString(data.ticket);
  if (!ticket) {
    throw new Error(`Stream ticket create response is invalid: ${JSON.stringify(response.body)}`);
  }
  return {
    ticket,
    browserAuthSession,
  };
}

export async function sendBrowserSubscribeWithTicket(
  app: MockServer,
  ws: WebSocket,
  options: {
    userId: string | number;
    runId: string;
    requestId: string;
    lastOffset?: number;
    roleName?: string;
  },
) {
  ws.close();
  throw new Error(
    `sendBrowserSubscribeWithTicket is incompatible with stream-ticket websocket subprotocol auth for run ${options.runId}; use createBrowserWebSocketWithTicket instead.`,
  );
}

export async function createBrowserWebSocketWithTicket(
  app: MockServer,
  url: string,
  options: {
    userId: string | number;
    runId: string;
    roleName?: string;
  },
) {
  const ticket = await createBrowserStreamTicket(app, {
    userId: options.userId,
    runId: options.runId,
    roleName: options.roleName,
  });
  const browser = createWebSocket(url, {
    streamTicket: ticket,
  });
  return {
    browser,
    ticket,
  };
}

export function sendBrowserSubscribeFrame(
  ws: WebSocket,
  _ticket: Awaited<ReturnType<typeof createBrowserStreamTicket>>,
  options: {
    runId: string;
    requestId: string;
    lastOffset?: number;
  },
) {
  sendFrame(ws, {
    type: 'browser.subscribe',
    protocol: TERMINAL_PROTOCOL,
    requestId: options.requestId,
    runId: options.runId,
    lastOffset: options.lastOffset,
  });
}

export async function createTerminalStreamServer(app: MockServer, transport?: TerminalStreamTransport) {
  const broker = new TerminalStreamBroker(app, transport);
  const server = http.createServer();
  server.on('upgrade', (request, socket, head) => {
    const handled = broker.handleUpgrade(request, socket, head);
    if (!handled) {
      socket.destroy();
    }
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  const serverUrl = `http://127.0.0.1:${address.port}`;
  return {
    serverUrl,
    wsUrl: `ws://127.0.0.1:${address.port}${TERMINAL_STREAM_WS_PATH}`,
    async close() {
      await broker.unregister();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}

export function createWebSocket(
  url: string,
  options: {
    nodeToken?: string;
    authSession?: TestBrowserAuthSession;
    streamTicket?: { ticket: string };
    origin?: string;
    forwardedHost?: string;
    forwardedPort?: string;
    forwardedProto?: string;
    forwarded?: string;
  } = {},
) {
  const headers: Record<string, string> = {};
  let protocols: string[] | undefined;
  if (options.origin) {
    headers.Origin = options.origin;
  }
  if (options.forwardedHost) {
    headers['X-Forwarded-Host'] = options.forwardedHost;
  }
  if (options.forwardedPort) {
    headers['X-Forwarded-Port'] = options.forwardedPort;
  }
  if (options.forwardedProto) {
    headers['X-Forwarded-Proto'] = options.forwardedProto;
  }
  if (options.forwarded) {
    headers.Forwarded = options.forwarded;
  }
  if (options.nodeToken) {
    headers.Authorization = `Bearer ${options.nodeToken}`;
  }
  if (options.streamTicket) {
    protocols = buildBrowserStreamProtocols(options.streamTicket);
  } else if (options.authSession) {
    headers.Authorization = `Bearer ${options.authSession.authToken}`;
    headers['X-Authenticator'] = options.authSession.authenticator;
    if (options.authSession.role) {
      headers['X-Role'] = options.authSession.role;
    }
  }
  const wsOptions = {
    headers,
  };
  return protocols ? new WebSocket(url, protocols, wsOptions) : new WebSocket(url, wsOptions);
}

export async function waitForOpen(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket open timed out')), 10_000);
    ws.once('open', () => {
      clearTimeout(timer);
      resolve();
    });
    ws.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

export async function waitForFrame(
  ws: WebSocket,
  predicate: (frame: TerminalFrame) => boolean = () => true,
): Promise<TerminalFrame> {
  return await new Promise<TerminalFrame>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Terminal stream frame timed out'));
    }, 10_000);
    const onMessage = (data: WebSocket.RawData) => {
      const frame = JSON.parse(data.toString()) as TerminalFrame;
      if (!predicate(frame)) {
        return;
      }
      clearTimeout(timer);
      ws.off('message', onMessage);
      resolve(frame);
    };
    ws.on('message', onMessage);
  });
}

export function sendFrame(ws: WebSocket, frame: TerminalFrame | Record<string, unknown>) {
  ws.send(JSON.stringify(frame));
}

export async function createRunner(
  app: MockServer,
  options: { nodeKey?: string; maxConcurrency?: number; terminalControl?: boolean } = {},
) {
  const nodeKey = options.nodeKey || `terminal-stream-node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const nodeToken = createNodeToken();
  const now = new Date();
  const node = await app.db.getRepository('agNodes').create({
    values: {
      nodeKey,
      displayName: nodeKey,
      status: 'active',
      authMode: 'node-token',
      ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
      capabilitiesJson: {
        maxConcurrency: options.maxConcurrency || 1,
        terminalStream: true,
        terminal:
          options.terminalControl === false
            ? {
                backend: 'tmux',
                interrupt: false,
                terminate: false,
              }
            : {
                backend: 'tmux',
                interrupt: true,
                terminate: true,
              },
      },
      registeredAt: now,
      lastHeartbeatAt: now,
    },
  });
  const nodeId = String(node.get('id'));
  const profile = await app.db.getRepository('agAgentProfiles').create({
    values: {
      nodeId,
      profileKey: 'fake-success',
      displayName: 'Fake Success',
      agentType: 'code',
      driver: 'fake',
      status: 'active',
      capabilitiesJson: {
        maxConcurrency: options.maxConcurrency || 1,
      },
    },
  });
  return {
    nodeId,
    nodeToken: nodeToken.token,
    profileId: String(profile.get('id')),
  } satisfies TestRunner;
}

export async function createQueuedRun(app: MockServer, runner: TestRunner, runCode: string) {
  const now = new Date();
  const run = await app.db.getRepository('agRuns').create({
    values: {
      runCode,
      status: 'queued',
      claimAttempt: 0,
      leaseVersion: 0,
      cancelRequested: false,
      promptSnapshot: {
        text: `Prompt for ${runCode}`,
      },
      executionPayloadJson: {
        executionPolicyKey: 'fake-success',
        mode: 'fake-success',
      },
      sourceType: 'test',
      requestedAt: now,
      queuedAt: now,
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    },
  });
  return String(run.get('id'));
}

export async function claimRun(app: MockServer, runner: TestRunner, runId: string): Promise<ClaimedRun> {
  const response = await app
    .agent()
    .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.claimRun, runner.nodeId))
    .set('Authorization', `Bearer ${runner.nodeToken}`)
    .send({
      runId,
      profileKey: 'fake-success',
    });
  if (response.status !== 200) {
    throw new Error(`Claim failed with HTTP ${response.status}: ${JSON.stringify(response.body)}`);
  }
  const data = getRecord(getResponseData(response));
  return {
    runId: getString(data.runId),
    runCode: getString(data.runCode),
    claimToken: getString(data.claimToken),
    claimAttempt: getNumber(data.claimAttempt),
    leaseVersion: getNumber(data.leaseVersion),
  };
}

export async function createUserWithSnippets(app: MockServer, username: string, snippets: string[]) {
  const roleName = `${username}-role`;
  await app.db.getRepository('roles').create({
    values: {
      name: roleName,
      snippets,
    },
  });
  const user = await app.db.getRepository('users').create({
    values: {
      username,
      roles: [roleName],
    },
  });
  return {
    userId: user.get('id') as string | number,
    roleName,
  };
}
