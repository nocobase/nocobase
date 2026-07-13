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
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AgentGatewayProviderCapabilitiesPage from '../pages/AgentGatewayProviderCapabilitiesPage';

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

function renderProviderCapabilitiesPage(request: (config: RequestConfig) => Promise<unknown>) {
  const app = new Application();
  setFlowContextValue(app, 'api', { request });

  render(
    <FlowEngineProvider engine={app.flowEngine}>
      <AntdApp>
        <AgentGatewayProviderCapabilitiesPage />
      </AntdApp>
    </FlowEngineProvider>,
  );
}

describe('AgentGatewayProviderCapabilitiesPage', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/v/admin/settings/agent-gateway/provider-capabilities');
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

  it('renders provider capability and degradation states from profiles and runs', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === 'agentGatewayApi:listNodes') {
        return {
          data: {
            data: [{ id: 'node-1', nodeKey: 'local-node' }],
          },
        };
      }

      if (config.url === 'agentGatewayApi:listNodeProfiles/node-1') {
        return {
          data: {
            data: [
              {
                id: 'profile-codex',
                profileKey: 'codex-local',
                provider: 'codex',
                displayName: 'Codex Local',
                status: 'available',
                capabilitiesJson: {
                  resumeSession: true,
                  terminalOutput: true,
                  interrupt: true,
                  terminate: true,
                  artifacts: true,
                },
              },
              {
                id: 'profile-generic',
                profileKey: 'generic-local',
                provider: 'generic-cli',
                displayName: 'Generic Local',
                status: 'available',
                capabilitiesJson: {
                  terminalOutput: true,
                  terminate: true,
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
                runCode: 'AGW-CODEX',
                status: 'succeeded',
                sourceType: 'provider-capability-seed',
                provider: 'codex',
                capabilitySource: 'adapter',
                capabilitiesSnapshotJson: {
                  resumeSession: true,
                  terminalOutput: true,
                  interrupt: true,
                  terminate: true,
                  artifacts: true,
                },
                agentProfileId: 'profile-codex',
                agentSessionId: 'session-codex',
                agentSessionProviderId: 'codex-session-1',
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
                  interruptRun: false,
                  terminateRun: false,
                },
              },
              {
                id: 'run-generic',
                runCode: 'AGW-GENERIC',
                status: 'running',
                sourceType: 'provider-capability-seed',
                provider: 'generic-cli',
                capabilitySource: 'adapter',
                capabilitiesSnapshotJson: {
                  terminalOutput: true,
                  terminate: true,
                },
                agentProfileId: 'profile-generic',
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
                  interruptRun: false,
                  terminateRun: true,
                },
              },
            ],
          },
        };
      }

      throw new Error(`Unexpected request: ${config.url}`);
    });

    renderProviderCapabilitiesPage(request);

    expect(await screen.findByRole('region', { name: 'Provider Capabilities' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('AGW-CODEX')).toBeInTheDocument();
      expect(screen.getByText('AGW-GENERIC')).toBeInTheDocument();
    });

    const codexRow = screen.getByRole('row', { name: /codex adapter codex-local local-node/i });
    expect(within(codexRow).getByText('Resume: Visible')).toBeInTheDocument();
    expect(within(codexRow).getByText('Artifacts: Visible')).toBeInTheDocument();
    expect(within(codexRow).getByText('Resume: Allowed')).toBeInTheDocument();

    const genericRow = screen.getByRole('row', { name: /generic-cli adapter generic-local local-node/i });
    expect(within(genericRow).getByText('Resume: Hidden')).toBeInTheDocument();
    expect(within(genericRow).getByText('Artifacts: Hidden')).toBeInTheDocument();
    expect(within(genericRow).getByText('Resume: 409 unsupported')).toBeInTheDocument();
    expect(within(genericRow).getByText('Interrupt: 409 unsupported')).toBeInTheDocument();
    expect(within(genericRow).getByText('Terminate: Allowed')).toBeInTheDocument();

    expect(request).toHaveBeenCalledWith({
      url: 'agentGatewayApi:listNodes',
      method: 'get',
    });
  });
});
