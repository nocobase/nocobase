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
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AgentGatewayPromptTemplatesPage from '../pages/AgentGatewayPromptTemplatesPage';
import AgentGatewayProviderCapabilitiesPage from '../pages/AgentGatewayProviderCapabilitiesPage';
import AgentGatewaySettingsPage from '../pages/AgentGatewaySettingsPage';
import AgentGatewayTaskTemplatesPage from '../pages/AgentGatewayTaskTemplatesPage';
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
  setFlowContextValue(app, 'api', { request });
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

describe('Agent Gateway admin pages', () => {
  beforeEach(() => {
    stubAnimationFrameWithTimeout();
    window.history.pushState({}, '', '/admin/settings/agent-gateway/nodes');
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
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
        key: 'skills',
        sort: 15,
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
        sort: 40,
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'task-templates',
        sort: 30,
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'agent-gateway',
        key: 'dispatch-bindings',
        sort: 50,
      }),
    );
    expect(app.pluginSettingsManager.getRoutePath('agent-gateway.nodes')).toBe('/admin/settings/agent-gateway/nodes');
    expect(app.pluginSettingsManager.getRoutePath('agent-gateway.skills')).toBe('/admin/settings/agent-gateway/skills');
  });

  it('renders nodes and per-node profiles without raw execution configuration', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agentGatewayApi:listNodes') {
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

      if (config.url === 'agentGatewayApi:listNodeProfiles/node-id-1') {
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

      if (config.url === 'agentGatewayApi:updateNode/node-id-1') {
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

    expect(await screen.findByRole('region', { name: 'Agent Gateway Nodes' })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByText('node-1').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Local fake runner')).toBeTruthy();
    expect(screen.getAllByText('Enabled state').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Connection').length).toBeGreaterThan(0);
    expect(screen.queryByText('Current concurrency')).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Nodes' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Skills' })).toBeNull();
    expect(screen.getAllByText('Online').length).toBeGreaterThan(0);
    expect(screen.getByText('Offline - stale heartbeat')).toBeTruthy();
    expect(screen.getByText('fake-daemon/1.0.0')).toBeTruthy();
    expect(await screen.findByText('fake-success')).toBeTruthy();
    expect(await screen.findByText(/^(Terminal output|terminalOutput)$/)).toBeTruthy();
    expect(await screen.findByText(/^(Artifacts|artifacts)$/)).toBeTruthy();
    expect(screen.queryByText('must-not-render')).toBeNull();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agentGatewayApi:listNodes',
        method: 'get',
      }),
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'agentGatewayApi:listNodeProfiles/node-id-1',
        method: 'get',
      }),
    );

    fireEvent.click(screen.getAllByLabelText('Toggle node status')[0]);
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agentGatewayApi:updateNode/node-id-1',
          method: 'post',
          data: {
            status: 'disabled',
          },
        }),
      );
    });
  });

  it('renders a compact provider capability matrix', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agentGatewayApi:listNodes') {
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
      if (config.url === 'agentGatewayApi:listNodeProfiles/node-id-1') {
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
      if (config.url === 'agentGatewayApi:listRuns') {
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
                provider: 'codex',
                capabilitySource: 'session',
                capabilitiesSnapshotJson: {
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

    expect(await screen.findByRole('region', { name: 'Provider Capabilities' })).toBeTruthy();
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
      if (config.url === 'agentGatewayApi:listNodes') {
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
      if (config.url === 'agentGatewayApi:listNodeProfiles/node-id-1') {
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
      if (config.url === 'agentGatewayApi:listRuns') {
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
      if (config.url === 'agentGatewayApi:createNodeInvitation') {
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
        url: 'agentGatewayApi:createNodeInvitation',
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
      if (config.url === 'agentGatewayApi:listPromptTemplates') {
        return {
          data: {
            data: templates,
          },
        };
      }

      if (config.url === 'agentGatewayApi:createPromptTemplate') {
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

      if (config.url === 'agentGatewayApi:previewPromptTemplate') {
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

    expect(await screen.findByRole('region', { name: 'Prompt Templates' })).toBeTruthy();
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
          url: 'agentGatewayApi:createPromptTemplate',
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
        url: 'agentGatewayApi:previewPromptTemplate',
        method: 'post',
        data: expect.objectContaining({
          templateId: 'template-id-1',
          collectionName: 'tasks',
          recordId: '1',
        }),
      }),
    );
  });

  it('lists and creates task templates through Agent Gateway APIs', async () => {
    const templates = [
      {
        id: 'template-id-1',
        templateKey: 'generic',
        displayName: 'Generic task',
        status: 'active',
        cwd: '.',
        skillVersionIdsJson: [],
        artifactsJson: [],
      },
    ];
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agentGatewayApi:listTaskTemplates') {
        return {
          data: {
            data: templates,
          },
        };
      }

      if (config.url === 'agentGatewayApi:listRunOptions') {
        return {
          data: {
            data: {
              defaultCwd: '.',
              nodes: [
                {
                  id: 'node-187',
                  nodeKey: 'remote-187',
                  displayName: 'Remote 187',
                  status: 'active',
                  online: true,
                  profiles: [
                    {
                      id: 'profile-187',
                      nodeId: 'node-187',
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

      if (config.url === 'agentGatewayApi:initFileUpload') {
        return {
          data: {
            data: {
              id: 'upload-template-skill',
              chunkSize: 1024 * 1024,
            },
          },
        };
      }

      if (config.url === 'agentGatewayApi:appendFileUpload/upload-template-skill') {
        return {
          data: {
            data: {
              uploadId: 'upload-template-skill',
              receivedBytes: 14,
            },
          },
        };
      }

      if (config.url === 'agentGatewayApi:completeFileUpload/upload-template-skill') {
        return {
          data: {
            data: {
              id: 'upload-template-skill',
              status: 'completed',
            },
          },
        };
      }

      if (config.url === 'agentGatewayApi:createSkillVersionFromUpload') {
        return {
          data: {
            data: {
              skillVersionId: 'uploaded-template-skill-version-id',
              skillKey: config.data?.skillKey,
              versionLabel: config.data?.versionLabel,
              status: 'active',
            },
          },
        };
      }

      if (config.url === 'agentGatewayApi:createTaskTemplate') {
        templates.push({
          id: 'template-id-2',
          templateKey: String(config.data?.templateKey),
          displayName: String(config.data?.displayName),
          status: 'active',
          cwd: String(config.data?.cwd),
          skillVersionIdsJson: Array.isArray(config.data?.skillVersionIds)
            ? (config.data.skillVersionIds as string[])
            : [],
          artifactsJson: [],
        });
        return {
          data: {
            data: templates[1],
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayTaskTemplatesPage, request);

    expect(await screen.findByRole('region', { name: 'Task Templates' })).toBeTruthy();
    expect((await screen.findAllByText('generic')).length).toBeGreaterThan(0);
    expect(document.querySelector('.ant-table-row-expand-icon')).toBeNull();

    fireEvent.click(screen.getByText('New template'));
    expect(screen.queryByLabelText('Sort')).toBeNull();
    expect(screen.queryByLabelText('Runner')).toBeNull();
    expect(screen.getAllByLabelText('Title')).toHaveLength(1);
    fireEvent.change(screen.getByPlaceholderText('build-on-187'), {
      target: { value: 'build-on-187' },
    });
    fireEvent.change(screen.getByPlaceholderText('Build on 187'), {
      target: { value: 'Build on 187' },
    });
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: '187 browser validation' },
    });
    fireEvent.change(screen.getByLabelText('Prompt'), {
      target: { value: '搭建一个用于浏览器验收的任务页面' },
    });
    fireEvent.click(screen.getByText('Upload skill'));
    fireEvent.change(screen.getByLabelText('Skill key'), {
      target: { value: 'template-skill' },
    });
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    await act(async () => {
      fireEvent.change(fileInput as HTMLInputElement, {
        target: {
          files: [new File(['fake zip bytes'], 'template-skill.zip', { type: 'application/zip' })],
        },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agentGatewayApi:initFileUpload',
          method: 'post',
          data: expect.objectContaining({
            purpose: 'skill-version',
            fileName: 'template-skill.zip',
            sizeBytes: 14,
          }),
        }),
      );
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agentGatewayApi:appendFileUpload/upload-template-skill',
          method: 'post',
          data: expect.objectContaining({
            offset: 0,
            contentBase64: expect.any(String),
          }),
        }),
      );
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agentGatewayApi:createSkillVersionFromUpload',
          method: 'post',
          data: expect.objectContaining({
            uploadId: 'upload-template-skill',
            skillKey: 'template-skill',
            versionLabel: 'local',
          }),
        }),
      );
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'agentGatewayApi:createTaskTemplate',
          method: 'post',
          data: expect.objectContaining({
            templateKey: 'build-on-187',
            displayName: 'Build on 187',
            defaultTitle: '187 browser validation',
            defaultPrompt: '搭建一个用于浏览器验收的任务页面',
            nodeId: null,
            agentProfileId: null,
            skillVersionIdsJson: ['uploaded-template-skill-version-id'],
          }),
        }),
      );
    });
    const createCall = request.mock.calls.find(([config]) => config.url === 'agentGatewayApi:createTaskTemplate');
    expect(createCall?.[0].data).not.toHaveProperty('sort');
  });

  it('opens task template details from the templateId query parameter', async () => {
    window.history.pushState({}, '', '/admin/settings/agent-gateway/task-templates?templateId=template-id-1');
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agentGatewayApi:listTaskTemplates') {
        return {
          data: {
            data: [
              {
                id: 'template-id-1',
                templateKey: 'generic',
                displayName: 'Generic task',
                status: 'active',
                cwd: '.',
                skillVersionIdsJson: [],
                artifactsJson: [],
              },
            ],
          },
        };
      }

      if (config.url === 'agentGatewayApi:listRunOptions') {
        return {
          data: {
            data: {
              defaultCwd: '.',
              skillVersions: [],
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayTaskTemplatesPage, request);

    expect(await screen.findByDisplayValue('generic')).toBeTruthy();
    expect(screen.getByDisplayValue('Generic task')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' }).at(-1) as HTMLElement);
    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('templateId')).toBeNull();
    });
  });
});
