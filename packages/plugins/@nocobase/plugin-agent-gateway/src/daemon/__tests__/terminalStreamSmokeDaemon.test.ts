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

import { TERMINAL_PROTOCOL, TerminalFrame, decodeTerminalPayload } from '../../shared/terminalStreamProtocol';
import {
  encodeSmokeLineForTest,
  parseTerminalStreamSmokeDaemonArgs,
  runTerminalStreamSmokeDaemon,
} from '../terminalStreamSmokeDaemon';

function parseFrame(data: WebSocket.RawData) {
  return JSON.parse(data.toString()) as TerminalFrame;
}

async function waitForFrameCount(frames: TerminalFrame[], count: number) {
  const startedAt = Date.now();
  while (frames.length < count) {
    if (Date.now() - startedAt > 1000) {
      break;
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 10);
    });
  }
}

async function createSmokeServer() {
  const frames: TerminalFrame[] = [];
  const server = http.createServer((request, response) => {
    if (request.method === 'POST' && request.url === '/api/agent-gateway/nodes/node-1/runs:claim') {
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify({
          data: {
            claimed: true,
            runId: 'run-1',
            claimToken: 'ag_claim_test',
            claimAttempt: 1,
            leaseVersion: 1,
          },
        }),
      );
      return;
    }
    response.statusCode = 404;
    response.end('{}');
  });
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws/agent-gateway/terminal') {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      const frame = parseFrame(data);
      frames.push(frame);
      if (frame.type === 'daemon.register' || frame.type === 'daemon.bindRun') {
        ws.send(
          JSON.stringify({
            type: 'ack',
            protocol: TERMINAL_PROTOCOL,
            requestId: frame.requestId,
          }),
        );
      }
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  return {
    serverUrl: `http://127.0.0.1:${address.port}`,
    frames,
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

async function createSnapshotSmokeServer() {
  const frames: TerminalFrame[] = [];
  const server = http.createServer((request, response) => {
    if (request.method === 'POST' && request.url === '/api/agent-gateway/nodes/node-1/runs:claim') {
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify({
          data: {
            claimed: true,
            runId: 'run-1',
            claimToken: 'ag_claim_test',
            claimAttempt: 1,
            leaseVersion: 1,
          },
        }),
      );
      return;
    }
    response.statusCode = 404;
    response.end('{}');
  });
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws/agent-gateway/terminal') {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      const frame = parseFrame(data);
      frames.push(frame);
      if (frame.type === 'daemon.register' || frame.type === 'daemon.bindRun') {
        ws.send(
          JSON.stringify({
            type: 'ack',
            protocol: TERMINAL_PROTOCOL,
            requestId: frame.requestId,
          }),
        );
      }
      if (frame.type === 'terminal.data') {
        ws.send(
          JSON.stringify({
            type: 'daemon.snapshotRequest',
            protocol: TERMINAL_PROTOCOL,
            requestId: 'snapshot-empty',
            runId: frame.runId,
            fromOffset: frame.offsetEnd,
          }),
        );
      }
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  return {
    serverUrl: `http://127.0.0.1:${address.port}`,
    frames,
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

describe('terminal stream smoke daemon script', () => {
  it('parses claim-run and repeated/comma-separated line arguments', () => {
    const options = parseTerminalStreamSmokeDaemonArgs([
      'node',
      'terminal-stream-smoke-daemon.ts',
      '--server-url',
      'http://127.0.0.1:23000',
      '--run-id',
      'run-1',
      '--node-id',
      'node-1',
      '--node-token',
      'ag_node_test',
      '--claim-run',
      '--line',
      'AGENT_GATEWAY_STREAM_SMOKE_1',
      '--line',
      'AGENT_GATEWAY_STREAM_SMOKE_2,AGENT_GATEWAY_STREAM_SMOKE_3',
    ]);

    expect(options).toMatchObject({
      serverUrl: 'http://127.0.0.1:23000',
      runId: 'run-1',
      nodeId: 'node-1',
      nodeToken: 'ag_node_test',
      claimRun: true,
      lines: ['AGENT_GATEWAY_STREAM_SMOKE_1', 'AGENT_GATEWAY_STREAM_SMOKE_2', 'AGENT_GATEWAY_STREAM_SMOKE_3'],
    });
  });

  it('claims the run, registers the daemon websocket, binds the lease, and emits smoke lines', async () => {
    const server = await createSmokeServer();
    try {
      const result = await runTerminalStreamSmokeDaemon({
        serverUrl: server.serverUrl,
        runId: 'run-1',
        nodeId: 'node-1',
        nodeToken: 'ag_node_test',
        claimRun: true,
        lines: ['AGENT_GATEWAY_STREAM_SMOKE_1'],
        lineDelayMs: 0,
        holdOpenMs: 0,
      });

      expect(result).toMatchObject({
        runId: 'run-1',
        emittedLineCount: 1,
        offsetEnd: 29,
      });
      await waitForFrameCount(server.frames, 4);
      expect(server.frames.map((frame) => frame.type)).toEqual([
        'daemon.register',
        'daemon.bindRun',
        'terminal.data',
        'terminal.end',
      ]);
      const bindFrame = server.frames.find((frame) => frame.type === 'daemon.bindRun');
      expect(bindFrame).toMatchObject({
        runId: 'run-1',
        claimToken: 'ag_claim_test',
        claimAttempt: 1,
        leaseVersion: 1,
      });
      const dataFrame = server.frames.find((frame) => frame.type === 'terminal.data');
      expect(dataFrame?.type === 'terminal.data' ? decodeTerminalPayload(dataFrame.payload) : '').toBe(
        'AGENT_GATEWAY_STREAM_SMOKE_1\n',
      );
      expect(dataFrame?.type === 'terminal.data' ? dataFrame.payload : '').toBe(
        encodeSmokeLineForTest('AGENT_GATEWAY_STREAM_SMOKE_1'),
      );
    } finally {
      await server.close();
    }
  });

  it('responds to an exact-end snapshot request with an empty snapshot frame', async () => {
    const server = await createSnapshotSmokeServer();
    try {
      await runTerminalStreamSmokeDaemon({
        serverUrl: server.serverUrl,
        runId: 'run-1',
        nodeId: 'node-1',
        nodeToken: 'ag_node_test',
        claimRun: true,
        lines: ['AGENT_GATEWAY_STREAM_SMOKE_1'],
        lineDelayMs: 0,
        holdOpenMs: 20,
      });

      await waitForFrameCount(server.frames, 5);
      const snapshotFrame = server.frames.find((frame) => frame.type === 'terminal.snapshot');
      expect(snapshotFrame).toMatchObject({
        type: 'terminal.snapshot',
        requestId: 'snapshot-empty',
        offsetStart: 29,
        offsetEnd: 29,
        payload: '',
      });
    } finally {
      await server.close();
    }
  });
});
