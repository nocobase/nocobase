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
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
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

describe('TerminalStreamClient', () => {
  afterEach(() => {
    FakeWebSocket.instances = [];
    vi.useRealTimers();
  });

  it('builds the plugin-owned websocket URL with browser auth query fields', () => {
    expect(
      buildTerminalStreamUrl({
        baseUrl: 'http://127.0.0.1:23000',
        token: 'browser-token',
        authenticator: 'basic',
        role: 'root',
      }),
    ).toBe('ws://127.0.0.1:23000/ws/agent-gateway/terminal?token=browser-token&authenticator=basic&role=root');
  });

  it('subscribes on open and consumes ordered terminal data', () => {
    const fakeWebSocket = new FakeWebSocket();
    const states: unknown[] = [];
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      token: 'browser-token',
      baseUrl: 'http://127.0.0.1:23000',
      createWebSocket: () => fakeWebSocket,
      onStateChange: (state) => states.push(state),
    });

    client.connect();
    fakeWebSocket.dispatch('open');
    const subscribeFrame = JSON.parse(fakeWebSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      protocol: TERMINAL_PROTOCOL,
      runId: 'run-id-1',
      lastOffset: 0,
    });

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
    expect(states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ connectionState: 'connecting' }),
        expect.objectContaining({ connectionState: 'live' }),
      ]),
    );
  });

  it('ignores stale chunks and marks offset gaps explicitly', () => {
    const fakeWebSocket = new FakeWebSocket();
    const onStateChange = vi.fn();
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      token: 'browser-token',
      lastOffset: 6,
      createWebSocket: () => fakeWebSocket,
      onStateChange,
    });

    client.connect();
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
      connectionState: 'error',
      currentOffset: 6,
      lastErrorCode: 'TERMINAL_OFFSET_GAP',
    });
  });

  it('exposes protocol permission errors in state', () => {
    const fakeWebSocket = new FakeWebSocket();
    const client = new TerminalStreamClient({
      runId: 'run-id-1',
      token: 'browser-token',
      createWebSocket: () => fakeWebSocket,
    });

    client.connect();
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
      token: 'browser-token',
      reconnectDelayMs: 0,
      maxReconnectAttempts: 1,
      createWebSocket: () => new FakeWebSocket(),
      onStateChange: (state) => states.push(state),
    });

    client.connect();
    const firstWebSocket = FakeWebSocket.instances[0];
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
    const secondWebSocket = FakeWebSocket.instances[1];
    secondWebSocket.dispatch('open');
    const secondSubscribeFrame = JSON.parse(secondWebSocket.sent[0]) as Record<string, unknown>;

    expect(secondSubscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 6,
    });
    expect(states).toEqual(expect.arrayContaining([expect.objectContaining({ connectionState: 'reconnecting' })]));
  });
});
