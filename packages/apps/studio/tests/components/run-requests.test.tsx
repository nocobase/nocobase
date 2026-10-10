/**
 * The person who asked an agent to work on someone else's issue: "Comment and run as me" runs what their comment
 * asked as them, and the issue page lists what still waits for the owner, to run as themselves or withdraw.
 */
import type { ApiClient } from '@nocobase/app-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IssueRunRequestsSection } from '../../client/agents/issue-run-requests';
import { runCommentAsMe } from '../../client/agents/run-requests';

const request = vi.fn();

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request }),
}));

vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  pmKeys: { issues: ['pm', 'issues'] },
}));

// Keys stand for their text, so a test can tell which text was chosen.
vi.mock('@nocobase/i18n/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/i18n/client')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en-US' },
    }),
  };
});

vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const asked = (id: string, commentId: string) => ({
  id,
  agentId: 'a1',
  agentName: 'Coder',
  subject: { kind: 'issue', id: 'i7' },
  responsibleUserId: 'alice',
  responsibleName: 'Alice',
  requestedByUserId: 'bob',
  requestedByName: 'Bob',
  input: {
    type: 'comment',
    actor: { kind: 'user', id: 'bob', name: 'Bob' },
    text: `Asked in ${commentId}`,
    payload: { trigger: 'comment', commentId },
  },
  status: 'pending',
  expiresAt: '2026-10-16T08:00:00.000Z',
});

describe('comment and run as me', () => {
  it('runs as the commenter only what that comment asked', async () => {
    const calls: unknown[] = [];
    const api = {
      request: (call: { method?: string }) => {
        calls.push(call);
        return Promise.resolve(
          call.method === 'POST'
            ? undefined
            : { data: [asked('r1', 'c1'), asked('r2', 'c2')] },
        );
      },
    } as unknown as ApiClient;
    await expect(runCommentAsMe(api, 'i7', 'c2')).resolves.toBe(1);
    expect(calls).toEqual([
      {
        path: 'agents/runRequests',
        query: {
          role: 'requester',
          status: 'pending',
          subjectKind: 'issue',
          subjectId: 'i7',
          pageSize: '50',
        },
      },
      { method: 'POST', path: 'agents/runRequests/r2/runAsMe' },
    ]);
  });
});

describe('what the viewer asked on an issue', () => {
  const issue = { id: 'i7', owner: { id: 'alice', name: 'Alice' } } as never;
  const renderSection = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <IssueRunRequestsSection issue={issue} />
      </QueryClientProvider>,
    );

  it('lists each request with what it asked, to run as oneself or withdraw', async () => {
    request.mockReset();
    request.mockImplementation((call: { method?: string }) =>
      Promise.resolve(
        call.method === 'POST' ? undefined : { data: [asked('r1', 'c1')] },
      ),
    );
    renderSection();
    expect(await screen.findByText('Asked in c1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'runRequests.asMe' }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'agents/runRequests/r1/runAsMe',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'runRequests.withdraw' }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'agents/runRequests/r1/withdraw',
      }),
    );
  });

  it('renders nothing while nothing waits', async () => {
    request.mockReset();
    request.mockResolvedValue({ data: [] });
    const { container } = renderSection();
    await waitFor(() => expect(request).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
