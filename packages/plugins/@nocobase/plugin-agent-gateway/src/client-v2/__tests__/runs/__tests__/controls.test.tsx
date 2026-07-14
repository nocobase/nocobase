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
import { TERMINAL_PROTOCOL } from '../../../../shared/terminalStreamProtocol';
import {
  FakeBrowserWebSocket,
  RequestConfig,
  apiUrl,
  renderAgentGatewayPage,
  setupRunsPageTestHooks,
} from '../testUtils';
import AgentGatewayRunsPage from '../../../pages/AgentGatewayRunsPage';

describe('Agent Gateway runs controls', () => {
  setupRunsPageTestHooks();

  it('disables terminal controls without server-provided control action permission and capability', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
              capabilitiesSnapshotJson: {
                interrupt: false,
                terminalOutput: true,
                terminate: false,
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

  it('sends terminal control requests with stable idempotency keys and shows final ack state', async () => {
    vi.stubGlobal('WebSocket', FakeBrowserWebSocket);
    let controlAccepted = false;
    let controlStatusPollCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
              capabilitiesSnapshotJson: {
                interrupt: true,
                terminalOutput: true,
                terminate: true,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1')) {
        const error = new Error('events forbidden') as Error & { response?: { status: number } };
        error.response = { status: 403 };
        throw error;
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, 'run-id-1')) {
        return {
          data: {
            data: {
              ticket: 'control-stream-ticket',
              runId: 'run-id-1',
            },
          },
        };
      }

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus, 'run-id-1') &&
        config.params?.requestId === 'control-request-1'
      ) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1')) {
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

    await waitFor(() => expect(FakeBrowserWebSocket.instances).toHaveLength(1));
    const webSocket = FakeBrowserWebSocket.instances[0];
    webSocket.dispatch('open');
    const subscribeFrame = JSON.parse(webSocket.sent[0]) as Record<string, unknown>;
    webSocket.dispatch('message', {
      data: JSON.stringify({
        type: 'ack',
        protocol: TERMINAL_PROTOCOL,
        requestId: subscribeFrame.requestId,
      }),
    });

    fireEvent.click(screen.getByLabelText('Interrupt'));

    let interruptCall: RequestConfig | undefined;
    await waitFor(() => {
      interruptCall = request.mock.calls
        .map(([config]) => config)
        .find((config) => config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1'));
      expect(interruptCall).toBeTruthy();
    });
    expect(interruptCall).toEqual(
      expect.objectContaining({
        url: apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1'),
        method: 'post',
        data: expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^ag_control:interrupt:run-id-1:.+/),
        }),
      }),
    );
    await waitFor(() => {
      expect(
        webSocket.sent
          .map((frame) => JSON.parse(frame) as Record<string, unknown>)
          .find((frame) => {
            return frame.type === 'browser.controlNotify';
          }),
      ).toMatchObject({
        type: 'browser.controlNotify',
        protocol: TERMINAL_PROTOCOL,
        runId: 'run-id-1',
        controlRequestId: 'control-request-1',
      });
    });
    const controlNotifyFrame = webSocket.sent
      .map((frame) => JSON.parse(frame) as Record<string, unknown>)
      .find((frame) => frame.type === 'browser.controlNotify');
    expect(Object.keys(controlNotifyFrame || {}).sort()).toEqual(
      ['controlRequestId', 'protocol', 'requestId', 'runId', 'type'].sort(),
    );
    await waitFor(() => {
      expect(screen.queryByText('Control request ID: control-request-1')).toBeNull();
    });
    await waitFor(() => {
      expect(
        request.mock.calls
          .map(([config]) => config.url)
          .filter((url) => url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus, 'run-id-1')),
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-2')
      ) {
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
              capabilitiesSnapshotJson: {
                interrupt: true,
                terminalOutput: true,
                terminate: true,
              },
            },
          },
        };
      }

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-2')
      ) {
        return { data: { data: [] } };
      }

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-2')
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1')) {
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
        .filter((url) => url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus, 'run-id-2')),
    ).toHaveLength(0);
  });

  it('reuses a pending terminate idempotency key and shows failed final ack state', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('terminate-pending-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('terminate-pending-key-2' as `${string}-${string}-${string}-${string}-${string}`);
    let terminateAttempts = 0;
    let controlStatusPollCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
              output: 'terminate control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: false,
            },
          },
        };
      }

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus, 'run-id-1') &&
        config.params?.requestId === 'control-request-terminate'
      ) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.terminateTerminal, 'run-id-1')) {
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
      .filter((config) => config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.terminateTerminal, 'run-id-1'));
    const idempotencyKeys = terminateCalls.map((config) => config.data?.idempotencyKey);
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toBe(idempotencyKeys[1]);
    expect(idempotencyKeys[0]).toMatch(/^ag_control:terminate:run-id-1:/);
    expect(await screen.findByText('Control request failed', {}, { timeout: 7000 })).toBeTruthy();
  });

  it('hides terminal controls for completed runs even when control actions are present', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
              output: 'retry control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: true,
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1')) {
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
      .filter((config) => config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1'));
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
              output: 'validation key control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: true,
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1')) {
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
      .filter((config) => config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1'))
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
              output: 'final key control output',
              capturedAt: '2026-07-02T10:01:02.000Z',
              inputEnabled: true,
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1')) {
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
      .filter((config) => config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, 'run-id-1'))
      .map((config) => config.data?.idempotencyKey);
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toMatch(/^ag_control:interrupt:run-id-1:/);
    expect(idempotencyKeys[1]).toMatch(/^ag_control:interrupt:run-id-1:/);
    expect(idempotencyKeys[1]).not.toBe(idempotencyKeys[0]);
  });
});
