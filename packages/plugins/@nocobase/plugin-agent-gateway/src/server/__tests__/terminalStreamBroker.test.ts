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
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  TerminalFrame,
  decodeTerminalPayload,
  encodeTerminalPayload,
} from '../../shared/terminalStreamProtocol';
import PluginAgentGatewayServer from '../plugin';
import {
  claimRun,
  createBrowserStreamTicket,
  createQueuedRun,
  createRunner,
  createTerminalStreamServer,
  createUserWithSnippets,
  createWebSocket,
  sendFrame,
  waitForFrame,
  waitForOpen,
} from './helpers/terminalStreamHarness';

function waitForNoFrame(ws: WebSocket, predicate: (frame: TerminalFrame) => boolean, durationMs: number) {
  return new Promise<boolean>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      resolve(false);
    }, durationMs);
    const onMessage = (data: WebSocket.RawData) => {
      let frame: TerminalFrame;
      try {
        frame = JSON.parse(data.toString()) as TerminalFrame;
      } catch (error) {
        clearTimeout(timer);
        ws.off('message', onMessage);
        reject(error);
        return;
      }
      if (!predicate(frame)) {
        return;
      }
      clearTimeout(timer);
      ws.off('message', onMessage);
      resolve(true);
    };
    ws.on('message', onMessage);
  });
}

function waitForClose(ws: WebSocket) {
  if (ws.readyState === WebSocket.CLOSED) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('close', onClose);
      reject(new Error('WebSocket close timed out'));
    }, 5000);
    const onClose = () => {
      clearTimeout(timer);
      ws.off('close', onClose);
      resolve();
    };
    ws.on('close', onClose);
  });
}

async function createBrowserWithTicket(
  app: MockServer,
  serverUrl: string,
  options: { userId: string | number; runId: string; requestId: string; lastOffset?: number; roleName?: string },
) {
  const ticket = await createBrowserStreamTicket(app, {
    userId: options.userId,
    runId: options.runId,
    roleName: options.roleName,
  });
  const browser = createWebSocket(serverUrl, {
    streamTicket: ticket,
  });
  return {
    browser,
    ticket,
  };
}

function sendBrowserSubscribe(
  ws: WebSocket,
  ticket: Awaited<ReturnType<typeof createBrowserStreamTicket>>,
  options: { runId: string; requestId: string; lastOffset?: number },
) {
  sendFrame(ws, {
    type: 'browser.subscribe',
    protocol: TERMINAL_PROTOCOL,
    requestId: options.requestId,
    runId: options.runId,
    lastOffset: options.lastOffset,
  });
}

describe('terminal stream broker', () => {
  let app: MockServer;
  let rootUserId: string | number;

  beforeEach(async () => {
    app = await createMockServer({
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
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    expect(rootUser).toBeTruthy();
    rootUserId = rootUser.get('id') as string | number;
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('routes fake daemon terminal data to an authorized browser subscriber', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-1' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-1');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);

      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-1',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      expect(await waitForFrame(daemon, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'register-1',
      });

      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-1',
        lastOffset: 0,
      });
      expect(await waitForFrame(browser, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'subscribe-1',
      });

      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-1',
        runId,
        sessionName: 'agw_terminal_stream_broker_run_1',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      expect(await waitForFrame(daemon, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'bind-1',
      });

      sendFrame(daemon, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_stream_broker_run_1',
        offsetStart: 0,
        offsetEnd: 29,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('AGENT_GATEWAY_STREAM_SMOKE_1\n'),
        claimToken: 'ag_claim_should_not_forward',
      });

      const dataFrame = await waitForFrame(browser, (frame) => frame.type === 'terminal.data');
      expect(dataFrame).toMatchObject({
        type: 'terminal.data',
        runId,
        offsetStart: 0,
        offsetEnd: 29,
      });
      expect(decodeTerminalPayload(dataFrame.type === 'terminal.data' ? dataFrame.payload : '')).toContain(
        'AGENT_GATEWAY_STREAM_SMOKE_1',
      );
      expect(Object.prototype.hasOwnProperty.call(dataFrame, 'claimToken')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(dataFrame, 'sessionName')).toBe(false);
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('rejects browser subscription without terminal read permission', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-denied' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-denied');
    const server = await createTerminalStreamServer(app);
    const user = await createUserWithSnippets(app, 'terminal-stream-denied', ['agentGateway.readTerminal']);
    const ticket = await createBrowserStreamTicket(app, {
      userId: user.userId,
      runId,
      roleName: user.roleName,
    });
    await app.db.getRepository('roles').update({
      filterByTk: user.roleName,
      values: {
        snippets: ['agentGateway.readRuns'],
      },
    });
    const browser = createWebSocket(server.wsUrl, {
      streamTicket: ticket,
    });

    try {
      await waitForOpen(browser);
      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-denied',
        runId,
        lastOffset: 0,
      });

      expect(await waitForFrame(browser, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_PERMISSION_DENIED',
        requestId: 'subscribe-denied',
      });
    } finally {
      browser.close();
      await server.close();
    }
  });

  it('rejects a valid node token when another node owns the active run lease', async () => {
    const owner = await createRunner(app, { nodeKey: 'terminal-stream-owner-node' });
    const attacker = await createRunner(app, { nodeKey: 'terminal-stream-attacker-node' });
    const runId = await createQueuedRun(app, owner, 'terminal-stream-broker-run-cross-node');
    const lease = await claimRun(app, owner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: attacker.nodeToken });

    try {
      await waitForOpen(daemon);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-attacker',
        nodeId: attacker.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      expect(await waitForFrame(daemon, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'register-attacker',
      });

      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-attacker',
        runId,
        sessionName: 'agw_terminal_stream_cross_node',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });

      expect(await waitForFrame(daemon, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_LEASE_LOST',
        requestId: 'bind-attacker',
      });
    } finally {
      daemon.close();
      await server.close();
    }
  });

  it('forwards daemon offset gap errors to the requesting browser subscriber', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-gap' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-gap');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-gap',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'register-gap');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-gap',
        runId,
        sessionName: 'agw_terminal_stream_gap',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-gap');

      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-gap',
        lastOffset: 42,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-gap');
      const snapshotRequest = await waitForFrame(daemon, (frame) => frame.type === 'daemon.snapshotRequest');
      expect(snapshotRequest).toMatchObject({
        runId,
        fromOffset: 42,
      });

      sendFrame(daemon, {
        type: 'error',
        protocol: TERMINAL_PROTOCOL,
        requestId: snapshotRequest.type === 'daemon.snapshotRequest' ? snapshotRequest.requestId : '',
        code: 'TERMINAL_OFFSET_GAP',
        message: 'Offset is outside daemon ring buffer',
        details: {
          claimToken: lease.claimToken,
        },
      });

      const errorFrame = await waitForFrame(browser, (frame) => frame.type === 'error');
      expect(errorFrame).toMatchObject({
        code: 'TERMINAL_OFFSET_GAP',
      });
      expect(JSON.stringify(errorFrame)).not.toContain(String(lease.claimToken));
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('delays a reconnecting browser subscription until its daemon snapshot is delivered', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-snapshot-order' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-snapshot-order');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;
    const sessionName = 'agw_terminal_stream_snapshot_order';

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-snapshot-order',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'register-snapshot-order');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-snapshot-order',
        runId,
        sessionName,
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-snapshot-order');

      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-snapshot-order',
        lastOffset: 0,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-snapshot-order');
      const snapshotRequest = await waitForFrame(daemon, (frame) => frame.type === 'daemon.snapshotRequest');

      const priorText = 'before-subscribe\n';
      const duringText = 'during-snapshot\n';
      const afterText = 'after-snapshot\n';
      const priorOffset = Buffer.byteLength(priorText);
      const snapshotOffsetEnd = priorOffset + Buffer.byteLength(duringText);
      sendFrame(daemon, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName,
        offsetStart: priorOffset,
        offsetEnd: snapshotOffsetEnd,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(duringText),
      });
      expect(await waitForNoFrame(browser, (frame) => frame.type === 'terminal.data', 100)).toBe(false);

      sendFrame(daemon, {
        type: 'terminal.snapshot',
        protocol: TERMINAL_PROTOCOL,
        requestId: snapshotRequest.type === 'daemon.snapshotRequest' ? snapshotRequest.requestId : '',
        runId,
        sessionName,
        offsetStart: 0,
        offsetEnd: snapshotOffsetEnd,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(`${priorText}${duringText}`),
      });
      const snapshot = await waitForFrame(browser, (frame) => frame.type === 'terminal.snapshot');
      expect(snapshot).toMatchObject({
        offsetStart: 0,
        offsetEnd: snapshotOffsetEnd,
      });
      expect(Object.prototype.hasOwnProperty.call(snapshot, 'sessionName')).toBe(false);

      sendFrame(daemon, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName,
        offsetStart: snapshotOffsetEnd,
        offsetEnd: snapshotOffsetEnd + Buffer.byteLength(afterText),
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(afterText),
      });
      const data = await waitForFrame(browser, (frame) => frame.type === 'terminal.data');
      expect(decodeTerminalPayload(data.type === 'terminal.data' ? data.payload : '')).toBe(afterText);
      expect(Object.prototype.hasOwnProperty.call(data, 'sessionName')).toBe(false);
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('does not let terminal end overtake a pending reconnect snapshot from the same daemon', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-snapshot-before-end' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-snapshot-before-end');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;
    const sessionName = 'agw_terminal_stream_snapshot_before_end';

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-snapshot-before-end',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'register-snapshot-before-end');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-snapshot-before-end',
        runId,
        sessionName,
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-snapshot-before-end');

      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-snapshot-before-end',
        lastOffset: 0,
      });
      await waitForFrame(
        browser,
        (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-snapshot-before-end',
      );
      const snapshotRequest = await waitForFrame(daemon, (frame) => frame.type === 'daemon.snapshotRequest');

      sendFrame(daemon, {
        type: 'terminal.snapshot',
        protocol: TERMINAL_PROTOCOL,
        requestId: snapshotRequest.type === 'daemon.snapshotRequest' ? snapshotRequest.requestId : '',
        runId,
        sessionName,
        offsetStart: 0,
        offsetEnd: 14,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('snapshot tail\n'),
      });
      sendFrame(daemon, {
        type: 'terminal.end',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName,
        offsetEnd: 14,
        reason: 'completed',
      });

      const first = await waitForFrame(
        browser,
        (frame) => frame.type === 'terminal.snapshot' || frame.type === 'terminal.end',
      );
      const second = await waitForFrame(
        browser,
        (frame) => frame.type === 'terminal.snapshot' || frame.type === 'terminal.end',
      );
      expect(first.type).toBe('terminal.snapshot');
      expect(second.type).toBe('terminal.end');
      expect(Object.prototype.hasOwnProperty.call(first, 'sessionName')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(second, 'sessionName')).toBe(false);
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('closes a reconnecting browser when the daemon disconnects before snapshot response', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-snapshot-daemon-close' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-snapshot-daemon-close');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-snapshot-daemon-close',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(
        daemon,
        (frame) => frame.type === 'ack' && frame.requestId === 'register-snapshot-daemon-close',
      );
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-snapshot-daemon-close',
        runId,
        sessionName: 'agw_terminal_stream_snapshot_daemon_close',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-snapshot-daemon-close');

      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-snapshot-daemon-close',
        lastOffset: 8,
      });
      await waitForFrame(
        browser,
        (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-snapshot-daemon-close',
      );
      await waitForFrame(daemon, (frame) => frame.type === 'daemon.snapshotRequest');

      daemon.close();
      await waitForClose(browser);
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('delivers terminal end to a reconnecting browser while its daemon snapshot is pending', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-end-pending-snapshot' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-end-pending-snapshot');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;
    const sessionName = 'agw_terminal_stream_end_pending_snapshot';

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-end-pending-snapshot',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(
        daemon,
        (frame) => frame.type === 'ack' && frame.requestId === 'register-end-pending-snapshot',
      );
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-end-pending-snapshot',
        runId,
        sessionName,
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-end-pending-snapshot');

      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-end-pending-snapshot',
        lastOffset: 12,
      });
      await waitForFrame(
        browser,
        (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-end-pending-snapshot',
      );
      await waitForFrame(daemon, (frame) => frame.type === 'daemon.snapshotRequest');

      sendFrame(daemon, {
        type: 'terminal.end',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName,
        offsetEnd: 44,
        reason: 'completed',
      });

      const endFrame = await waitForFrame(browser, (frame) => frame.type === 'terminal.end');
      expect(endFrame).toMatchObject({
        runId,
        offsetEnd: 44,
        reason: 'completed',
      });
      expect(Object.prototype.hasOwnProperty.call(endFrame, 'sessionName')).toBe(false);
      expect(await waitForNoFrame(browser, (frame) => frame.type === 'error', 100)).toBe(false);
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('keeps a bound websocket stream valid after normal run heartbeat lease renewal', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-heartbeat' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-heartbeat');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-heartbeat',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'register-heartbeat');
      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-heartbeat',
        lastOffset: 0,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-heartbeat');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-heartbeat',
        runId,
        sessionName: 'agw_terminal_stream_heartbeat',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-heartbeat');

      const heartbeatResponse = await app
        .agent()
        .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/heartbeat`)
        .set('Authorization', `Bearer ${runner.nodeToken}`)
        .send({
          claimToken: lease.claimToken,
          claimAttempt: lease.claimAttempt,
          leaseVersion: lease.leaseVersion,
          status: 'running',
        });
      expect(heartbeatResponse.status).toBe(200);

      sendFrame(daemon, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_stream_heartbeat',
        offsetStart: 0,
        offsetEnd: 29,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('AGENT_GATEWAY_STREAM_SMOKE_1\n'),
      });

      expect(await waitForFrame(browser, (frame) => frame.type === 'terminal.data')).toMatchObject({
        runId,
        offsetEnd: 29,
      });
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('rejects reconnect snapshot requests after the bound run lease expires', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-expired' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-expired');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-expired',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'register-expired');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-expired',
        runId,
        sessionName: 'agw_terminal_stream_expired',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-expired');

      await app.db.getRepository('agRuns').update({
        filterByTk: runId,
        values: {
          claimExpiresAt: new Date(Date.now() - 1000),
        },
      });

      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-expired',
        lastOffset: 42,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-expired');

      expect(await waitForFrame(browser, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_LEASE_LOST',
      });
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('returns terminal end for reconnect snapshots after a run is already terminalized', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-completed-reconnect' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-completed-reconnect');
    await app.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        status: 'succeeded',
        terminalStatus: 'closed',
        terminalSessionName: 'agw_terminal_stream_completed_reconnect',
        finishedAt: new Date(),
      },
    });
    const server = await createTerminalStreamServer(app);
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;

    try {
      await waitForOpen(browser);
      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-completed-reconnect',
        lastOffset: 1203,
      });
      await waitForFrame(
        browser,
        (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-completed-reconnect',
      );
      const endFrame = await waitForFrame(browser, (frame) => frame.type === 'terminal.end');
      expect(endFrame).toMatchObject({
        runId,
        offsetEnd: 1203,
        reason: 'completed',
      });
      expect(Object.prototype.hasOwnProperty.call(endFrame, 'sessionName')).toBe(false);
    } finally {
      browser.close();
      await server.close();
    }
  });

  it('rejects terminal end after the bound run lease expires', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-end-expired' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-end-expired');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browserConnection = await createBrowserWithTicket(app, server.wsUrl, {
      userId: rootUserId,
      runId,
    });
    const browser = browserConnection.browser;

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-end-expired',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'register-end-expired');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-end-expired',
        runId,
        sessionName: 'agw_terminal_stream_end_expired',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-end-expired');

      sendBrowserSubscribe(browser, browserConnection.ticket, {
        runId,
        requestId: 'subscribe-end-expired',
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-end-expired');

      await app.db.getRepository('agRuns').update({
        filterByTk: runId,
        values: {
          claimExpiresAt: new Date(Date.now() - 1000),
        },
      });

      sendFrame(daemon, {
        type: 'terminal.end',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_stream_end_expired',
        offsetEnd: 0,
        reason: 'completed',
      });

      expect(await waitForFrame(daemon, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_LEASE_LOST',
      });
      expect(await waitForNoFrame(browser, (frame) => frame.type === 'terminal.end', 100)).toBe(false);
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });
});
