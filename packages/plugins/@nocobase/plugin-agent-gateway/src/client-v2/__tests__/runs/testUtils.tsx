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
import { cleanup, render, screen } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

import { AgentGatewayApiAction, getAgentGatewayApiUrl } from '../../../shared/apiContract';
import { TerminalStreamWebSocketEvent } from '../../utils/terminalStreamClient';

interface FlowContextWithDefineProperty {
  defineProperty(name: string, descriptor: { value: unknown }): void;
}

export function apiUrl(action: AgentGatewayApiAction, targetKey?: string) {
  return getAgentGatewayApiUrl(action, targetKey);
}

export interface RequestConfig {
  url: string;
  method: 'get' | 'post';
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export const RESUMABLE_RUN_CAPABILITIES = {
  resumeSession: true,
  resumeWithMessage: true,
} as const;

interface ApiContextOverrides {
  auth?: {
    token?: string;
    authenticator?: string;
    getAuthenticator?: () => string;
    role?: string;
  };
}

export class FakeBrowserWebSocket {
  static instances: FakeBrowserWebSocket[] = [];

  readyState = 1;
  sent: string[] = [];
  private readonly listeners = new Map<string, Set<(event: TerminalStreamWebSocketEvent) => void>>();

  constructor(
    readonly url: string,
    readonly protocols?: string[],
  ) {
    FakeBrowserWebSocket.instances.push(this);
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

const xtermMock = vi.hoisted(() => {
  type KeyHandler = (event: KeyboardEvent) => boolean;

  class MockTerminal {
    static instances: MockTerminal[] = [];

    writes: string[] = [];
    resetCount = 0;
    disposed = false;
    keyHandler?: KeyHandler;
    private element?: HTMLElement;

    constructor() {
      MockTerminal.instances.push(this);
    }

    loadAddon() {}

    attachCustomKeyEventHandler(handler: KeyHandler) {
      this.keyHandler = handler;
    }

    open(container: HTMLElement) {
      this.element = document.createElement('pre');
      container.appendChild(this.element);
    }

    write(value: string, callback?: () => void) {
      this.writes.push(value);
      if (this.element) {
        this.element.textContent = `${this.element.textContent || ''}${value}`;
      }
      callback?.();
    }

    reset() {
      this.resetCount += 1;
      if (this.element) {
        this.element.textContent = '';
      }
    }

    dispose() {
      this.disposed = true;
    }
  }

  return {
    MockTerminal,
  };
});

const fitAddonMock = vi.hoisted(() => {
  class MockFitAddon {
    static instances: MockFitAddon[] = [];

    fit = vi.fn();

    constructor() {
      MockFitAddon.instances.push(this);
    }
  }

  return {
    MockFitAddon,
  };
});

vi.mock('@xterm/xterm', () => ({
  Terminal: xtermMock.MockTerminal,
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: fitAddonMock.MockFitAddon,
}));

function setFlowContextValue(app: Application, key: string, value: unknown) {
  (app.flowEngine.context as unknown as FlowContextWithDefineProperty).defineProperty(key, { value });
}

export function renderAgentGatewayPage(
  Page: React.ComponentType,
  request: (config: RequestConfig) => Promise<unknown>,
  apiOverrides: ApiContextOverrides = {},
) {
  const app = new Application();
  setFlowContextValue(app, 'api', {
    request,
    ...apiOverrides,
  });
  setFlowContextValue(app, 'message', {
    success: vi.fn(),
    error: vi.fn(),
  });

  render(
    <FlowEngineProvider engine={app.flowEngine}>
      <AntdApp>
        <Page />
      </AntdApp>
    </FlowEngineProvider>,
  );
}

export function getTaskTemplateSelectInput() {
  const input = screen
    .getAllByLabelText('Task template')
    .find((element) => element.getAttribute('role') === 'combobox');
  if (!input) {
    throw new Error('Task template select input not found');
  }
  return input;
}

function stubAnimationFrameWithTimeout() {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
    return window.setTimeout(() => callback(performance.now()), 0);
  });
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
    window.clearTimeout(handle);
  });
}

type IntervalCallback = (...args: unknown[]) => void;

function isIntervalCallback(handler: TimerHandler): handler is IntervalCallback {
  return typeof handler === 'function';
}

export function spyOnPageIntervals() {
  const intervalCallbacks = new Map<number, () => void>();
  let nextPageIntervalId = -1;
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);

  vi.spyOn(window, 'setInterval').mockImplementation((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
    if (isIntervalCallback(handler) && typeof timeout === 'number' && timeout >= 1000) {
      const intervalId = nextPageIntervalId;
      nextPageIntervalId -= 1;
      intervalCallbacks.set(intervalId, () => handler(...args));
      return intervalId;
    }
    return nativeSetInterval(handler, timeout, ...args);
  });
  vi.spyOn(window, 'clearInterval').mockImplementation((intervalId?: number) => {
    if (typeof intervalId === 'number') {
      if (intervalCallbacks.delete(intervalId)) {
        return;
      }
    }
    nativeClearInterval(intervalId);
  });

  return intervalCallbacks;
}

export function getMockTerminalInstances() {
  return xtermMock.MockTerminal.instances;
}

export function setupRunsPageTestHooks() {
  beforeEach(() => {
    xtermMock.MockTerminal.instances = [];
    fitAddonMock.MockFitAddon.instances = [];
    stubAnimationFrameWithTimeout();
    window.history.pushState({}, '', '/admin/settings/agent-gateway/runs');
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
  });

  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    FakeBrowserWebSocket.instances = [];
  });
}
