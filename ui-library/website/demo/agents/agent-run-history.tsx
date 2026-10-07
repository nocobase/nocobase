import { useState, type ReactElement } from 'react';

import {
  RunActivityRow,
  RunBrief,
  AgentRunHistory,
  RunLivePill,
  RunHeader,
  RunTranscript,
  type AgentRunHistoryRun,
  type RunTranscriptEvent,
} from '@/components/agent-run-history';

const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const RUNS: readonly AgentRunHistoryRun[] = [
  {
    id: 'r6',
    agentId: 'coder',
    agentName: 'Code Agent',
    status: 'running',
    createdAt: ago(4),
    startedAt: ago(3),
    finishedAt: null,
  },
  ...['completed', 'failed', 'completed', 'cancelled', 'completed'].map(
    (status, index): AgentRunHistoryRun => ({
      id: `r${5 - index}`,
      agentId: index % 2 ? 'reviewer' : 'coder',
      agentName: index % 2 ? 'Review Agent' : 'Code Agent',
      status: status as AgentRunHistoryRun['status'],
      createdAt: ago(60 * (index + 1)),
      startedAt: ago(60 * (index + 1) - 1),
      finishedAt: ago(60 * (index + 1) - 9),
      failure: status === 'failed' ? 'The runtime lost its credentials' : null,
    }),
  ),
];

const EVENTS: readonly RunTranscriptEvent[] = [
  { seq: 1, at: ago(3), type: 'status', content: 'Checked out agent/PM-12' },
  { seq: 2, at: ago(3), type: 'thinking', content: 'Looking at the tests' },
  {
    seq: 3,
    at: ago(2),
    type: 'toolUse',
    tool: 'Bash',
    input: { command: 'pnpm test' },
  },
  {
    seq: 4,
    at: ago(2),
    type: 'toolResult',
    tool: 'Bash',
    output:
      ' ✓ tests/login.test.ts (2 tests)\n ✓ tests/session.test.ts (1 test)\n\n Test Files  2 passed (2)\n      Tests  3 passed (3)',
  },
  { seq: 5, at: ago(1), type: 'text', content: 'All tests pass.' },
];

export function AgentRunHistoryDemo(): ReactElement {
  const [opened, setOpened] = useState<AgentRunHistoryRun | null>(null);
  const shown = opened ?? RUNS[0];
  return (
    <div className='grid gap-6 p-6 lg:grid-cols-[20rem_minmax(0,1fr)]'>
      <div className='space-y-4'>
        <AgentRunHistory
          runs={RUNS}
          onOpenRun={setOpened}
          onStop={() => undefined}
          className='rounded-lg border bg-card p-4'
        />
        <RunLivePill runs={RUNS} onOpenRun={setOpened} />
        <RunActivityRow run={RUNS[2]} onOpenRun={setOpened} />
      </div>
      <div className='space-y-6'>
        {shown ? (
          <RunTranscript
            header={
              <RunHeader
                run={shown}
                trigger='Moved to In progress'
                attempt='attempt 1 of 3'
              />
            }
            events={EVENTS}
            open
          />
        ) : null}
        <RunBrief
          sections={[
            { key: 'system', title: 'Rules', text: 'You are Code Agent.' },
            { key: 'task', title: 'Task', text: 'Issue PM-12: Fix it' },
            { key: 'turn', title: 'First turn', text: '' },
          ]}
        />
      </div>
    </div>
  );
}
