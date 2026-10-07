import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Activity, IssueDetail } from '../../shared/issues.js';
import type { IssueUpdate } from '../../client/pages/issues/detail/use-issue-update.js';
import { clientMocks, resetApi } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { startingExecutor } = await import('../../client/lib/kinds.js');
const { buildTimeline } =
  await import('../../client/pages/issues/detail/timeline.js');
const { StartDialog } =
  await import('../../client/pages/issues/detail/start-dialog.js');
const { useConfirmedUpdate } =
  await import('../../client/pages/issues/detail/use-confirmed-update.js');

afterEach(cleanup);

const activity = (id: string, createdAt: string): Activity =>
  ({
    id,
    action: 'status_changed',
    createdAt,
    details: {},
  }) as unknown as Activity;

describe('runs on the issue page', () => {
  it('places each run on the activity line where it was started', () => {
    const entries = buildTimeline(
      [],
      [
        activity('a1', '2026-10-01T08:00:00.000Z'),
        activity('a2', '2026-10-01T10:00:00.000Z'),
      ],
      undefined,
      [{ id: 'r1', createdAt: '2026-10-01T09:00:00.000Z' }],
    );
    expect(entries.map((entry) => entry.key)).toEqual([
      'activity:a1',
      'run:r1',
      'activity:a2',
    ]);
  });

  it('asks to start only when an executor of another kind would start working', () => {
    const agent = { type: 'agent', id: 'a1' };
    const statuses = [
      { key: 'backlog', name: 'Backlog', category: 'unstarted', color: 'gray' },
      { key: 'todo', name: 'Todo', category: 'unstarted', color: 'blue' },
      { key: 'done', name: 'Done', category: 'done', color: 'green' },
    ] as const;
    const check = (input: Parameters<typeof startingExecutor>[0]) =>
      startingExecutor({ statuses, ...input });
    // Newly set, on an issue where work starts.
    expect(
      check({ fromStatus: 'todo', executorBefore: null, executorAfter: agent }),
    ).toEqual(agent);
    expect(
      check({
        fromStatus: 'todo',
        executorBefore: agent,
        executorAfter: { type: 'agent', id: 'a1' },
      }),
    ).toBeNull();
    expect(
      check({
        fromStatus: 'todo',
        executorBefore: agent,
        executorAfter: { type: 'agent', id: 'a2' },
      }),
    ).toEqual({ type: 'agent', id: 'a2' });
    expect(
      check({
        fromStatus: 'todo',
        executorBefore: null,
        executorAfter: { type: 'user', id: 'u1' },
      }),
    ).toBeNull();
    expect(
      check({ fromStatus: 'todo', executorBefore: agent, executorAfter: null }),
    ).toBeNull();
    // Assigned in backlog, or in a finished status: nothing starts, so nothing asks.
    expect(
      check({
        fromStatus: 'backlog',
        executorBefore: null,
        executorAfter: agent,
      }),
    ).toBeNull();
    expect(
      check({ fromStatus: 'done', executorBefore: null, executorAfter: agent }),
    ).toBeNull();
    // Out of backlog with an agent: asks; into backlog or between other statuses: does not.
    expect(
      check({ fromStatus: 'backlog', toStatus: 'todo', executorBefore: agent }),
    ).toEqual(agent);
    expect(
      check({ fromStatus: 'todo', toStatus: 'backlog', executorBefore: agent }),
    ).toBeNull();
    expect(
      check({ fromStatus: 'todo', toStatus: 'done', executorBefore: agent }),
    ).toBeNull();
    // A new issue: given to an agent unless it starts in backlog.
    expect(
      check({
        fromStatus: null,
        toStatus: 'todo',
        executorBefore: null,
        executorAfter: agent,
      }),
    ).toEqual(agent);
    expect(
      check({
        fromStatus: null,
        toStatus: 'backlog',
        executorBefore: null,
        executorAfter: agent,
      }),
    ).toBeNull();
  });

  it('asks "Start now?" before giving the issue to an agent, and sends the answer', async () => {
    resetApi({});
    const mutate = vi.fn();
    const issue = {
      id: 'i1',
      identifier: 'PM-1',
      statusKey: 'todo',
      executor: null,
    } as unknown as IssueDetail;
    function Harness(): ReactElement {
      const confirmed = useConfirmedUpdate({
        issue,
        others: [{ type: 'agent', id: 'a1', name: 'Coder' }],
        update: { mutate } as unknown as IssueUpdate,
      });
      return (
        <>
          <button
            type='button'
            onClick={() =>
              confirmed.apply({ executor: { type: 'agent', id: 'a1' } })
            }
          >
            assign
          </button>
          <button
            type='button'
            onClick={() => confirmed.apply({ priority: 'high' })}
          >
            prioritize
          </button>
          <StartDialog
            request={confirmed.startRequest}
            onDecide={confirmed.decide}
            onCancel={confirmed.cancel}
          />
        </>
      );
    }
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Harness />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'prioritize' }));
    expect(mutate).toHaveBeenLastCalledWith({ priority: 'high' });

    fireEvent.click(screen.getByRole('button', { name: 'assign' }));
    expect(await screen.findByText('start.title')).toBeTruthy();
    expect(screen.getByText('Coder')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'start.later' }));
    await waitFor(() =>
      expect(mutate).toHaveBeenLastCalledWith({
        executor: { type: 'agent', id: 'a1' },
        start: false,
      }),
    );
  });
});
