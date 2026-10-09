import { useState, type ReactElement } from 'react';

import { AgentQueue } from '#extensions/nocobase-agent-queue/agent-queue';
import type {
  AgentQueueData,
  AgentQueueEntry,
  AgentQueueRow,
} from '#extensions/nocobase-agent-queue/types';

const VIEWER = 'u-me';
const ago = (seconds: number) =>
  new Date(Date.now() - seconds * 1000).toISOString();

const entry = (
  agentId: string,
  state: AgentQueueEntry['state'],
  patch: Partial<AgentQueueEntry> = {},
): AgentQueueEntry => ({
  agentId,
  state,
  run: null,
  queue: null,
  blockedBy: null,
  waiting: null,
  idle: null,
  ...patch,
});

const row = (
  id: number,
  title: string,
  mine: boolean,
  value: AgentQueueEntry,
): AgentQueueRow => ({
  ...value,
  issue: { id: `i${id}`, identifier: `PM-${id}`, title, blockedCount: 0 },
  others: [],
  mine,
});

const run = (since: number, runnerName: string, text: string) => ({
  id: `r-${since}`,
  status: 'running' as const,
  since: ago(since),
  runnerName,
  lastActivity: { type: 'toolUse', tool: 'Edit', text },
  attempt: 1,
  maxAttempts: 3,
});

const wait = (
  reason: 'noRunnerOnline' | 'concurrencyFull' | 'next',
  agentPosition: number,
) => ({
  reason,
  position: reason === 'next' ? agentPosition : null,
  agentPosition,
  until: null,
  tool: null,
  missing: [],
});

/** A static board: two busy agents, one waiting on people, one idle and offline. */
const DEMO_DATA: AgentQueueData = {
  agents: {
    code: {
      id: 'code',
      name: 'Code Agent',
      avatar: null,
      tool: 'claude',
      archived: false,
      online: true,
      active: 2,
      maxConcurrentRuns: 3,
    },
    review: {
      id: 'review',
      name: 'Review Agent',
      avatar: null,
      tool: 'codex',
      archived: false,
      online: true,
      active: 1,
      maxConcurrentRuns: 1,
    },
    docs: {
      id: 'docs',
      name: 'Docs Writer',
      avatar: null,
      tool: 'claude',
      archived: false,
      online: false,
      active: 0,
      maxConcurrentRuns: 2,
    },
  },
  rows: [
    row(
      21,
      'Stream large exports with a progress bar',
      true,
      entry('code', 'working', {
        run: run(754, 'mac-mini-02', 'client/export/stream.ts'),
      }),
    ),
    row(
      24,
      'Remember the last issue view per page',
      false,
      entry('code', 'working', {
        run: run(65, 'linux-runner', 'Running the unit tests'),
      }),
    ),
    row(
      25,
      'Show who an agent waits for',
      true,
      entry('code', 'queued', {
        run: { ...run(300, '', ''), status: 'queued', runnerName: null },
        queue: wait('concurrencyFull', 1),
      }),
    ),
    row(
      27,
      'Drag cards between columns on touch screens',
      false,
      entry('code', 'queued', {
        run: { ...run(120, '', ''), status: 'queued', runnerName: null },
        queue: wait('next', 2),
      }),
    ),
    row(
      28,
      'Dark theme for the board',
      false,
      entry('code', 'queued', {
        blockedBy: [
          { issueId: 'i12', identifier: 'PM-12', title: 'Theme tokens' },
        ],
      }),
    ),
    row(
      30,
      'Design: offline mode for the inbox',
      true,
      entry('code', 'waiting', {
        waiting: {
          kind: 'proposal',
          since: ago(3600),
          waitingFor: [{ userId: VIEWER, name: 'Me' }],
          viewerDecides: true,
          path: '/issues/PM-30#design',
          detail: null,
        },
      }),
    ),
    row(
      31,
      'Review the search ranking change',
      false,
      entry('review', 'working', {
        run: run(1980, 'linux-runner', 'Reading the diff'),
      }),
    ),
    row(
      33,
      'Move the release to Done',
      false,
      entry('review', 'waiting', {
        waiting: {
          kind: 'approval',
          since: ago(7200),
          waitingFor: [{ userId: 'u-ada', name: 'Ada' }],
          viewerDecides: false,
          path: '/inbox',
          detail: 'done',
        },
      }),
    ),
    row(
      35,
      'Write the export guide',
      false,
      entry('docs', 'queued', {
        run: { ...run(900, '', ''), status: 'queued', runnerName: null },
        queue: wait('noRunnerOnline', 1),
      }),
    ),
    row(
      36,
      'Document the queue',
      true,
      entry('docs', 'idle', {
        idle: {
          reason: 'lastRun',
          lastRun: { status: 'completed', at: ago(3 * 3600) },
          mayStart: true,
        },
      }),
    ),
    row(
      37,
      'Translate the agent pages',
      false,
      entry('docs', 'idle', {
        idle: { reason: 'backlog', lastRun: null, mayStart: false },
      }),
    ),
    row(
      38,
      'Write the release notes',
      false,
      entry('docs', 'idle', {
        idle: { reason: 'noAutoRun', lastRun: null, mayStart: true },
      }),
    ),
  ],
  summary: { runners: { online: 2, busy: 2 } },
  truncated: false,
  generatedAt: new Date().toISOString(),
};

export function AgentQueueDemo(): ReactElement {
  const [onlyMine, setOnlyMine] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className='flex h-svh flex-col gap-3 bg-background p-6 text-foreground'>
      {opened ? (
        <p className='text-xs text-muted-foreground'>Opened {opened}</p>
      ) : null}
      <div className='min-h-0 flex-1'>
        <AgentQueue
          data={DEMO_DATA}
          viewerId={VIEWER}
          issueHref={(issue) => `/issues/${issue.identifier}`}
          onNavigate={setOpened}
          onlyMine={onlyMine}
          onOnlyMineChange={setOnlyMine}
          onStart={(issue) => setOpened(`Started ${issue.identifier}`)}
          expandIdle
        />
      </div>
    </div>
  );
}
