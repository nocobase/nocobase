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
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
import { AgentTimeline } from '../components/AgentTimeline';
import AgentGatewayDispatchBindingsPage from '../pages/AgentGatewayDispatchBindingsPage';
import AgentGatewayProviderCapabilitiesPage from '../pages/AgentGatewayProviderCapabilitiesPage';
import AgentGatewayPromptTemplatesPage from '../pages/AgentGatewayPromptTemplatesPage';
import AgentGatewayRunsPage from '../pages/AgentGatewayRunsPage';
import AgentGatewaySettingsPage from '../pages/AgentGatewaySettingsPage';
import PluginAgentGatewayClientV2 from '../plugin';
import { TerminalStreamWebSocketEvent } from '../utils/terminalStreamClient';

interface FlowContextWithDefineProperty {
  defineProperty(name: string, descriptor: { value: unknown }): void;
}

interface RequestConfig {
  url: string;
  method: 'get' | 'post';
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

interface ApiContextOverrides {
  auth?: {
    token?: string;
    authenticator?: string;
    getAuthenticator?: () => string;
    role?: string;
  };
}

class FakeBrowserWebSocket {
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

function renderAgentGatewayPage(
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

function renderSettingsPage(request: (config: RequestConfig) => Promise<unknown>) {
  renderAgentGatewayPage(AgentGatewaySettingsPage, request);
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

function spyOnPageIntervals() {
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

describe('PluginAgentGatewayClientV2', () => {
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

  it('registers the Agent Gateway settings page', async () => {
    const app = new Application({
      plugins: [PluginAgentGatewayClientV2],
    });
    const addMenuItem = vi.spyOn(app.pluginSettingsManager, 'addMenuItem');
    const addPageTabItem = vi.spyOn(app.pluginSettingsManager, 'addPageTabItem');

    await app.load();

    expect(addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'agent-gateway',
        icon: 'ApiOutlined',
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'nodes',
        sort: 10,
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'runs',
        sort: 20,
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'provider-capabilities',
        aclSnippet: 'pm.agent-gateway.nodes',
        sort: 24,
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'prompt-templates',
        sort: 30,
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'dispatch-bindings',
        sort: 40,
      }),
    );
    expect(app.pluginSettingsManager.getRoutePath('agent-gateway.nodes')).toBe('/admin/settings/agent-gateway/nodes');
  });

  it('renders nodes and per-node profiles without raw execution configuration', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/nodes:list') {
        return {
          data: {
            data: [
              {
                id: 'node-id-1',
                nodeKey: 'node-1',
                displayName: 'Local fake runner',
                status: 'active',
                tokenLast4: 'abcd',
                capabilitiesJson: {
                  maxConcurrency: 2,
                },
                metadataJson: {
                  currentConcurrency: 1,
                  daemonVersion: 'fake-daemon/1.0.0',
                },
                registeredAt: '2026-06-30T10:00:00.000Z',
                lastHeartbeatAt: '2026-06-30T10:01:00.000Z',
                online: true,
                onlineReason: null,
              },
              {
                id: 'node-id-stale',
                nodeKey: 'node-stale',
                displayName: 'Stale local runner',
                status: 'active',
                registeredAt: '2026-06-30T10:00:00.000Z',
                lastHeartbeatAt: '2026-06-30T09:55:00.000Z',
                online: false,
                onlineReason: 'heartbeat-stale',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/nodes/node-id-1/profiles:list') {
        return {
          data: {
            data: [
              {
                id: 'profile-id-1',
                profileKey: 'fake-success',
                displayName: 'Fake Success',
                agentType: 'code',
                driver: 'fake',
                status: 'active',
                capabilitiesJson: {
                  terminalOutput: true,
                  artifacts: true,
                },
                metadataJson: {
                  command: 'must-not-render',
                  cwd: '/tmp/must-not-render',
                  env: {
                    SECRET: 'must-not-render',
                  },
                },
                trustedConfigJson: {
                  command: 'must-not-render',
                },
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/nodes:update/node-id-1') {
        return {
          data: {
            data: {
              id: 'node-id-1',
              nodeKey: 'node-1',
              displayName: 'Local fake runner',
              status: 'disabled',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderSettingsPage(request);

    expect(await screen.findByRole('heading', { name: 'Agent Gateway' })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByText('node-1').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Local fake runner')).toBeTruthy();
    expect(screen.getAllByText('Enabled state').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Connection').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Online').length).toBeGreaterThan(0);
    expect(screen.getByText('Offline - stale heartbeat')).toBeTruthy();
    expect(screen.getByText('fake-daemon/1.0.0')).toBeTruthy();
    expect(await screen.findByText('fake-success')).toBeTruthy();
    expect(await screen.findByText(/^(Terminal output|terminalOutput)$/)).toBeTruthy();
    expect(await screen.findByText(/^(Artifacts|artifacts)$/)).toBeTruthy();
    expect(screen.queryByText('must-not-render')).toBeNull();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/nodes:list',
        method: 'get',
      }),
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/nodes/node-id-1/profiles:list',
        method: 'get',
      }),
    );

    fireEvent.click(screen.getAllByLabelText('Toggle node status')[0]);
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/nodes:update/node-id-1',
          method: 'post',
          data: {
            status: 'disabled',
          },
        }),
      );
    });
  });

  it('opens skill upload with NB OpenCode UI Batch defaults', async () => {
    const request = vi.fn(async () => ({ data: { data: [] } }));

    renderSettingsPage(request);

    fireEvent.click(await screen.findByText('Upload skill'));

    expect(screen.getByLabelText('Skill key')).toHaveValue('nb-opencode-ui-batch');
    expect(screen.getByLabelText('Display name')).toHaveValue('NB OpenCode UI Batch');
    expect(screen.getByLabelText('Version label')).toHaveValue('local');
  });

  it('shows uploaded skill versions in the settings Skills tab', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/skill-versions:list') {
        return {
          data: {
            data: [
              {
                id: 'skill-version-id-1',
                skillKey: 'nb-opencode-ui-batch',
                displayName: 'NB OpenCode UI Batch',
                versionLabel: 'local',
                status: 'active',
                skillStatus: 'active',
                sourceType: 'zip',
                sourceSha256: 'abcdef0123456789',
                updatedAt: '2026-07-05T10:00:00.000Z',
              },
            ],
          },
        };
      }
      return { data: { data: [] } };
    });

    renderSettingsPage(request);

    fireEvent.click(await screen.findByRole('tab', { name: 'Skills' }));

    expect(await screen.findByText('NB OpenCode UI Batch')).toBeTruthy();
    expect(await screen.findByText('nb-opencode-ui-batch')).toBeTruthy();
    expect(await screen.findByText('local')).toBeTruthy();
    expect(await screen.findByText('zip / abcdef01...')).toBeTruthy();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/skill-versions:list',
        method: 'get',
      }),
    );
  });

  it('renders a compact provider capability matrix', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/nodes:list') {
        return {
          data: {
            data: [
              {
                id: 'node-id-1',
                nodeKey: 'node-1',
              },
            ],
          },
        };
      }
      if (config.url === 'agent-gateway/nodes/node-id-1/profiles:list') {
        return {
          data: {
            data: [
              {
                id: 'profile-codex',
                profileKey: 'codex',
                provider: 'codex',
                displayName: 'Codex',
                status: 'active',
                capabilitiesJson: {
                  resumeSession: true,
                },
              },
              {
                id: 'profile-generic',
                profileKey: 'generic-cli',
                provider: 'generic-cli',
                displayName: 'Generic CLI',
                status: 'active',
                capabilitiesJson: {},
              },
            ],
          },
        };
      }
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-codex',
                runCode: 'provider-capability-codex',
                status: 'succeeded',
                agentProfileId: 'profile-codex',
                sourceType: 'provider-capability-seed',
                agentSessionId: 'session-codex',
                agentSessionProviderId: 'codex-thread',
                agentProvider: 'codex',
                agentProviderCapabilitySource: 'session',
                agentProviderCapabilitiesJson: {
                  resumeSession: true,
                  artifacts: false,
                },
                agentGatewayActionPermissionsJson: {
                  resumeAgentSession: true,
                  readTerminal: true,
                  readArtifacts: true,
                  readRawLogs: true,
                  interruptRun: true,
                  terminateRun: true,
                },
                agentGatewayControlActionsJson: {
                  interruptRun: true,
                  terminateRun: true,
                },
              },
              {
                id: 'run-generic',
                runCode: 'provider-capability-generic',
                status: 'running',
                agentProfileId: 'profile-generic',
                sourceType: 'provider-capability-seed',
                terminalBackend: 'tmux',
                terminalStatus: 'active',
                agentGatewayActionPermissionsJson: {
                  resumeAgentSession: true,
                  readTerminal: true,
                  readArtifacts: true,
                  readRawLogs: true,
                  interruptRun: true,
                  terminateRun: true,
                },
                agentGatewayControlActionsJson: {
                  interruptRun: true,
                  terminateRun: true,
                },
              },
            ],
          },
        };
      }
      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayProviderCapabilitiesPage, request);

    expect(await screen.findByText('Provider Capabilities')).toBeTruthy();
    expect(await screen.findByText('Run detail')).toBeTruthy();
    expect(await screen.findByText('Detail controls')).toBeTruthy();
    expect(await screen.findByText('Server response')).toBeTruthy();
    expect(await screen.findByText('provider-capability-codex')).toBeTruthy();
    expect(await screen.findByText('provider-capability-generic')).toBeTruthy();
    expect(await screen.findAllByText('codex')).toHaveLength(2);
    expect(await screen.findAllByText('generic-cli')).toHaveLength(2);
    expect(await screen.findAllByText('Resume: Visible')).toHaveLength(1);
    expect(await screen.findAllByText('Resume: Hidden')).toHaveLength(1);
    expect(await screen.findAllByText('Resume: 409 unsupported')).toHaveLength(1);
    expect(await screen.findAllByText('Artifacts: Hidden')).toHaveLength(2);
    expect(await screen.findAllByText('Artifacts: 409 unsupported')).toHaveLength(2);
    expect(await screen.findAllByText('Live message: 409 unsupported')).toHaveLength(2);
    expect(await screen.findAllByText('CLI stdin: 403 disabled')).toHaveLength(2);
    expect(await screen.findByText('Interrupt: 409 unsupported')).toBeTruthy();
    expect(await screen.findByText('Terminate: Allowed')).toBeTruthy();
    expect(await screen.findAllByText('Terminal output: 200 unavailable')).toHaveLength(2);
    expect(screen.queryByText('Live message: Allowed')).toBeNull();
    expect(
      await screen.findByText(
        (_, element) => element?.tagName === 'SPAN' && element.textContent === 'resumeSession: 1',
      ),
    ).toBeTruthy();
    expect(
      await screen.findByText((_, element) => element?.tagName === 'SPAN' && element.textContent === 'artifacts: 0'),
    ).toBeTruthy();
  });

  it('renders provider capability matrix controls with current user permissions', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/nodes:list') {
        return {
          data: {
            data: [
              {
                id: 'node-id-1',
                nodeKey: 'node-1',
              },
            ],
          },
        };
      }
      if (config.url === 'agent-gateway/nodes/node-id-1/profiles:list') {
        return {
          data: {
            data: [
              {
                id: 'profile-codex',
                profileKey: 'custom-codex',
                provider: 'codex',
                displayName: 'Custom Codex',
                status: 'active',
                capabilitiesJson: {
                  structuredEvents: true,
                  terminalOutput: true,
                  resumeSession: true,
                  interrupt: true,
                  terminate: true,
                  artifacts: true,
                },
              },
            ],
          },
        };
      }
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-codex',
                runCode: 'provider-capability-codex-restricted',
                status: 'running',
                agentProfileId: 'profile-codex',
                sourceType: 'provider-capability-seed',
                agentSessionId: 'session-codex',
                agentSessionProviderId: 'codex-thread',
                terminalBackend: 'tmux',
                terminalStatus: 'active',
                agentGatewayActionPermissionsJson: {
                  resumeAgentSession: false,
                  readTerminal: false,
                  readArtifacts: false,
                  readRawLogs: false,
                  interruptRun: false,
                  terminateRun: false,
                },
                agentGatewayControlActionsJson: {
                  interruptRun: false,
                  terminateRun: false,
                },
              },
            ],
          },
        };
      }
      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayProviderCapabilitiesPage, request);

    expect(await screen.findByText('provider-capability-codex-restricted')).toBeTruthy();
    expect(await screen.findAllByText('Resume: Hidden')).toHaveLength(1);
    expect(await screen.findAllByText('Live output: Hidden')).toHaveLength(1);
    expect(await screen.findAllByText('Interrupt: Hidden')).toHaveLength(1);
    expect(await screen.findAllByText('Terminate: Hidden')).toHaveLength(1);
    expect(await screen.findAllByText('Raw logs: Hidden')).toHaveLength(1);
    expect(await screen.findAllByText('Artifacts: Hidden')).toHaveLength(1);
    expect(await screen.findAllByText('Resume: 403 denied')).toHaveLength(1);
    expect(await screen.findAllByText('Interrupt: 403 denied')).toHaveLength(1);
    expect(await screen.findAllByText('Terminal output: 403 denied')).toHaveLength(1);
    expect(await screen.findAllByText('Raw logs: 403 denied')).toHaveLength(1);
    expect(await screen.findAllByText('Artifacts: 403 denied')).toHaveLength(1);
  });

  it('creates an invitation and clears the one-time register command when the modal closes', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/node-invitations:create') {
        return {
          data: {
            data: {
              invitationId: 'invitation-id-1',
              bootstrapCommand:
                "curl -fsSL 'https://nocobase.example.test/api/agent-gateway/bootstrap.sh' | AGENT_GATEWAY_SERVER_URL='https://nocobase.example.test' AGENT_GATEWAY_NODE_KEY='remote-196' AGENT_GATEWAY_INVITE_TOKEN='ag_inv_once' AGENT_GATEWAY_SERVICE_SCOPE='auto' AGENT_GATEWAY_HEALTH_CHECK='true' bash",
              registerCommand:
                "curl -fsSL 'https://nocobase.example.test/api/agent-gateway/bootstrap.sh' | AGENT_GATEWAY_SERVER_URL='https://nocobase.example.test' AGENT_GATEWAY_NODE_KEY='remote-196' AGENT_GATEWAY_INVITE_TOKEN='ag_inv_once' AGENT_GATEWAY_SERVICE_SCOPE='auto' AGENT_GATEWAY_HEALTH_CHECK='true' bash",
              expiresAt: '2026-07-01T10:00:00.000Z',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderSettingsPage(request);

    fireEvent.click(await screen.findByText('Create invitation'));
    const nodeKeyInput = await screen.findByRole('textbox', { name: 'Node key' });
    expect(nodeKeyInput).toBeTruthy();
    fireEvent.change(nodeKeyInput, {
      target: { value: 'remote-196' },
    });
    fireEvent.click(screen.getByText('Create'));

    expect(await screen.findByText(/curl -fsSL/)).toBeTruthy();
    expect(await screen.findByText(/AGENT_GATEWAY_NODE_KEY='remote-196'/)).toBeTruthy();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/node-invitations:create',
        method: 'post',
        data: expect.objectContaining({
          expectedNodeKey: 'remote-196',
        }),
      }),
    );

    fireEvent.click(screen.getByText('Close'));

    await waitFor(() => {
      expect(screen.queryByText(/curl -fsSL/)).toBeNull();
    });
  });

  it('lists, creates, and previews prompt templates through Agent Gateway APIs', async () => {
    const templates = [
      {
        id: 'template-id-1',
        templateKey: 'ticket-summary',
        displayName: 'Ticket summary',
        status: 'active',
        templateText: 'Summarize {{record.title}}',
      },
    ];
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/prompt-templates:list') {
        return {
          data: {
            data: templates,
          },
        };
      }

      if (config.url === 'agent-gateway/prompt-templates:create') {
        templates.push({
          id: 'template-id-2',
          templateKey: String(config.data?.templateKey),
          displayName: String(config.data?.displayName),
          status: 'active',
          templateText: String(config.data?.templateText),
        });
        return {
          data: {
            data: templates[1],
          },
        };
      }

      if (config.url === 'agent-gateway/prompt-templates:preview') {
        return {
          data: {
            data: {
              templateId: 'template-id-1',
              templateKey: 'ticket-summary',
              renderedPrompt: 'Rendered task prompt',
              variables: [{ expression: 'record.title', value: 'Task title' }],
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayPromptTemplatesPage, request);

    expect(await screen.findByText('Prompt Templates')).toBeTruthy();
    expect(await screen.findByText('ticket-summary')).toBeTruthy();

    fireEvent.click(screen.getByText('New template'));
    fireEvent.change(screen.getByPlaceholderText('ticket-summary'), {
      target: { value: 'new-template' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ticket summary'), {
      target: { value: 'New template' },
    });
    fireEvent.change(screen.getByPlaceholderText('Summarize {{record.title}}'), {
      target: { value: 'Hello {{record.title}}' },
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/prompt-templates:create',
          method: 'post',
          data: expect.objectContaining({
            templateKey: 'new-template',
            displayName: 'New template',
            templateText: 'Hello {{record.title}}',
          }),
        }),
      );
    });

    const previewButtons = await screen.findAllByLabelText('Preview template');
    fireEvent.click(previewButtons[0]);
    fireEvent.change(screen.getByLabelText('Collection name'), {
      target: { value: 'tasks' },
    });
    fireEvent.change(screen.getByLabelText('Record ID'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Preview'));

    expect(await screen.findByText('Rendered task prompt')).toBeTruthy();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/prompt-templates:preview',
        method: 'post',
        data: expect.objectContaining({
          templateId: 'template-id-1',
          collectionName: 'tasks',
          recordId: '1',
        }),
      }),
    );
  });

  it('creates a task run from the runs page and opens the run details', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/task-runs:options') {
        return {
          data: {
            data: {
              defaultProfileKey: 'codex',
              defaultCwd: '.',
              nodes: [
                {
                  id: 'node-id-offline',
                  nodeKey: 'old-codex',
                  displayName: 'Old Codex',
                  status: 'active',
                  online: false,
                  profiles: [
                    {
                      id: 'profile-id-offline',
                      nodeId: 'node-id-offline',
                      profileKey: 'codex',
                      displayName: 'Old Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
                {
                  id: 'node-id-1',
                  nodeKey: 'local-codex',
                  displayName: 'Local Codex',
                  status: 'active',
                  online: true,
                  profiles: [
                    {
                      id: 'profile-id-1',
                      nodeId: 'node-id-1',
                      profileKey: 'codex',
                      displayName: 'Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
              ],
              skillVersions: [
                {
                  id: 'skill-version-id-1',
                  skillKey: 'nb-opencode-ui-batch',
                  displayName: 'NB OpenCode UI Batch',
                  versionLabel: 'v1',
                  status: 'active',
                },
              ],
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [],
          },
        };
      }

      if (config.url === 'agent-gateway/task-runs:create') {
        return {
          data: {
            data: {
              runId: 'run-id-created',
              runCode: 'run-ui-build-created',
              run: {
                id: 'run-id-created',
                runCode: 'run-ui-build-created',
                status: 'queued',
                resultSummaryJson: {
                  title: 'Batch evaluation',
                },
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-created') {
        return {
          data: {
            data: {
              id: 'run-id-created',
              runCode: 'run-ui-build-created',
              status: 'queued',
              resultSummaryJson: {
                title: 'Batch evaluation',
              },
              requestedAt: '2026-07-04T10:00:00.000Z',
              nodeId: 'node-id-1',
              agentProfileId: 'profile-id-1',
              runnerStatusJson: {
                online: false,
                reason: 'heartbeat-stale',
                nodeKey: 'local-codex',
                profileKey: 'codex',
                lastHeartbeatAt: '2026-07-04T09:55:00.000Z',
              },
              agentGatewayActionPermissionsJson: {},
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('New task run'));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Batch evaluation' },
    });
    fireEvent.mouseDown(screen.getByLabelText('Task preset'));
    fireEvent.click(await screen.findByText('OpenCode UI batch harness'));
    fireEvent.change(screen.getByLabelText('Instruction'), {
      target: { value: '运行 nb-opencode-ui-batch harness 并汇总结果' },
    });
    expect(await screen.findByText('NB OpenCode UI Batch / v1')).toBeTruthy();
    fireEvent.click(screen.getByText('Advanced'));
    fireEvent.change(screen.getByLabelText('Artifact root'), {
      target: { value: '../..' },
    });
    fireEvent.click(screen.getByText('Add artifact declaration'));
    fireEvent.change(screen.getByLabelText('Artifact path or glob'), {
      target: { value: 'runs/nb-opencode-ui-batch/*/report.html' },
    });
    fireEvent.change(screen.getByLabelText('Artifact group'), {
      target: { value: 'Reports' },
    });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/task-runs:create',
          method: 'post',
          data: expect.objectContaining({
            title: 'Batch evaluation',
            scenario: 'opencode-ui-batch',
            prompt: '运行 nb-opencode-ui-batch harness 并汇总结果',
            skillVersionIds: ['skill-version-id-1'],
            cwd: '.',
            artifactRoot: '../..',
            artifacts: [
              {
                glob: 'runs/nb-opencode-ui-batch/*/report.html',
                groupLabel: 'Reports',
              },
            ],
            nodeId: 'node-id-1',
            agentProfileId: 'profile-id-1',
          }),
        }),
      );
    });
    expect(await screen.findAllByText('Batch evaluation')).not.toHaveLength(0);
    expect(await screen.findByText('Queued: waiting for runner')).toBeTruthy();
    expect(await screen.findByText(/Runner heartbeat is stale; start or reconnect the daemon/)).toBeTruthy();
  });

  it('imports an external run from pasted agent logs and opens the run details', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [],
          },
        };
      }

      if (config.url === 'agent-gateway/external-runs:import') {
        return {
          data: {
            data: {
              runId: 'run-id-imported',
              runCode: 'external-codex-import',
              run: {
                id: 'run-id-imported',
                runCode: 'external-codex-import',
                status: 'succeeded',
                taskTitle: 'Imported Codex log',
                agentProvider: 'codex',
                agentGatewayActionPermissionsJson: {},
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-imported') {
        return {
          data: {
            data: {
              id: 'run-id-imported',
              runCode: 'external-codex-import',
              status: 'succeeded',
              taskTitle: 'Imported Codex log',
              agentProvider: 'codex',
              agentGatewayActionPermissionsJson: {},
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('Import external run'));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Imported Codex log' },
    });
    fireEvent.change(screen.getByLabelText('Instruction'), {
      target: { value: 'Import a build task that was started outside Agent Gateway' },
    });
    fireEvent.change(screen.getByLabelText('Raw log'), {
      target: {
        value: [
          JSON.stringify({ type: 'thread.started', thread_id: 'codex-thread-imported' }),
          JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'done' } }),
        ].join('\n'),
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/external-runs:import',
          method: 'post',
          data: expect.objectContaining({
            provider: 'codex',
            format: 'codex-jsonl',
            title: 'Imported Codex log',
            instruction: 'Import a build task that was started outside Agent Gateway',
            status: 'succeeded',
            logs: [
              expect.objectContaining({
                format: 'codex-jsonl',
                contentText: expect.stringContaining('codex-thread-imported'),
              }),
            ],
          }),
        }),
      );
    });
    expect(await screen.findAllByText('Imported Codex log')).not.toHaveLength(0);
  });

  it('paginates the runs table through the run list API', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        const page = Number(config.params?.page || 1);
        const pageSize = Number(config.params?.pageSize || 20);
        return {
          data: {
            data: [
              {
                id: `run-page-${page}`,
                runCode: `run-code-page-${page}`,
                status: 'queued',
                taskTitle: `Run page ${page}`,
                agentGatewayActionPermissionsJson: {},
              },
            ],
            meta: {
              count: 42,
              page,
              pageSize,
              totalPage: Math.ceil(42 / pageSize),
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('Run page 1')).toBeTruthy();
    await waitFor(() => {
      expect(request).toHaveBeenLastCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/runs:list',
          params: expect.objectContaining({
            page: 1,
            pageSize: 20,
          }),
        }),
      );
    });
    expect(await screen.findByText('Total 42 runs')).toBeTruthy();

    fireEvent.click(screen.getByTitle('2'));

    expect(await screen.findByText('Run page 2')).toBeTruthy();
    await waitFor(() => {
      expect(request).toHaveBeenLastCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/runs:list',
          params: expect.objectContaining({
            page: 2,
            pageSize: 20,
          }),
        }),
      );
    });
  });

  it('uploads a skill while creating a task run and submits the selected skill version ids', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/task-runs:options') {
        return {
          data: {
            data: {
              defaultProfileKey: 'codex',
              defaultCwd: '.',
              nodes: [
                {
                  id: 'node-id-1',
                  nodeKey: 'local-codex',
                  displayName: 'Local Codex',
                  status: 'active',
                  online: true,
                  profiles: [
                    {
                      id: 'profile-id-1',
                      nodeId: 'node-id-1',
                      profileKey: 'codex',
                      displayName: 'Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
              ],
              skillVersions: [],
            },
          },
        };
      }

      if (config.url === 'agent-gateway/skill-versions:upload-zip') {
        return {
          data: {
            data: {
              skillVersionId: 'uploaded-skill-version-id',
              skillKey: 'custom-skill',
              versionLabel: 'local',
              status: 'active',
            },
          },
        };
      }

      if (config.url === 'agent-gateway/task-runs:create') {
        return {
          data: {
            data: {
              runId: 'run-id-created',
              runCode: 'run-created',
              run: {
                id: 'run-id-created',
                runCode: 'run-created',
                status: 'queued',
                taskTitle: 'Uploaded skill task',
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-created') {
        return {
          data: {
            data: {
              id: 'run-id-created',
              runCode: 'run-created',
              status: 'queued',
              taskTitle: 'Uploaded skill task',
              agentGatewayActionPermissionsJson: {},
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:list') {
        return { data: { data: [] } };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('New task run'));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Uploaded skill task' },
    });
    fireEvent.change(screen.getByLabelText('Instruction'), {
      target: { value: 'Run with uploaded skill' },
    });
    fireEvent.click(await screen.findByText('Upload skill'));

    fireEvent.change(screen.getByLabelText('Skill key'), {
      target: { value: 'custom-skill' },
    });
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    await act(async () => {
      fireEvent.change(fileInput as HTMLInputElement, {
        target: {
          files: [new File(['fake zip bytes'], 'custom-skill.zip', { type: 'application/zip' })],
        },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/skill-versions:upload-zip',
          method: 'post',
          data: expect.objectContaining({
            skillKey: 'custom-skill',
            versionLabel: 'local',
            contentBase64: expect.any(String),
          }),
        }),
      );
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/task-runs:create',
          method: 'post',
          data: expect.objectContaining({
            title: 'Uploaded skill task',
            prompt: 'Run with uploaded skill',
            skillVersionIds: ['uploaded-skill-version-id'],
          }),
        }),
      );
    });
  });

  it('does not allow creating a task run when all runners are offline', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/task-runs:options') {
        return {
          data: {
            data: {
              defaultProfileKey: 'codex',
              defaultCwd: '.',
              nodes: [
                {
                  id: 'node-id-offline',
                  nodeKey: 'local-codex',
                  displayName: 'Local Codex',
                  status: 'active',
                  online: false,
                  profiles: [
                    {
                      id: 'profile-id-offline',
                      nodeId: 'node-id-offline',
                      profileKey: 'codex',
                      displayName: 'Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
              ],
              skillVersions: [],
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('New task run'));

    expect(await screen.findByText('No online runner is available. Start or reconnect the daemon.')).toBeTruthy();
    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).toBeDisabled();
    fireEvent.click(createButton);
    expect(request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/task-runs:create',
      }),
    );
  });

  it('requires a skill version before creating an OpenCode UI batch task run', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/task-runs:options') {
        return {
          data: {
            data: {
              defaultProfileKey: 'codex',
              defaultCwd: '.',
              nodes: [
                {
                  id: 'node-id-1',
                  nodeKey: 'local-codex',
                  displayName: 'Local Codex',
                  status: 'active',
                  online: true,
                  profiles: [
                    {
                      id: 'profile-id-1',
                      nodeId: 'node-id-1',
                      profileKey: 'codex',
                      displayName: 'Codex',
                      provider: 'codex',
                      status: 'active',
                    },
                  ],
                },
              ],
              skillVersions: [],
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByText('New task run'));
    fireEvent.mouseDown(screen.getByLabelText('Task preset'));
    fireEvent.click(await screen.findByText('OpenCode UI batch harness'));
    fireEvent.change(screen.getByLabelText('Instruction'), {
      target: { value: '运行 nb-opencode-ui-batch harness 并汇总结果' },
    });
    fireEvent.click(screen.getByText('Create'));

    expect(await screen.findByText('Skill version is required for OpenCode UI batch harness')).toBeTruthy();
    expect(request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/task-runs:create',
      }),
    );
  });

  it('shows a live waiting state when a running run has no task messages yet', async () => {
    let resolveConversationEvents: (value: unknown) => void = () => {};
    const conversationEventsResponse = new Promise((resolve) => {
      resolveConversationEvents = resolve;
    });
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-empty',
                runCode: 'run-empty-task',
                status: 'running',
                requestedAt: '2026-06-30T10:00:00.000Z',
                agentGatewayActionPermissionsJson: {
                  readSessionMessages: true,
                },
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-empty') {
        return {
          data: {
            data: {
              id: 'run-id-empty',
              runCode: 'run-empty-task',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
                readArtifacts: false,
                readRawLogs: false,
                readTerminal: false,
              },
              agentProviderCapabilitiesJson: {
                artifacts: false,
                structuredEvents: false,
                terminalOutput: false,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-empty/conversation-events:list') {
        return conversationEventsResponse;
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByLabelText('Task conversation')).toBeTruthy();
    await waitFor(() => {
      expect(document.querySelector('.ant-drawer-body .ant-spin')).toBeTruthy();
    });
    expect(screen.queryByText('Waiting for live task updates from the agent')).toBeNull();

    await act(async () => {
      resolveConversationEvents({
        data: {
          data: [],
        },
      });
      await conversationEventsResponse;
    });

    expect(await screen.findByText('Waiting for live task updates from the agent')).toBeTruthy();
    expect(screen.queryByText('No task messages yet')).toBeNull();
  });

  it('refreshes the Summary task timeline while a run is still active', async () => {
    const intervalCallbacks = spyOnPageIntervals();
    let conversationEventsCallCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-live',
                runCode: 'run-live-task',
                status: 'running',
                requestedAt: '2026-06-30T10:00:00.000Z',
                agentGatewayActionPermissionsJson: {
                  readSessionMessages: true,
                },
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-live') {
        return {
          data: {
            data: {
              id: 'run-id-live',
              runCode: 'run-live-task',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
                readArtifacts: false,
                readRawLogs: false,
                readTerminal: false,
              },
              agentProviderCapabilitiesJson: {
                artifacts: false,
                structuredEvents: false,
                terminalOutput: false,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-live/conversation-events:list') {
        conversationEventsCallCount += 1;
        if (conversationEventsCallCount < 3) {
          return {
            data: {
              data: [],
            },
          };
        }
        return {
          data: {
            data: [
              {
                id: 'conversation-event-id-live-1',
                source: 'terminal-live',
                sequence: 1,
                eventType: 'agent.message',
                contentText: 'live task output is visible before completion\n\nexec\n',
                contentJson: {
                  live: true,
                  stream: 'terminal',
                },
                createdAt: '2026-06-30T10:01:00.000Z',
              },
              {
                id: 'conversation-event-id-live-2',
                source: 'terminal-live',
                sequence: 2,
                eventType: 'agent.message',
                contentText:
                  'yarn test packages/plugins/@nocobase/plugin-agent-gateway/src/shared/__tests__/agentTranscript.test.ts\nsucceeded in 5ms\n\nlive task still running',
                contentJson: {
                  live: true,
                  stream: 'terminal',
                },
                createdAt: '2026-06-30T10:01:01.000Z',
              },
            ],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-live-task')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);

    expect(await screen.findByText('Waiting for live task updates from the agent')).toBeTruthy();
    await act(async () => {
      for (const callback of Array.from(intervalCallbacks.values())) {
        callback();
      }
    });

    const timelineRegion = await screen.findByLabelText('Task conversation');
    const firstAgentText = await within(timelineRegion as HTMLElement).findByText(
      /live task output is visible before completion/,
    );
    const secondAgentText = await within(timelineRegion as HTMLElement).findByText(/live task still running/);
    expect(within(timelineRegion as HTMLElement).getAllByText('Tool calls')).toHaveLength(1);
    const toolCallsText = within(timelineRegion as HTMLElement).getByText('Tool calls');
    expect(firstAgentText.compareDocumentPosition(toolCallsText) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toolCallsText.compareDocumentPosition(secondAgentText) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).queryByText(/yarn test packages/)).toBeNull();
    fireEvent.click(toolCallsText);
    expect(await within(timelineRegion as HTMLElement).findAllByText('succeeded')).not.toHaveLength(0);
    expect(within(timelineRegion as HTMLElement).queryByText('Details')).toBeNull();
  });

  it('shows run-scoped task events before falling back to an empty session timeline', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-task',
                runCode: 'run-task-with-session',
                status: 'running',
                agentSessionId: 'session-id-empty',
                requestedAt: '2026-06-30T10:00:00.000Z',
                agentGatewayActionPermissionsJson: {
                  readSessionMessages: true,
                },
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-task') {
        return {
          data: {
            data: {
              id: 'run-id-task',
              runCode: 'run-task-with-session',
              status: 'running',
              agentSessionId: 'session-id-empty',
              requestedAt: '2026-06-30T10:00:00.000Z',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
                readArtifacts: false,
                readRawLogs: false,
                readTerminal: false,
              },
              agentProviderCapabilitiesJson: {
                artifacts: false,
                structuredEvents: false,
                terminalOutput: false,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-task/conversation-events:list') {
        return {
          data: {
            data: [
              {
                id: 'conversation-event-id-task',
                source: 'agent-gateway-task',
                sequence: 0,
                eventType: 'agent.user.message',
                contentText: 'initial task instruction should be visible',
                createdAt: '2026-06-30T10:00:00.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-empty/conversation-events:list') {
        return {
          data: {
            data: [],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText('initial task instruction should be visible')).toBeTruthy();
    expect(screen.queryByText('Waiting for live task updates from the agent')).toBeNull();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/runs/run-id-task/conversation-events:list',
        method: 'get',
      }),
    );
  });

  it('lists runs, shows observation details, and requests cancel for active runs', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-build-1',
                status: 'running',
                nodeId: 'node-id-1',
                agentProfileId: 'profile-id-1',
                runnerStatusJson: {
                  nodeKey: 'local-codex',
                  profileKey: 'codex',
                  profileProvider: 'codex-cli',
                },
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
                sourceType: 'record-action',
                sourceCollection: 'tickets',
                sourceRecordId: '1',
                resultSummaryJson: {
                  title: 'Build calendar page',
                },
                tokenUsageJson: {
                  inputTokens: 39968,
                  cachedInputTokens: 18176,
                  outputTokens: 144,
                  reasoningOutputTokens: 77,
                  totalTokens: 40112,
                },
                requestedAt: '2026-06-30T10:00:00.000Z',
                startedAt: '2026-06-30T10:01:00.000Z',
                agentGatewayActionPermissionsJson: {
                  cancelRun: true,
                },
              },
              {
                id: 'run-id-2',
                runCode: 'run_task_fallback_should_not_render',
                taskTitle: 'Completed import task',
                status: 'succeeded',
                resultSummaryJson: {
                  status: 'succeeded',
                },
                startedAt: '2026-06-30T10:01:00.000Z',
                finishedAt: '2026-06-30T10:02:00.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/cancel') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'canceling',
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'running',
              nodeId: 'node-id-1',
              agentProfileId: 'profile-id-1',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              continuationReason: 'initial-run',
              promptSnapshot: {
                text: 'must-not-render',
              },
              executionPayloadJson: {
                command: 'must-not-render',
                cwd: '/tmp/must-not-render',
                env: {
                  SECRET: 'must-not-render',
                },
              },
              resultSummaryJson: {
                status: 'succeeded',
                exitCode: 0,
                declaredArtifacts: {
                  declaredArtifactCount: 2,
                  declaredArtifactKeys: ['report.html', 'browser-screenshots/page.png'],
                },
                command: 'must-not-render',
                cwd: '/tmp/must-not-render',
                env: {
                  SECRET: 'must-not-render',
                },
                safe: 'visible summary',
              },
              tokenUsageJson: {
                inputTokens: 39968,
                cachedInputTokens: 18176,
                outputTokens: 144,
                reasoningOutputTokens: 77,
                totalTokens: 40112,
              },
              errorSummary: 'command=must-not-render cwd=/tmp/must-not-render env.SECRET=must-not-render',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
                readTerminal: true,
                readArtifacts: true,
                readRawLogs: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/events:list') {
        return {
          data: {
            data: [
              {
                id: 'event-id-1',
                source: 'stdout',
                sequence: 1,
                level: 'info',
                eventType: 'log',
                message: 'build started',
                emittedAt: '2026-06-30T10:01:01.000Z',
              },
              {
                id: 'event-harness-render',
                source: 'harness',
                sequence: 2,
                level: 'info',
                eventType: 'render_run.started',
                message: 'rerendering report',
                payloadJson: {
                  progress: true,
                  phase: 'render_run',
                  status: 'started',
                },
                emittedAt: '2026-06-30T10:01:04.000Z',
              },
              {
                id: 'event-heartbeat',
                source: 'heartbeat',
                sequence: 3,
                level: 'info',
                eventType: 'heartbeat.running',
                message: 'heartbeat noise should stay collapsed',
                emittedAt: '2026-06-30T10:01:05.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list') {
        return {
          data: {
            data: [
              {
                id: 'conversation-event-id-session',
                source: 'codex',
                sequence: 0,
                eventType: 'agent.session.started',
                contentText: 'session lifecycle noise should stay hidden',
                createdAt: '2026-06-30T10:00:59.000Z',
              },
              {
                id: 'conversation-event-id-1',
                source: 'codex',
                sequence: 1,
                eventType: 'agent.message',
                contentText: 'timeline says build started',
                contentJson: {
                  itemId: 'item-1',
                },
                createdAt: '2026-06-30T10:01:01.000Z',
              },
              {
                id: 'conversation-event-id-command',
                source: 'codex',
                sequence: 2,
                eventType: 'agent.command.completed',
                contentText: 'Command completed',
                contentJson: {
                  status: 'succeeded',
                  exitCode: 0,
                  command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
                  output: 'suite completed',
                },
                createdAt: '2026-06-30T10:01:02.000Z',
              },
              {
                id: 'conversation-event-id-tool',
                source: 'codex',
                sequence: 3,
                eventType: 'agent.tool.completed',
                contentText: 'Tool completed',
                contentJson: {
                  status: 'succeeded',
                  toolName: 'read',
                  input: {
                    path: 'packages/plugins/@nocobase/plugin-agent-gateway/src/shared/agentTranscript.ts',
                  },
                  output: 'agentTranscript.ts',
                },
                createdAt: '2026-06-30T10:01:02.500Z',
              },
              {
                id: 'conversation-event-id-turn',
                source: 'codex',
                sequence: 4,
                eventType: 'agent.turn.completed',
                contentText: 'turn lifecycle noise should stay hidden',
                createdAt: '2026-06-30T10:01:03.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/artifacts:list') {
        return {
          data: {
            data: [
              {
                id: 'artifact-id-1',
                artifactKey: 'stdout',
                artifactType: 'log',
                mimeType: 'text/plain',
                contentText: 'inline artifact text',
                metadataJson: {
                  artifactGroupLabel: 'Logs',
                  externalUrl: 'https://daemon.example/artifact',
                },
              },
              {
                id: 'artifact-id-2',
                artifactKey: 'browser-screenshot',
                artifactType: 'image',
                mimeType: 'image/png',
                contentText:
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
                metadataJson: {
                  artifactGroupLabel: 'Screenshots',
                  relativePath: 'runs/nb-opencode-ui-batch/run-1/browser-screenshots/overview.png',
                },
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/snapshots:list') {
        return {
          data: {
            data: [
              {
                id: 'snapshot-id-1',
                snapshotType: 'workspace',
                snapshotJson: {
                  files: ['a.ts'],
                },
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/api-call-logs:list') {
        return {
          data: {
            data: [
              {
                id: 'api-log-id-1',
                method: 'POST',
                path: '/api/agent-gateway/runs/run-id-1/events:append',
                statusCode: 200,
                durationMs: 12,
                createdAt: '2026-06-30T10:01:02.000Z',
                requestSummaryJson: {
                  action: 'events:append',
                },
                responseSummaryJson: {
                  statusCode: 200,
                },
              },
              {
                id: 'api-log-heartbeat-1',
                method: 'POST',
                path: '/api/agent-gateway/nodes/node-id-1/runs/run-id-1/heartbeat',
                statusCode: 200,
                durationMs: 3,
                createdAt: '2026-06-30T10:01:03.000Z',
              },
              {
                id: 'api-log-heartbeat-2',
                method: 'POST',
                path: '/api/agent-gateway/nodes/node-id-1/runs/run-id-1/heartbeat',
                statusCode: 200,
                durationMs: 5,
                createdAt: '2026-06-30T10:01:13.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'agent is building',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: true,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('Build calendar page')).toBeTruthy();
    expect(await screen.findByText('Completed import task')).toBeTruthy();
    expect(await screen.findAllByText('Total: 40.1K')).not.toHaveLength(0);
    expect(await screen.findAllByText('Input: 40.0K / Output: 144 / Cached: 18.2K / Reasoning: 77')).not.toHaveLength(
      0,
    );
    expect(await screen.findByText('local-codex')).toBeTruthy();
    expect(await screen.findByText('codex / codex-cli')).toBeTruthy();
    expect(await screen.findByText('1m 00s')).toBeTruthy();
    expect(screen.queryByText('run_task_fallback_should_not_render')).toBeNull();
    expect(screen.queryByText('Run code')).toBeNull();
    expect(screen.queryByText('Finished at')).toBeNull();
    expect(screen.queryByText('Session')).toBeNull();
    expect(screen.queryByText('No agent session')).toBeNull();

    const cancelButtons = await screen.findAllByLabelText('Cancel run');
    expect(cancelButtons).toHaveLength(1);
    fireEvent.click(cancelButtons[0]);
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/runs/run-id-1/cancel',
          method: 'post',
        }),
      );
    });

    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);
    expect(new URLSearchParams(window.location.search).get('runId')).toBe('run-id-1');

    expect(await screen.findByText('Task conversation')).toBeTruthy();
    expect(await screen.findByText('timeline says build started')).toBeTruthy();
    expect(screen.queryByText('session lifecycle noise should stay hidden')).toBeNull();
    expect(screen.queryByText('turn lifecycle noise should stay hidden')).toBeNull();
    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(within(timelineRegion as HTMLElement).getAllByText('Tool calls')).toHaveLength(1);
    expect(within(timelineRegion as HTMLElement).getByText('2')).toBeTruthy();
    expect(screen.queryByText('Command completed')).toBeNull();
    fireEvent.click(within(timelineRegion as HTMLElement).getByText('Tool calls'));
    expect(await within(timelineRegion as HTMLElement).findAllByText('succeeded')).not.toHaveLength(0);
    const commandToolTitles = await within(timelineRegion as HTMLElement).findAllByText((_, element) => {
      return (
        element?.tagName.toLowerCase() === 'strong' &&
        element.textContent === 'Exec · node scripts/run-suite.mjs --tasks tasks.yaml'
      );
    });
    fireEvent.click(commandToolTitles[0]);
    expect(await within(timelineRegion as HTMLElement).findByText('suite completed')).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText(/agent\.command\.completed/)).toBeTruthy();
    fireEvent.click(await within(timelineRegion as HTMLElement).findByText(/Tool · read/));
    expect(await within(timelineRegion as HTMLElement).findAllByText(/agentTranscript\.ts/)).not.toHaveLength(0);
    expect(within(timelineRegion as HTMLElement).queryByText('No command details available')).toBeNull();
    expect(await within(timelineRegion as HTMLElement).findAllByText('Details')).not.toHaveLength(0);
    expect(screen.queryByText('Command completed')).toBeNull();

    const getRequestedUrls = () => request.mock.calls.map(([config]) => config.url);
    expect(getRequestedUrls()).not.toContain('agent-gateway/runs/run-id-1/events:list');
    expect(getRequestedUrls()).not.toContain('agent-gateway/runs/run-id-1/artifacts:list');
    expect(getRequestedUrls()).not.toContain('agent-gateway/runs/run-id-1/snapshots:list');
    expect(getRequestedUrls()).not.toContain('agent-gateway/runs/run-id-1/api-call-logs:list');

    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('Live CLI Output')).toBeTruthy();
    expect(await screen.findByText(/agent is building/)).toBeTruthy();
    expect(screen.queryByLabelText('Terminal input')).toBeNull();
    expect(screen.queryByLabelText('Send terminal input')).toBeNull();
    expect(await screen.findAllByText('codex / thread-id-1')).toBeTruthy();
    expect(await screen.findAllByText('session-id-1')).toBeTruthy();

    fireEvent.click(await screen.findByRole('tab', { name: 'Summary' }));
    expect(await screen.findByText('Run summary')).toBeTruthy();
    expect(await screen.findAllByText('Total: 40.1K')).not.toHaveLength(0);
    expect(await screen.findByText('Exit code: 0')).toBeTruthy();
    expect(await screen.findByText('Artifacts: 2')).toBeTruthy();
    expect(screen.queryByText(/visible summary/)).toBeNull();
    expect(screen.queryByLabelText('Run progress')).toBeNull();
    expect(screen.queryByText('rerendering report')).toBeNull();

    fireEvent.click(await screen.findByRole('tab', { name: 'Logs' }));
    expect(await screen.findByText('build started')).toBeTruthy();
    expect(getRequestedUrls()).toContain('agent-gateway/runs/run-id-1/events:list');
    expect(await screen.findByText('Harness stages')).toBeTruthy();
    expect(await screen.findByText('render_run / started')).toBeTruthy();
    expect(await screen.findAllByText('rerendering report')).not.toHaveLength(0);
    expect(screen.queryByText('heartbeat noise should stay collapsed')).toBeNull();
    fireEvent.click(await screen.findByText('Heartbeat event details'));
    expect(await screen.findByText('heartbeat noise should stay collapsed')).toBeTruthy();

    fireEvent.click(await screen.findByRole('tab', { name: 'Artifacts' }));
    expect(await screen.findByRole('tab', { name: 'Screenshots (1)' })).toBeTruthy();
    expect(getRequestedUrls()).toContain('agent-gateway/runs/run-id-1/artifacts:list');
    expect(getRequestedUrls()).toContain('agent-gateway/runs/run-id-1/snapshots:list');
    expect(await screen.findByText('Image artifact preview')).toBeTruthy();
    expect(screen.getByAltText('browser-screenshot').getAttribute('src')).toContain('data:image/png;base64,');
    fireEvent.click(await screen.findByRole('tab', { name: 'Logs (1)' }));
    expect(await screen.findByText('inline artifact text')).toBeTruthy();
    expect(await screen.findByText(/"files":/)).toBeTruthy();

    fireEvent.click(await screen.findByRole('tab', { name: 'API Logs' }));
    expect(await screen.findByText('/api/agent-gateway/runs/run-id-1/events:append')).toBeTruthy();
    expect(getRequestedUrls()).toContain('agent-gateway/runs/run-id-1/api-call-logs:list');
    expect(await screen.findByText('Heartbeat summary')).toBeTruthy();
    expect(await screen.findByText('Heartbeat calls: 2')).toBeTruthy();
    expect(screen.queryByText('/api/agent-gateway/nodes/node-id-1/runs/run-id-1/heartbeat')).toBeNull();
    fireEvent.click(await screen.findByText('Heartbeat details'));
    expect(await screen.findAllByText('/api/agent-gateway/nodes/node-id-1/runs/run-id-1/heartbeat')).toHaveLength(2);
    expect(screen.queryByText(/must-not-render/)).toBeNull();
    expect(screen.queryByText(/https:\/\/daemon\.example\/artifact/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('runId')).toBeNull();
    });
  });

  it('sends terminal control requests with stable idempotency keys and shows final ack state', async () => {
    let controlAccepted = false;
    let controlStatusPollCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-control-1',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-control-1',
              status: 'running',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/events:list') {
        const error = new Error('events forbidden') as Error & { response?: { status: number } };
        error.response = { status: 403 };
        throw error;
      }

      if (config.url === 'agent-gateway/runs/run-id-1/control-requests/control-request-1:get') {
        if (controlAccepted) {
          controlStatusPollCount += 1;
        }
        return {
          data: {
            data: {
              runId: 'run-id-1',
              controlRequestId: 'control-request-1',
              controlRequestStatus:
                controlStatusPollCount === 1 ? 'accepted' : controlStatusPollCount === 2 ? 'delivered' : 'succeeded',
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'control run output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:interrupt') {
        controlAccepted = true;
        return {
          data: {
            data: {
              success: true,
              controlRequestId: 'control-request-1',
              controlRequestStatus: 'accepted',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-control-1')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/control run output/)).toBeTruthy();
    expect(screen.queryByText('ag-run-run-id-1')).toBeNull();

    fireEvent.click(screen.getByLabelText('Interrupt'));

    let interruptCall: RequestConfig | undefined;
    await waitFor(() => {
      interruptCall = request.mock.calls
        .map(([config]) => config)
        .find((config) => config.url === 'agent-gateway/runs/run-id-1/terminal:interrupt');
      expect(interruptCall).toBeTruthy();
    });
    expect(interruptCall).toEqual(
      expect.objectContaining({
        url: 'agent-gateway/runs/run-id-1/terminal:interrupt',
        method: 'post',
        data: expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^ag_control:interrupt:run-id-1:.+/),
        }),
      }),
    );
    await waitFor(() => {
      expect(screen.queryByText('Control request ID: control-request-1')).toBeNull();
    });
    await waitFor(() => {
      expect(
        request.mock.calls
          .map(([config]) => config.url)
          .filter((url) => url === 'agent-gateway/runs/run-id-1/control-requests/control-request-1:get'),
      ).not.toHaveLength(0);
    });
    expect(await screen.findByText('Control request accepted')).toBeTruthy();
    expect(await screen.findByText('Control request delivered', {}, { timeout: 7000 })).toBeTruthy();
    expect(await screen.findByText('Control request succeeded', {}, { timeout: 7000 })).toBeTruthy();
  });

  it('ignores late terminal control responses after switching run details', async () => {
    let resolveInterrupt:
      | ((value: {
          data: {
            data: Record<string, unknown>;
          };
        }) => void)
      | undefined;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-control-switch-1',
                status: 'running',
              },
              {
                id: 'run-id-2',
                runCode: 'run-control-switch-2',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1' || config.url === 'agent-gateway/runs:get/run-id-2') {
        const runId = config.url.endsWith('run-id-1') ? 'run-id-1' : 'run-id-2';
        return {
          data: {
            data: {
              id: runId,
              runCode: runId === 'run-id-1' ? 'run-control-switch-1' : 'run-control-switch-2',
              status: 'running',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      if (
        config.url === 'agent-gateway/runs/run-id-1/events:list' ||
        config.url === 'agent-gateway/runs/run-id-2/events:list'
      ) {
        return { data: { data: [] } };
      }

      if (
        config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot' ||
        config.url === 'agent-gateway/runs/run-id-2/terminal:snapshot'
      ) {
        const runId = config.url.includes('run-id-1') ? 'run-id-1' : 'run-id-2';
        return {
          data: {
            data: {
              backend: 'tmux',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: runId === 'run-id-1' ? 'switch output one' : 'switch output two',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:interrupt') {
        return await new Promise<{ data: { data: Record<string, unknown> } }>((resolve) => {
          resolveInterrupt = resolve;
        });
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-control-switch-1')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/switch output one/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Interrupt'));
    await waitFor(() => expect(resolveInterrupt).toBeTruthy());

    fireEvent.click((await screen.findAllByLabelText('View run details'))[1]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/switch output two/)).toBeTruthy();
    resolveInterrupt?.({
      data: {
        data: {
          success: true,
          runId: 'run-id-1',
          controlRequestId: 'control-request-switch-1',
          controlRequestStatus: 'accepted',
        },
      },
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(screen.queryByText('Control request accepted')).toBeNull();
    expect(
      request.mock.calls
        .map(([config]) => config.url)
        .filter((url) => url === 'agent-gateway/runs/run-id-2/control-requests/control-request-switch-1:get'),
    ).toHaveLength(0);
  });

  it('reuses a pending terminate idempotency key and shows failed final ack state', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('terminate-pending-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('terminate-pending-key-2' as `${string}-${string}-${string}-${string}-${string}`);
    let terminateAttempts = 0;
    let controlStatusPollCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-terminate-control',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-terminate-control',
              status: 'running',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'terminate control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/control-requests/control-request-terminate:get') {
        controlStatusPollCount += 1;
        return {
          data: {
            data: {
              runId: 'run-id-1',
              controlRequestId: 'control-request-terminate',
              controlRequestStatus: controlStatusPollCount < 3 ? 'accepted' : 'failed',
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:terminate') {
        terminateAttempts += 1;
        return {
          data: {
            data: {
              success: true,
              controlRequestId: 'control-request-terminate',
              controlRequestStatus: 'accepted',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-terminate-control')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/terminate control output/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Terminate'));
    expect(await screen.findByText('Control request accepted')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Terminate'));
    await waitFor(() => expect(terminateAttempts).toBe(2));

    const terminateCalls = request.mock.calls
      .map(([config]) => config)
      .filter((config) => config.url === 'agent-gateway/runs/run-id-1/terminal:terminate');
    const idempotencyKeys = terminateCalls.map((config) => config.data?.idempotencyKey);
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toBe(idempotencyKeys[1]);
    expect(idempotencyKeys[0]).toMatch(/^ag_control:terminate:run-id-1:/);
    expect(await screen.findByText('Control request failed', {}, { timeout: 7000 })).toBeTruthy();
  });

  it('disables terminal controls without server-provided control action permission and capability', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-control-disabled',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-control-disabled',
              status: 'running',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: false,
                terminateRun: false,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'disabled control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: true,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-control-disabled')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/disabled control output/)).toBeTruthy();
    expect(screen.queryByLabelText('Interrupt')).toBeNull();
    expect(screen.queryByLabelText('Terminate')).toBeNull();
    expect(
      request.mock.calls.map(([config]) => config).find((config) => config.url?.includes('terminal:interrupt')),
    ).toBeUndefined();
  });

  it('hides terminal controls for completed runs even when control actions are present', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-control-completed',
                status: 'succeeded',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-control-completed',
              status: 'succeeded',
              terminalBackend: 'tmux',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'succeeded',
              available: true,
              output: 'completed control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-control-completed')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/completed control output/)).toBeTruthy();
    expect(screen.queryByLabelText('Interrupt')).toBeNull();
    expect(screen.queryByLabelText('Terminate')).toBeNull();
  });

  it('reuses a terminal control idempotency key after transient HTTP failure', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('control-retry-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('control-retry-key-2' as `${string}-${string}-${string}-${string}-${string}`);
    let interruptAttempts = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-control-retry',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-control-retry',
              status: 'running',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'retry control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: true,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:interrupt') {
        interruptAttempts += 1;
        if (interruptAttempts === 1) {
          const error = new Error('temporary interrupt failure') as Error & { response?: { status: number } };
          error.response = { status: 503 };
          throw error;
        }
        return {
          data: {
            data: {
              success: true,
              controlRequestId: 'control-request-1',
              controlRequestStatus: 'accepted',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-control-retry')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/retry control output/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Interrupt'));
    await waitFor(() => expect(interruptAttempts).toBe(1));
    fireEvent.click(screen.getByLabelText('Interrupt'));
    await waitFor(() => expect(interruptAttempts).toBe(2));

    const interruptCalls = request.mock.calls
      .map(([config]) => config)
      .filter((config) => config.url === 'agent-gateway/runs/run-id-1/terminal:interrupt');
    const idempotencyKeys = interruptCalls.map((config) => config.data?.idempotencyKey);
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toBe(idempotencyKeys[1]);
    expect(idempotencyKeys[0]).toMatch(/^ag_control:interrupt:run-id-1:/);
  });

  it('generates a new terminal control idempotency key after validation failure', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('control-validation-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('control-validation-key-2' as `${string}-${string}-${string}-${string}-${string}`);
    let interruptAttempts = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-control-validation-key',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-control-validation-key',
              status: 'running',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'validation key control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: true,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:interrupt') {
        interruptAttempts += 1;
        if (interruptAttempts === 1) {
          const error = new Error('invalid control request') as Error & { response?: { status: number } };
          error.response = { status: 400 };
          throw error;
        }
        return {
          data: {
            data: {
              success: true,
              controlRequestId: 'control-request-validation',
              controlRequestStatus: 'accepted',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-control-validation-key')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/validation key control output/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Interrupt'));
    await waitFor(() => expect(interruptAttempts).toBe(1));
    fireEvent.click(screen.getByLabelText('Interrupt'));
    await waitFor(() => expect(interruptAttempts).toBe(2));

    const idempotencyKeys = request.mock.calls
      .map(([config]) => config)
      .filter((config) => config.url === 'agent-gateway/runs/run-id-1/terminal:interrupt')
      .map((config) => config.data?.idempotencyKey);
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toMatch(/^ag_control:interrupt:run-id-1:/);
    expect(idempotencyKeys[1]).toMatch(/^ag_control:interrupt:run-id-1:/);
    expect(idempotencyKeys[1]).not.toBe(idempotencyKeys[0]);
  });

  it('generates a new terminal control idempotency key after a final response status', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('control-final-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('control-final-key-2' as `${string}-${string}-${string}-${string}-${string}`);
    let interruptAttempts = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-control-final-key',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-control-final-key',
              status: 'running',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'final key control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: true,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:interrupt') {
        interruptAttempts += 1;
        return {
          data: {
            data: {
              success: true,
              controlRequestId: `control-request-${interruptAttempts}`,
              controlRequestStatus: 'succeeded',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-control-final-key')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/final key control output/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Interrupt'));
    await waitFor(() => expect(interruptAttempts).toBe(1));
    expect(await screen.findByText('Control request succeeded')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Interrupt'));
    await waitFor(() => expect(interruptAttempts).toBe(2));

    const idempotencyKeys = request.mock.calls
      .map(([config]) => config)
      .filter((config) => config.url === 'agent-gateway/runs/run-id-1/terminal:interrupt')
      .map((config) => config.data?.idempotencyKey);
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toMatch(/^ag_control:interrupt:run-id-1:/);
    expect(idempotencyKeys[1]).toMatch(/^ag_control:interrupt:run-id-1:/);
    expect(idempotencyKeys[1]).not.toBe(idempotencyKeys[0]);
  });

  it('opens run details from the runId query and preserves unrelated query parameters on close', async () => {
    window.history.pushState({}, '', '/admin/settings/agent-gateway/runs?terminalStreamSmoke=1&runId=run-id-1');
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-build-1',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
                interruptRun: true,
                terminateRun: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'opened from query',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/opened from query/)).toBeTruthy();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/runs:get/run-id-1',
        method: 'get',
      }),
    );
    expect(new URLSearchParams(window.location.search).get('runId')).toBe('run-id-1');

    fireEvent.click(screen.getByLabelText('Close'));

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get('runId')).toBeNull();
      expect(params.get('terminalStreamSmoke')).toBe('1');
    });
  });

  it('does not render the terminal stream smoke panel without terminal read permission', async () => {
    window.history.pushState({}, '', '/admin/settings/agent-gateway/runs?terminalStreamSmoke=1&runId=run-id-1');
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-no-terminal-read',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-no-terminal-read',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readTerminal: false,
                readSessionMessages: false,
                resumeAgentSession: false,
              },
            },
          },
        };
      }

      throw new Error(`Unexpected request: ${config.url}`);
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('Waiting for live task updates from the agent')).toBeTruthy();
    expect(screen.queryByTestId('agent-gateway-terminal-stream-smoke-panel')).toBeNull();
    expect(request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/runs/run-id-1/terminal-stream-tickets:create',
      }),
    );
  });

  it('shows a stable detail access error without polling sensitive endpoints', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-list-only',
                status: 'succeeded',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        throw Object.assign(new Error('Run details are not allowed'), {
          response: {
            data: {
              errors: [
                {
                  message: 'Run details are not allowed',
                },
              ],
            },
          },
        });
      }

      throw new Error(`Unexpected request: ${config.url}`);
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-list-only')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);

    expect(await screen.findByText('Run details unavailable')).toBeTruthy();
    expect(await screen.findByText('Run details are not allowed')).toBeTruthy();

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/runs:get/run-id-1',
          method: 'get',
        }),
      );
    });

    const requestedUrls = request.mock.calls.map(([config]) => config.url);
    expect(requestedUrls.filter((url) => url === 'agent-gateway/runs:get/run-id-1')).toHaveLength(1);
    expect(requestedUrls.some((url) => url?.includes('terminal:snapshot'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('conversation-events:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('events:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('artifacts:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('snapshots:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('api-call-logs:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('terminal-stream-tickets:create'))).toBe(false);
    expect(FakeBrowserWebSocket.instances).toHaveLength(0);
  });

  it('stops sensitive polling and streaming after an already-open detail refresh is denied', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    let detailCallCount = 0;
    const requestCounts = new Map<string, number>();
    const request = vi.fn(async (config: RequestConfig) => {
      requestCounts.set(config.url, (requestCounts.get(config.url) || 0) + 1);
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-revoked-detail',
                status: 'running',
                agentSessionId: 'session-id-1',
                terminalStatus: 'active',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        detailCallCount += 1;
        if (detailCallCount > 1) {
          throw Object.assign(new Error('Run details were revoked'), {
            response: {
              data: {
                code: 'AGENT_GATEWAY_PERMISSION_DENIED',
                errors: [
                  {
                    message: 'Run details were revoked',
                  },
                ],
              },
            },
          });
        }
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-revoked-detail',
              status: 'running',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
                readSessionMessages: true,
                readArtifacts: true,
                readRawLogs: true,
              },
              agentGatewayControlActionsJson: {},
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'stale snapshot before denial',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal-stream-tickets:create') {
        return {
          data: {
            data: {
              ticket: 'ag_stream_revoked_ticket',
              ticketProof: 'ag_stream_revoked_proof',
              authProof: 'ag_stream_revoked_auth',
              expiresAt: '2026-06-30T10:02:00.000Z',
            },
          },
        };
      }

      if (
        config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list' ||
        config.url === 'agent-gateway/runs/run-id-1/conversation-events:list' ||
        config.url === 'agent-gateway/runs/run-id-1/events:list' ||
        config.url === 'agent-gateway/runs/run-id-1/artifacts:list' ||
        config.url === 'agent-gateway/runs/run-id-1/snapshots:list' ||
        config.url === 'agent-gateway/runs/run-id-1/api-call-logs:list'
      ) {
        return { data: { data: [] } };
      }

      throw new Error(`Unexpected request: ${config.url}`);
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request, {
      auth: {
        token: 'browser-token',
        getAuthenticator: () => 'basic',
        role: 'root',
      },
    });

    expect(await screen.findByText('run-revoked-detail')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('stale snapshot before denial')).toBeTruthy();
    await waitFor(() => {
      expect(FakeBrowserWebSocket.instances).toHaveLength(1);
    });

    await new Promise((resolve) => {
      window.setTimeout(resolve, 5200);
    });

    expect(await screen.findByText('Run details unavailable')).toBeTruthy();
    expect(await screen.findByText('Run details were revoked')).toBeTruthy();
    expect(screen.queryByText('Run summary')).toBeNull();
    expect(screen.queryByText('stale snapshot before denial')).toBeNull();

    const sensitiveUrls = [
      'agent-gateway/runs/run-id-1/terminal:snapshot',
      'agent-gateway/agent-sessions/session-id-1/conversation-events:list',
      'agent-gateway/runs/run-id-1/terminal-stream-tickets:create',
    ];
    const countsAfterDenial = Object.fromEntries(sensitiveUrls.map((url) => [url, requestCounts.get(url) || 0]));

    await new Promise((resolve) => {
      window.setTimeout(resolve, 2300);
    });

    for (const url of sensitiveUrls) {
      expect(requestCounts.get(url) || 0).toBe(countsAfterDenial[url]);
    }
    expect(FakeBrowserWebSocket.instances[0].readyState).toBe(3);
  }, 15000);

  it('clears stale terminal output and session timeline when run affordances are revoked by detail refresh', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    const intervalCallbacks = spyOnPageIntervals();

    const requestCounts = new Map<string, number>();
    let detailCallCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      requestCounts.set(config.url, (requestCounts.get(config.url) || 0) + 1);

      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-affordance-revoked',
                status: 'running',
                agentSessionId: 'session-id-1',
                terminalStatus: 'active',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        detailCallCount += 1;
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-affordance-revoked',
              status: 'running',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              terminalStatus: 'active',
              agentGatewayActionPermissionsJson:
                detailCallCount === 1
                  ? {
                      readTerminal: true,
                      readSessionMessages: true,
                      readArtifacts: false,
                      readRawLogs: false,
                    }
                  : {
                      readTerminal: false,
                      readSessionMessages: false,
                      readArtifacts: false,
                      readRawLogs: false,
                    },
              agentGatewayControlActionsJson: {},
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'stale snapshot after affordance revoked',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal-stream-tickets:create') {
        return {
          data: {
            data: {
              ticket: 'ag_stream_affordance_ticket',
              ticketProof: 'ag_stream_affordance_proof',
              authProof: 'ag_stream_affordance_auth',
              expiresAt: '2026-06-30T10:02:00.000Z',
            },
          },
        };
      }

      if (
        config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list' ||
        config.url === 'agent-gateway/runs/run-id-1/conversation-events:list'
      ) {
        return {
          data: {
            data: [
              {
                id: 'event-id-1',
                source: 'codex',
                sequence: 1,
                eventType: 'agent.message',
                contentText: 'stale session event after affordance revoked',
                createdAt: '2026-07-02T10:00:00.000Z',
              },
            ],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request, {
      auth: {
        token: 'browser-token',
        getAuthenticator: () => 'basic',
        role: 'root',
      },
    });

    expect(await screen.findByText('run-affordance-revoked')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    expect(await screen.findByText('stale session event after affordance revoked')).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('stale snapshot after affordance revoked')).toBeTruthy();
    await waitFor(() => {
      expect(FakeBrowserWebSocket.instances).toHaveLength(1);
    });

    await act(async () => {
      for (const callback of Array.from(intervalCallbacks.values())) {
        callback();
      }
    });

    expect(await screen.findByText('Agent Gateway terminal read permission required')).toBeTruthy();
    expect(screen.queryByText('stale snapshot after affordance revoked')).toBeNull();
    fireEvent.click(await screen.findByRole('tab', { name: 'Summary' }));
    expect(await screen.findByText('Agent Gateway session message read permission required')).toBeTruthy();
    expect(screen.queryByText('stale session event after affordance revoked')).toBeNull();

    const sensitiveUrls = [
      'agent-gateway/runs/run-id-1/terminal:snapshot',
      'agent-gateway/agent-sessions/session-id-1/conversation-events:list',
      'agent-gateway/runs/run-id-1/terminal-stream-tickets:create',
    ];
    const countsAfterRevocation = Object.fromEntries(sensitiveUrls.map((url) => [url, requestCounts.get(url) || 0]));

    await act(async () => {
      for (const callback of Array.from(intervalCallbacks.values())) {
        callback();
      }
    });

    for (const url of sensitiveUrls) {
      expect(requestCounts.get(url) || 0).toBe(countsAfterRevocation[url]);
    }
    expect(FakeBrowserWebSocket.instances[0].readyState).toBe(3);
  });

  it('hides detail controls and skips sensitive polling when run affordances deny access', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-detail-only',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-detail-only',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              finishedAt: '2026-06-30T10:02:00.000Z',
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: false,
                readSessionMessages: false,
                readTerminal: false,
                readArtifacts: false,
                readRawLogs: false,
              },
              agentGatewayControlActionsJson: {
                interruptRun: false,
                terminateRun: false,
              },
            },
          },
        };
      }

      throw new Error(`Unexpected request: ${config.url}`);
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-detail-only')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);

    expect(await screen.findByText('No task messages yet')).toBeTruthy();
    expect(await screen.findByText('Agent Gateway session message read permission required')).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('Agent Gateway terminal read permission required')).toBeTruthy();
    expect(screen.queryByText('Resume agent session')).toBeNull();
    expect(screen.queryByLabelText('Refresh terminal')).toBeNull();

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/runs:get/run-id-1',
          method: 'get',
        }),
      );
    });

    const requestedUrls = request.mock.calls.map(([config]) => config.url);
    expect(requestedUrls.some((url) => url?.includes('terminal:snapshot'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('conversation-events:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('events:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('artifacts:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('snapshots:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('api-call-logs:list'))).toBe(false);
    expect(requestedUrls.some((url) => url?.includes('terminal-stream-tickets:create'))).toBe(false);
    expect(FakeBrowserWebSocket.instances).toHaveLength(0);
  });

  it('does not open a live terminal stream when terminal output is unsupported by the provider', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    const requestedUrls: string[] = [];
    const request = vi.fn(async (config: RequestConfig) => {
      requestedUrls.push(config.url);
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-no-terminal-output',
                status: 'running',
                terminalBackend: 'tmux',
                terminalStatus: 'active',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-no-terminal-output',
              status: 'running',
              terminalBackend: 'tmux',
              terminalStatus: 'active',
              agentProvider: 'codex',
              agentProviderCapabilitiesJson: {
                structuredEvents: true,
                terminalOutput: false,
                resumeSession: true,
                liveSemanticMessage: false,
                stdinMessage: false,
                interrupt: true,
                terminate: true,
                artifacts: true,
              },
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
                interruptRun: true,
                terminateRun: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request, {
      auth: {
        token: 'browser-token',
        getAuthenticator: () => 'basic',
        role: 'root',
      },
    });

    expect(await screen.findByText('run-no-terminal-output')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('Terminal output is not supported by this provider')).toBeTruthy();
    expect(await screen.findByLabelText('Interrupt')).toBeTruthy();
    expect(await screen.findByLabelText('Terminate')).toBeTruthy();
    await waitFor(() => expect(requestedUrls).toContain('agent-gateway/runs:get/run-id-1'));
    expect(requestedUrls.some((url) => url.includes('terminal:snapshot'))).toBe(false);
    expect(requestedUrls.some((url) => url.includes('terminal-stream-tickets:create'))).toBe(false);
    expect(FakeBrowserWebSocket.instances).toHaveLength(0);
  });

  it('hides cancel actions when the run affordance denies cancel permission', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-no-cancel',
                status: 'running',
                agentGatewayActionPermissionsJson: {
                  cancelRun: false,
                },
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-no-cancel',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              agentGatewayActionPermissionsJson: {
                cancelRun: false,
                resumeAgentSession: false,
                readSessionMessages: false,
                readTerminal: false,
                readArtifacts: false,
                readRawLogs: false,
              },
              agentGatewayControlActionsJson: {
                interruptRun: false,
                terminateRun: false,
              },
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-no-cancel')).toBeTruthy();
    expect(screen.queryByLabelText('Cancel run')).toBeNull();

    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    expect(await screen.findByText('Waiting for live task updates from the agent')).toBeTruthy();
    expect(screen.queryByLabelText('Cancel run')).toBeNull();
  });

  it('opens run details when the v route receives a runId after mount', async () => {
    window.history.pushState({}, '', '/v/admin/settings/agent-gateway/runs');
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-build-1',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'opened from v route query',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-build-1')).toBeTruthy();

    act(() => {
      window.history.pushState({}, '', '/v/admin/settings/agent-gateway/runs?runId=run-id-1');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/opened from v route query/)).toBeTruthy();

    act(() => {
      window.history.pushState({}, '', '/v/admin/settings/agent-gateway/runs');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await waitFor(() => {
      expect(screen.queryByText(/opened from v route query/)).toBeNull();
    });
  });

  it('ignores a stale terminal snapshot response after switching run details', async () => {
    let resolveRunOneSnapshot: ((value: { data: { data: Record<string, unknown> } }) => void) | undefined;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-stale-snapshot-1',
                status: 'running',
              },
              {
                id: 'run-id-2',
                runCode: 'run-stale-snapshot-2',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1' || config.url === 'agent-gateway/runs:get/run-id-2') {
        const runId = config.url.endsWith('run-id-1') ? 'run-id-1' : 'run-id-2';
        return {
          data: {
            data: {
              id: runId,
              runCode: runId === 'run-id-1' ? 'run-stale-snapshot-1' : 'run-stale-snapshot-2',
              status: 'running',
              terminalBackend: 'tmux',
              terminalStatus: 'active',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
              agentGatewayControlActionsJson: {
                interruptRun: true,
                terminateRun: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return await new Promise<{ data: { data: Record<string, unknown> } }>((resolve) => {
          resolveRunOneSnapshot = resolve;
        });
      }

      if (config.url === 'agent-gateway/runs/run-id-2/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'fresh run two snapshot',
              capturedAt: '2026-06-30T10:01:03.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-stale-snapshot-1')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    await waitFor(() => expect(resolveRunOneSnapshot).toBeTruthy());

    fireEvent.click(detailButtons[1]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/fresh run two snapshot/)).toBeTruthy();

    resolveRunOneSnapshot?.({
      data: {
        data: {
          backend: 'tmux',
          terminalStatus: 'active',
          runStatus: 'running',
          available: true,
          output: 'stale run one snapshot',
          capturedAt: '2026-06-30T10:01:02.000Z',
          inputEnabled: false,
        },
      },
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(screen.queryByText(/stale run one snapshot/)).toBeNull();
    expect(screen.getByText(/fresh run two snapshot/)).toBeTruthy();
  });

  it('falls back to the latest terminal snapshot after a live stream error', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    let terminalSnapshotCallCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-build-1',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        terminalSnapshotCallCount += 1;
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: terminalSnapshotCallCount === 1 ? 'snapshot before stream' : 'snapshot after stream failure',
              capturedAt: terminalSnapshotCallCount === 1 ? '2026-06-30T10:01:02.000Z' : '2026-06-30T10:01:04.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal-stream-tickets:create') {
        return {
          data: {
            data: {
              ticket: 'ag_stream_page_ticket',
              ticketProof: 'ag_stream_page_proof',
              authProof: 'ag_stream_page_auth',
              authenticator: 'basic',
              role: 'root',
              expiresAt: '2026-06-30T10:02:00.000Z',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request, {
      auth: {
        token: 'browser-token',
        getAuthenticator: () => 'basic',
        role: 'root',
      },
    });

    expect(await screen.findByText('run-build-1')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('snapshot before stream')).toBeTruthy();
    await waitFor(() => {
      expect(FakeBrowserWebSocket.instances).toHaveLength(1);
    });

    const webSocket = FakeBrowserWebSocket.instances[0];
    expect(webSocket.url).not.toContain('token=');
    expect(webSocket.protocols?.[0]).toBe(TERMINAL_STREAM_BROWSER_SUBPROTOCOL);
    expect(
      webSocket.protocols?.some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_AUTH_PROTOCOL_PREFIX)),
    ).toBe(false);
    expect(
      webSocket.protocols?.some((protocol) =>
        protocol.startsWith(TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX),
      ),
    ).toBe(true);
    expect(
      webSocket.protocols?.some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX)),
    ).toBe(true);
    expect(webSocket.protocols?.join(',')).not.toContain('browser-token');
    act(() => {
      webSocket.dispatch('open');
    });
    const subscribeFrame = JSON.parse(webSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 0,
    });
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_page_ticket');
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_page_proof');
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_page_auth');
    expect(JSON.stringify(subscribeFrame)).not.toContain('browser-token');
    expect(subscribeFrame).not.toHaveProperty('browserAuth');
    expect(subscribeFrame).not.toHaveProperty('ticket');
    expect(subscribeFrame).not.toHaveProperty('ticketProof');
    expect(subscribeFrame).not.toHaveProperty('authProof');
    expect(subscribeFrame).not.toHaveProperty('authToken');
    expect(subscribeFrame).not.toHaveProperty('authenticator');
    expect(subscribeFrame).not.toHaveProperty('role');
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
          sessionName: 'ag-run-run-id-1',
          offsetStart: 0,
          offsetEnd: 12,
          payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
          payload: encodeTerminalPayload('stream first\n'),
        }),
      });
    });

    expect(await screen.findByText('stream first')).toBeTruthy();

    act(() => {
      webSocket.dispatch('message', {
        data: JSON.stringify({
          type: 'error',
          protocol: TERMINAL_PROTOCOL,
          requestId: subscribeFrame.requestId,
          code: 'TERMINAL_DAEMON_UNAVAILABLE',
          message: 'offline',
        }),
      });
    });
    expect((await screen.findByTestId('agent-gateway-xterm-stream-error')).textContent).toBe(
      'TERMINAL_DAEMON_UNAVAILABLE',
    );
    fireEvent.click(screen.getByLabelText('Refresh terminal'));
    await waitFor(() => {
      expect(terminalSnapshotCallCount).toBeGreaterThan(1);
    });

    expect(await screen.findByText('snapshot after stream failure')).toBeTruthy();
    expect(await screen.findByText('Live stream unavailable; showing terminal snapshots')).toBeTruthy();
    expect((await screen.findByTestId('agent-gateway-xterm-output-mode')).textContent).toBe('Snapshot fallback');
  });

  it('keeps the saved terminal snapshot visible when a restored offset has no new stream output', async () => {
    window.sessionStorage.setItem('agentGatewayTerminalOffset:run-id-1', '12');
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-build-1',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'saved snapshot after reload',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal-stream-tickets:create') {
        return {
          data: {
            data: {
              ticket: 'ag_stream_page_ticket',
              ticketProof: 'ag_stream_page_proof',
              authProof: 'ag_stream_page_auth',
              authenticator: 'basic',
              role: 'root',
              expiresAt: '2026-06-30T10:02:00.000Z',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request, {
      auth: {
        token: 'browser-token',
        getAuthenticator: () => 'basic',
        role: 'root',
      },
    });

    expect(await screen.findByText('run-build-1')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('saved snapshot after reload')).toBeTruthy();
    await waitFor(() => {
      expect(FakeBrowserWebSocket.instances).toHaveLength(1);
    });

    const webSocket = FakeBrowserWebSocket.instances[0];
    expect(webSocket.url).not.toContain('token=');
    expect(webSocket.protocols?.[0]).toBe(TERMINAL_STREAM_BROWSER_SUBPROTOCOL);
    expect(
      webSocket.protocols?.some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_AUTH_PROTOCOL_PREFIX)),
    ).toBe(false);
    expect(
      webSocket.protocols?.some((protocol) =>
        protocol.startsWith(TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX),
      ),
    ).toBe(true);
    expect(
      webSocket.protocols?.some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX)),
    ).toBe(true);
    expect(webSocket.protocols?.join(',')).not.toContain('browser-token');
    act(() => {
      webSocket.dispatch('open');
    });
    const subscribeFrame = JSON.parse(webSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 12,
    });
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_page_ticket');
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_page_proof');
    expect(JSON.stringify(subscribeFrame)).not.toContain('ag_stream_page_auth');
    expect(JSON.stringify(subscribeFrame)).not.toContain('browser-token');
    expect(subscribeFrame).not.toHaveProperty('browserAuth');
    expect(subscribeFrame).not.toHaveProperty('ticket');
    expect(subscribeFrame).not.toHaveProperty('ticketProof');
    expect(subscribeFrame).not.toHaveProperty('authProof');
    expect(subscribeFrame).not.toHaveProperty('authToken');
    expect(subscribeFrame).not.toHaveProperty('authenticator');
    expect(subscribeFrame).not.toHaveProperty('role');
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
          type: 'terminal.snapshot',
          protocol: TERMINAL_PROTOCOL,
          requestId: 'snapshot-empty',
          runId: 'run-id-1',
          sessionName: 'ag-run-run-id-1',
          offsetStart: 12,
          offsetEnd: 12,
          payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
          payload: '',
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('agent-gateway-xterm-stream-offset').textContent).toBe('Offset: 12');
    });
    expect(await screen.findByText('saved snapshot after reload')).toBeTruthy();
  });

  it('keeps run details visible when optional observation streams are forbidden', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-build-1',
                status: 'running',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'running',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
                readSessionMessages: true,
                readArtifacts: true,
                readRawLogs: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/events:list') {
        throw new Error('403 Forbidden');
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list') {
        throw new Error('403 Forbidden');
      }

      if (config.url === 'agent-gateway/runs/run-id-1/artifacts:list') {
        return {
          data: {
            data: [],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/snapshots:list') {
        return {
          data: {
            data: [],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/api-call-logs:list') {
        throw new Error('403 Forbidden');
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'agent is still visible',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-build-1')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText(/Agent timeline unavailable/)).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText(/agent is still visible/)).toBeTruthy();
    expect(await screen.findAllByText('codex / thread-id-1')).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: 'Logs' }));
    expect(await screen.findByText(/Events unavailable/)).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: 'API Logs' }));
    expect(await screen.findByText(/API logs unavailable/)).toBeTruthy();
  });

  it('does not promote legacy run events into the primary timeline while a normalized run is active', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-active-empty-timeline',
                status: 'running',
                requestedAt: '2026-06-30T10:00:00.000Z',
                startedAt: '2026-06-30T10:01:00.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-active-empty-timeline',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
                readRawLogs: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/events:list') {
        return {
          data: {
            data: [
              {
                id: 'legacy-event-id-1',
                source: 'stdout',
                sequence: 1,
                level: 'info',
                eventType: 'log',
                message: 'raw legacy event must stay out of timeline',
                emittedAt: '2026-06-30T10:01:01.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'agent output stays visible',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-active-empty-timeline')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText('Waiting for live task updates from the agent')).toBeTruthy();
    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(timelineRegion).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).queryByText('raw legacy event must stay out of timeline')).toBeNull();
  });

  it('does not promote legacy run events into the primary timeline for a new failed run without a session', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-failed-empty-timeline',
                status: 'failed',
                requestedAt: '2026-06-30T10:00:00.000Z',
                startedAt: '2026-06-30T10:01:00.000Z',
                finishedAt: '2026-06-30T10:02:00.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-failed-empty-timeline',
              status: 'failed',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              finishedAt: '2026-06-30T10:02:00.000Z',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
                readRawLogs: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/events:list') {
        return {
          data: {
            data: [
              {
                id: 'legacy-event-id-1',
                source: 'stderr',
                sequence: 1,
                level: 'error',
                eventType: 'log',
                message: 'new failed raw legacy output must stay out of timeline',
                emittedAt: '2026-06-30T10:01:01.000Z',
              },
            ],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-failed-empty-timeline')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText('No task messages yet')).toBeTruthy();
    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(timelineRegion).toBeTruthy();
    expect(
      within(timelineRegion as HTMLElement).queryByText('new failed raw legacy output must stay out of timeline'),
    ).toBeNull();
  });

  it('marks failed normalized command events as failed in the primary timeline', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-failed-command-timeline',
                status: 'failed',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-failed-command-timeline',
              status: 'failed',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              finishedAt: '2026-06-30T10:02:00.000Z',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list') {
        return {
          data: {
            data: [
              {
                id: 'conversation-event-id-1',
                source: 'codex',
                sequence: 1,
                eventType: 'agent.command.completed',
                contentText: 'Command failed',
                contentJson: {
                  status: 'failed',
                  exitCode: 1,
                },
                createdAt: '2026-06-30T10:01:01.000Z',
              },
            ],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-failed-command-timeline')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    const toolCallsText = await screen.findByText('Tool calls');
    const timelineItem = toolCallsText.closest('.ant-timeline-item');
    expect(timelineItem?.querySelector('.ant-timeline-item-head-red')).toBeTruthy();
    expect(screen.queryByText('Command failed')).toBeNull();
    fireEvent.click(toolCallsText);
    expect(await screen.findAllByText('failed')).not.toHaveLength(0);
    expect(screen.queryByText(/agent\.command\.completed/)).toBeNull();
    expect(screen.queryByText(/"status": "failed"/)).toBeNull();
    expect(screen.queryByText('Details')).toBeNull();
    expect(screen.queryByText('Command failed')).toBeNull();
  });

  it('lazy renders older timeline messages and long text blocks', async () => {
    const longText = `${'terminal output '.repeat(500)}visible tail after expansion`;
    const events = Array.from({ length: 90 }, (_, index) => ({
      id: `timeline-event-${index + 1}`,
      source: index % 2 === 0 ? 'agent-gateway-task' : 'codex',
      sequence: index + 1,
      eventType: index % 2 === 0 ? 'agent.user.message' : 'agent.message',
      contentText: index === 89 ? longText : `message ${index + 1}`,
      createdAt: `2026-06-30T10:00:${String(index % 60).padStart(2, '0')}.000Z`,
    }));

    render(
      <AntdApp>
        <AgentTimeline t={(key) => key} events={events} legacyEvents={[]} useLegacyFallback={false} />
      </AntdApp>,
    );

    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(within(timelineRegion as HTMLElement).queryByText('message 1')).toBeNull();
    expect(await within(timelineRegion as HTMLElement).findByText(/Load earlier messages/)).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText(/chars hidden/)).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).queryByText(/visible tail after expansion/)).toBeNull();

    fireEvent.click(await within(timelineRegion as HTMLElement).findByText('Show full text'));
    expect(await within(timelineRegion as HTMLElement).findByText(/visible tail after expansion/)).toBeTruthy();

    fireEvent.click(await within(timelineRegion as HTMLElement).findByText(/Load earlier messages/));
    expect(await within(timelineRegion as HTMLElement).findByText('message 1')).toBeTruthy();
  });

  it('shows dangling running tool calls as unknown when the run is no longer live', async () => {
    render(
      <AntdApp>
        <AgentTimeline
          t={(key) => key}
          events={[
            {
              id: 'started-tool',
              source: 'codex',
              sequence: 1,
              eventType: 'agent.command.started',
              correlationId: 'item-stalled',
              contentJson: {
                command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
                status: 'in_progress',
              },
              createdAt: '2026-06-30T10:00:00.000Z',
            },
          ]}
          legacyEvents={[]}
          useLegacyFallback={false}
          closeDanglingToolCalls
        />
      </AntdApp>,
    );

    const timelineRegion = await screen.findByLabelText('Task conversation');
    fireEvent.click(await within(timelineRegion as HTMLElement).findByText('Tool calls'));
    const toolTitle = await within(timelineRegion as HTMLElement).findByText(
      'Exec · node scripts/run-suite.mjs --tasks tasks.yaml',
    );
    expect(toolTitle).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).getAllByText('unknown')).not.toHaveLength(0);
    fireEvent.click(toolTitle);
    expect(await within(timelineRegion as HTMLElement).findByText(/agent\.command\.started/)).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).queryByText('No command details available')).toBeNull();
  });

  it('renders reasoning, progress, and raw transcript events with explicit labels', async () => {
    render(
      <AntdApp>
        <AgentTimeline
          t={(key) => key}
          events={[
            {
              id: 'reasoning-event',
              source: 'codex',
              sequence: 1,
              eventType: 'agent.reasoning',
              contentText: 'I should inspect the current run first.',
              createdAt: '2026-06-30T10:00:00.000Z',
            },
            {
              id: 'progress-event',
              source: 'opencode',
              sequence: 2,
              eventType: 'agent.progress',
              contentText: 'Browser verification is running',
              createdAt: '2026-06-30T10:00:01.000Z',
            },
            {
              id: 'raw-event',
              source: 'codex',
              sequence: 3,
              eventType: 'agent.raw',
              contentText: 'unexpected.event',
              contentJson: {
                rawProviderEvent: {
                  type: 'unexpected.event',
                  payload: {
                    phase: 'unmapped',
                  },
                },
              },
              createdAt: '2026-06-30T10:00:02.000Z',
            },
          ]}
          legacyEvents={[]}
          useLegacyFallback={false}
        />
      </AntdApp>,
    );

    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(await within(timelineRegion as HTMLElement).findByText('Reasoning')).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText('Progress')).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText('Raw event')).toBeTruthy();
    expect(
      await within(timelineRegion as HTMLElement).findByText('I should inspect the current run first.'),
    ).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText('Browser verification is running')).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).queryByText(/"unexpected\.event"/)).toBeNull();
    fireEvent.click(await within(timelineRegion as HTMLElement).findByText('Raw event'));
    expect(await within(timelineRegion as HTMLElement).findByText(/"unexpected\.event"/)).toBeTruthy();
  });

  it('folds raw item.completed provider events by default', async () => {
    render(
      <AntdApp>
        <AgentTimeline
          t={(key) => key}
          events={[
            {
              id: 'raw-error-event',
              source: 'codex',
              sequence: 1,
              eventType: 'agent.raw',
              contentJson: {
                rawProviderEvent: {
                  item: {
                    id: 'item_0',
                    type: 'error',
                    message: '[features].codex_hooks is deprecated. Use [features].hooks instead.',
                  },
                  type: 'item.completed',
                },
              },
              createdAt: '2026-06-30T10:00:02.000Z',
            },
          ]}
          legacyEvents={[]}
          useLegacyFallback={false}
        />
      </AntdApp>,
    );

    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(await within(timelineRegion as HTMLElement).findByText('Raw event')).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).queryByText(/\[features\]\.codex_hooks is deprecated/)).toBeNull();

    fireEvent.click(await within(timelineRegion as HTMLElement).findByText('Raw event'));
    expect(
      await within(timelineRegion as HTMLElement).findByText(/\[features\]\.codex_hooks is deprecated/),
    ).toBeTruthy();
  });

  it('hides empty provider agent_message completions from the task conversation', async () => {
    render(
      <AntdApp>
        <AgentTimeline
          t={(key) => key}
          events={[
            {
              id: 'empty-agent-message-tool',
              source: 'codex',
              sequence: 1,
              eventType: 'agent.tool.completed',
              contentText: 'agent_message',
              contentJson: {
                rawProviderEvent: {
                  type: 'item.completed',
                  item: {
                    id: 'item_18',
                    text: '',
                    type: 'agent_message',
                  },
                },
              },
              createdAt: '2026-06-30T10:00:02.000Z',
            },
            {
              id: 'visible-agent-message',
              source: 'codex',
              sequence: 2,
              eventType: 'agent.message',
              contentText: 'Important result.',
              createdAt: '2026-06-30T10:00:03.000Z',
            },
          ]}
          legacyEvents={[]}
          useLegacyFallback={false}
        />
      </AntdApp>,
    );

    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(await within(timelineRegion as HTMLElement).findByText('Important result.')).toBeTruthy();
    expect(timelineRegion.textContent).not.toContain('item_18');
    expect(timelineRegion.textContent).not.toContain('agent_message');
    expect(within(timelineRegion as HTMLElement).queryByText('Tool calls')).toBeNull();
  });

  it('hides low-signal child-agent provider lifecycle labels from the task conversation', async () => {
    render(
      <AntdApp>
        <AgentTimeline
          t={(key) => key}
          events={[
            {
              id: 'lifecycle-event',
              source: 'codex',
              sequence: 1,
              eventType: 'agent.message',
              contentText: 'Item Complete',
              contentJson: {
                rawProviderEvent: {
                  item: {
                    id: 'spawn-aquinas',
                    type: 'collab_tool_call',
                    tool: 'spawn_agent',
                    status: 'completed',
                  },
                  type: 'item.completed',
                },
              },
              createdAt: '2026-06-30T10:00:02.000Z',
            },
            {
              id: 'child-event',
              source: 'codex',
              sequence: 2,
              eventType: 'agent.message',
              contentText: 'Hi',
              contentJson: {
                participant: {
                  id: 'sub-agent:aquinas',
                  type: 'sub-agent',
                  name: 'Aquinas',
                  parentId: 'agent:root',
                },
              },
              createdAt: '2026-06-30T10:00:03.000Z',
            },
          ]}
          legacyEvents={[]}
          useLegacyFallback={false}
        />
      </AntdApp>,
    );

    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(await within(timelineRegion as HTMLElement).findByText('Sub-agent: Aquinas')).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText('Hi')).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).queryByText('Item Complete')).toBeNull();
  });

  it('does not render Agent Gateway harness progress markers in the task conversation', async () => {
    render(
      <AntdApp>
        <AgentTimeline
          t={(key) => key}
          events={[
            {
              id: 'task-event',
              source: 'agent-gateway-task',
              sequence: 1,
              eventType: 'agent.user.message',
              contentText: [
                'Build all task pages.',
                '- Emit progress lines when possible as: AGW_PROGRESS phase=<phase> status=<started|succeeded|failed> message=<short text>.',
                'Use the uploaded skill.',
              ].join('\n'),
              createdAt: '2026-06-30T10:00:00.000Z',
            },
            {
              id: 'agent-event',
              source: 'codex',
              sequence: 2,
              eventType: 'agent.message',
              contentText: [
                'Starting the build.',
                'AGW_PROGRESS phase=build status=started message=creating pages',
                'Continuing with browser verification.',
              ].join('\n'),
              createdAt: '2026-06-30T10:00:01.000Z',
            },
            {
              id: 'reasoning-event',
              source: 'codex',
              sequence: 3,
              eventType: 'agent.reasoning',
              contentText: 'I should include `AGW_PROGRESS` while running the suite.',
              createdAt: '2026-06-30T10:00:01.500Z',
            },
            {
              id: 'command-event',
              source: 'codex',
              sequence: 4,
              eventType: 'agent.command.completed',
              correlationId: 'cmd-progress',
              contentText: 'Command completed',
              contentJson: {
                command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
                status: 'completed',
                exitCode: 0,
                aggregated_output: [
                  'AGW_PROGRESS phase=batch status=started message=running suite',
                  'Suite completed: 12/12 tasks passed.',
                  'AGW_PROGRESS phase=batch status=succeeded message=done',
                ].join('\n'),
              },
              createdAt: '2026-06-30T10:00:02.000Z',
            },
            {
              id: 'empty-raw-agent-message',
              source: 'codex',
              sequence: 5,
              eventType: 'agent.raw',
              contentJson: {
                rawProviderEvent: {
                  type: 'item.completed',
                  item: {
                    id: 'item_9',
                    text: '',
                    type: 'agent_message',
                  },
                },
              },
              createdAt: '2026-06-30T10:00:03.000Z',
            },
          ]}
          legacyEvents={[]}
          useLegacyFallback={false}
        />
      </AntdApp>,
    );

    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(
      await within(timelineRegion as HTMLElement).findByText(/Build all task pages\.\s+Use the uploaded skill\./),
    ).toBeTruthy();
    expect(
      await within(timelineRegion as HTMLElement).findByText(
        /Starting the build\.\s+Continuing with browser verification\./,
      ),
    ).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText(/progress marker/)).toBeTruthy();
    expect(timelineRegion.textContent).not.toContain('AGW_PROGRESS');
    expect(timelineRegion.textContent).not.toContain('item_9');

    fireEvent.click(await within(timelineRegion as HTMLElement).findByText('Tool calls'));
    const toolTitle = await within(timelineRegion as HTMLElement).findByText(
      'Exec · node scripts/run-suite.mjs --tasks tasks.yaml',
    );
    fireEvent.click(toolTitle);
    expect(await within(timelineRegion as HTMLElement).findByText('Suite completed: 12/12 tasks passed.')).toBeTruthy();
    expect(timelineRegion.textContent).not.toContain('AGW_PROGRESS');
    expect(timelineRegion.textContent).not.toContain('item_9');
  });

  it('shows root agent and child agent messages as separate timeline participants', async () => {
    render(
      <AntdApp>
        <AgentTimeline
          t={(key) => key}
          events={[
            {
              id: 'timeline-user',
              source: 'agent-gateway-task',
              sequence: 1,
              eventType: 'agent.user.message',
              contentText: '启动 2 个子 agent 分别说一句 hi',
              createdAt: '2026-06-30T10:00:00.000Z',
            },
            {
              id: 'timeline-root',
              source: 'terminal-live',
              sequence: 2,
              eventType: 'agent.message',
              contentText: 'I will start two child agents.\ncollab: SpawnAgent\nAquinas: hi\nBacon: hi',
              createdAt: '2026-06-30T10:00:01.000Z',
            },
          ]}
          legacyEvents={[]}
          useLegacyFallback={false}
        />
      </AntdApp>,
    );

    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(await within(timelineRegion as HTMLElement).findByText('You')).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText('Agent')).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText('Sub-agent: Aquinas')).toBeTruthy();
    expect(await within(timelineRegion as HTMLElement).findByText('Sub-agent: Bacon')).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).getAllByText('hi')).toHaveLength(2);
    expect(await within(timelineRegion as HTMLElement).findByText('Tool calls')).toBeTruthy();
    expect(within(timelineRegion as HTMLElement).queryByText('Aquinas: hi')).toBeNull();
  });

  it('does not clear the normalized timeline when a later poll returns an empty older snapshot', async () => {
    let conversationEventCallCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-timeline-empty-regression',
                status: 'running',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-timeline-empty-regression',
              status: 'running',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list') {
        conversationEventCallCount += 1;
        if (conversationEventCallCount > 1) {
          return { data: { data: [] } };
        }
        return {
          data: {
            data: [
              {
                id: 'conversation-event-id-1',
                source: 'codex',
                sequence: 1,
                eventType: 'agent.message',
                contentText: 'stable normalized event after empty poll',
                createdAt: '2026-06-30T10:01:01.000Z',
              },
            ],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-timeline-empty-regression')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText('stable normalized event after empty poll')).toBeTruthy();
    await waitFor(() => expect(conversationEventCallCount).toBeGreaterThan(1));
    expect(await screen.findByText('stable normalized event after empty poll')).toBeTruthy();
  });

  it('keeps the last successful normalized timeline when polling temporarily fails', async () => {
    let conversationEventCallCount = 0;
    const intervalCallbacks = spyOnPageIntervals();

    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-timeline-retry',
                status: 'running',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-timeline-retry',
              status: 'running',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
                readRawLogs: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list') {
        conversationEventCallCount += 1;
        if (conversationEventCallCount > 1) {
          throw new Error('temporary timeline outage');
        }
        return {
          data: {
            data: [
              {
                id: 'conversation-event-id-1',
                source: 'codex',
                sequence: 1,
                eventType: 'agent.message',
                contentText: 'stable normalized event',
                createdAt: '2026-06-30T10:01:01.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/events:list') {
        return {
          data: {
            data: [
              {
                id: 'legacy-event-id-1',
                source: 'stdout',
                sequence: 1,
                level: 'info',
                eventType: 'log',
                message: 'legacy event should not replace normalized event',
                emittedAt: '2026-06-30T10:01:01.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'active',
              runStatus: 'running',
              available: true,
              output: 'agent output stays visible',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-timeline-retry')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText('stable normalized event')).toBeTruthy();
    await act(async () => {
      for (const callback of intervalCallbacks.values()) {
        callback();
      }
    });

    expect(await screen.findByText('stable normalized event')).toBeTruthy();
    expect(await screen.findByText(/Agent timeline unavailable/)).toBeTruthy();
    const timelineRegion = await screen.findByLabelText('Task conversation');
    expect(timelineRegion).toBeTruthy();
    expect(
      within(timelineRegion as HTMLElement).queryByText('legacy event should not replace normalized event'),
    ).toBeNull();
  });

  it('refreshes run summary while the detail drawer remains open', async () => {
    let runDetailsCallCount = 0;
    const intervalCallbacks = spyOnPageIntervals();

    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-refresh-1',
                status: runDetailsCallCount > 1 ? 'succeeded' : 'running',
                agentSessionId: runDetailsCallCount > 1 ? 'session-id-2' : null,
                agentSessionProvider: runDetailsCallCount > 1 ? 'codex' : null,
                agentSessionProviderId: runDetailsCallCount > 1 ? 'thread-id-2' : null,
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        runDetailsCallCount += 1;
        const completed = runDetailsCallCount > 1;
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-refresh-1',
              status: completed ? 'succeeded' : 'running',
              terminalStatus: completed ? 'closed' : 'active',
              agentSessionId: completed ? 'session-id-2' : null,
              agentSessionProvider: completed ? 'codex' : null,
              agentSessionProviderId: completed ? 'thread-id-2' : null,
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              finishedAt: completed ? '2026-06-30T10:02:00.000Z' : null,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: runDetailsCallCount > 1 ? 'closed' : 'active',
              runStatus: runDetailsCallCount > 1 ? 'succeeded' : 'running',
              available: true,
              output: 'agent output stays visible',
              capturedAt: '2026-06-30T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-refresh-1')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findAllByText('No agent session')).not.toHaveLength(0);

    await act(async () => {
      for (const callback of intervalCallbacks.values()) {
        callback();
      }
    });

    await waitFor(() => {
      expect(runDetailsCallCount).toBeGreaterThan(1);
    });
    expect(await screen.findByText('codex / thread-id-2')).toBeTruthy();
    expect(await screen.findByText('session-id-2')).toBeTruthy();
  });

  it('keeps existing run details visible without flashing a spinner during refresh', async () => {
    let runDetailsCallCount = 0;
    let runsListCallCount = 0;
    let resolveSecondRunDetails: ((value: { data: { data: Record<string, unknown> } }) => void) | undefined;
    let resolveSecondRunsList: ((value: { data: { data: Record<string, unknown>[] } }) => void) | undefined;
    const secondRunDetails = new Promise<{ data: { data: Record<string, unknown> } }>((resolve) => {
      resolveSecondRunDetails = resolve;
    });
    const secondRunsList = new Promise<{ data: { data: Record<string, unknown>[] } }>((resolve) => {
      resolveSecondRunsList = resolve;
    });
    const intervalCallbacks = spyOnPageIntervals();

    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        runsListCallCount += 1;
        if (runsListCallCount > 1) {
          return await secondRunsList;
        }
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-refresh-1',
                status: 'running',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        runDetailsCallCount += 1;
        if (runDetailsCallCount > 1) {
          return await secondRunDetails;
        }
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-refresh-1',
              status: 'running',
              terminalStatus: 'active',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-refresh-1')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findAllByText('No agent session')).not.toHaveLength(0);

    await act(async () => {
      for (const callback of intervalCallbacks.values()) {
        callback();
      }
    });

    await waitFor(() => {
      expect(runDetailsCallCount).toBeGreaterThan(1);
    });
    expect(screen.getAllByText('No agent session')).not.toHaveLength(0);
    expect(document.querySelector('.ant-drawer-body .ant-spin')).toBeNull();
    expect(document.querySelector('.ant-table-wrapper .ant-spin-spinning')).toBeNull();

    await act(async () => {
      resolveSecondRunsList?.({
        data: {
          data: [
            {
              id: 'run-id-1',
              runCode: 'run-refresh-1',
              status: 'succeeded',
            },
          ],
        },
      });
      resolveSecondRunDetails?.({
        data: {
          data: {
            id: 'run-id-1',
            runCode: 'run-refresh-1',
            status: 'succeeded',
            terminalStatus: 'closed',
            requestedAt: '2026-06-30T10:00:00.000Z',
            startedAt: '2026-06-30T10:01:00.000Z',
            finishedAt: '2026-06-30T10:02:00.000Z',
          },
        },
      });
    });
  });

  it('does not keep polling or reset the terminal for a completed run with unchanged output', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    const intervalCallbacks = spyOnPageIntervals();
    let terminalSnapshotCallCount = 0;
    let conversationEventsCallCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-completed-stable',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-completed-stable',
              status: 'succeeded',
              terminalBackend: 'tmux',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              finishedAt: '2026-06-30T10:02:00.000Z',
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
                readSessionMessages: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:snapshot') {
        terminalSnapshotCallCount += 1;
        return {
          data: {
            data: {
              backend: 'tmux',
              sessionName: 'ag-run-run-id-1',
              terminalStatus: 'closed',
              runStatus: 'succeeded',
              available: true,
              output: 'Pane is dead. Stable saved terminal output.',
              capturedAt: terminalSnapshotCallCount === 1 ? '2026-06-30T10:02:00.000Z' : '2026-06-30T10:02:05.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list') {
        conversationEventsCallCount += 1;
        return {
          data: {
            data: [
              {
                id: 'event-id-1',
                source: 'codex',
                sequence: 1,
                eventType: 'agent.message',
                contentText: 'completed session event',
                createdAt: '2026-06-30T10:02:00.000Z',
              },
            ],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request, {
      auth: {
        token: 'browser-token',
        getAuthenticator: () => 'basic',
        role: 'root',
      },
    });

    expect(await screen.findByText('run-completed-stable')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    expect(await screen.findByText('completed session event')).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('Pane is dead. Stable saved terminal output.')).toBeTruthy();

    await waitFor(() => {
      expect(xtermMock.MockTerminal.instances).toHaveLength(1);
    });
    const terminal = xtermMock.MockTerminal.instances[0];
    const resetCountAfterInitialSnapshot = terminal.resetCount;

    expect(intervalCallbacks.size).toBe(0);
    expect(FakeBrowserWebSocket.instances).toHaveLength(0);

    await act(async () => {
      for (const callback of intervalCallbacks.values()) {
        callback();
      }
    });

    expect(terminalSnapshotCallCount).toBe(1);
    expect(conversationEventsCallCount).toBeGreaterThan(0);
    expect(terminal.resetCount).toBe(resetCountAfterInitialSnapshot);
    expect(
      terminal.writes.filter((value) => value.includes('Pane is dead. Stable saved terminal output.')),
    ).toHaveLength(1);
    expect(document.querySelector('.ant-table-wrapper .ant-spin-spinning')).toBeNull();
    expect(document.querySelector('.ant-drawer-body .ant-spin')).toBeNull();
  });

  it('resumes a completed Codex session and opens the continuation run with session timeline', async () => {
    const randomUUIDSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('resume-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('resume-key-2' as `${string}-${string}-${string}-${string}-${string}`);
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-source',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
              {
                id: 'run-id-2',
                runCode: 'run-resume-child',
                status: 'queued',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
                parentRunId: 'run-id-1',
                resumedFromRunId: 'run-id-1',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-resume-source',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              finishedAt: '2026-07-02T10:00:00.000Z',
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
                readSessionMessages: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-2') {
        return {
          data: {
            data: {
              id: 'run-id-2',
              runCode: 'run-resume-child',
              status: 'queued',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              parentRunId: 'run-id-1',
              resumedFromRunId: 'run-id-1',
              continuationReason: 'user-message',
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
                readSessionMessages: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list') {
        return {
          data: {
            data: [
              {
                id: 'event-id-1',
                source: 'codex',
                sequence: 1,
                eventType: 'agent.message',
                contentText: 'session timeline original',
                createdAt: '2026-07-02T10:00:00.000Z',
              },
              {
                id: 'event-id-2',
                source: 'agent-gateway',
                sequence: 0,
                eventType: 'agent.user.message',
                contentText: 'session timeline follow-up',
                createdAt: '2026-07-02T10:01:00.000Z',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-1/resume') {
        return {
          data: {
            data: {
              runId: 'run-id-2',
              runCode: 'run-resume-child',
              agentSessionId: 'session-id-1',
              parentRunId: 'run-id-1',
              resumedFromRunId: 'run-id-1',
              deduped: false,
            },
          },
        };
      }

      if (config.url?.includes('/terminal:snapshot')) {
        return {
          data: {
            data: null,
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-resume-source')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    expect(await screen.findByText('session timeline original')).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('Resume agent session')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Resume message'), {
      target: {
        value: 'Continue this session',
      },
    });
    fireEvent.click(screen.getByText('Resume session'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/agent-sessions/session-id-1/resume',
          method: 'post',
          data: {
            message: 'Continue this session',
            idempotencyKey: 'resume-key-1',
            resumedFromRunId: 'run-id-1',
          },
        }),
      );
    });
    await waitFor(() => expect(screen.getAllByText('run-resume-child').length).toBeGreaterThan(0));
    expect(window.location.search).toContain('runId=run-id-2');
    expect(randomUUIDSpy).toHaveBeenCalled();
  });

  it('clears stale resume controls and session timeline while switching run details', async () => {
    const intervalCallbacks = spyOnPageIntervals();

    let resolveRunTwoDetails: ((value: unknown) => void) | undefined;
    let sessionOneTimelineRequests = 0;
    let runTwoTimelineRequests = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-switch-source',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
              {
                id: 'run-id-2',
                runCode: 'run-switch-target',
                status: 'succeeded',
                agentSessionId: 'session-id-2',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-2',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-switch-source',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
                readSessionMessages: true,
              },
            },
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-2') {
        return await new Promise((resolve) => {
          resolveRunTwoDetails = resolve;
        });
      }

      if (config.url === 'agent-gateway/agent-sessions/session-id-1/conversation-events:list') {
        sessionOneTimelineRequests += 1;
        return {
          data: {
            data: [
              {
                id: 'event-id-1',
                source: 'codex',
                sequence: 1,
                eventType: 'agent.message',
                contentText: 'old session timeline event',
                createdAt: '2026-07-02T10:00:00.000Z',
              },
            ],
          },
        };
      }

      if (
        config.url === 'agent-gateway/runs/run-id-2/conversation-events:list' ||
        config.url === 'agent-gateway/agent-sessions/session-id-2/conversation-events:list'
      ) {
        runTwoTimelineRequests += 1;
        return {
          data: {
            data: [
              {
                id: 'event-id-2',
                source: 'codex',
                sequence: 1,
                eventType: 'agent.message',
                contentText: 'target run scoped event',
                createdAt: '2026-07-02T10:01:00.000Z',
              },
            ],
          },
        };
      }

      if (config.url?.includes('/terminal:snapshot')) {
        return {
          data: {
            data: null,
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-switch-source')).toBeTruthy();
    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText('old session timeline event')).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByLabelText('Resume message')).toBeTruthy();
    const sessionOneRequestsBeforeSwitch = sessionOneTimelineRequests;

    fireEvent.click(detailButtons[1]);

    await waitFor(() => {
      expect(screen.queryByLabelText('Resume message')).toBeNull();
    });
    expect(screen.queryByText('old session timeline event')).toBeNull();

    await act(async () => {
      for (const callback of intervalCallbacks.values()) {
        callback();
      }
    });

    expect(sessionOneTimelineRequests).toBe(sessionOneRequestsBeforeSwitch);
    expect(runTwoTimelineRequests).toBe(0);

    await act(async () => {
      resolveRunTwoDetails?.({
        data: {
          data: {
            id: 'run-id-2',
            runCode: 'run-switch-target',
            status: 'succeeded',
            terminalStatus: 'closed',
            agentSessionId: 'session-id-2',
            agentSessionProvider: 'codex',
            agentSessionProviderId: 'thread-id-2',
            agentGatewayActionPermissionsJson: {
              resumeAgentSession: true,
              readSessionMessages: true,
            },
          },
        },
      });
    });

    await waitFor(() => {
      expect(runTwoTimelineRequests).toBeGreaterThan(0);
    });
    expect(await screen.findByText('target run scoped event')).toBeTruthy();
  });

  it('reuses the same resume idempotency key for transient HTTP retry', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('retry-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('retry-key-2' as `${string}-${string}-${string}-${string}-${string}`);
    let resumeAttempts = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-retry',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }
      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-resume-retry',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
              },
            },
          },
        };
      }
      if (config.url === 'agent-gateway/agent-sessions/session-id-1/resume') {
        resumeAttempts += 1;
        if (resumeAttempts === 1) {
          const error = new Error('temporary resume failure') as Error & { response?: { status: number } };
          error.response = { status: 503 };
          throw error;
        }
        return {
          data: {
            data: {
              runId: 'run-id-2',
              agentSessionId: 'session-id-1',
              deduped: true,
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-resume-retry')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    fireEvent.change(await screen.findByLabelText('Resume message'), {
      target: {
        value: 'Retry me',
      },
    });
    fireEvent.click(screen.getByText('Resume session'));
    await waitFor(() => expect(resumeAttempts).toBe(1));
    fireEvent.click(screen.getByText('Resume session'));
    await waitFor(() => expect(resumeAttempts).toBe(2));

    const resumeCalls = request.mock.calls
      .map(([config]) => config)
      .filter((config) => config.url === 'agent-gateway/agent-sessions/session-id-1/resume');
    expect(resumeCalls.map((config) => config.data?.idempotencyKey)).toEqual(['retry-key-1', 'retry-key-1']);
  });

  it('generates a new resume idempotency key when the message changes after a transient failure', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('retry-change-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('retry-change-key-2' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('retry-change-key-3' as `${string}-${string}-${string}-${string}-${string}`);
    let resumeAttempts = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-retry-change',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }
      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-resume-retry-change',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
              },
            },
          },
        };
      }
      if (config.url === 'agent-gateway/agent-sessions/session-id-1/resume') {
        resumeAttempts += 1;
        if (resumeAttempts === 1) {
          const error = new Error('temporary resume failure') as Error & { response?: { status: number } };
          error.response = { status: 503 };
          throw error;
        }
        return {
          data: {
            data: {
              runId: 'run-id-2',
              agentSessionId: 'session-id-1',
              deduped: false,
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-resume-retry-change')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    const input = await screen.findByLabelText('Resume message');
    fireEvent.change(input, {
      target: {
        value: 'First message',
      },
    });
    fireEvent.click(screen.getByText('Resume session'));
    await waitFor(() => expect(resumeAttempts).toBe(1));
    fireEvent.change(input, {
      target: {
        value: 'Second message',
      },
    });
    fireEvent.click(screen.getByText('Resume session'));
    await waitFor(() => expect(resumeAttempts).toBe(2));

    const resumeCalls = request.mock.calls
      .map(([config]) => config)
      .filter((config) => config.url === 'agent-gateway/agent-sessions/session-id-1/resume');
    expect(resumeCalls.map((config) => config.data?.idempotencyKey)).toEqual([
      'retry-change-key-1',
      'retry-change-key-2',
    ]);
    expect(resumeCalls.map((config) => config.data?.message)).toEqual(['First message', 'Second message']);
  });

  it('generates a new resume idempotency key after validation failure and message change', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('validation-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('validation-key-2' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('validation-key-3' as `${string}-${string}-${string}-${string}-${string}`);
    let resumeAttempts = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-validation',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }
      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-resume-validation',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
              },
            },
          },
        };
      }
      if (config.url === 'agent-gateway/agent-sessions/session-id-1/resume') {
        resumeAttempts += 1;
        if (resumeAttempts === 1) {
          const error = new Error('message is required') as Error & { response?: { status: number } };
          error.response = { status: 400 };
          throw error;
        }
        return {
          data: {
            data: {
              runId: 'run-id-2',
              agentSessionId: 'session-id-1',
              deduped: false,
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-resume-validation')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    const input = await screen.findByLabelText('Resume message');
    fireEvent.change(input, {
      target: {
        value: 'bad',
      },
    });
    fireEvent.click(screen.getByText('Resume session'));
    await waitFor(() => expect(resumeAttempts).toBe(1));
    fireEvent.change(input, {
      target: {
        value: 'good',
      },
    });
    fireEvent.click(screen.getByText('Resume session'));
    await waitFor(() => expect(resumeAttempts).toBe(2));

    const resumeCalls = request.mock.calls
      .map(([config]) => config)
      .filter((config) => config.url === 'agent-gateway/agent-sessions/session-id-1/resume');
    expect(resumeCalls.map((config) => config.data?.idempotencyKey)).toEqual(['validation-key-1', 'validation-key-2']);
  });

  it('hides resume controls when provider capabilities do not support resume', async () => {
    const genericCapabilities = {
      structuredEvents: false,
      terminalOutput: true,
      resumeSession: false,
      liveSemanticMessage: false,
      stdinMessage: false,
      interrupt: false,
      terminate: true,
      artifacts: false,
    };
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-generic-no-resume',
                status: 'succeeded',
                agentProvider: 'generic-cli',
                agentProviderCapabilitiesJson: genericCapabilities,
                agentGatewayActionPermissionsJson: {
                  resumeAgentSession: true,
                  readSessionMessages: false,
                  readTerminal: false,
                },
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-generic-no-resume',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'generic-cli',
              agentSessionProviderId: 'thread-id-1',
              agentProvider: 'generic-cli',
              agentProviderCapabilitiesJson: genericCapabilities,
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
                readSessionMessages: false,
                readTerminal: false,
              },
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-generic-no-resume')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(screen.queryByText('Resume agent session')).toBeNull();
    expect(screen.queryByLabelText('Resume message')).toBeNull();
    expect(screen.queryByText('Resume session')).toBeNull();
  });

  it('disables resume when the agent session does not support resume with message', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/runs:list') {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-disabled',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
                agentSessionCapabilitiesJson: {
                  resumeWithMessage: false,
                },
                agentGatewayActionPermissionsJson: {
                  resumeAgentSession: true,
                },
              },
            ],
          },
        };
      }
      if (config.url === 'agent-gateway/runs:get/run-id-1') {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-resume-disabled',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              agentSessionProvider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              agentSessionCapabilitiesJson: {
                resumeWithMessage: false,
              },
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
              },
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-resume-disabled')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Agent Sessions' }));
    expect(await screen.findByText('Agent session does not support resume with message')).toBeTruthy();
    expect(await screen.findByLabelText('Resume message')).toBeDisabled();
    expect(screen.getByText('Resume session').closest('button')).toBeDisabled();
  });

  it('lists, creates, and toggles dispatch bindings through Agent Gateway APIs', async () => {
    const bindings: Array<Record<string, unknown>> = [
      {
        id: 'binding-id-1',
        bindingKey: 'ticket-dispatch',
        collectionName: 'tickets',
        outputAgentRunField: 'agentRun',
        promptTemplateId: 'template-id-1',
        enabled: true,
        priority: 0,
        fieldMappingsJson: {
          title: 'title',
        },
        skillFieldsJson: {},
      },
    ];
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/dispatch-bindings:list') {
        return {
          data: {
            data: bindings,
          },
        };
      }

      if (config.url === 'agent-gateway/prompt-templates:list') {
        return {
          data: {
            data: [
              {
                id: 'template-id-1',
                templateKey: 'ticket-summary',
                displayName: 'Ticket summary',
              },
            ],
          },
        };
      }

      if (config.url === 'agent-gateway/dispatch-bindings:create') {
        const createdBinding = {
          id: 'binding-id-2',
          bindingKey: String(config.data?.bindingKey),
          collectionName: String(config.data?.collectionName),
          outputAgentRunField: String(config.data?.outputAgentRunField),
          promptTemplateId: String(config.data?.promptTemplateId),
          enabled: true,
          priority: Number(config.data?.priority || 0),
        };
        bindings.push(createdBinding);
        return {
          data: {
            data: createdBinding,
          },
        };
      }

      if (config.url === 'agent-gateway/dispatch-bindings:update/binding-id-1') {
        return {
          data: {
            data: {
              ...bindings[0],
              enabled: config.data?.enabled,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayDispatchBindingsPage, request);

    expect(await screen.findByText('ticket-dispatch')).toBeTruthy();

    fireEvent.click(screen.getByText('New binding'));
    fireEvent.change(screen.getByPlaceholderText('ticket-dispatch'), {
      target: { value: 'new-ticket-dispatch' },
    });
    fireEvent.change(screen.getByPlaceholderText('tickets'), {
      target: { value: 'tickets' },
    });
    fireEvent.change(screen.getByPlaceholderText('agentRun'), {
      target: { value: 'agentRun' },
    });
    fireEvent.mouseDown(screen.getByLabelText('Prompt template'));
    fireEvent.click(await screen.findByText('Ticket summary'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/dispatch-bindings:create',
          method: 'post',
          data: expect.objectContaining({
            bindingKey: 'new-ticket-dispatch',
            collectionName: 'tickets',
            outputAgentRunField: 'agentRun',
            promptTemplateId: 'template-id-1',
          }),
        }),
      );
    });

    fireEvent.click(screen.getAllByLabelText('Toggle dispatch binding status')[0]);
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/dispatch-bindings:update/binding-id-1',
          method: 'post',
          data: {
            enabled: false,
          },
        }),
      );
    });
  });
});
