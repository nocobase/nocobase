/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AGENT_GATEWAY_API_ACTIONS } from '../../../../shared/apiContract';
import { AgentTimeline } from '../../../components/AgentTimeline';
import {
  RequestConfig,
  apiUrl,
  renderAgentGatewayPage,
  setupRunsPageTestHooks,
  spyOnPageIntervals,
} from '../testUtils';
import AgentGatewayRunsPage from '../../../pages/AgentGatewayRunsPage';

describe('Agent Gateway runs conversation and timeline', () => {
  setupRunsPageTestHooks();

  it('does not promote legacy run events into the primary timeline while a normalized run is active', async () => {
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1')) {
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1')) {
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-failed-command-timeline',
                status: 'failed',
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
              runCode: 'run-failed-command-timeline',
              status: 'failed',
              agentSessionId: 'session-id-1',
              provider: 'codex',
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1')) {
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
        <AgentTimeline t={(key) => key} events={events} />
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-timeline-empty-regression',
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
              runCode: 'run-timeline-empty-regression',
              status: 'running',
              agentSessionId: 'session-id-1',
              provider: 'codex',
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1')) {
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

  it('polls conversation deltas by cursor and prepends older messages without duplicates', async () => {
    const intervalCallbacks = spyOnPageIntervals();
    const conversationRequests: RequestConfig[] = [];
    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-cursor-timeline',
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
              runCode: 'run-cursor-timeline',
              status: 'running',
              agentGatewayActionPermissionsJson: {
                readSessionMessages: true,
              },
            },
          },
        };
      }
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents, 'run-id-1')) {
        conversationRequests.push(config);
        if (config.params?.beforeCursor === 'before-1') {
          return {
            data: {
              data: [
                {
                  id: 'event-older',
                  source: 'codex',
                  sequence: 1,
                  eventType: 'agent.message',
                  contentText: 'older cursor message',
                  createdAt: '2026-06-30T10:00:00.000Z',
                },
              ],
              meta: {
                pageSize: 100,
                hasMoreBefore: false,
                hasMoreAfter: true,
              },
            },
          };
        }
        if (config.params?.afterCursor === 'after-1') {
          return {
            data: {
              data: [
                {
                  id: 'event-current',
                  source: 'codex',
                  sequence: 2,
                  eventType: 'agent.message',
                  contentText: 'current cursor message',
                  createdAt: '2026-06-30T10:00:01.000Z',
                },
                {
                  id: 'event-delta',
                  source: 'cloud-code',
                  sequence: 0,
                  eventType: 'agent.message',
                  contentText: 'delta cursor message',
                  createdAt: '2026-06-30T10:00:02.000Z',
                },
              ],
              meta: {
                pageSize: 100,
                afterCursor: 'after-2',
                hasMoreBefore: true,
                hasMoreAfter: false,
              },
            },
          };
        }
        return {
          data: {
            data: [
              {
                id: 'event-current',
                source: 'codex',
                sequence: 2,
                eventType: 'agent.message',
                contentText: 'current cursor message',
                createdAt: '2026-06-30T10:00:01.000Z',
              },
            ],
            meta: {
              pageSize: 100,
              beforeCursor: 'before-1',
              afterCursor: 'after-1',
              hasMoreBefore: true,
              hasMoreAfter: false,
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    renderAgentGatewayPage(AgentGatewayRunsPage, request);
    fireEvent.click((await screen.findAllByLabelText('View run details'))[0]);
    expect(await screen.findByText('current cursor message')).toBeTruthy();

    fireEvent.click(await screen.findByRole('button', { name: 'Load older messages' }));
    expect(await screen.findByText('older cursor message')).toBeTruthy();
    expect(conversationRequests.some((config) => config.params?.beforeCursor === 'before-1')).toBe(true);

    await act(async () => {
      for (const callback of intervalCallbacks.values()) {
        callback();
      }
    });
    expect(await screen.findByText('delta cursor message')).toBeTruthy();
    expect(conversationRequests.some((config) => config.params?.afterCursor === 'after-1')).toBe(true);
    expect(screen.getAllByText('current cursor message')).toHaveLength(1);
  });

  it('keeps the last successful normalized timeline when polling temporarily fails', async () => {
    let conversationEventCallCount = 0;
    const intervalCallbacks = spyOnPageIntervals();

    const request = vi.fn(async (config: RequestConfig) => {
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-timeline-retry',
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
              runCode: 'run-timeline-retry',
              status: 'running',
              agentSessionId: 'session-id-1',
              provider: 'codex',
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, 'session-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRunEvents, 'run-id-1')) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, 'run-id-1')) {
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
        return {
          data: {
            data: [
              {
                id: 'run-id-1',
                runCode: 'run-refresh-1',
                status: runDetailsCallCount > 1 ? 'succeeded' : 'running',
                agentSessionId: runDetailsCallCount > 1 ? 'session-id-2' : null,
                provider: runDetailsCallCount > 1 ? 'codex' : null,
                agentSessionProviderId: runDetailsCallCount > 1 ? 'thread-id-2' : null,
              },
            ],
          },
        };
      }

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
              provider: completed ? 'codex' : null,
              agentSessionProviderId: completed ? 'thread-id-2' : null,
              requestedAt: '2026-06-30T10:00:00.000Z',
              startedAt: '2026-06-30T10:01:00.000Z',
              finishedAt: completed ? '2026-06-30T10:02:00.000Z' : null,
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
      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns)) {
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

      if (config.url === apiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run-id-1')) {
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
});
