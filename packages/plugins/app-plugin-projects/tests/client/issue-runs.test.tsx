import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

const { buildTimeline } =
  await import('../../client/pages/issues/detail/timeline.js');
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

  it('applies a change at once, without asking to start', () => {
    resetApi({});
    const mutate = vi.fn();
    const issue = {
      id: 'i1',
      identifier: 'PM-1',
      statusKey: 'in_progress',
      executor: null,
    } as unknown as IssueDetail;
    function Harness(): ReactElement {
      const confirmed = useConfirmedUpdate({
        issue,
        others: [{ type: 'agent', id: 'a1', name: 'Coder' }],
        update: { mutate } as unknown as IssueUpdate,
      });
      return (
        <button
          type='button'
          onClick={() =>
            confirmed.apply({ executor: { type: 'agent', id: 'a1' } })
          }
        >
          assign
        </button>
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
    fireEvent.click(screen.getByRole('button', { name: 'assign' }));
    expect(mutate).toHaveBeenLastCalledWith({
      executor: { type: 'agent', id: 'a1' },
    });
  });
});
