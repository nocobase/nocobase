import {
  formatRunWait,
  runWaitBlocks,
  type RunWaitTranslate,
} from '@nocobase/app-plugin-agents/client/runs';
import type { RunWait } from '@nocobase/app-plugin-agents/shared/runs';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { AgentQueue } from '../../registry/agents/agent-queue/agent-queue';
import { defaultAgentQueueLabels } from '../../registry/agents/agent-queue/labels';
import {
  waitView,
  type AgentQueueFormatWait,
  type AgentQueueItem,
} from '../../registry/agents/agent-queue/model';
import type {
  AgentQueueAgent,
  AgentQueueData,
  AgentQueueWait,
} from '../../registry/agents/agent-queue/types';

const agent: AgentQueueAgent = {
  id: 'coder',
  name: 'Coder',
  avatar: null,
  tool: 'claude',
  archived: false,
  online: true,
  active: 2,
  maxConcurrentRuns: 3,
};

const queued = (wait: AgentQueueWait): AgentQueueItem => ({
  issue: {
    id: 'issue',
    identifier: 'PM-2',
    title: 'Secrets',
    blockedCount: 0,
  },
  entry: {
    agentId: agent.id,
    state: 'queued',
    run: null,
    queue: wait,
    blockedBy: null,
    waiting: null,
    idle: null,
  },
  mine: true,
  forMe: false,
});

const board = (wait: AgentQueueWait): AgentQueueData => {
  const { issue, entry, mine } = queued(wait);
  return {
    rows: [{ ...entry, issue, mine, others: [] }],
    agents: { [agent.id]: agent },
    summary: { runners: { online: 1, busy: 1 } },
    truncated: false,
    generatedAt: '2026-10-09T05:00:00.000Z',
  };
};

const unknown: AgentQueueWait = {
  reason: 'somethingNewer',
  position: 1,
  agentPosition: 1,
};

describe('agent queue waits', () => {
  it('takes the plugin’s wait as it is, and its formatter as a formatWait', () => {
    expectTypeOf<RunWait>().toMatchTypeOf<AgentQueueWait>();
    const t: RunWaitTranslate = (key, options) =>
      key === 'runWait.reasons.secretsNotAllowed'
        ? `team only: ${String(options?.variables)}`
        : String(options?.defaultValue ?? key);
    const formatWait: AgentQueueFormatWait = (wait) => ({
      text: formatRunWait(t, wait),
      blocking: runWaitBlocks(wait),
    });
    expect(
      waitView(
        defaultAgentQueueLabels,
        queued({
          reason: 'secretsNotAllowed',
          position: 1,
          agentPosition: 1,
          params: { variables: ['NPM_TOKEN'] },
        }),
        agent,
        formatWait,
      ),
    ).toEqual({ text: 'team only: NPM_TOKEN', blocking: true });
  });

  it('shows the reason code of a wait nobody words, without failing', () => {
    expect(waitView(defaultAgentQueueLabels, queued(unknown), agent)).toEqual({
      text: 'somethingNewer',
    });
    render(
      <AgentQueue
        data={board(unknown)}
        viewerId={null}
        issueHref={(issue) => `/issues/${issue.identifier}`}
      />,
    );
    expect(screen.getByText('somethingNewer')).toBeInTheDocument();
  });

  it('shows the words and the warning the consumer gives', () => {
    render(
      <AgentQueue
        data={board(unknown)}
        viewerId={null}
        issueHref={(issue) => `/issues/${issue.identifier}`}
        formatWait={(wait) => ({
          text: `Waiting: ${wait.reason}`,
          detail: 'Ask an administrator',
          blocking: true,
        })}
      />,
    );
    const badge = screen.getByText('Waiting: somethingNewer');
    expect(badge.closest('[title]')).toHaveAttribute(
      'title',
      'Ask an administrator',
    );
    expect(badge.closest('[class*="amber"]')).not.toBeNull();
  });

  it('still says what blocks a queued issue', () => {
    expect(
      waitView(
        defaultAgentQueueLabels,
        {
          ...queued(unknown),
          entry: {
            ...queued(unknown).entry,
            blockedBy: [{ issueId: 'b', identifier: 'PM-1', title: 'First' }],
          },
        },
        agent,
      ),
    ).toEqual({ text: 'Blocked by PM-1' });
  });
});
