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
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
  encodeTerminalPayload,
} from '../../../../shared/terminalStreamProtocol';
import {
  FakeBrowserWebSocket,
  RequestConfig,
  apiUrl,
  getMockTerminalInstances,
  renderAgentGatewayPage,
  setupRunsPageTestHooks,
  spyOnPageIntervals,
} from '../testUtils';
import AgentGatewayRunsPage from '../../../pages/AgentGatewayRunsPage';

describe('Agent Gateway runs terminal', () => {
  setupRunsPageTestHooks();

  it('does not open a live terminal stream when terminal output is unsupported by the provider', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    const requestedUrls: string[] = [];
    const request = vi.fn(async (config: RequestConfig) => {
      requestedUrls.push(config.url);
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-no-terminal-output',
              status: 'running',
              terminalBackend: 'tmux',
              terminalStatus: 'active',
              provider: 'codex',
              capabilitiesSnapshotJson: {
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
    await waitFor(() => expect(requestedUrls).toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')));
    expect(requestedUrls.some((url) => url.includes('terminal:snapshot'))).toBe(false);
    expect(requestedUrls.some((url) => url.includes('terminal-stream-tickets:create'))).toBe(false);
    expect(FakeBrowserWebSocket.instances).toHaveLength(0);
  });

  it('ignores a stale terminal snapshot response after switching run details', async () => {
    let resolveRunOneSnapshot: ((value: { data: { data: Record<string, unknown> } }) => void) | undefined;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-2')
      ) {
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
        return await new Promise<{ data: { data: Record<string, unknown> } }>((resolve) => {
          resolveRunOneSnapshot = resolve;
        });
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-2')) {
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

  it('stops terminal snapshot polling while the stream is live and restores it after a stream error', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    const intervalCallbacks = spyOnPageIntervals();
    let terminalSnapshotCallCount = 0;
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, 'run-id-1')) {
        return {
          data: {
            data: {
              ticket: 'ag_stream_page_ticket',
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
      webSocket.protocols?.some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX)),
    ).toBe(true);
    expect(webSocket.protocols).toHaveLength(2);
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
    expect(JSON.stringify(subscribeFrame)).not.toContain('browser-token');
    expect(subscribeFrame).not.toHaveProperty('browserAuth');
    expect(subscribeFrame).not.toHaveProperty('ticket');
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
    const snapshotCallsWhileLive = terminalSnapshotCallCount;
    expect(snapshotCallsWhileLive).toBe(1);

    await act(async () => {
      for (const callback of intervalCallbacks.values()) {
        callback();
      }
    });
    expect(terminalSnapshotCallCount).toBe(snapshotCallsWhileLive);

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
    await waitFor(() => {
      expect(terminalSnapshotCallCount).toBeGreaterThan(snapshotCallsWhileLive);
    });

    expect(await screen.findByText('snapshot after stream failure')).toBeTruthy();
    expect(await screen.findByText('Live stream unavailable; showing terminal snapshots')).toBeTruthy();
    expect((await screen.findByTestId('agent-gateway-xterm-output-mode')).textContent).toBe('Snapshot fallback');
  });

  it('keeps the saved terminal snapshot visible when a restored offset has no new stream output', async () => {
    window.sessionStorage.setItem('agentGatewayTerminalOffset:run-id-1', '12');
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, 'run-id-1')) {
        return {
          data: {
            data: {
              ticket: 'ag_stream_page_ticket',
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
      webSocket.protocols?.some((protocol) => protocol.startsWith(TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX)),
    ).toBe(true);
    expect(webSocket.protocols).toHaveLength(2);
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
    expect(JSON.stringify(subscribeFrame)).not.toContain('browser-token');
    expect(subscribeFrame).not.toHaveProperty('browserAuth');
    expect(subscribeFrame).not.toHaveProperty('ticket');
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

  it('does not keep polling or reset the terminal for a completed run with unchanged output', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    const intervalCallbacks = spyOnPageIntervals();
    let terminalSnapshotCallCount = 0;
    let conversationEventsCallCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-completed-stable',
              status: 'succeeded',
              terminalBackend: 'tmux',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              capabilitiesSnapshotJson: {
                terminalOutput: true,
              },
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1')) {
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
      expect(getMockTerminalInstances()).toHaveLength(1);
    });
    const terminal = getMockTerminalInstances()[0];
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
});
