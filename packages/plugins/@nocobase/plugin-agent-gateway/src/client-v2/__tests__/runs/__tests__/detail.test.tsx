/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiPath } from '../../../../shared/apiContract';
import {
  RequestConfig,
  apiUrl,
  renderAgentGatewayPage,
  setupRunsPageTestHooks,
  spyOnPageIntervals,
} from '../testUtils';
import AgentGatewayRunsPage from '../../../pages/AgentGatewayRunsPage';

describe('Agent Gateway runs detail', () => {
  setupRunsPageTestHooks();

  it('shows a live waiting state when a running run has no task messages yet', async () => {
    let resolveConversationEvents: (value: unknown) => void = () => {};
    const conversationEventsResponse = new Promise((resolve) => {
      resolveConversationEvents = resolve;
    });
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-empty')) {
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
              capabilitiesSnapshotJson: {
                artifacts: false,
                structuredEvents: false,
                terminalOutput: false,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents, 'run-id-empty')) {
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

  it('opens associated task template and skill details from the runs table links', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-link',
                runCode: 'run-link-1',
                taskTitle: 'Build linked app',
                status: 'succeeded',
                taskTemplateId: 'template-id-link',
                taskTemplateJson: {
                  id: 'template-id-link',
                  templateKey: 'linked-template',
                  displayName: 'Linked task template',
                  skillVersionIds: ['skill-version-id-link'],
                  skills: [
                    {
                      id: 'skill-version-id-link',
                      skillKey: 'nb-opencode-ui-batch',
                      displayName: 'NB OpenCode UI Batch',
                      versionLabel: 'local',
                      status: 'active',
                    },
                  ],
                },
              },
            ],
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-link')) {
        return {
          data: {
            data: {
              id: 'run-id-link',
              runCode: 'run-link-1',
              taskTitle: 'Build linked app',
              status: 'succeeded',
              agentGatewayActionPermissionsJson: {},
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTaskTemplate, 'template-id-link')) {
        return {
          data: {
            data: {
              id: 'template-id-link',
              templateKey: 'linked-template',
              displayName: 'Linked task template',
              description: 'Linked task template description',
              status: 'active',
              defaultTitle: 'Build linked app',
              defaultPrompt: 'Build the linked app',
              cwd: '/srv/nocobase',
              skillVersionIdsJson: ['skill-version-id-link'],
              artifactsJson: [],
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getSkillVersion, 'skill-version-id-link')) {
        return {
          data: {
            data: {
              id: 'skill-version-id-link',
              skillVersionId: 'skill-version-id-link',
              skillId: 'skill-id-link',
              skillKey: 'nb-opencode-ui-batch',
              displayName: 'NB OpenCode UI Batch',
              versionLabel: 'local',
              status: 'active',
              sourceType: 'zip',
            },
          },
        };
      }

      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);

    expect(await screen.findByText('Build linked app')).toBeTruthy();
    expect(screen.queryByText('Actions')).toBeNull();

    fireEvent.click(screen.getByText('Linked task template'));
    expect(window.location.pathname).toBe('/admin/settings/agent-gateway/runs');
    expect(new URLSearchParams(window.location.search).get('templateId')).toBe('template-id-link');
    expect(await screen.findByText('Linked task template description')).toBeTruthy();
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.getTaskTemplate, 'template-id-link'),
          method: 'get',
        }),
      );
    });

    await act(async () => {
      window.history.pushState({}, '', '/admin/settings/agent-gateway/runs');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    fireEvent.click(screen.getByText('NB OpenCode UI Batch / local'));
    expect(window.location.pathname).toBe('/admin/settings/agent-gateway/runs');
    expect(new URLSearchParams(window.location.search).get('skillVersionId')).toBe('skill-version-id-link');
    expect(await screen.findByText('skill-id-link')).toBeTruthy();
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.getSkillVersion, 'skill-version-id-link'),
          method: 'get',
        }),
      );
    });

    await act(async () => {
      window.history.pushState({}, '', '/admin/settings/agent-gateway/runs');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    fireEvent.click(screen.getByText('Build linked app'));
    expect(window.location.pathname).toBe('/admin/settings/agent-gateway/runs');
    expect(new URLSearchParams(window.location.search).get('runId')).toBe('run-id-link');
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-link'),
          method: 'get',
        }),
      );
    });
  });

  it('refreshes the Summary task timeline while a run is still active', async () => {
    const intervalCallbacks = spyOnPageIntervals();
    let conversationEventsCallCount = 0;
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-live')) {
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
              capabilitiesSnapshotJson: {
                artifacts: false,
                structuredEvents: false,
                terminalOutput: false,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents, 'run-id-live')) {
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-task')) {
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
              capabilitiesSnapshotJson: {
                artifacts: false,
                structuredEvents: false,
                terminalOutput: false,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents, 'run-id-task')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-empty')) {
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
        url: apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents, 'run-id-task'),
        method: 'get',
      }),
    );
  });

  it('lists runs, shows observation details, and requests cancel for active runs', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-build-1',
                status: 'importing',
                nodeId: 'node-id-1',
                agentProfileId: 'profile-id-1',
                runnerStatusJson: {
                  nodeKey: 'local-codex',
                  profileKey: 'codex',
                  profileProvider: 'codex-cli',
                },
                agentSessionId: 'session-id-1',
                provider: 'codex',
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.cancelRun, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-build-1',
              status: 'running',
              nodeId: 'node-id-1',
              agentProfileId: 'profile-id-1',
              agentSessionId: 'session-id-1',
              provider: 'codex',
              capabilitiesSnapshotJson: {
                structuredEvents: true,
                terminalOutput: true,
                resumeSession: true,
                liveSemanticMessage: false,
                stdinMessage: false,
                interrupt: true,
                terminate: true,
                artifacts: true,
                detectSessionId: true,
                resumeWithMessage: true,
              },
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
                cancelRun: true,
                readSessionMessages: true,
                readTerminal: true,
                readArtifacts: true,
                readRawLogs: true,
              },
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1')) {
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
                contentJson: {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, 'run-id-1')) {
        return {
          data: {
            data: [
              {
                id: 'artifact-id-1',
                artifactKey: 'stdout',
                artifactType: 'log',
                mimeType: 'text/plain',
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
                metadataJson: {
                  artifactGroupLabel: 'Screenshots',
                  relativePath: 'runs/nb-opencode-ui-batch/run-1/browser-screenshots/overview.png',
                },
              },
            ],
            meta: {
              count: 2,
              page: 1,
              pageSize: 20,
              totalPage: 1,
            },
          },
        };
      }

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent, 'run-id-1') &&
        config.params?.artifactId === 'artifact-id-1'
      ) {
        return {
          data: {
            data: {
              id: 'artifact-id-1',
              contentText: 'inline artifact text',
            },
          },
        };
      }

      if (
        config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent, 'run-id-1') &&
        config.params?.artifactId === 'artifact-id-2'
      ) {
        return {
          data: {
            data: {
              id: 'artifact-id-2',
              contentText:
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
            },
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs, 'run-id-1')) {
        return {
          data: {
            data: [
              {
                id: 'api-log-id-1',
                method: 'POST',
                path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendRunEvents, 'run-id-1'),
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
                path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, 'run-id-1'),
                statusCode: 200,
                durationMs: 3,
                createdAt: '2026-06-30T10:01:03.000Z',
              },
              {
                id: 'api-log-heartbeat-2',
                method: 'POST',
                path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, 'run-id-1'),
                statusCode: 200,
                durationMs: 5,
                createdAt: '2026-06-30T10:01:13.000Z',
              },
            ],
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
    expect(await screen.findByText('importing')).toBeTruthy();
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
    expect(screen.queryByText('Actions')).toBeNull();

    const detailButtons = await screen.findAllByLabelText('View run details');
    fireEvent.click(detailButtons[0]);
    expect(new URLSearchParams(window.location.search).get('runId')).toBe('run-id-1');

    const cancelButtons = await screen.findAllByLabelText('Cancel run');
    expect(cancelButtons).toHaveLength(1);
    fireEvent.click(cancelButtons[0]);
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: apiUrl(AGENT_GATEWAY_API_ACTIONS.cancelRun, 'run-id-1'),
          method: 'post',
        }),
      );
    });

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
    expect(getRequestedUrls()).not.toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1'));
    expect(getRequestedUrls()).not.toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, 'run-id-1'));
    expect(getRequestedUrls()).not.toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots, 'run-id-1'));
    expect(getRequestedUrls()).not.toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs, 'run-id-1'));

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
    expect(getRequestedUrls()).toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1'));
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1'),
        params: expect.objectContaining({ pageSize: 100 }),
      }),
    );
    expect(await screen.findByText('Harness stages')).toBeTruthy();
    expect(await screen.findByText('render_run / started')).toBeTruthy();
    expect(await screen.findAllByText('rerendering report')).not.toHaveLength(0);
    expect(screen.queryByText('heartbeat noise should stay collapsed')).toBeNull();
    fireEvent.click(await screen.findByText('Heartbeat event details'));
    expect(await screen.findByText('heartbeat noise should stay collapsed')).toBeTruthy();

    fireEvent.click(await screen.findByRole('tab', { name: 'Artifacts' }));
    expect(await screen.findByRole('tab', { name: 'Screenshots (1)' })).toBeTruthy();
    expect(getRequestedUrls()).toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, 'run-id-1'));
    expect(getRequestedUrls()).toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots, 'run-id-1'));
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, 'run-id-1'),
        params: { page: 1, pageSize: 20 },
      }),
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots, 'run-id-1'),
        params: { page: 1, pageSize: 20 },
      }),
    );
    expect(getRequestedUrls()).not.toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent, 'run-id-1'));
    fireEvent.click(await screen.findByText('Preview'));
    expect(await screen.findByText('Image artifact preview')).toBeTruthy();
    expect(getRequestedUrls()).toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent, 'run-id-1'));
    expect(screen.getByAltText('browser-screenshot').getAttribute('src')).toContain('data:image/png;base64,');
    fireEvent.click(await screen.findByText('Preview'));
    fireEvent.click(await screen.findByText('Preview'));
    await screen.findByText('Image artifact preview');
    expect(
      getRequestedUrls().filter((url) => url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent, 'run-id-1')),
    ).toHaveLength(1);
    fireEvent.click(await screen.findByRole('tab', { name: 'Logs (1)' }));
    fireEvent.click(await screen.findByText('Preview'));
    expect(await screen.findByText('inline artifact text')).toBeTruthy();
    expect(await screen.findByText(/"files":/)).toBeTruthy();

    fireEvent.click(await screen.findByRole('tab', { name: 'API Logs' }));
    expect(
      await screen.findByText(getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendRunEvents, 'run-id-1')),
    ).toBeTruthy();
    expect(getRequestedUrls()).toContain(apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs, 'run-id-1'));
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs, 'run-id-1'),
        params: { page: 1, pageSize: 20 },
      }),
    );
    expect(await screen.findByText('Heartbeat summary')).toBeTruthy();
    expect(await screen.findByText('Heartbeat calls: 2')).toBeTruthy();
    expect(screen.queryByText(getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, 'run-id-1'))).toBeNull();
    fireEvent.click(await screen.findByText('Heartbeat details'));
    expect(
      await screen.findAllByText(getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, 'run-id-1')),
    ).toHaveLength(2);
    expect(screen.queryByText(/must-not-render/)).toBeNull();
    expect(screen.queryByText(/https:\/\/daemon\.example\/artifact/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('runId')).toBeNull();
    });
  });

  it('loads artifact pages from the server when detail pagination changes', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [{ id: 'run-id-1', runCode: 'run-artifact-pages', status: 'succeeded' }],
          },
        };
      }
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
        return {
          data: {
            data: {
              id: 'run-id-1',
              runCode: 'run-artifact-pages',
              status: 'succeeded',
              agentGatewayActionPermissionsJson: {
                readArtifacts: true,
              },
              capabilitiesSnapshotJson: {
                artifacts: true,
              },
            },
          },
        };
      }
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, 'run-id-1')) {
        const page = Number(config.params?.page || 1);
        return {
          data: {
            data: [
              {
                id: `artifact-page-${page}`,
                artifactKey: `artifact-page-${page}`,
                artifactType: 'log',
                mimeType: 'text/plain',
              },
            ],
            meta: {
              count: 21,
              page,
              pageSize: 20,
              totalPage: 2,
            },
          },
        };
      }
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots, 'run-id-1')) {
        return {
          data: {
            data: [],
            meta: {
              count: 0,
              page: 1,
              pageSize: 20,
              totalPage: 0,
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    fireEvent.click(await screen.findByRole('tab', { name: 'Artifacts' }));
    expect(await screen.findByText(/artifact-page-1 \/ log \/ text\/plain/)).toBeTruthy();

    const artifactsPanel = screen.getByText('Artifacts: 21').closest('.ant-space-vertical');
    expect(artifactsPanel).toBeTruthy();
    const enabledNextButton = artifactsPanel?.querySelector<HTMLButtonElement>(
      '.ant-pagination-next:not(.ant-pagination-disabled) button',
    );
    expect(enabledNextButton).toBeTruthy();
    fireEvent.click(enabledNextButton as HTMLButtonElement);

    expect(await screen.findByText(/artifact-page-2 \/ log \/ text\/plain/)).toBeTruthy();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, 'run-id-1'),
        params: { page: 2, pageSize: 20 },
      }),
    );
  });
});
