/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AGENT_GATEWAY_API_ACTIONS } from '../../../../shared/apiContract';
import {
  FakeBrowserWebSocket,
  RequestConfig,
  apiUrl,
  renderAgentGatewayPage,
  setupRunsPageTestHooks,
  spyOnPageIntervals,
} from '../testUtils';
import AgentGatewayRunsPage from '../../../pages/AgentGatewayRunsPage';

describe('Agent Gateway runs permission transitions', () => {
  setupRunsPageTestHooks();

  it('opens run details from the runId query and preserves unrelated query parameters on close', async () => {
    window.history.pushState({}, '', '/admin/settings/agent-gateway/runs?source=acceptance&runId=run-id-1');
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
              capabilitiesSnapshotJson: {
                interrupt: true,
                terminalOutput: true,
                terminate: true,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1')) {
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
        url: apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1'),
        method: 'get',
      }),
    );
    expect(new URLSearchParams(window.location.search).get('runId')).toBe('run-id-1');

    fireEvent.click(screen.getByLabelText('Close'));

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get('runId')).toBeNull();
      expect(params.get('source')).toBe('acceptance');
    });
  });

  it('shows a stable detail access error without polling sensitive endpoints', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1'),
          method: 'get',
        }),
      );
    });

    const requestedUrls = request.mock.calls.map(([config]) => config.url);
    expect(requestedUrls.filter((url) => url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1'))).toHaveLength(1);
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
    const intervalCallbacks = spyOnPageIntervals();
    let detailCallCount = 0;
    const requestCounts = new Map<string, number>();
    const request = vi.fn(async (config: RequestConfig) => {
      requestCounts.set(config.url, (requestCounts.get(config.url) || 0) + 1);
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
              provider: 'codex',
              terminalStatus: 'active',
              capabilitiesSnapshotJson: {
                artifacts: true,
                structuredEvents: true,
                terminalOutput: true,
              },
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, 'run-id-1')) {
        return {
          data: {
            data: {
              ticket: 'ag_stream_revoked_ticket',
              expiresAt: '2026-06-30T10:02:00.000Z',
            },
          },
        };
      }

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents, 'run-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, 'run-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots, 'run-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs, 'run-id-1')
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

    await act(async () => {
      for (const callback of [...intervalCallbacks.values()]) {
        callback();
      }
    });

    expect(await screen.findByText('Run details unavailable')).toBeTruthy();
    expect(await screen.findByText('Run details were revoked')).toBeTruthy();
    expect(screen.queryByText('Run summary')).toBeNull();
    expect(screen.queryByText('stale snapshot before denial')).toBeNull();

    const sensitiveUrls = [
      apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1'),
      apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1'),
      apiUrl(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, 'run-id-1'),
    ];
    const countsAfterDenial = Object.fromEntries(sensitiveUrls.map((url) => [url, requestCounts.get(url) || 0]));

    await act(async () => {
      for (const callback of [...intervalCallbacks.values()]) {
        callback();
      }
    });

    for (const url of sensitiveUrls) {
      expect(requestCounts.get(url) || 0).toBe(countsAfterDenial[url]);
    }
    expect(FakeBrowserWebSocket.instances[0].readyState).toBe(3);
  });

  it('clears stale terminal output and session timeline when run affordances are revoked by detail refresh', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    const intervalCallbacks = spyOnPageIntervals();

    const requestCounts = new Map<string, number>();
    let detailCallCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      requestCounts.set(config.url, (requestCounts.get(config.url) || 0) + 1);

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        detailCallCount += 1;
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-affordance-revoked',
              status: 'running',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              terminalStatus: 'active',
              capabilitiesSnapshotJson: {
                terminalOutput: true,
              },
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, 'run-id-1')) {
        return {
          data: {
            data: {
              ticket: 'ag_stream_affordance_ticket',
              expiresAt: '2026-06-30T10:02:00.000Z',
            },
          },
        };
      }

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents, 'run-id-1')
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
      apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1'),
      apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1'),
      apiUrl(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, 'run-id-1'),
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-detail-only',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                provider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-detail-only',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              provider: 'codex',
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
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1'),
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

  it('hides cancel actions when the run affordance denies cancel permission', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'running',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              capabilitiesSnapshotJson: {
                terminalOutput: true,
              },
              agentGatewayActionPermissionsJson: {
                readTerminal: true,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1')) {
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

  it('keeps run details visible when optional observation streams are forbidden', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-build-1',
                status: 'running',
                agentSessionId: 'session-id-1',
                provider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
            ],
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'running',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              capabilitiesSnapshotJson: {
                artifacts: true,
                structuredEvents: true,
                terminalOutput: true,
              },
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1')) {
        throw new Error('403 Forbidden');
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1')) {
        throw new Error('403 Forbidden');
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, 'run-id-1')) {
        return {
          data: {
            data: [],
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots, 'run-id-1')) {
        return {
          data: {
            data: [],
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs, 'run-id-1')) {
        throw new Error('403 Forbidden');
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1')) {
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
});
