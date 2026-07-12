/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import { act, cleanup, render, screen } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_AUTH_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  encodeTerminalPayload,
} from '../../shared/terminalStreamProtocol';
import TerminalStreamSmokePanel from '../components/TerminalStreamSmokePanel';

interface FlowContextWithDefineProperty {
  defineProperty(name: string, descriptor: { value: unknown }): void;
}

type Listener = (event: { data?: string }) => void;

class BrowserFakeWebSocket {
  static latest: BrowserFakeWebSocket | null = null;
  readyState = 1;
  sent: string[] = [];
  private readonly listeners = new Map<string, Set<Listener>>();

  constructor(
    readonly url: string,
    readonly protocols?: string[],
  ) {
    BrowserFakeWebSocket.latest = this;
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.dispatch('close');
  }

  addEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) || new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string, event: { data?: string } = {}) {
    for (const listener of this.listeners.get(type) || []) {
      listener(event);
    }
  }
}

function setFlowContextValue(app: Application, key: string, value: unknown) {
  (app.flowEngine.context as unknown as FlowContextWithDefineProperty).defineProperty(key, { value });
}

function renderSmokePanel() {
  const app = new Application();
  setFlowContextValue(app, 'api', {
    auth: {
      token: 'browser-token',
      getAuthenticator: () => 'basic',
      role: 'root',
    },
    request: vi.fn(async (config: { url: string; method: 'get' | 'post' }) => {
      if (config.url === 'agentGatewayApi:createTerminalStreamTicket/run-id-1') {
        return {
          data: {
            data: {
              ticket: 'ag_stream_smoke_ticket',
              ticketProof: 'ag_stream_smoke_proof',
              authProof: 'ag_stream_smoke_auth',
              authenticator: 'basic',
              role: 'root',
              expiresAt: '2026-06-30T10:02:00.000Z',
            },
          },
        };
      }
      return { data: { data: null } };
    }),
  });
  setFlowContextValue(app, 'message', {
    success: vi.fn(),
    error: vi.fn(),
  });
  render(
    <FlowEngineProvider engine={app.flowEngine}>
      <AntdApp>
        <TerminalStreamSmokePanel runId="run-id-1" />
      </AntdApp>
    </FlowEngineProvider>,
  );
}

async function waitForLatestWebSocket() {
  for (let i = 0; i < 20 && !BrowserFakeWebSocket.latest; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  expect(BrowserFakeWebSocket.latest).toBeTruthy();
  return BrowserFakeWebSocket.latest;
}

describe('TerminalStreamSmokePanel', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    BrowserFakeWebSocket.latest = null;
    globalThis.WebSocket = BrowserFakeWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('does not render without the smoke query flag', () => {
    window.history.pushState({}, '', '/v2/admin/settings/agent-gateway/runs');
    renderSmokePanel();

    expect(screen.queryByTestId('agent-gateway-terminal-stream-smoke-panel')).toBeNull();
  });

  it('renders browser-observable stream state and decoded preview with the smoke flag', async () => {
    window.history.pushState({}, '', '/v2/admin/settings/agent-gateway/runs?terminalStreamSmoke=1');
    renderSmokePanel();

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('agent-gateway-terminal-stream-state')).toHaveTextContent('connecting');
    const webSocket = await waitForLatestWebSocket();
    act(() => {
      webSocket?.dispatch('open');
    });
    expect(webSocket?.sent.length).toBe(1);
    const subscribeFrame = JSON.parse(webSocket?.sent[0] || '{}') as Record<string, unknown>;
    expect(webSocket?.url).not.toContain('token=');
    expect(webSocket?.protocols?.[0]).toBe(TERMINAL_STREAM_BROWSER_SUBPROTOCOL);
    expect(
      webSocket?.protocols?.some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_AUTH_PROTOCOL_PREFIX)),
    ).toBe(false);
    expect(
      webSocket?.protocols?.some((protocol) =>
        protocol.startsWith(TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX),
      ),
    ).toBe(true);
    expect(
      webSocket?.protocols?.some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX)),
    ).toBe(true);
    expect(webSocket?.protocols?.join(',')).not.toContain('browser-token');
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 0,
    });
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_smoke_ticket');
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_smoke_proof');
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_smoke_auth');
    expect(JSON.stringify(subscribeFrame)).not.toContain('browser-token');
    expect(subscribeFrame).not.toHaveProperty('browserAuth');
    expect(subscribeFrame).not.toHaveProperty('ticket');
    expect(subscribeFrame).not.toHaveProperty('ticketProof');
    expect(subscribeFrame).not.toHaveProperty('authProof');
    expect(subscribeFrame).not.toHaveProperty('authToken');
    expect(subscribeFrame).not.toHaveProperty('authenticator');
    expect(subscribeFrame).not.toHaveProperty('role');
    act(() => {
      webSocket?.dispatch('message', {
        data: JSON.stringify({
          type: 'ack',
          protocol: TERMINAL_PROTOCOL,
          requestId: subscribeFrame.requestId,
        }),
      });
      webSocket?.dispatch('message', {
        data: JSON.stringify({
          type: 'terminal.data',
          protocol: TERMINAL_PROTOCOL,
          runId: 'run-id-1',
          sessionName: 'session-1',
          offsetStart: 0,
          offsetEnd: 29,
          payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
          payload: encodeTerminalPayload('AGENT_GATEWAY_STREAM_SMOKE_1\n'),
        }),
      });
    });

    expect(screen.getByTestId('agent-gateway-terminal-stream-state')).toHaveTextContent('live');
    expect(screen.getByTestId('agent-gateway-terminal-stream-offset')).toHaveTextContent('29');
    expect(screen.getByTestId('agent-gateway-terminal-stream-preview')).toHaveTextContent(
      'AGENT_GATEWAY_STREAM_SMOKE_1',
    );
  });
});
