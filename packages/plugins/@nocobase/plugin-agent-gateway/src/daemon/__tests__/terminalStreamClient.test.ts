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

import WebSocket, { WebSocketServer } from 'ws';

import {
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_WS_PATH,
  TerminalFrame,
  decodeTerminalPayload,
} from '../../shared/terminalStreamProtocol';
import { TerminalRingBuffer } from '../terminalRingBuffer';
import { DaemonTerminalStreamClient } from '../terminalStreamClient';
import { RunLease } from '../types';

function waitForServerListening(server: http.Server) {
  return new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
}

function waitForConnection(wss: WebSocketServer) {
  return new Promise<WebSocket>((resolve) => {
    wss.once('connection', (ws) => resolve(ws));
  });
}

function waitForFrame(ws: WebSocket, predicate: (frame: TerminalFrame) => boolean = () => true) {
  return new Promise<TerminalFrame>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error('terminal stream client test timed out'));
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

function sendFrame(ws: WebSocket, frame: TerminalFrame | Record<string, unknown>) {
  ws.send(JSON.stringify(frame));
}

async function waitForClientState(client: DaemonTerminalStreamClient, state: string) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 1000) {
    if (client.getState() === state) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  expect(client.getState()).toBe(state);
}

async function createTestServer(options: { closeFirstUpgrade?: boolean } = {}) {
  const server = http.createServer();
  const wss = new WebSocketServer({ noServer: true });
  let upgradeCount = 0;
  server.on('upgrade', (request, socket, head) => {
    upgradeCount += 1;
    if (options.closeFirstUpgrade && upgradeCount === 1) {
      socket.destroy();
      return;
    }
    if (new URL(request.url || '/', 'http://127.0.0.1').pathname !== TERMINAL_STREAM_WS_PATH) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
  await waitForServerListening(server);
  const address = server.address() as AddressInfo;
  return {
    serverUrl: `http://127.0.0.1:${address.port}`,
    wss,
    async close() {
      for (const client of wss.clients) {
        client.close();
      }
      await new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}

function createLease(overrides: Partial<RunLease> = {}): RunLease {
  return {
    runId: 'run-1',
    claimToken: 'ag_claim_TEST',
    claimAttempt: 1,
    leaseVersion: 1,
    ...overrides,
  };
}

async function acknowledgeRegisterAndBind(ws: WebSocket) {
  const register = await waitForFrame(ws, (frame) => frame.type === 'daemon.register');
  sendFrame(ws, {
    type: 'ack',
    protocol: TERMINAL_PROTOCOL,
    requestId: register.type === 'daemon.register' ? register.requestId : '',
  });
  const bind = await waitForFrame(ws, (frame) => frame.type === 'daemon.bindRun');
  sendFrame(ws, {
    type: 'ack',
    protocol: TERMINAL_PROTOCOL,
    requestId: bind.type === 'daemon.bindRun' ? bind.requestId : '',
  });
  return {
    register,
    bind,
  };
}

describe('daemon terminal stream client', () => {
  it('registers, binds, sends terminal data, and responds to snapshot requests', async () => {
    const server = await createTestServer();
    const connectionPromise = waitForConnection(server.wss);
    const ringBuffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
    });
    const client = new DaemonTerminalStreamClient({
      serverUrl: server.serverUrl,
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer,
      getLease: () => createLease(),
    });

    try {
      const startPromise = client.start();
      const daemon = await connectionPromise;
      const register = await waitForFrame(daemon, (frame) => frame.type === 'daemon.register');
      expect(register).toMatchObject({
        nodeId: 'node-1',
      });
      sendFrame(daemon, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: register.type === 'daemon.register' ? register.requestId : '',
      });
      const bind = await waitForFrame(daemon, (frame) => frame.type === 'daemon.bindRun');
      expect(bind).toMatchObject({
        runId: 'run-1',
        claimToken: 'ag_claim_TEST',
        leaseVersion: 1,
      });
      sendFrame(daemon, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: bind.type === 'daemon.bindRun' ? bind.requestId : '',
      });
      await startPromise;

      await client.appendText('hello stream\n');
      const data = await waitForFrame(daemon, (frame) => frame.type === 'terminal.data');
      expect(data).toMatchObject({
        offsetStart: 0,
        offsetEnd: 13,
      });
      expect(decodeTerminalPayload(data.type === 'terminal.data' ? data.payload : '')).toBe('hello stream\n');

      sendFrame(daemon, {
        type: 'daemon.snapshotRequest',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'snapshot-1',
        runId: 'run-1',
        fromOffset: 6,
      });
      const snapshot = await waitForFrame(daemon, (frame) => frame.type === 'terminal.snapshot');
      expect(snapshot).toMatchObject({
        requestId: 'snapshot-1',
        offsetStart: 6,
        offsetEnd: 13,
      });
      expect(decodeTerminalPayload(snapshot.type === 'terminal.snapshot' ? snapshot.payload : '')).toBe('stream\n');
    } finally {
      client.close();
      await server.close();
    }
  });

  it('replays output appended while reconnecting after the daemon rebinds', async () => {
    const server = await createTestServer();
    const ringBuffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
    });
    let resolveReconnecting: () => void = () => {};
    const reconnecting = new Promise<void>((resolve) => {
      resolveReconnecting = resolve;
    });
    const client = new DaemonTerminalStreamClient({
      serverUrl: server.serverUrl,
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer,
      getLease: () => createLease(),
      initialReconnectDelayMs: 10,
      maxReconnectDelayMs: 20,
      onStateChange: (state) => {
        if (state === 'reconnecting') {
          resolveReconnecting();
        }
      },
    });

    try {
      const firstConnectionPromise = waitForConnection(server.wss);
      const startPromise = client.start();
      const first = await firstConnectionPromise;
      await acknowledgeRegisterAndBind(first);
      await startPromise;
      await client.appendText('before reconnect\n');
      await waitForFrame(first, (frame) => frame.type === 'terminal.data');

      const secondConnectionPromise = waitForConnection(server.wss);
      first.close();
      await reconnecting;
      await client.appendText('during reconnect\n');
      const second = await secondConnectionPromise;
      await acknowledgeRegisterAndBind(second);
      const replay = await waitForFrame(second, (frame) => frame.type === 'terminal.data');
      expect(replay).toMatchObject({
        offsetStart: 17,
        offsetEnd: 34,
      });
      expect(decodeTerminalPayload(replay.type === 'terminal.data' ? replay.payload : '')).toBe('during reconnect\n');
    } finally {
      client.close();
      await server.close();
    }
  });

  it('delivers a pending terminal end after reconnecting', async () => {
    const server = await createTestServer();
    const ringBuffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
    });
    let resolveReconnecting: () => void = () => {};
    const reconnecting = new Promise<void>((resolve) => {
      resolveReconnecting = resolve;
    });
    const client = new DaemonTerminalStreamClient({
      serverUrl: server.serverUrl,
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer,
      getLease: () => createLease(),
      initialReconnectDelayMs: 10,
      maxReconnectDelayMs: 20,
      onStateChange: (state) => {
        if (state === 'reconnecting') {
          resolveReconnecting();
        }
      },
    });

    try {
      const firstConnectionPromise = waitForConnection(server.wss);
      const startPromise = client.start();
      const first = await firstConnectionPromise;
      await acknowledgeRegisterAndBind(first);
      await startPromise;

      const secondConnectionPromise = waitForConnection(server.wss);
      first.close();
      await reconnecting;
      await client.appendText('final while reconnecting\n');
      const endPromise = client.end('completed');
      const second = await secondConnectionPromise;
      const secondRegister = await waitForFrame(second, (frame) => frame.type === 'daemon.register');
      sendFrame(second, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: secondRegister.type === 'daemon.register' ? secondRegister.requestId : '',
      });
      const secondBind = await waitForFrame(second, (frame) => frame.type === 'daemon.bindRun');
      const dataFramePromise = waitForFrame(second, (frame) => frame.type === 'terminal.data');
      const endFramePromise = waitForFrame(second, (frame) => frame.type === 'terminal.end');
      sendFrame(second, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: secondBind.type === 'daemon.bindRun' ? secondBind.requestId : '',
      });
      await dataFramePromise;
      const end = await endFramePromise;
      expect(end).toMatchObject({
        offsetEnd: 25,
        reason: 'completed',
      });
      await endPromise;
    } finally {
      client.close();
      await server.close();
    }
  });

  it('reconnects and rebinds with the latest run lease', async () => {
    const server = await createTestServer();
    let lease = createLease();
    const ringBuffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
    });
    const client = new DaemonTerminalStreamClient({
      serverUrl: server.serverUrl,
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer,
      getLease: () => lease,
      initialReconnectDelayMs: 10,
      maxReconnectDelayMs: 20,
    });

    try {
      const firstConnectionPromise = waitForConnection(server.wss);
      const startPromise = client.start();
      const first = await firstConnectionPromise;
      const firstRegister = await waitForFrame(first, (frame) => frame.type === 'daemon.register');
      sendFrame(first, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: firstRegister.type === 'daemon.register' ? firstRegister.requestId : '',
      });
      const firstBind = await waitForFrame(first, (frame) => frame.type === 'daemon.bindRun');
      sendFrame(first, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: firstBind.type === 'daemon.bindRun' ? firstBind.requestId : '',
      });
      await startPromise;

      lease = createLease({ leaseVersion: 2 });
      const secondConnectionPromise = waitForConnection(server.wss);
      first.close();
      const second = await secondConnectionPromise;
      const secondRegister = await waitForFrame(second, (frame) => frame.type === 'daemon.register');
      sendFrame(second, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: secondRegister.type === 'daemon.register' ? secondRegister.requestId : '',
      });
      const secondBind = await waitForFrame(second, (frame) => frame.type === 'daemon.bindRun');
      expect(secondBind).toMatchObject({
        leaseVersion: 2,
      });
    } finally {
      client.close();
      await server.close();
    }
  });

  it('reconnects when the websocket closes before opening', async () => {
    const server = await createTestServer({ closeFirstUpgrade: true });
    const ringBuffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
    });
    const client = new DaemonTerminalStreamClient({
      serverUrl: server.serverUrl,
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer,
      getLease: () => createLease(),
      initialReconnectDelayMs: 10,
      maxReconnectDelayMs: 20,
    });

    try {
      const secondConnectionPromise = waitForConnection(server.wss);
      await client.start();
      const second = await secondConnectionPromise;
      await acknowledgeRegisterAndBind(second);
      await waitForClientState(client, 'bound');
      expect(client.getState()).toBe('bound');
    } finally {
      client.close();
      await server.close();
    }
  });

  it('keeps reconnecting by default until the client is closed', async () => {
    const server = await createTestServer();
    const ringBuffer = new TerminalRingBuffer({
      runId: 'run-1',
      sessionName: 'session-1',
    });
    const client = new DaemonTerminalStreamClient({
      serverUrl: server.serverUrl,
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer,
      getLease: () => createLease(),
      initialReconnectDelayMs: 1,
      maxReconnectDelayMs: 1,
    });

    try {
      const firstConnectionPromise = waitForConnection(server.wss);
      const startPromise = client.start();
      let connection = await firstConnectionPromise;
      await acknowledgeRegisterAndBind(connection);
      await startPromise;

      for (let index = 0; index < 9; index += 1) {
        const nextConnectionPromise = waitForConnection(server.wss);
        connection.close();
        connection = await nextConnectionPromise;
        await acknowledgeRegisterAndBind(connection);
        await waitForClientState(client, 'bound');
      }

      expect(client.getState()).toBe('bound');
    } finally {
      client.close();
      await server.close();
    }
  });
});
