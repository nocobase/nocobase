/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import WebSocket from 'ws';

import {
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_WS_PATH,
  TerminalAck,
  TerminalDaemonBindRun,
  TerminalError,
  TerminalFrame,
  TerminalSnapshotRequest,
  createTerminalDataFrame,
  encodeTerminalPayload,
} from '../shared/terminalStreamProtocol';
import { AgentGatewayApiClient } from './apiClient';
import { AgentGatewayDaemonNodeClient } from './gateway';
import { GatewayRequester, JsonRecord, RunLease } from './types';

export interface TerminalStreamSmokeDaemonOptions {
  serverUrl: string;
  runId: string;
  nodeId: string;
  nodeToken: string;
  claimRun?: boolean;
  claimToken?: string;
  claimAttempt?: number;
  leaseVersion?: number;
  lines: string[];
  sessionName?: string;
  lineDelayMs?: number;
  holdOpenMs?: number;
  requester?: GatewayRequester;
}

export interface TerminalStreamSmokeDaemonResult {
  runId: string;
  sessionName: string;
  emittedLineCount: number;
  offsetEnd: number;
}

interface EmittedStream {
  buffer: Buffer;
  offsetStart: number;
  offsetEnd: number;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getInteger(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(numberValue) ? numberValue : null;
}

function sleep(ms: number) {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildWebSocketUrl(serverUrl: string) {
  const url = new URL(TERMINAL_STREAM_WS_PATH, serverUrl.replace(/\/$/, ''));
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

function normalizeLine(line: string) {
  return line.endsWith('\n') ? line : `${line}\n`;
}

function isTerminalAck(frame: TerminalFrame, requestId: string): frame is TerminalAck {
  return frame.type === 'ack' && frame.requestId === requestId;
}

function isTerminalError(frame: TerminalFrame): frame is TerminalError {
  return frame.type === 'error';
}

function parseFrame(data: WebSocket.RawData) {
  return JSON.parse(data.toString()) as TerminalFrame;
}

async function waitForFrame(
  ws: WebSocket,
  predicate: (frame: TerminalFrame) => boolean,
  timeoutMs = 5000,
): Promise<TerminalFrame> {
  return await new Promise<TerminalFrame>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error('Timed out waiting for terminal stream frame'));
    }, timeoutMs);
    const onMessage = (data: WebSocket.RawData) => {
      let frame: TerminalFrame;
      try {
        frame = parseFrame(data);
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
      resolve(frame);
    };
    ws.on('message', onMessage);
  });
}

async function waitForOpen(ws: WebSocket, timeoutMs = 5000) {
  if (ws.readyState === WebSocket.OPEN) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out opening terminal stream WebSocket'));
    }, timeoutMs);
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

async function waitForAck(ws: WebSocket, requestId: string) {
  const frame = await waitForFrame(
    ws,
    (candidate) => isTerminalAck(candidate, requestId) || isTerminalError(candidate),
  );
  if (isTerminalError(frame)) {
    throw new Error(`${frame.code}: ${frame.message}`);
  }
  return frame;
}

async function sendFrame(ws: WebSocket, frame: TerminalFrame | JsonRecord) {
  await new Promise<void>((resolve, reject) => {
    ws.send(JSON.stringify(frame), (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function resolveLease(options: TerminalStreamSmokeDaemonOptions): Promise<RunLease> {
  if (options.claimRun) {
    const client = new AgentGatewayDaemonNodeClient(options.requester || new AgentGatewayApiClient(options.serverUrl), {
      serverUrl: options.serverUrl,
      nodeId: options.nodeId,
      nodeKey: `terminal-stream-smoke-${options.nodeId}`,
      nodeToken: options.nodeToken,
      savedAt: new Date().toISOString(),
    });
    const lease = await client.claimRun({ runId: options.runId });
    if (!lease.claimed) {
      throw new Error(`Run was not claimed: ${getString(lease.reason) || 'unknown reason'}`);
    }
    return lease;
  }

  if (!options.claimToken || options.claimAttempt === undefined || options.leaseVersion === undefined) {
    throw new Error('--claim-token, --claim-attempt, and --lease-version are required when --claim-run is not used');
  }

  return {
    runId: options.runId,
    claimToken: options.claimToken,
    claimAttempt: options.claimAttempt,
    leaseVersion: options.leaseVersion,
  };
}

function createSnapshotFrame(
  request: TerminalSnapshotRequest,
  sessionName: string,
  stream: EmittedStream,
): TerminalFrame {
  if (request.fromOffset < stream.offsetStart || request.fromOffset > stream.offsetEnd) {
    return {
      type: 'error',
      protocol: TERMINAL_PROTOCOL,
      requestId: request.requestId,
      code: 'TERMINAL_OFFSET_GAP',
      message: 'Offset is outside daemon smoke buffer',
    };
  }

  const relativeStart = request.fromOffset - stream.offsetStart;
  const snapshot = stream.buffer.subarray(relativeStart);
  if (!snapshot.byteLength) {
    return {
      type: 'error',
      protocol: TERMINAL_PROTOCOL,
      requestId: request.requestId,
      code: 'TERMINAL_OFFSET_GAP',
      message: 'No smoke data is available after the requested offset',
    };
  }

  return {
    type: 'terminal.snapshot',
    protocol: TERMINAL_PROTOCOL,
    requestId: request.requestId,
    runId: request.runId,
    sessionName,
    offsetStart: request.fromOffset,
    offsetEnd: stream.offsetEnd,
    payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
    payload: snapshot.toString('base64'),
  };
}

function attachSnapshotResponder(ws: WebSocket, sessionName: string, stream: EmittedStream) {
  ws.on('message', async (data) => {
    let frame: TerminalFrame;
    try {
      frame = parseFrame(data);
    } catch {
      return;
    }
    if (frame.type !== 'daemon.snapshotRequest') {
      return;
    }
    try {
      await sendFrame(ws, createSnapshotFrame(frame, sessionName, stream));
    } catch {
      ws.close();
    }
  });
}

export function parseTerminalStreamSmokeDaemonArgs(argv: string[]): TerminalStreamSmokeDaemonOptions {
  const flags: Record<string, string[]> = {};
  const booleanFlags = new Set<string>();
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith('--')) {
      continue;
    }
    const name = key.slice(2);
    if (!value || value.startsWith('--')) {
      booleanFlags.add(name);
      continue;
    }
    const values = flags[name] || [];
    values.push(value);
    flags[name] = values;
    index += 1;
  }

  const getFlag = (name: string) => getString(flags[name]?.[flags[name].length - 1]);
  const parseIntegerFlag = (name: string) => {
    const value = getInteger(getFlag(name));
    return value === null ? undefined : value;
  };
  const lines = (flags.line || [])
    .flatMap((line) => line.split(','))
    .map((line) => line.trim())
    .filter(Boolean);

  const options: TerminalStreamSmokeDaemonOptions = {
    serverUrl: getFlag('server-url').replace(/\/$/, ''),
    runId: getFlag('run-id'),
    nodeId: getFlag('node-id'),
    nodeToken: getFlag('node-token'),
    claimRun: booleanFlags.has('claim-run'),
    claimToken: getFlag('claim-token') || undefined,
    claimAttempt: parseIntegerFlag('claim-attempt'),
    leaseVersion: parseIntegerFlag('lease-version'),
    lines,
    sessionName: getFlag('session-name') || undefined,
    lineDelayMs: parseIntegerFlag('line-delay-ms'),
    holdOpenMs: parseIntegerFlag('hold-open-ms'),
  };

  if (!options.serverUrl || !options.runId || !options.nodeId || !options.nodeToken) {
    throw new Error('--server-url, --run-id, --node-id, and --node-token are required');
  }
  if (!options.lines.length) {
    throw new Error('At least one --line is required');
  }

  return options;
}

export async function runTerminalStreamSmokeDaemon(
  options: TerminalStreamSmokeDaemonOptions,
): Promise<TerminalStreamSmokeDaemonResult> {
  const lease = await resolveLease(options);
  const sessionName = options.sessionName || `agw_terminal_stream_smoke_${options.runId}_${Date.now().toString(36)}`;
  const stream: EmittedStream = {
    buffer: Buffer.alloc(0),
    offsetStart: 0,
    offsetEnd: 0,
  };
  const ws = new WebSocket(buildWebSocketUrl(options.serverUrl), {
    headers: {
      Authorization: `Bearer ${options.nodeToken}`,
    },
  });

  try {
    await waitForOpen(ws);
    attachSnapshotResponder(ws, sessionName, stream);

    const registerRequestId = `smoke-register-${Date.now()}`;
    await sendFrame(ws, {
      type: 'daemon.register',
      protocol: TERMINAL_PROTOCOL,
      requestId: registerRequestId,
      nodeId: options.nodeId,
      capabilities: {
        terminalStream: true,
      },
    });
    await waitForAck(ws, registerRequestId);

    const bindRequestId = `smoke-bind-${Date.now()}`;
    const bindFrame: TerminalDaemonBindRun = {
      type: 'daemon.bindRun',
      protocol: TERMINAL_PROTOCOL,
      requestId: bindRequestId,
      runId: options.runId,
      sessionName,
      startOffset: stream.offsetEnd,
      claimToken: lease.claimToken,
      claimAttempt: lease.claimAttempt,
      leaseVersion: lease.leaseVersion,
    };
    await sendFrame(ws, bindFrame);
    await waitForAck(ws, bindRequestId);

    for (const line of options.lines) {
      const text = normalizeLine(line);
      const frame = createTerminalDataFrame({
        runId: options.runId,
        sessionName,
        offsetStart: stream.offsetEnd,
        text,
      });
      stream.buffer = Buffer.concat([stream.buffer, Buffer.from(text, 'utf8')]);
      stream.offsetEnd = frame.offsetEnd;
      await sendFrame(ws, frame);
      await sleep(options.lineDelayMs ?? 200);
    }

    await sleep(options.holdOpenMs ?? 3000);
    await sendFrame(ws, {
      type: 'terminal.end',
      protocol: TERMINAL_PROTOCOL,
      runId: options.runId,
      sessionName,
      offsetEnd: stream.offsetEnd,
      reason: 'completed',
    });

    return {
      runId: options.runId,
      sessionName,
      emittedLineCount: options.lines.length,
      offsetEnd: stream.offsetEnd,
    };
  } finally {
    ws.close();
  }
}

export function encodeSmokeLineForTest(line: string) {
  return encodeTerminalPayload(normalizeLine(line));
}
