import {
  RUN_WAIT_REASONS,
  type RunWait,
} from '@nocobase/app-plugin-agents/shared/runs';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  defaultAgentQueueLabels,
  type AgentQueueLabels,
} from '../../registry/agents/agent-queue/labels.js';
import {
  isBlockingWait,
  waitText,
  type AgentQueueItem,
} from '../../registry/agents/agent-queue/model.js';
import type {
  AgentQueueAgent,
  AgentQueueWait,
} from '../../registry/agents/agent-queue/types.js';

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

const item: AgentQueueItem = {
  issue: {
    id: 'issue',
    identifier: 'PM-68',
    title: 'Tool limits',
    blockedCount: 0,
  },
  entry: {
    agentId: agent.id,
    state: 'queued',
    run: null,
    queue: {
      reason: 'toolSlotsFull',
      tool: 'claude',
      position: 1,
      agentPosition: 1,
      missing: [],
    },
    blockedBy: null,
    waiting: null,
    idle: null,
  },
  mine: true,
  forMe: false,
};

describe('agent queue tool slots', () => {
  it('accepts the plugin wait shape, including every wait reason', () => {
    expectTypeOf<RunWait>().toMatchTypeOf<AgentQueueWait>();
    for (const reason of RUN_WAIT_REASONS)
      expect(defaultAgentQueueLabels.queue.reasons).toHaveProperty(reason);
  });

  it('uses an English fallback when existing translations lack the new reason', () => {
    const { toolSlotsFull: _newReason, ...reasons } =
      defaultAgentQueueLabels.queue.reasons;
    const labels: AgentQueueLabels = {
      ...defaultAgentQueueLabels,
      queue: { ...defaultAgentQueueLabels.queue, reasons },
    };
    expect(waitText(labels, item, agent, 'en')).toBe(
      'Every fitting runtime has its claude slots full',
    );
    expect(isBlockingWait(item)).toBe(false);
  });

  it('uses a translated tool limit reason separately from overall runtime capacity', () => {
    const labels: AgentQueueLabels = {
      ...defaultAgentQueueLabels,
      queue: {
        ...defaultAgentQueueLabels.queue,
        reasons: {
          ...defaultAgentQueueLabels.queue.reasons,
          toolSlotsFull: '{tool} 的并发槽位已满',
          runnersBusy: '机器槽位已满',
        },
      },
    };
    expect(waitText(labels, item, agent, 'zh-CN')).toBe(
      'claude 的并发槽位已满',
    );
    expect(
      waitText(
        labels,
        {
          ...item,
          entry: {
            ...item.entry,
            queue: { ...item.entry.queue!, reason: 'runnersBusy' },
          },
        },
        agent,
        'zh-CN',
      ),
    ).toBe('机器槽位已满');
  });
});
