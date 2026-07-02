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

import { TERMINAL_STREAM_WS_PATH, TerminalFrame } from '../../../shared/terminalStreamProtocol';
import { TerminalStreamBroker } from '../../actions/terminalStreamBroker';
import { createNodeToken, toStoredTokenFields } from '../../security';

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

interface AuthManagerForToken {
  tokenController: {
    add(options: { userId: string | number }): Promise<{ jti: string }>;
    getConfig(): Promise<{ tokenExpirationTime: number }>;
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

export async function createBrowserToken(app: MockServer, userId: string | number, roleName?: string) {
  const authManager = app.authManager as unknown as AuthManagerForToken;
  const tokenInfo = await authManager.tokenController.add({ userId });
  const expiresIn = (await authManager.tokenController.getConfig()).tokenExpirationTime;
  return jwt.sign(
    {
      userId,
      temp: true,
      roleName,
      signInTime: Date.now(),
    },
    authManager.jwt.secret(),
    {
      jwtid: tokenInfo.jti,
      expiresIn,
    },
  );
}

export async function createTerminalStreamServer(app: MockServer) {
  const broker = new TerminalStreamBroker(app);
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
      broker.unregister();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}

export function createWebSocket(url: string, options: { token?: string; nodeToken?: string } = {}) {
  const headers: Record<string, string> = {};
  if (options.nodeToken) {
    headers.Authorization = `Bearer ${options.nodeToken}`;
  }
  const connectUrl = options.token ? `${url}?token=${encodeURIComponent(options.token)}&authenticator=basic` : url;
  const ws = new WebSocket(connectUrl, {
    headers,
  });
  return ws;
}

export async function waitForOpen(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket open timed out')), 5000);
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
    }, 5000);
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
    .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs:claim`)
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
