/**
 * The event card of delegated work in the chat panel: it names the milestone, links the issue and the pull request,
 * and stops or resumes following the issue; other news is left to its line.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request }),
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? `${key}(${Object.entries(options)
            .map(([name, value]) => `${name}=${String(value)}`)
            .join(',')})`
        : key,
    i18n: { language: 'en-US' },
  }),
}));

const { renderDelegationNews } =
  await import('../../client/agents/delegation/news.js');

const DELEGATION = {
  id: 'd1',
  conversationId: 'c1',
  issueId: 'i1',
  agentId: 'coder',
  userId: 'alice',
  followed: true,
  createdAt: '2026-10-05T08:00:00.000Z',
  updatedAt: '2026-10-05T08:00:00.000Z',
};

function show(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  request.mockReset();
  request.mockImplementation(
    (options: { method?: string; json?: { followed: boolean } }) =>
      Promise.resolve({
        data:
          options.method === 'PATCH'
            ? { ...DELEGATION, followed: options.json?.followed }
            : DELEGATION,
      }),
  );
});

describe('the delegation card', () => {
  it('shows the milestone with its links, and stops and resumes following', async () => {
    show(
      renderDelegationNews({
        code: 'news',
        type: 'delegation',
        title: 'PM-12 · Coder finished its work: Done., PR #34',
        params: {
          delegationId: 'd1',
          event: 'finished',
          issueId: 'i1',
          identifier: 'PM-12',
          issueTitle: 'Fix login',
          agentId: 'coder',
          agentName: 'Coder',
          excerpt: 'Fixed the form.',
          prNumber: '34',
          prUrl: 'https://github.com/acme/app/pull/34',
          prTitle: 'Fix login form',
        },
      }),
    );
    const card = screen.getByTestId('delegation-card');
    expect(card.dataset.event).toBe('finished');
    expect(
      screen.getByText(
        'studioAgents.delegation.events.finished(identifier=PM-12,agent=Coder,status=)',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('PM-12 Fix login').closest('a')).toHaveAttribute(
      'href',
      '/issues/PM-12',
    );
    expect(screen.getByText('Fixed the form.')).toBeInTheDocument();
    expect(
      screen
        .getByText(
          'studioAgents.delegation.pullRequest(number=34,title=Fix login form)',
        )
        .closest('a'),
    ).toHaveAttribute('href', 'https://github.com/acme/app/pull/34');

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'studioAgents.delegation.stopFollowing',
      }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        path: 'delegations/d1',
        method: 'PATCH',
        json: { followed: false },
      }),
    );
    expect(
      await screen.findByText('studioAgents.delegation.notFollowing'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'studioAgents.delegation.followAgain',
      }),
    ).toBeInTheDocument();
  });

  it('leaves other news to its line', () => {
    expect(
      renderDelegationNews({
        code: 'news',
        type: 'planDecided',
        title: 'The plan was executed.',
      }),
    ).toBeNull();
  });
});
