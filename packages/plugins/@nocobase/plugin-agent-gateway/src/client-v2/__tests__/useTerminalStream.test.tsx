/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
  encodeTerminalPayload,
} from '../../shared/terminalStreamProtocol';
import { TerminalStreamWebSocket, TerminalStreamWebSocketEvent } from '../utils/terminalStreamClient';
import { TERMINAL_STREAM_CHUNK_LIMIT, useTerminalStream } from '../hooks/useTerminalStream';

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
    ticket: 'ag_stream_ticket',
  }));
}

async function waitForFakeWebSocket(index = 0) {
  for (let i = 0; i < 20 && !FakeWebSocket.instances[index]; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  expect(FakeWebSocket.instances[index]).toBeTruthy();
  return FakeWebSocket.instances[index];
}

describe('useTerminalStream', () => {
  afterEach(() => {
    cleanup();
    FakeWebSocket.instances = [];
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  it('tracks stream state and decoded chunks', async () => {
    const webSocketUrls: string[] = [];
    const protocolsBySocket: string[][] = [];
    const createWebSocket = (url: string, protocols?: string[]) => {
      webSocketUrls.push(url);
      protocolsBySocket.push(protocols || []);
      return new FakeWebSocket();
    };
    const createStreamTicket = createStreamTicketFactory();
    const { result } = renderHook(() =>
      useTerminalStream({
        runId: 'run-id-1',
        createStreamTicket,
        createWebSocket,
      }),
    );
    const webSocket = await waitForFakeWebSocket();

    act(() => {
      webSocket.dispatch('open');
    });
    const subscribeFrame = JSON.parse(webSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 0,
    });
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_ticket');
    expect(JSON.stringify(subscribeFrame)).not.toContain('browser-token');
    expect(subscribeFrame).not.toHaveProperty('browserAuth');
    expect(subscribeFrame).not.toHaveProperty('ticket');
    expect(subscribeFrame).not.toHaveProperty('authToken');
    expect(subscribeFrame).not.toHaveProperty('authenticator');
    expect(subscribeFrame).not.toHaveProperty('role');
    expect(webSocketUrls[0]).not.toContain('browser-token');
    expect(protocolsBySocket[0][0]).toBe(TERMINAL_STREAM_BROWSER_SUBPROTOCOL);
    expect(
      protocolsBySocket[0].some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX)),
    ).toBe(true);
    expect(protocolsBySocket[0]).toHaveLength(2);
    expect(protocolsBySocket[0].join(',')).not.toContain('browser-token');
    act(() => {
      webSocket.dispatch('message', {
        data: JSON.stringify({
          type: 'ack',
          protocol: TERMINAL_PROTOCOL,
          requestId: subscribeFrame.requestId,
        }),
      });
      webSocket.dispatch('message', {
        data: JSON.stringify({
          type: 'terminal.data',
          protocol: TERMINAL_PROTOCOL,
          runId: 'run-id-1',
          sessionName: 'session-1',
          offsetStart: 0,
          offsetEnd: 12,
          payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
          payload: encodeTerminalPayload('hello world\n'),
        }),
      });
    });

    await waitFor(() => {
      expect(result.current.connectionState).toBe('live');
      expect(result.current.currentOffset).toBe(12);
      expect(result.current.chunks).toEqual([
        expect.objectContaining({
          offsetStart: 0,
          offsetEnd: 12,
          sequence: 1,
          text: 'hello world\n',
        }),
      ]);
    });
  });

  it('stays closed when disabled or missing auth', () => {
    const { result } = renderHook(() =>
      useTerminalStream({
        runId: 'run-id-1',
        enabled: true,
      }),
    );

    expect(result.current.connectionState).toBe('closed');
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it('caps retained chunks while preserving monotonically increasing sequence numbers', async () => {
    const createWebSocket = () => new FakeWebSocket();
    const createStreamTicket = createStreamTicketFactory();
    const { result } = renderHook(() =>
      useTerminalStream({
        runId: 'run-id-1',
        createStreamTicket,
        createWebSocket,
      }),
    );
    const webSocket = await waitForFakeWebSocket();

    act(() => {
      for (let index = 0; index < TERMINAL_STREAM_CHUNK_LIMIT + 2; index += 1) {
        const text = `${index}\n`;
        webSocket.dispatch('message', {
          data: JSON.stringify({
            type: 'terminal.data',
            protocol: TERMINAL_PROTOCOL,
            runId: 'run-id-1',
            sessionName: 'session-1',
            offsetStart: index,
            offsetEnd: index + 1,
            payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
            payload: encodeTerminalPayload(text),
          }),
        });
      }
    });

    await waitFor(() => {
      expect(result.current.chunks).toHaveLength(TERMINAL_STREAM_CHUNK_LIMIT);
      expect(result.current.chunks[0].sequence).toBe(3);
      expect(result.current.chunks.at(-1)?.sequence).toBe(TERMINAL_STREAM_CHUNK_LIMIT + 2);
    });
  });

  it('reconnects with the current offset after socket close', async () => {
    vi.useFakeTimers();
    const createWebSocket = () => new FakeWebSocket();
    const createStreamTicket = createStreamTicketFactory();
    const { result } = renderHook(() =>
      useTerminalStream({
        runId: 'run-id-1',
        createStreamTicket,
        reconnectDelayMs: 0,
        maxReconnectAttempts: 1,
        createWebSocket,
      }),
    );
    const firstWebSocket = await waitForFakeWebSocket();
    act(() => {
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
    });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const secondWebSocket = await waitForFakeWebSocket(1);
    act(() => {
      secondWebSocket.dispatch('open');
    });
    const subscribeFrame = JSON.parse(secondWebSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 6,
    });
  });

  it('persists the consumed offset and resumes from it after remount', async () => {
    const createWebSocket = () => new FakeWebSocket();
    const createStreamTicket = createStreamTicketFactory();
    const first = renderHook(() =>
      useTerminalStream({
        runId: 'run-id-1',
        createStreamTicket,
        createWebSocket,
      }),
    );
    const firstWebSocket = await waitForFakeWebSocket();

    act(() => {
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
    });

    await waitFor(() => {
      expect(first.result.current.currentOffset).toBe(6);
      expect(window.sessionStorage.getItem('agentGatewayTerminalOffset:run-id-1')).toBe('6');
    });

    first.unmount();
    renderHook(() =>
      useTerminalStream({
        runId: 'run-id-1',
        createStreamTicket,
        createWebSocket,
      }),
    );
    const secondWebSocket = await waitForFakeWebSocket(1);

    act(() => {
      secondWebSocket.dispatch('open');
    });

    const subscribeFrame = JSON.parse(secondWebSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 6,
    });
  });

  it('does not treat a restored offset as visible stream output before data arrives', async () => {
    window.sessionStorage.setItem('agentGatewayTerminalOffset:run-id-1', '6');
    const createWebSocket = () => new FakeWebSocket();
    const createStreamTicket = createStreamTicketFactory();
    const { result } = renderHook(() =>
      useTerminalStream({
        runId: 'run-id-1',
        createStreamTicket,
        createWebSocket,
      }),
    );
    const webSocket = await waitForFakeWebSocket();

    act(() => {
      webSocket.dispatch('open');
    });

    await waitFor(() => {
      expect(result.current.currentOffset).toBe(6);
      expect(result.current.hasStreamOutput).toBe(false);
      expect(result.current.chunks).toEqual([]);
    });
  });

  it('does not flush stale stream state after cleanup disables the hook', async () => {
    vi.useFakeTimers();
    const createWebSocket = () => new FakeWebSocket();
    const createStreamTicket = createStreamTicketFactory();
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useTerminalStream({
          runId: 'run-id-1',
          createStreamTicket,
          enabled,
          createWebSocket,
        }),
      {
        initialProps: {
          enabled: true,
        },
      },
    );
    const webSocket = await waitForFakeWebSocket();

    act(() => {
      webSocket.dispatch('message', {
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
    });
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(result.current.currentOffset).toBe(6);

    rerender({ enabled: false });
    expect(result.current).toMatchObject({
      connectionState: 'closed',
      currentOffset: 0,
      previewText: '',
      chunks: [],
      hasStreamOutput: false,
    });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(result.current).toMatchObject({
      connectionState: 'closed',
      currentOffset: 0,
      previewText: '',
      chunks: [],
      hasStreamOutput: false,
    });
  });
});
