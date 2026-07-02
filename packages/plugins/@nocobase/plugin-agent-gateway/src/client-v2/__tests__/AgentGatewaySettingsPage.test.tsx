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
  encodeTerminalPayload,
} from '../../shared/terminalStreamProtocol';
import AgentGatewayDispatchBindingsPage from '../pages/AgentGatewayDispatchBindingsPage';
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

  constructor(readonly url: string) {
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

describe('PluginAgentGatewayClientV2', () => {
  beforeEach(() => {
    xtermMock.MockTerminal.instances = [];
    fitAddonMock.MockFitAddon.instances = [];
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
        key: 'index',
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'runs',
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'prompt-templates',
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'dispatch-bindings',
      }),
    );
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
                  mode: 'success',
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
    expect(screen.getByText('fake-daemon/1.0.0')).toBeTruthy();
    expect(await screen.findByText('fake-success')).toBeTruthy();
    expect(screen.getByText(/"mode": "success"/)).toBeTruthy();
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

    fireEvent.click(screen.getByLabelText('Toggle node status'));
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

  it('creates an invitation and clears the one-time register command when the modal closes', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agent-gateway/node-invitations:create') {
        return {
          data: {
            data: {
              invitationId: 'invitation-id-1',
              registerCommand:
                'agent-gateway-daemon register --server-url https://nocobase.example.test --invite-token ag_inv_once',
              expiresAt: '2026-07-01T10:00:00.000Z',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderSettingsPage(request);

    fireEvent.click(await screen.findByText('Create invitation'));
    expect(await screen.findByText('Expected node key')).toBeTruthy();
    fireEvent.click(screen.getByText('Create'));

    expect(await screen.findByText(/agent-gateway-daemon register/)).toBeTruthy();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agent-gateway/node-invitations:create',
        method: 'post',
        data: expect.objectContaining({
          expiresInSeconds: 86400,
        }),
      }),
    );

    fireEvent.click(screen.getByText('Close'));

    await waitFor(() => {
      expect(screen.queryByText(/agent-gateway-daemon register/)).toBeNull();
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
                agentSessionId: 'session-id-1',
                agentSessionProvider: 'codex',
                agentSessionProviderId: 'thread-id-1',
                sourceType: 'record-action',
                sourceCollection: 'tickets',
                sourceRecordId: '1',
                requestedAt: '2026-06-30T10:00:00.000Z',
              },
              {
                id: 'run-id-2',
                runCode: 'run-done-1',
                status: 'succeeded',
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
                command: 'must-not-render',
                cwd: '/tmp/must-not-render',
                env: {
                  SECRET: 'must-not-render',
                },
                safe: 'visible summary',
              },
              errorSummary: 'command=must-not-render cwd=/tmp/must-not-render env.SECRET=must-not-render',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
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
            ],
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
                eventType: 'agent.message',
                contentText: 'timeline says build started',
                contentJson: {
                  itemId: 'item-1',
                },
                createdAt: '2026-06-30T10:01:01.000Z',
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
                  externalUrl: 'https://daemon.example/artifact',
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
                requestSummaryJson: {
                  action: 'events:append',
                },
                responseSummaryJson: {
                  statusCode: 200,
                },
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

    expect(await screen.findByText('run-build-1')).toBeTruthy();
    expect(await screen.findByText('run-done-1')).toBeTruthy();
    expect(await screen.findByText('codex / thread-id-1')).toBeTruthy();
    expect(await screen.findByText('Legacy run')).toBeTruthy();

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

    expect(await screen.findByText('Run summary')).toBeTruthy();
    expect(await screen.findAllByText('codex / thread-id-1')).toBeTruthy();
    expect(await screen.findAllByText('session-id-1')).toBeTruthy();
    expect(await screen.findByText('Agent Timeline')).toBeTruthy();
    expect(await screen.findByText('Normalized agent activity')).toBeTruthy();
    expect(await screen.findByText('timeline says build started')).toBeTruthy();
    expect(await screen.findByText('Live CLI Output')).toBeTruthy();
    expect(await screen.findByText(/agent is building/)).toBeTruthy();
    expect(screen.queryByLabelText('Terminal input')).toBeNull();
    expect(screen.queryByLabelText('Send terminal input')).toBeNull();
    expect(await screen.findByText('build started')).toBeTruthy();
    expect(await screen.findByText('inline artifact text')).toBeTruthy();
    expect(await screen.findByText(/visible summary/)).toBeTruthy();
    expect(await screen.findByText(/"files":/)).toBeTruthy();
    expect(await screen.findByText('/api/agent-gateway/runs/run-id-1/events:append')).toBeTruthy();
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
    expect(await screen.findByText(/switch output one/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Interrupt'));
    await waitFor(() => expect(resolveInterrupt).toBeTruthy());

    fireEvent.click((await screen.findAllByLabelText('View run details'))[1]);
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

    expect(await screen.findByText('Run summary')).toBeTruthy();
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

    expect(await screen.findByText('Run summary')).toBeTruthy();
    expect(await screen.findByText(/opened from v route query/)).toBeTruthy();

    act(() => {
      window.history.pushState({}, '', '/v/admin/settings/agent-gateway/runs');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Run summary')).toBeNull();
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
    await waitFor(() => expect(resolveRunOneSnapshot).toBeTruthy());

    fireEvent.click(detailButtons[1]);
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
    expect(await screen.findByText('snapshot before stream')).toBeTruthy();
    await waitFor(() => {
      expect(FakeBrowserWebSocket.instances).toHaveLength(1);
    });

    const webSocket = FakeBrowserWebSocket.instances[0];
    act(() => {
      webSocket.dispatch('open');
    });
    const subscribeFrame = JSON.parse(webSocket.sent[0]) as Record<string, unknown>;
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
    expect(await screen.findByText('saved snapshot after reload')).toBeTruthy();
    await waitFor(() => {
      expect(FakeBrowserWebSocket.instances).toHaveLength(1);
    });

    const webSocket = FakeBrowserWebSocket.instances[0];
    act(() => {
      webSocket.dispatch('open');
    });
    const subscribeFrame = JSON.parse(webSocket.sent[0]) as Record<string, unknown>;
    expect(subscribeFrame).toMatchObject({
      type: 'browser.subscribe',
      runId: 'run-id-1',
      lastOffset: 12,
    });
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

    expect(await screen.findByText('Run summary')).toBeTruthy();
    expect(await screen.findAllByText('codex / thread-id-1')).toBeTruthy();
    expect(await screen.findByText(/agent is still visible/)).toBeTruthy();
    expect(await screen.findByText(/Agent timeline unavailable/)).toBeTruthy();
    expect(await screen.findByText(/Events unavailable/)).toBeTruthy();
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

    expect(await screen.findByText('No timeline activity yet')).toBeTruthy();
    const timelineHeading = await screen.findByText('Agent Timeline');
    const timelineRegion = timelineHeading.closest('section');
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

    expect(await screen.findByText('No timeline activity yet')).toBeTruthy();
    const timelineHeading = await screen.findByText('Agent Timeline');
    const timelineRegion = timelineHeading.closest('section');
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

    const commandText = await screen.findByText('Command failed');
    const timelineItem = commandText.closest('.ant-timeline-item');
    expect(timelineItem?.querySelector('.ant-timeline-item-head-red')).toBeTruthy();
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
    const intervalCallbacks: Array<() => void> = [];
    vi.spyOn(window, 'setInterval').mockImplementation((handler: TimerHandler) => {
      if (typeof handler === 'function') {
        intervalCallbacks.push(() => handler());
      }
      return intervalCallbacks.length;
    });
    vi.spyOn(window, 'clearInterval').mockImplementation(() => undefined);

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
      for (const callback of intervalCallbacks) {
        callback();
      }
    });

    expect(await screen.findByText('stable normalized event')).toBeTruthy();
    expect(await screen.findByText(/Agent timeline unavailable/)).toBeTruthy();
    const timelineHeading = await screen.findByText('Agent Timeline');
    const timelineRegion = timelineHeading.closest('section');
    expect(timelineRegion).toBeTruthy();
    expect(
      within(timelineRegion as HTMLElement).queryByText('legacy event should not replace normalized event'),
    ).toBeNull();
  });

  it('refreshes run summary while the detail drawer remains open', async () => {
    let runDetailsCallCount = 0;
    const intervalCallbacks: Array<() => void> = [];
    vi.spyOn(window, 'setInterval').mockImplementation((handler: TimerHandler) => {
      if (typeof handler === 'function') {
        intervalCallbacks.push(() => handler());
      }
      return intervalCallbacks.length;
    });
    vi.spyOn(window, 'clearInterval').mockImplementation(() => undefined);

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

    expect(await screen.findByText('Run summary')).toBeTruthy();
    expect(await screen.findByText('No agent session')).toBeTruthy();

    await act(async () => {
      for (const callback of intervalCallbacks) {
        callback();
      }
    });

    await waitFor(() => {
      expect(runDetailsCallCount).toBeGreaterThan(1);
    });
    expect(await screen.findByText('codex / thread-id-2')).toBeTruthy();
    expect(await screen.findByText('session-id-2')).toBeTruthy();
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
    expect(await screen.findByText('Resume agent session')).toBeTruthy();
    expect(await screen.findByText('session timeline original')).toBeTruthy();

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
    const intervalCallbacks: Array<() => void> = [];
    vi.spyOn(window, 'setInterval').mockImplementation((handler: TimerHandler) => {
      if (typeof handler === 'function') {
        intervalCallbacks.push(() => handler());
      }
      return intervalCallbacks.length;
    });
    vi.spyOn(window, 'clearInterval').mockImplementation(() => undefined);

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

      if (config.url === 'agent-gateway/runs/run-id-2/conversation-events:list') {
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
    expect(await screen.findByLabelText('Resume message')).toBeTruthy();
    const sessionOneRequestsBeforeSwitch = sessionOneTimelineRequests;

    fireEvent.click(detailButtons[1]);

    await waitFor(() => {
      expect(screen.queryByLabelText('Resume message')).toBeNull();
    });
    expect(screen.queryByText('old session timeline event')).toBeNull();

    await act(async () => {
      for (const callback of intervalCallbacks) {
        callback();
      }
    });

    expect(sessionOneTimelineRequests).toBe(sessionOneRequestsBeforeSwitch);
    expect(runTwoTimelineRequests).toBeGreaterThan(0);

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
          },
        },
      });
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
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-resume-disabled')).toBeTruthy();
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
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
