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
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AgentGatewayDispatchBindingsPage from '../pages/AgentGatewayDispatchBindingsPage';
import AgentGatewayPromptTemplatesPage from '../pages/AgentGatewayPromptTemplatesPage';
import AgentGatewayRunsPage from '../pages/AgentGatewayRunsPage';
import AgentGatewaySettingsPage from '../pages/AgentGatewaySettingsPage';
import PluginAgentGatewayClientV2 from '../plugin';

interface FlowContextWithDefineProperty {
  defineProperty(name: string, descriptor: { value: unknown }): void;
}

interface RequestConfig {
  url: string;
  method: 'get' | 'post';
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

function setFlowContextValue(app: Application, key: string, value: unknown) {
  (app.flowEngine.context as unknown as FlowContextWithDefineProperty).defineProperty(key, { value });
}

function renderAgentGatewayPage(Page: React.ComponentType, request: (config: RequestConfig) => Promise<unknown>) {
  const app = new Application();
  setFlowContextValue(app, 'api', {
    request,
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
    vi.restoreAllMocks();
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

      if (config.url === 'agent-gateway/runs/run-id-1/terminal:send') {
        return {
          data: {
            data: {
              success: true,
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('run-build-1')).toBeTruthy();
    expect(await screen.findByText('run-done-1')).toBeTruthy();

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

    expect(await screen.findByText('Run summary')).toBeTruthy();
    expect(await screen.findByText(/agent is building/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Terminal input'), {
      target: { value: 'continue' },
    });
    fireEvent.click(screen.getByLabelText('Send terminal input'));
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agent-gateway/runs/run-id-1/terminal:send',
          method: 'post',
          data: {
            input: 'continue',
            appendEnter: true,
          },
        }),
      );
    });
    expect(await screen.findByText('build started')).toBeTruthy();
    expect(await screen.findByText('inline artifact text')).toBeTruthy();
    expect(await screen.findByText(/visible summary/)).toBeTruthy();
    expect(await screen.findByText(/"files":/)).toBeTruthy();
    expect(await screen.findByText('/api/agent-gateway/runs/run-id-1/events:append')).toBeTruthy();
    expect(screen.queryByText(/must-not-render/)).toBeNull();
    expect(screen.queryByText(/https:\/\/daemon\.example\/artifact/)).toBeNull();
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
