/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME,
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
  encodeTerminalPayload,
} from '../../shared/terminalStreamProtocol';
import {
  TerminalStreamClient,
  TerminalStreamWebSocket,
  TerminalStreamWebSocketEvent,
  buildTerminalStreamUrl,
} from '../utils/terminalStreamClient';

class FakeWebSocket implements TerminalStreamWebSocket {
  static instances: FakeWebSocket[] = [];

  readyState = 1;
  sent: string[] = [];
  private readonly listeners = new Map<string, Set<(event: TerminalStreamWebSocketEvent) => void>>();

  constructor() {
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.dispatch('close', {});
  }

  addEventListener(type: string, listener: (event: TerminalStreamWebSocketEvent) => void) {
    const listeners = this.listeners.get(type) || new Set<(event: TerminalStreamWebSocketEvent) => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: TerminalStreamWebSocketEvent) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string, event: TerminalStreamWebSocketEvent = {}) {
    for (const listener of this.listeners.get(type) || []) {
      listener(event);
    }
  }
}

function createStreamTicketFactory() {
  return vi.fn(async () => ({
    ticket: 'ag_stream_client_ticket',
  }));
}

async function waitForFakeWebSocket(index = 0) {
  for (let i = 0; i < 20 && !FakeWebSocket.instances[index]; i += 1) {
    await Promise.resolve();
  }
  expect(FakeWebSocket.instances[index]).toBeTruthy();
  return FakeWebSocket.instances[index];
}

describe('TerminalStreamClient', () => {
  afterEach(() => {
    FakeWebSocket.instances = [];
    vi.useRealTimers();
  });

  it('builds the plugin-owned websocket URL without browser auth query fields', () => {
    expect(
      buildTerminalStreamUrl({
        baseUrl: 'http://127.0.0.1:23000',
      }),
    ).toBe('ws://127.0.0.1:23000/ws/agent-gateway/terminal');
  });

  it('subscribes on open and consumes ordered terminal data', async () => {
    const states: unknown[] = [];
    const onChunk = vi.fn();
    const protocolsBySocket: string[][] = [];
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      baseUrl: 'http://127.0.0.1:23000',
      createStreamTicket: createStreamTicketFactory(),
      createWebSocket: (_url, protocols) => {
        protocolsBySocket.push(protocols || []);
        return new FakeWebSocket();
      },
      onStateChange: (state) => states.push(state),
      onChunk,
    });

    client.connect();
    const fakeWebSocket = await waitForFakeWebSocket();
    expect(buildTerminalStreamUrl({ baseUrl: 'http://127.0.0.1:23000' })).not.toContain('token=');
    expect(protocolsBySocket[0][0]).toBe(TERMINAL_STREAM_BROWSER_SUBPROTOCOL);
    expect(
      protocolsBySocket[0].some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX)),
    ).toBe(true);
    expect(protocolsBySocket[0]).toHaveLength(2);
    expect(protocolsBySocket[0].join(',')).not.toContain('browser-token');
    expect(protocolsBySocket[0].join(',')).not.toContain('ag_stream_client_ticket');
    fakeWebSocket.dispatch('open');
    const subscribeFrame = JSON.parse(fakeWebSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      protocol: TERMINAL_PROTOCOL,
      runId: 'run-id-1',
      lastOffset: 0,
    });
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_client_ticket');
    expect(JSON.stringify(subscribeFrame)).not.toContain('browser-token');
    expect(subscribeFrame).not.toHaveProperty('browserAuth');
    expect(subscribeFrame).not.toHaveProperty('ticket');
    expect(subscribeFrame).not.toHaveProperty('authToken');
    expect(subscribeFrame).not.toHaveProperty('authenticator');
    expect(subscribeFrame).not.toHaveProperty('role');

    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: subscribeFrame.requestId,
      }),
    });
    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        sessionName: 'session-1',
        offsetStart: 0,
        offsetEnd: 6,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('hello\n'),
      }),
    });

    expect(client.getState()).toMatchObject({
      connectionState: 'live',
      currentOffset: 6,
      previewText: 'hello\n',
    });
    expect(onChunk).toHaveBeenCalledWith({
      frameType: 'terminal.data',
      offsetStart: 0,
      offsetEnd: 6,
      text: 'hello\n',
    });
    expect(states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ connectionState: 'connecting' }),
        expect.objectContaining({ connectionState: 'live' }),
      ]),
    );
  });

  it('only emits the unconsumed tail from overlapping snapshot frames', async () => {
    const onChunk = vi.fn();
    const prefix = '你好\n';
    const tail = 'world\n';
    const fullOutput = `${prefix}${tail}`;
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      createStreamTicket: createStreamTicketFactory(),
      lastOffset: new TextEncoder().encode(prefix).byteLength,
      createWebSocket: () => new FakeWebSocket(),
      onChunk,
    });

    client.connect();
    const fakeWebSocket = await waitForFakeWebSocket();
    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'terminal.snapshot',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        sessionName: 'session-1',
        offsetStart: 0,
        offsetEnd: new TextEncoder().encode(fullOutput).byteLength,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(fullOutput),
      }),
    });

    expect(client.getState()).toMatchObject({
      connectionState: 'live',
      currentOffset: new TextEncoder().encode(fullOutput).byteLength,
      previewText: tail,
    });
    expect(onChunk).toHaveBeenCalledWith({
      frameType: 'terminal.snapshot',
      offsetStart: new TextEncoder().encode(prefix).byteLength,
      offsetEnd: new TextEncoder().encode(fullOutput).byteLength,
      text: tail,
    });
  });

  it('consumes browser terminal frames without sessionName', async () => {
    const onChunk = vi.fn();
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      createStreamTicket: createStreamTicketFactory(),
      createWebSocket: () => new FakeWebSocket(),
      onChunk,
    });

    client.connect();
    const fakeWebSocket = await waitForFakeWebSocket();
    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        offsetStart: 0,
        offsetEnd: 6,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('hello\n'),
      }),
    });
    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'terminal.snapshot',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        offsetStart: 6,
        offsetEnd: 12,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('world\n'),
      }),
    });
    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'terminal.end',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        offsetEnd: 12,
        reason: 'completed',
      }),
    });

    expect(onChunk).toHaveBeenCalledWith({
      frameType: 'terminal.data',
      offsetStart: 0,
      offsetEnd: 6,
      text: 'hello\n',
    });
    expect(onChunk).toHaveBeenCalledWith({
      frameType: 'terminal.snapshot',
      offsetStart: 6,
      offsetEnd: 12,
      text: 'world\n',
    });
    expect(client.getState()).toMatchObject({
      connectionState: 'closed',
      currentOffset: 12,
      previewText: 'hello\nworld\n',
    });
  });

  it('splits large decoded payloads into browser frame-sized chunks', async () => {
    const onChunk = vi.fn();
    const largeText = `${'L'.repeat(TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME)}tail`;
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      createStreamTicket: createStreamTicketFactory(),
      createWebSocket: () => new FakeWebSocket(),
      onChunk,
    });

    client.connect();
    const fakeWebSocket = await waitForFakeWebSocket();
    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        sessionName: 'session-1',
        offsetStart: 0,
        offsetEnd: largeText.length,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(largeText),
      }),
    });

    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onChunk.mock.calls[0][0]).toMatchObject({
      offsetStart: 0,
      offsetEnd: TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME,
    });
    expect(onChunk.mock.calls[0][0].text).toHaveLength(TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME);
    expect(onChunk.mock.calls[1][0]).toMatchObject({
      offsetStart: TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME,
      offsetEnd: largeText.length,
      text: 'tail',
    });
  });

  it('ignores stale chunks and reconnects from the current offset after a local gap', async () => {
    vi.useFakeTimers();
    const onStateChange = vi.fn();
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      createStreamTicket: createStreamTicketFactory(),
      lastOffset: 6,
      reconnectDelayMs: 0,
      maxReconnectAttempts: 1,
      createWebSocket: () => new FakeWebSocket(),
      onStateChange,
    });

    client.connect();
    const fakeWebSocket = await waitForFakeWebSocket();
    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        sessionName: 'session-1',
        offsetStart: 0,
        offsetEnd: 6,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('stale\n'),
      }),
    });
    expect(client.getState().currentOffset).toBe(6);
    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        sessionName: 'session-1',
        offsetStart: 10,
        offsetEnd: 16,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('gap!!!'),
      }),
    });

    expect(client.getState()).toMatchObject({
      connectionState: 'reconnecting',
      currentOffset: 6,
      lastErrorCode: 'TERMINAL_OFFSET_GAP',
    });
    await vi.runOnlyPendingTimersAsync();
    const secondWebSocket = await waitForFakeWebSocket(1);
    secondWebSocket.dispatch('open');
    const subscribeFrame = JSON.parse(secondWebSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 6,
    });
  });

  it('exposes protocol permission errors in state', async () => {
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      createStreamTicket: createStreamTicketFactory(),
      createWebSocket: () => new FakeWebSocket(),
    });

    client.connect();
    const fakeWebSocket = await waitForFakeWebSocket();
    fakeWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'error',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-1',
        code: 'TERMINAL_PERMISSION_DENIED',
        message: 'Denied',
      }),
    });

    expect(client.getState()).toMatchObject({
      connectionState: 'error',
      lastErrorCode: 'TERMINAL_PERMISSION_DENIED',
    });
  });

  it('reconnects with the consumed offset after an unexpected socket close', async () => {
    vi.useFakeTimers();
    const states: unknown[] = [];
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      createStreamTicket: createStreamTicketFactory(),
      reconnectDelayMs: 0,
      maxReconnectAttempts: 1,
      createWebSocket: () => new FakeWebSocket(),
      onStateChange: (state) => states.push(state),
    });

    client.connect();
    const firstWebSocket = await waitForFakeWebSocket();
    firstWebSocket.dispatch('open');
    const firstSubscribeFrame = JSON.parse(firstWebSocket.sent[0]) as Record<string, unknown>;
    firstWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: firstSubscribeFrame.requestId,
      }),
    });
    firstWebSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        sessionName: 'session-1',
        offsetStart: 0,
        offsetEnd: 6,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('hello\n'),
      }),
    });

    firstWebSocket.dispatch('close');
    expect(client.getState()).toMatchObject({
      connectionState: 'reconnecting',
      currentOffset: 6,
    });

    await vi.runOnlyPendingTimersAsync();
    const secondWebSocket = await waitForFakeWebSocket(1);
    secondWebSocket.dispatch('open');
    const secondSubscribeFrame = JSON.parse(secondWebSocket.sent[0]) as Record<string, unknown>;

    expect(secondSubscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 6,
    });
    expect(states).toEqual(expect.arrayContaining([expect.objectContaining({ connectionState: 'reconnecting' })]));
  });

  it('reconnects after a native websocket error followed by close', async () => {
    vi.useFakeTimers();
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      createStreamTicket: createStreamTicketFactory(),
      lastOffset: 9,
      reconnectDelayMs: 0,
      maxReconnectAttempts: 1,
      createWebSocket: () => new FakeWebSocket(),
    });

    client.connect();
    const firstWebSocket = await waitForFakeWebSocket();
    firstWebSocket.dispatch('error');
    expect(client.getState()).toMatchObject({
      connectionState: 'connecting',
      lastErrorCode: 'TERMINAL_DAEMON_UNAVAILABLE',
    });

    firstWebSocket.dispatch('close');
    expect(client.getState()).toMatchObject({
      connectionState: 'reconnecting',
      currentOffset: 9,
    });

    await vi.runOnlyPendingTimersAsync();
    const secondWebSocket = await waitForFakeWebSocket(1);
    secondWebSocket.dispatch('open');
    const subscribeFrame = JSON.parse(secondWebSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 9,
    });
  });
});
