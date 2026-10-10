// @vitest-environment node
import type { RunWait } from '@nocobase/app-plugin-agents/shared/runs';
import { describe, expect, it } from 'vitest';

import { issuesEnUS, issuesZhCN } from '../../client/issues/locales.js';
import {
  agentQueueLanes,
  agentQueueTotals,
  elapsed,
  laneState,
  waitingForNames,
  waitView,
} from '../../client/extensions/nocobase-agent-queue/model.js';
import type {
  AgentBoard,
  AgentBoardAgent,
  AgentBoardEntry,
  AgentBoardRow,
} from '../../shared/agent-board.js';

const labels = issuesEnUS.agentQueue;

const wait = (patch: Partial<RunWait>): RunWait => ({
  reason: 'next',
  position: 1,
  agentPosition: 1,
  until: null,
  tool: null,
  missing: [],
  detail: null,
  ...patch,
});

const agent = (
  id: string,
  patch: Partial<AgentBoardAgent> = {},
): AgentBoardAgent => ({
  id,
  name: id,
  avatar: null,
  tool: 'claude',
  model: null,
  models: ['claude'],
  archived: false,
  online: true,
  active: 0,
  maxConcurrentRuns: 2,
  ...patch,
});

const entry = (
  agentId: string,
  state: AgentBoardEntry['state'],
  patch: Partial<AgentBoardEntry> = {},
): AgentBoardEntry => ({
  agentId,
  state,
  run: null,
  queue: null,
  blockedBy: null,
  waiting: null,
  ...patch,
});

const row = (
  identifier: string,
  value: AgentBoardEntry,
  patch: Partial<AgentBoardRow> = {},
): AgentBoardRow =>
  ({
    ...value,
    issue: { id: identifier, identifier, title: identifier, blockedCount: 0 },
    others: [],
    mine: false,
    ...patch,
  }) as AgentBoardRow;

const board = (
  rows: AgentBoardRow[],
  agents: AgentBoardAgent[],
): Pick<AgentBoard, 'rows' | 'agents'> => ({
  rows,
  agents: Object.fromEntries(agents.map((item) => [item.id, item])),
});

describe('the agent queue', () => {
  it('puts each agent’s issues in queue order: running, then queued by claim order, waiting and idle apart', () => {
    const lanes = agentQueueLanes(
      board(
        [
          row(
            'PM-3',
            entry('a', 'queued', { queue: wait({ agentPosition: 2 }) }),
          ),
          row('PM-1', entry('a', 'working')),
          row(
            'PM-2',
            entry('a', 'queued', { queue: wait({ agentPosition: 1 }) }),
          ),
          row('PM-4', entry('a', 'queued', { blockedBy: [] })),
          row('PM-5', entry('a', 'idle')),
        ],
        [agent('a')],
      ),
    );
    const [lane] = lanes;
    expect(lane?.running.map((item) => item.issue.identifier)).toEqual([
      'PM-1',
    ]);
    expect(lane?.next.map((item) => item.issue.identifier)).toEqual([
      'PM-2',
      'PM-3',
      'PM-4',
    ]);
    expect(lane?.idle.map((item) => item.issue.identifier)).toEqual(['PM-5']);
    expect(lane && laneState(lane)).toBe('working');
  });

  it('orders lanes by activity, keeps idle agents, and with "only mine" keeps the viewer’s', () => {
    const data = board(
      [
        row('PM-1', entry('busy', 'working')),
        row(
          'PM-2',
          entry('waiting', 'waiting', {
            waiting: {
              kind: 'question',
              since: null,
              waitingFor: [{ userId: 'me', name: 'Me' }],
              viewerDecides: true,
              path: '/issues/PM-2',
              detail: null,
            },
          }),
        ),
        row('PM-3', entry('queued', 'queued', { queue: wait({}) }), {
          mine: true,
        }),
      ],
      [agent('idle'), agent('waiting'), agent('queued'), agent('busy')],
    );
    expect(agentQueueLanes(data).map((lane) => lane.agent.id)).toEqual([
      'busy',
      'queued',
      'waiting',
      'idle',
    ]);
    const mine = agentQueueLanes(data, { onlyMine: true });
    expect(mine.map((lane) => lane.agent.id)).toEqual(['queued', 'waiting']);
    expect(agentQueueTotals(mine)).toEqual({
      running: 0,
      queued: 1,
      waitingForMe: 1,
    });
    expect(waitingForNames(labels, mine[1]!.waiting[0]!, 'me')).toBe('you');
  });

  it('delegates run waits, keeps issue blockers, and measures elapsed time', () => {
    const [lane] = agentQueueLanes(
      board(
        [
          row(
            'PM-1',
            entry('a', 'queued', {
              queue: wait({ reason: 'concurrencyFull' }),
            }),
          ),
          row(
            'PM-2',
            entry('a', 'queued', {
              blockedBy: [{ issueId: 'x', identifier: 'PM-12', title: 'x' }],
            }),
          ),
          row(
            'PM-3',
            entry('a', 'queued', {
              queue: wait({ reason: 'toolSlotsFull', tool: 'claude' }),
            }),
          ),
        ],
        [agent('a', { maxConcurrentRuns: 3 })],
      ),
    );
    expect(
      lane!.next.map((item) => waitView(labels, item, lane!.agent)),
    ).toEqual([
      { text: 'concurrencyFull' },
      { text: 'toolSlotsFull' },
      { text: 'Blocked by PM-12' },
    ]);
    expect(
      waitView(issuesZhCN.agentQueue, lane!.next[2]!, lane!.agent),
    ).toEqual({ text: '被 PM-12 阻塞' });
    expect(
      waitView(labels, lane!.next[1]!, lane!.agent, (wait, agent) => ({
        text: `${wait.tool}: ${agent.name}`,
        blocking: false,
      })),
    ).toEqual({ text: 'claude: a', blocking: false });
    const now = Date.parse('2026-10-03T10:00:00Z');
    expect(elapsed('2026-10-03T09:55:53Z', 'en', now)).toBe('4:07');
    expect(elapsed('2026-10-03T07:55:00Z', 'en', now)).toBe('2 hr 5 min');
  });
});
