/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import WebSocket from 'ws';

import {
  TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN,
  TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER,
  TERMINAL_MAX_DAEMON_STREAM_BINDINGS_PER_NODE,
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES,
  TERMINAL_SERVER_MAX_RAW_FRAME_BYTES,
  TerminalFrame,
} from '../../shared/terminalStreamProtocol';
import PluginAgentGatewayServer from '../plugin';
import {
  claimRun,
  createBrowserWebSocketWithTicket,
  createQueuedRun,
  createRunner,
  createTerminalStreamServer,
  createUserWithSnippets,
  createWebSocket,
  sendBrowserSubscribeFrame,
  sendFrame,
  waitForFrame,
  waitForOpen,
} from './helpers/terminalStreamHarness';

async function createApp() {
  return await createMockServer({
    plugins: [
      'system-settings',
      'field-sort',
      'users',
      'departments',
      'auth',
      'acl',
      'data-source-manager',
      'error-handler',
      [PluginAgentGatewayServer, { packageName: '@nocobase/plugin-agent-gateway' }],
    ],
  });
}

async function getRootUserId(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({
    filter: {
      'roles.name': 'root',
    },
  });
  expect(rootUser).toBeTruthy();
  return rootUser?.get('id') as string | number;
}

async function subscribeBrowser(
  app: MockServer,
  serverUrl: string,
  options: {
    userId: string | number;
    runId: string;
    requestId: string;
    lastOffset?: number;
    roleName?: string;
  },
) {
  const { browser, ticket } = await createBrowserWebSocketWithTicket(app, serverUrl, {
    userId: options.userId,
    runId: options.runId,
    roleName: options.roleName,
  });
  await waitForOpen(browser);
  sendBrowserSubscribeFrame(browser, ticket, {
    runId: options.runId,
    requestId: options.requestId,
    lastOffset: options.lastOffset,
  });
  return {
    browser,
    frame: await waitForFrame(browser, (frame) => frame.type === 'ack' || frame.type === 'error'),
  };
}

async function registerDaemon(ws: WebSocket, nodeId: string) {
  await waitForOpen(ws);
  sendFrame(ws, {
    type: 'daemon.register',
    protocol: TERMINAL_PROTOCOL,
    requestId: 'daemon-register',
    nodeId,
    capabilities: {
      terminalStream: true,
    },
  });
  expect(await waitForFrame(ws, (frame) => frame.type === 'ack' || frame.type === 'error')).toMatchObject({
    type: 'ack',
    requestId: 'daemon-register',
  });
}

async function waitForCloseCode(ws: WebSocket) {
  return await new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket close timed out')), 5000);
    ws.once('close', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
    ws.once('error', () => {
      // The client may observe a socket error before close for protocol-level transport rejection.
    });
  });
}

async function bindDaemonRun(
  daemon: WebSocket,
  options: {
    runId: string;
    requestId: string;
    sessionName: string;
    claimToken: string;
    claimAttempt: number;
    leaseVersion: number;
  },
) {
  sendFrame(daemon, {
    type: 'daemon.bindRun',
    protocol: TERMINAL_PROTOCOL,
    requestId: options.requestId,
    runId: options.runId,
    sessionName: options.sessionName,
    startOffset: 0,
    claimToken: options.claimToken,
    claimAttempt: options.claimAttempt,
    leaseVersion: options.leaseVersion,
  });
  expect(await waitForFrame(daemon, (frame) => frame.type === 'ack' || frame.type === 'error')).toMatchObject({
    type: 'ack',
    requestId: options.requestId,
  });
}

describe('terminal stream reliability limits', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('rejects browser subscriptions beyond the per-user limit', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-limit-user-node' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-limit-user-run');
    const server = await createTerminalStreamServer(app);
    const rootUserId = await getRootUserId(app);
    const browsers: WebSocket[] = [];

    try {
      for (let index = 0; index < TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER; index += 1) {
        const { browser, frame } = await subscribeBrowser(app, server.wsUrl, {
          userId: rootUserId,
          runId,
          requestId: `subscribe-user-${index}`,
        });
        browsers.push(browser);
        expect(frame).toMatchObject({
          type: 'ack',
        });
      }
      const rejectedResult = await subscribeBrowser(app, server.wsUrl, {
        userId: rootUserId,
        runId,
        requestId: 'subscribe-user-over-limit',
      });
      const rejected = rejectedResult.browser;
      browsers.push(rejected);
      expect(rejectedResult.frame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_SUBSCRIPTION_LIMIT',
        requestId: 'subscribe-user-over-limit',
      });
    } finally {
      browsers.forEach((browser) => browser.close());
      await server.close();
    }
  });

  it('reserves per-user subscription capacity before delayed reconnect snapshots resolve', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-pending-limit-user-node' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-pending-limit-user-run');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const rootUserId = await getRootUserId(app);
    const browsers: WebSocket[] = [];

    try {
      await registerDaemon(daemon, runner.nodeId);
      await bindDaemonRun(daemon, {
        runId,
        requestId: 'bind-pending-user',
        sessionName: 'agw_terminal_stream_pending_limit_user',
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });

      const browserTickets = await Promise.all(
        Array.from({ length: TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER + 1 }, async (_value, index) =>
          createBrowserWebSocketWithTicket(app, server.wsUrl, {
            userId: rootUserId,
            runId,
          }),
        ),
      );
      browsers.push(...browserTickets.map(({ browser }) => browser));
      await Promise.all(browsers.map((browser) => waitForOpen(browser)));
      browserTickets.forEach(({ browser, ticket }, index) => {
        sendBrowserSubscribeFrame(browser, ticket, {
          runId,
          requestId: `subscribe-pending-user-${index}`,
          lastOffset: 0,
        });
      });
      const frames = await Promise.all(
        browsers.map((browser) => waitForFrame(browser, (frame) => frame.type === 'ack' || frame.type === 'error')),
      );

      expect(frames.filter((frame) => frame.type === 'ack')).toHaveLength(TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER);
      expect(frames.filter((frame) => frame.type === 'error')).toEqual([
        expect.objectContaining({
          type: 'error',
          code: 'TERMINAL_SUBSCRIPTION_LIMIT',
        }),
      ]);
    } finally {
      browsers.forEach((browser) => browser.close());
      daemon.close();
      await server.close();
    }
  });

  it('rejects browser subscriptions beyond the per-run limit without first hitting per-user limits', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-limit-run-node' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-limit-run');
    const server = await createTerminalStreamServer(app);
    const browsers: WebSocket[] = [];

    try {
      let opened = 0;
      for (let userIndex = 0; opened < TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN; userIndex += 1) {
        const user = await createUserWithSnippets(app, `terminal-stream-limit-run-user-${userIndex}`, [
          'agentGateway.readTerminal',
        ]);
        for (
          let subscriptionIndex = 0;
          subscriptionIndex < TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER - 1 &&
          opened < TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN;
          subscriptionIndex += 1
        ) {
          const { browser, frame } = await subscribeBrowser(app, server.wsUrl, {
            userId: user.userId,
            roleName: user.roleName,
            runId,
            requestId: `subscribe-run-${opened}`,
          });
          browsers.push(browser);
          expect(frame).toMatchObject({
            type: 'ack',
          });
          opened += 1;
        }
      }

      const overflowUser = await createUserWithSnippets(app, 'terminal-stream-limit-run-user-overflow', [
        'agentGateway.readTerminal',
      ]);
      const rejectedResult = await subscribeBrowser(app, server.wsUrl, {
        userId: overflowUser.userId,
        roleName: overflowUser.roleName,
        runId,
        requestId: 'subscribe-run-over-limit',
      });
      const rejected = rejectedResult.browser;
      browsers.push(rejected);
      expect(rejectedResult.frame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_SUBSCRIPTION_LIMIT',
        requestId: 'subscribe-run-over-limit',
      });
    } finally {
      browsers.forEach((browser) => browser.close());
      await server.close();
    }
  });

  it('reserves per-run subscription capacity before delayed reconnect snapshots resolve', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-pending-limit-run-node' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-pending-limit-run');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browsers: WebSocket[] = [];

    try {
      await registerDaemon(daemon, runner.nodeId);
      await bindDaemonRun(daemon, {
        runId,
        requestId: 'bind-pending-run',
        sessionName: 'agw_terminal_stream_pending_limit_run',
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });

      const subscribers: Array<{ userId: string | number; roleName: string }> = [];
      for (let userIndex = 0; subscribers.length < TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN + 1; userIndex += 1) {
        const user = await createUserWithSnippets(app, `terminal-stream-pending-limit-run-user-${userIndex}`, [
          'agentGateway.readTerminal',
        ]);
        for (
          let subscriptionIndex = 0;
          subscriptionIndex < TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_USER - 1 &&
          subscribers.length < TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN + 1;
          subscriptionIndex += 1
        ) {
          subscribers.push(user);
        }
      }

      const browserTickets = await Promise.all(
        subscribers.map((subscriber) =>
          createBrowserWebSocketWithTicket(app, server.wsUrl, {
            userId: subscriber.userId,
            roleName: subscriber.roleName,
            runId,
          }),
        ),
      );
      browsers.push(...browserTickets.map(({ browser }) => browser));
      await Promise.all(browsers.map((browser) => waitForOpen(browser)));
      browserTickets.forEach(({ browser, ticket }, index) => {
        sendBrowserSubscribeFrame(browser, ticket, {
          runId,
          requestId: `subscribe-pending-run-${index}`,
          lastOffset: 0,
        });
      });
      const frames = await Promise.all(
        browsers.map((browser) => waitForFrame(browser, (frame) => frame.type === 'ack' || frame.type === 'error')),
      );

      expect(frames.filter((frame) => frame.type === 'ack')).toHaveLength(TERMINAL_MAX_BROWSER_SUBSCRIPTIONS_PER_RUN);
      expect(frames.filter((frame) => frame.type === 'error')).toEqual([
        expect.objectContaining({
          type: 'error',
          code: 'TERMINAL_SUBSCRIPTION_LIMIT',
        }),
      ]);
    } finally {
      browsers.forEach((browser) => browser.close());
      daemon.close();
      await server.close();
    }
  });

  it('rejects daemon stream bindings beyond the per-node limit', async () => {
    const runner = await createRunner(app, {
      nodeKey: 'terminal-stream-limit-daemon-node',
      maxConcurrency: TERMINAL_MAX_DAEMON_STREAM_BINDINGS_PER_NODE + 1,
    });
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });

    try {
      await registerDaemon(daemon, runner.nodeId);
      for (let index = 0; index < TERMINAL_MAX_DAEMON_STREAM_BINDINGS_PER_NODE; index += 1) {
        const runId = await createQueuedRun(app, runner, `terminal-stream-limit-daemon-run-${index}`);
        const lease = await claimRun(app, runner, runId);
        sendFrame(daemon, {
          type: 'daemon.bindRun',
          protocol: TERMINAL_PROTOCOL,
          requestId: `bind-${index}`,
          runId,
          sessionName: `agw_terminal_stream_limit_daemon_${index}`,
          startOffset: 0,
          claimToken: lease.claimToken,
          claimAttempt: lease.claimAttempt,
          leaseVersion: lease.leaseVersion,
        });
        expect(await waitForFrame(daemon, (frame) => frame.type === 'ack' || frame.type === 'error')).toMatchObject({
          type: 'ack',
          requestId: `bind-${index}`,
        });
      }

      const overflowRunId = await createQueuedRun(app, runner, 'terminal-stream-limit-daemon-run-overflow');
      const overflowLease = await claimRun(app, runner, overflowRunId);
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-overflow',
        runId: overflowRunId,
        sessionName: 'agw_terminal_stream_limit_daemon_overflow',
        startOffset: 0,
        claimToken: overflowLease.claimToken,
        claimAttempt: overflowLease.claimAttempt,
        leaseVersion: overflowLease.leaseVersion,
      });
      expect(await waitForFrame(daemon, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_SUBSCRIPTION_LIMIT',
        requestId: 'bind-overflow',
      });
    } finally {
      daemon.close();
      await server.close();
    }
  });

  it('rejects oversized decoded terminal frames separately from subscription limits', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-limit-oversize-node' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-limit-oversize-run');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const oversizedPayload = Buffer.alloc(TERMINAL_SERVER_MAX_DECODED_PAYLOAD_BYTES + 1, 'O');

    try {
      await registerDaemon(daemon, runner.nodeId);
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-oversize',
        runId,
        sessionName: 'agw_terminal_stream_limit_oversize',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      expect(await waitForFrame(daemon, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'bind-oversize',
      });

      sendFrame(daemon, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_stream_limit_oversize',
        offsetStart: 0,
        offsetEnd: oversizedPayload.byteLength,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: oversizedPayload.toString('base64'),
      });
      const frame = (await waitForFrame(daemon, (candidate) => candidate.type === 'error')) as TerminalFrame;
      expect(frame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_FRAME_TOO_LARGE',
      });
    } finally {
      daemon.close();
      await server.close();
    }
  });

  it('closes raw websocket frames beyond the transport payload limit', async () => {
    const server = await createTerminalStreamServer(app);
    const ws = createWebSocket(server.wsUrl);

    try {
      await waitForOpen(ws);
      const closePromise = waitForCloseCode(ws);
      ws.send('X'.repeat(TERMINAL_SERVER_MAX_RAW_FRAME_BYTES + 1));
      expect(await closePromise).toBe(1009);
    } finally {
      ws.close();
      await server.close();
    }
  });
});
