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
  RESUMABLE_RUN_CAPABILITIES,
  RequestConfig,
  apiUrl,
  renderAgentGatewayPage,
  setupRunsPageTestHooks,
  spyOnPageIntervals,
} from '../testUtils';
import AgentGatewayRunsPage from '../../../pages/AgentGatewayRunsPage';

describe('Agent Gateway runs resume messages', () => {
  setupRunsPageTestHooks();

  it('resumes a completed Codex session and opens the continuation run with session timeline', async () => {
    const randomUUIDSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('resume-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('resume-key-2' as `${string}-${string}-${string}-${string}-${string}`);
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-source',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                provider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
              {
                id: 'run-id-2',
                runCode: 'run-resume-child',
                status: 'queued',
                agentSessionId: 'session-id-1',
                provider: 'codex',
                agentSessionProviderId: 'thread-id-1',
                parentRunId: 'run-id-1',
                resumedFromRunId: 'run-id-1',
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
              runCode: 'run-resume-source',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              finishedAt: '2026-07-02T10:00:00.000Z',
              capabilitiesSnapshotJson: RESUMABLE_RUN_CAPABILITIES,
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
                readSessionMessages: true,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-2')) {
        return {
          data: {
            data: {
              id: 'run-id-2',
              runCode: 'run-resume-child',
              status: 'queued',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              parentRunId: 'run-id-1',
              resumedFromRunId: 'run-id-1',
              continuationReason: 'user-message',
              capabilitiesSnapshotJson: RESUMABLE_RUN_CAPABILITIES,
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
                readSessionMessages: true,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, 'session-id-1')) {
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
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, 'session-id-1'),
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-switch-source',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                provider: 'codex',
                agentSessionProviderId: 'thread-id-1',
              },
              {
                id: 'run-id-2',
                runCode: 'run-switch-target',
                status: 'succeeded',
                agentSessionId: 'session-id-2',
                provider: 'codex',
                agentSessionProviderId: 'thread-id-2',
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
              runCode: 'run-switch-source',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              capabilitiesSnapshotJson: RESUMABLE_RUN_CAPABILITIES,
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
                readSessionMessages: true,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-2')) {
        return await new Promise((resolve) => {
          resolveRunTwoDetails = resolve;
        });
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1')) {
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
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents, 'run-id-2') ||
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-2')
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
            provider: 'codex',
            agentSessionProviderId: 'thread-id-2',
            capabilitiesSnapshotJson: RESUMABLE_RUN_CAPABILITIES,
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-retry',
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
              runCode: 'run-resume-retry',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              capabilitiesSnapshotJson: RESUMABLE_RUN_CAPABILITIES,
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
              },
            },
          },
        };
      }
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, 'session-id-1')) {
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
      .filter((config) => config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, 'session-id-1'));
    expect(resumeCalls.map((config) => config.data?.idempotencyKey)).toEqual(['retry-key-1', 'retry-key-1']);
  });

  it('generates a new resume idempotency key when the message changes after a transient failure', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('retry-change-key-1' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('retry-change-key-2' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('retry-change-key-3' as `${string}-${string}-${string}-${string}-${string}`);
    let resumeAttempts = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-retry-change',
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
              runCode: 'run-resume-retry-change',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              capabilitiesSnapshotJson: RESUMABLE_RUN_CAPABILITIES,
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
              },
            },
          },
        };
      }
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, 'session-id-1')) {
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
      .filter((config) => config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, 'session-id-1'));
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-validation',
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
              runCode: 'run-resume-validation',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              capabilitiesSnapshotJson: RESUMABLE_RUN_CAPABILITIES,
              agentGatewayActionPermissionsJson: {
                resumeAgentSession: true,
              },
            },
          },
        };
      }
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, 'session-id-1')) {
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
      .filter((config) => config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, 'session-id-1'));
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-generic-no-resume',
                status: 'succeeded',
                provider: 'generic-cli',
                capabilitiesSnapshotJson: genericCapabilities,
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-generic-no-resume',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              provider: 'generic-cli',
              agentSessionProviderId: 'thread-id-1',
              provider: 'generic-cli',
              capabilitiesSnapshotJson: genericCapabilities,
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-resume-disabled',
                status: 'succeeded',
                agentSessionId: 'session-id-1',
                provider: 'codex',
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-resume-disabled',
              status: 'succeeded',
              terminalStatus: 'closed',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              agentSessionProviderId: 'thread-id-1',
              agentSessionCapabilitiesJson: {
                resumeWithMessage: false,
              },
              capabilitiesSnapshotJson: RESUMABLE_RUN_CAPABILITIES,
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
});
