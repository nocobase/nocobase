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

import { DaemonTerminalStreamClient } from '../../daemon/terminalStreamClient';
import { TerminalRingBuffer } from '../../daemon/terminalRingBuffer';
import { TERMINAL_PROTOCOL, TerminalFrame, decodeTerminalPayload } from '../../shared/terminalStreamProtocol';
import PluginAgentGatewayServer from '../plugin';
import {
  claimRun,
  createBrowserToken,
  createQueuedRun,
  createRunner,
  createTerminalStreamServer,
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

describe('terminal stream daemon integration', () => {
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

  it('routes real daemon stream client data and terminal end through the broker', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-real-daemon-node-1' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-real-daemon-run-1');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const browserToken = await createBrowserToken(app, rootUserId);
    const browser = createWebSocket(server.wsUrl, { token: browserToken });
    const sessionName = 'agw_terminal_stream_real_daemon_1';
    const stream = new DaemonTerminalStreamClient({
      serverUrl: server.serverUrl,
      nodeId: runner.nodeId,
      nodeToken: runner.nodeToken,
      runId,
      sessionName,
      ringBuffer: new TerminalRingBuffer({
        runId,
        sessionName,
      }),
      getLease: () => lease,
    });

    try {
      await waitForOpen(browser);
      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-real-daemon',
        runId,
        lastOffset: 0,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-real-daemon');
      await stream.start();
      await stream.appendText('AGENT_GATEWAY_STREAM_REAL_DAEMON_1\n');

      const data = await waitForFrame(browser, (frame) => frame.type === 'terminal.data');
      expect(data).toMatchObject({
        runId,
        offsetStart: 0,
      });
      expect(decodeTerminalPayload(data.type === 'terminal.data' ? data.payload : '')).toContain(
        'AGENT_GATEWAY_STREAM_REAL_DAEMON_1',
      );

      await stream.end('completed');
      expect(await waitForFrame(browser, (frame) => frame.type === 'terminal.end')).toMatchObject({
        runId,
        reason: 'completed',
      });
    } finally {
      stream.close();
      browser.close();
      await server.close();
    }
  });

  it('rebinds after daemon websocket disconnect and continues forwarding new chunks', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-real-daemon-node-reconnect' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-real-daemon-run-reconnect');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const browserToken = await createBrowserToken(app, rootUserId);
    const browser = createWebSocket(server.wsUrl, { token: browserToken });
    const daemonSockets: WebSocket[] = [];
    let resolveRebound: (() => void) | null = null;
    const rebound = new Promise<void>((resolve) => {
      resolveRebound = resolve;
    });
    let resolveReconnecting: (() => void) | null = null;
    const reconnecting = new Promise<void>((resolve) => {
      resolveReconnecting = resolve;
    });
    const sessionName = 'agw_terminal_stream_real_daemon_reconnect';
    const stream = new DaemonTerminalStreamClient({
      serverUrl: server.serverUrl,
      nodeId: runner.nodeId,
      nodeToken: runner.nodeToken,
      runId,
      sessionName,
      ringBuffer: new TerminalRingBuffer({
        runId,
        sessionName,
      }),
      getLease: () => lease,
      initialReconnectDelayMs: 10,
      maxReconnectDelayMs: 20,
      createWebSocket: (url, headers) => {
        const ws = new WebSocket(url, { headers });
        daemonSockets.push(ws);
        return ws;
      },
      onStateChange: (state) => {
        if (state === 'reconnecting') {
          resolveReconnecting?.();
        }
        if (state === 'bound' && daemonSockets.length > 1) {
          resolveRebound?.();
        }
      },
    });

    try {
      await waitForOpen(browser);
      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-reconnect',
        runId,
        lastOffset: 0,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-reconnect');
      await stream.start();
      await stream.appendText('AGENT_GATEWAY_STREAM_BEFORE_RECONNECT\n');
      await waitForFrame(browser, (frame) => frame.type === 'terminal.data');

      daemonSockets[0].close();
      await reconnecting;
      expect(await waitForNoFrame(browser, (frame) => frame.type === 'terminal.end', 100)).toBe(false);
      await stream.appendText('AGENT_GATEWAY_STREAM_DURING_RECONNECT\n');
      await rebound;
      const replayed = await waitForFrame(browser, (frame) => frame.type === 'terminal.data');
      expect(decodeTerminalPayload(replayed.type === 'terminal.data' ? replayed.payload : '')).toContain(
        'AGENT_GATEWAY_STREAM_DURING_RECONNECT',
      );
      await stream.appendText('AGENT_GATEWAY_STREAM_AFTER_RECONNECT\n');
      const dataAfterReconnect = await waitForFrame(browser, (frame) => frame.type === 'terminal.data');
      expect(
        decodeTerminalPayload(dataAfterReconnect.type === 'terminal.data' ? dataAfterReconnect.payload : ''),
      ).toContain('AGENT_GATEWAY_STREAM_AFTER_RECONNECT');
    } finally {
      stream.close();
      browser.close();
      await server.close();
    }
  });

  it('returns a deterministic offset gap when daemon snapshot exceeds frame budget', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-real-daemon-node-snapshot-budget' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-real-daemon-run-snapshot-budget');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const browserToken = await createBrowserToken(app, rootUserId);
    const browser = createWebSocket(server.wsUrl, { token: browserToken });
    const sessionName = 'agw_terminal_stream_snapshot_budget';
    const stream = new DaemonTerminalStreamClient({
      serverUrl: server.serverUrl,
      nodeId: runner.nodeId,
      nodeToken: runner.nodeToken,
      runId,
      sessionName,
      ringBuffer: new TerminalRingBuffer({
        runId,
        sessionName,
        maxBytes: 1024,
        maxSnapshotBytes: 8,
      }),
      getLease: () => lease,
    });

    try {
      await stream.start();
      await stream.appendText('0123456789');
      await waitForOpen(browser);
      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-snapshot-budget',
        runId,
        lastOffset: 0,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-snapshot-budget');
      expect(await waitForFrame(browser, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_OFFSET_GAP',
      });
    } finally {
      stream.close();
      browser.close();
      await server.close();
    }
  });
});
