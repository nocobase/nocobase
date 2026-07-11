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
  TERMINAL_DAEMON_TARGET_CHUNK_BYTES,
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_WS_PATH,
  TerminalFrame,
  decodeTerminalPayload,
} from '../../shared/terminalStreamProtocol';
import { TerminalRingBuffer } from '../terminalRingBuffer';
import { DaemonTerminalStreamClient, TerminalStreamSocket } from '../terminalStreamClient';
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

function waitForFrame(
  ws: WebSocket,
  predicate: (frame: TerminalFrame) => boolean = () => true,
  acknowledgeDaemonFrame = true,
) {
  return new Promise<TerminalFrame>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error('terminal stream client test timed out'));
    }, 5000);
    const onMessage = (data: WebSocket.RawData) => {
      const frame = JSON.parse(data.toString()) as TerminalFrame;
      if (
        acknowledgeDaemonFrame &&
        (frame.type === 'terminal.data' || frame.type === 'terminal.end') &&
        frame.requestId
      ) {
        sendFrame(ws, {
          type: 'ack',
          protocol: TERMINAL_PROTOCOL,
          requestId: frame.requestId,
        });
      }
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

class NeverOpeningSocket implements TerminalStreamSocket {
  readyState = WebSocket.CONNECTING;
  closeCalls = 0;

  send(_data: string, callback?: (error?: Error) => void) {
    callback?.(new Error('socket is not open'));
  }

  close() {
    this.closeCalls += 1;
    this.readyState = WebSocket.CLOSED;
  }

  on(_event: 'open', _listener: () => void): this;
  on(_event: 'message', _listener: (data: WebSocket.RawData) => void): this;
  on(_event: 'close', _listener: () => void): this;
  on(_event: 'error', _listener: (error: Error) => void): this;
  on(_event: string, _listener: unknown) {
    return this;
  }

  off(_event: 'open', _listener: () => void): this;
  off(_event: 'message', _listener: (data: WebSocket.RawData) => void): this;
  off(_event: 'close', _listener: () => void): this;
  off(_event: 'error', _listener: (error: Error) => void): this;
  off(_event: string, _listener: unknown) {
    return this;
  }
}

class StalledSendSocket implements TerminalStreamSocket {
  readyState = WebSocket.OPEN;
  closeCalls = 0;

  send(_data: string, _callback?: (error?: Error) => void) {}

  close() {
    this.closeCalls += 1;
    this.readyState = WebSocket.CLOSED;
  }

  on(_event: 'open', _listener: () => void): this;
  on(_event: 'message', _listener: (data: WebSocket.RawData) => void): this;
  on(_event: 'close', _listener: () => void): this;
  on(_event: 'error', _listener: (error: Error) => void): this;
  on(_event: string, _listener: unknown) {
    return this;
  }

  off(_event: 'open', _listener: () => void): this;
  off(_event: 'message', _listener: (data: WebSocket.RawData) => void): this;
  off(_event: 'close', _listener: () => void): this;
  off(_event: 'error', _listener: (error: Error) => void): this;
  off(_event: string, _listener: unknown) {
    return this;
  }
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
  it('keeps the closed state when an in-flight connection later rejects', async () => {
    const socket = new NeverOpeningSocket();
    const client = new DaemonTerminalStreamClient({
      serverUrl: 'http://127.0.0.1:23001',
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer: new TerminalRingBuffer({
        runId: 'run-1',
        sessionName: 'session-1',
      }),
      getLease: () => createLease(),
      ackTimeoutMs: 20,
      createWebSocket: () => socket,
    });

    const startPromise = client.start();
    client.close();
    await startPromise;

    expect(client.getState()).toBe('closed');
  });

  it('times out when the websocket never opens', async () => {
    const socket = new NeverOpeningSocket();
    const client = new DaemonTerminalStreamClient({
      serverUrl: 'http://127.0.0.1:23001',
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer: new TerminalRingBuffer({
        runId: 'run-1',
        sessionName: 'session-1',
      }),
      getLease: () => createLease(),
      ackTimeoutMs: 20,
      maxReconnectAttempts: 0,
      createWebSocket: () => socket,
    });

    await client.start();

    expect(client.getState()).toBe('closed');
    expect(socket.closeCalls).toBe(1);
  });

  it('reports an undelivered terminal end when reconnect attempts are exhausted', async () => {
    const socket = new NeverOpeningSocket();
    const client = new DaemonTerminalStreamClient({
      serverUrl: 'http://127.0.0.1:23001',
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer: new TerminalRingBuffer({
        runId: 'run-1',
        sessionName: 'session-1',
      }),
      getLease: () => createLease(),
      ackTimeoutMs: 20,
      sendTimeoutMs: 20,
      maxReconnectAttempts: 0,
      createWebSocket: () => socket,
    });

    await client.start();

    await expect(client.end('completed')).resolves.toBe(false);
    client.close();
  });

  it('times out an unacknowledged registration without retaining a pending ACK', async () => {
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
      ackTimeoutMs: 20,
      maxReconnectAttempts: 0,
    });

    try {
      const startedAt = Date.now();
      const startPromise = client.start();
      const daemon = await connectionPromise;
      await waitForFrame(daemon, (frame) => frame.type === 'daemon.register');
      await startPromise;

      expect(Date.now() - startedAt).toBeLessThan(500);
      expect(client.getState()).toBe('closed');
      const pendingAcks = (client as unknown as { pendingAcks: Map<string, unknown> }).pendingAcks;
      expect(pendingAcks.size).toBe(0);
    } finally {
      client.close();
      await server.close();
    }
  });

  it('times out an ACK even when the websocket send callback never settles', async () => {
    const socket = new StalledSendSocket();
    const client = new DaemonTerminalStreamClient({
      serverUrl: 'http://127.0.0.1:23001',
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer: new TerminalRingBuffer({
        runId: 'run-1',
        sessionName: 'session-1',
      }),
      getLease: () => createLease(),
      ackTimeoutMs: 20,
      maxReconnectAttempts: 0,
      createWebSocket: () => socket,
    });

    const completion = await Promise.race([
      client.start().then(() => 'completed'),
      new Promise<'timed-out'>((resolve) => setTimeout(() => resolve('timed-out'), 500)),
    ]);

    expect(completion).toBe('completed');
    expect(client.getState()).toBe('closed');
    expect(socket.closeCalls).toBe(1);
    const pendingAcks = (client as unknown as { pendingAcks: Map<string, unknown> }).pendingAcks;
    expect(pendingAcks.size).toBe(0);
  });

  it('accepts a server ACK even when the websocket send callback never settles', async () => {
    const socket = new StalledSendSocket();
    const client = new DaemonTerminalStreamClient({
      serverUrl: 'http://127.0.0.1:23001',
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer: new TerminalRingBuffer({
        runId: 'run-1',
        sessionName: 'session-1',
      }),
      getLease: () => createLease(),
      ackTimeoutMs: 500,
      sendTimeoutMs: 500,
      createWebSocket: () => socket,
    });
    const internals = client as unknown as {
      ws?: TerminalStreamSocket;
      sendWithAck(frame: TerminalFrame): Promise<void>;
      handleMessage(data: WebSocket.RawData): void;
    };
    internals.ws = socket;
    const requestId = 'stalled-send-acknowledged';
    const completion = internals.sendWithAck({
      type: 'daemon.register',
      protocol: TERMINAL_PROTOCOL,
      requestId,
      nodeId: 'node-1',
      capabilities: {
        terminalStream: true,
      },
    });
    internals.handleMessage(
      Buffer.from(
        JSON.stringify({
          type: 'ack',
          protocol: TERMINAL_PROTOCOL,
          requestId,
        }),
      ),
    );

    await expect(completion).resolves.toBeUndefined();
  });

  it('times out terminal data and end sends when the websocket callback never settles', async () => {
    const socket = new StalledSendSocket();
    const client = new DaemonTerminalStreamClient({
      serverUrl: 'http://127.0.0.1:23001',
      nodeId: 'node-1',
      nodeToken: 'ag_node_TEST',
      runId: 'run-1',
      sessionName: 'session-1',
      ringBuffer: new TerminalRingBuffer({
        runId: 'run-1',
        sessionName: 'session-1',
      }),
      getLease: () => createLease(),
      sendTimeoutMs: 20,
      createWebSocket: () => socket,
    });
    const internals = client as unknown as {
      ws?: TerminalStreamSocket;
      sendFrame(frame: TerminalFrame): Promise<void>;
    };
    internals.ws = socket;
    const sendFrame = internals.sendFrame.bind(client);

    await expect(
      sendFrame({
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-1',
        sessionName: 'session-1',
        offsetStart: 0,
        offsetEnd: 1,
        payloadEncoding: 'base64-utf8',
        payload: 'eA==',
      }),
    ).rejects.toThrow('Terminal stream send timed out: terminal.data');

    await expect(
      sendFrame({
        type: 'terminal.end',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-1',
        sessionName: 'session-1',
        offsetEnd: 0,
        reason: 'completed',
      }),
    ).rejects.toThrow('Terminal stream send timed out: terminal.end');
  });

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

      const dataPromise = waitForFrame(daemon, (frame) => frame.type === 'terminal.data');
      await client.appendText('hello stream\n');
      const data = await dataPromise;
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

  it('does not advance terminal output until the server acknowledges the data frame', async () => {
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
      ackTimeoutMs: 1000,
    });

    try {
      const startPromise = client.start();
      const daemon = await connectionPromise;
      await acknowledgeRegisterAndBind(daemon);
      await startPromise;
      let appendSettled = false;
      const dataPromise = waitForFrame(daemon, (frame) => frame.type === 'terminal.data', false);
      const appendPromise = client.appendText('acknowledge me\n').finally(() => {
        appendSettled = true;
      });
      const data = await dataPromise;

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(appendSettled).toBe(false);
      expect((client as unknown as { nextSendOffset: number }).nextSendOffset).toBe(0);
      expect(data.type).toBe('terminal.data');
      if (data.type === 'terminal.data' && data.requestId) {
        sendFrame(daemon, {
          type: 'ack',
          protocol: TERMINAL_PROTOCOL,
          requestId: data.requestId,
        });
      }
      await appendPromise;

      expect((client as unknown as { nextSendOffset: number }).nextSendOffset).toBe(15);
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
      const firstDataPromise = waitForFrame(first, (frame) => frame.type === 'terminal.data');
      await client.appendText('before reconnect\n');
      await firstDataPromise;

      const secondConnectionPromise = waitForConnection(server.wss);
      first.close();
      await reconnecting;
      await client.appendText('during reconnect\n');
      const second = await secondConnectionPromise;
      const secondRegister = await waitForFrame(second, (frame) => frame.type === 'daemon.register');
      sendFrame(second, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: secondRegister.type === 'daemon.register' ? secondRegister.requestId : '',
      });
      const secondBind = await waitForFrame(second, (frame) => frame.type === 'daemon.bindRun');
      const replayPromise = waitForFrame(second, (frame) => frame.type === 'terminal.data');
      sendFrame(second, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: secondBind.type === 'daemon.bindRun' ? secondBind.requestId : '',
      });
      const replay = await replayPromise;
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

  it('sends large retained output in 32 KiB data frames', async () => {
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
    const largeOutput = 'L'.repeat(TERMINAL_DAEMON_TARGET_CHUNK_BYTES * 2 + 5);

    try {
      const startPromise = client.start();
      const daemon = await connectionPromise;
      await acknowledgeRegisterAndBind(daemon);
      await startPromise;
      const framePromises = [
        waitForFrame(daemon, (frame) => frame.type === 'terminal.data' && frame.offsetStart === 0),
        waitForFrame(
          daemon,
          (frame) => frame.type === 'terminal.data' && frame.offsetStart === TERMINAL_DAEMON_TARGET_CHUNK_BYTES,
        ),
        waitForFrame(
          daemon,
          (frame) => frame.type === 'terminal.data' && frame.offsetStart === TERMINAL_DAEMON_TARGET_CHUNK_BYTES * 2,
        ),
      ];
      await client.appendText(largeOutput);
      const frames = await Promise.all(framePromises);

      expect(frames).toHaveLength(3);
      expect(
        frames.map((frame) => (frame.type === 'terminal.data' ? decodeTerminalPayload(frame.payload) : '')).join(''),
      ).toBe(largeOutput);
      for (const frame of frames) {
        expect(frame.type).toBe('terminal.data');
        if (frame.type === 'terminal.data') {
          expect(Buffer.byteLength(decodeTerminalPayload(frame.payload), 'utf8')).toBeLessThanOrEqual(
            TERMINAL_DAEMON_TARGET_CHUNK_BYTES,
          );
        }
      }
    } finally {
      client.close();
      await server.close();
    }
  });

  it('rewinds retained output after an unscoped stream error', async () => {
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
      const first = await firstConnectionPromise;
      await acknowledgeRegisterAndBind(first);
      await startPromise;

      const firstDataPromise = waitForFrame(first, (frame) => frame.type === 'terminal.data');
      await client.appendText('must replay\n');
      const firstData = await firstDataPromise;
      expect(firstData).toMatchObject({
        offsetStart: 0,
        offsetEnd: 12,
      });

      const secondConnectionPromise = waitForConnection(server.wss);
      sendFrame(first, {
        type: 'error',
        protocol: TERMINAL_PROTOCOL,
        code: 'TERMINAL_RUN_NOT_BOUND',
        message: 'Run is not bound to this daemon',
      });
      const second = await secondConnectionPromise;
      const secondRegister = await waitForFrame(second, (frame) => frame.type === 'daemon.register');
      sendFrame(second, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: secondRegister.type === 'daemon.register' ? secondRegister.requestId : '',
      });
      const secondBind = await waitForFrame(second, (frame) => frame.type === 'daemon.bindRun');
      const replayPromise = waitForFrame(second, (frame) => frame.type === 'terminal.data');
      sendFrame(second, {
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: secondBind.type === 'daemon.bindRun' ? secondBind.requestId : '',
      });
      const replay = await replayPromise;
      expect(replay).toMatchObject({
        offsetStart: 0,
        offsetEnd: 12,
      });
      expect(decodeTerminalPayload(replay.type === 'terminal.data' ? replay.payload : '')).toBe('must replay\n');
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
      await expect(endPromise).resolves.toBe(true);
    } finally {
      client.close();
      await server.close();
    }
  });

  it('sends terminal end once when end is called repeatedly', async () => {
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
      await acknowledgeRegisterAndBind(daemon);
      await startPromise;
      const endFramePromise = waitForFrame(daemon, (frame) => frame.type === 'terminal.end');
      const endResults = await Promise.all([client.end('completed'), client.end('completed')]);
      expect(endResults).toEqual([true, true]);
      expect(await endFramePromise).toMatchObject({
        type: 'terminal.end',
        reason: 'completed',
      });
      expect(await waitForNoFrame(daemon, (frame) => frame.type === 'terminal.end', 100)).toBe(false);
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
