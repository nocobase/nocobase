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
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
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

  constructor(readonly url: string) {
    BrowserFakeWebSocket.latest = this;
    setTimeout(() => this.dispatch('open'), 0);
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
      role: 'root',
      getAuthenticator: () => 'basic',
    },
    request: vi.fn(),
  });
  render(
    <FlowEngineProvider engine={app.flowEngine}>
      <AntdApp>
        <TerminalStreamSmokePanel runId="run-id-1" />
      </AntdApp>
    </FlowEngineProvider>,
  );
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

    expect(await screen.findByTestId('agent-gateway-terminal-stream-state')).toHaveTextContent('connecting');
    await waitFor(() => {
      expect(BrowserFakeWebSocket.latest?.sent.length).toBe(1);
    });
    const subscribeFrame = JSON.parse(BrowserFakeWebSocket.latest?.sent[0] || '{}') as Record<string, unknown>;
    act(() => {
      BrowserFakeWebSocket.latest?.dispatch('message', {
        data: JSON.stringify({
          type: 'ack',
          protocol: TERMINAL_PROTOCOL,
          requestId: subscribeFrame.requestId,
        }),
      });
      BrowserFakeWebSocket.latest?.dispatch('message', {
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

    expect(await screen.findByTestId('agent-gateway-terminal-stream-state')).toHaveTextContent('live');
    expect(screen.getByTestId('agent-gateway-terminal-stream-offset')).toHaveTextContent('29');
    expect(screen.getByTestId('agent-gateway-terminal-stream-preview')).toHaveTextContent(
      'AGENT_GATEWAY_STREAM_SMOKE_1',
    );
  });
});
