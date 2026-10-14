/**
 * The event card of delegated work in the chat panel: it names the milestone, links the issue and the pull request,
 * and stops or resumes following the issue; other news is left to its line.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClientError } from '@nocobase/app-client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
const identities = {
  loading: false,
  failed: false,
  nameOf: (id: string) =>
    id === 'coder'
      ? 'Coder'
      : id === 'studio-project-manager'
        ? '负责人'
        : null,
};
vi.mock('@nocobase/app-plugin-agents/client/runs', () => ({
  useAgentIdentities: () => identities,
}));

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
  identities.loading = false;
  identities.failed = false;
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
  it.each([403, 404])(
    'distinguishes refused lookups from a missing delegation (%s)',
    async (status) => {
      request.mockRejectedValue(
        new ApiClientError('Lookup unavailable', {
          status,
          method: 'GET',
          url: '/delegations/d1',
        }),
      );
      show(
        renderDelegationNews({
          code: 'news',
          type: 'delegation',
          title: 'Old title',
          params: {
            delegationId: 'd1',
            event: 'finished',
            agentName: 'Project manager',
            agentNameKey: 'studioAgents.projectManager.name',
            agentNameNs: 'studio',
            identifier: 'PM-12',
          },
        }),
      );
      const agent = status === 404 ? 'Project manager' : 'inbox.anAgent';
      await waitFor(() =>
        expect(screen.getByTestId('delegation-card')).toHaveAttribute(
          'aria-label',
          `studioAgents.delegation.events.finished(identifier=PM-12,agent=${agent},status=)`,
        ),
      );
    },
  );
  it('uses the current database identity for an old milestone and its accessible label', () => {
    show(
      renderDelegationNews({
        code: 'news',
        type: 'delegation',
        title: 'Old title',
        params: {
          delegationId: 'd1',
          event: 'finished',
          agentId: 'studio-project-manager',
          agentName: 'Project manager',
          agentNameKey: 'studioAgents.projectManager.name',
          agentNameNs: 'studio',
          identifier: 'PM-12',
          excerpt: 'Historical Project manager text',
        },
      }),
    );
    expect(screen.getByTestId('delegation-card')).toHaveAttribute(
      'aria-label',
      'studioAgents.delegation.events.finished(identifier=PM-12,agent=负责人,status=)',
    );
    expect(
      screen.getByText('Historical Project manager text'),
    ).toBeInTheDocument();
  });
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
