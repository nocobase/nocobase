/**
 * The issue page's properties: the status among the six fixed statuses, and "Arrange", where the project manager is
 * the only agent beside the people.
 */
import { FIXED_STATUSES } from '@nocobase/app-plugin-projects/shared/statuses';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const NAMES: Readonly<Record<string, string>> = {
  backlog: 'Backlog',
  in_progress: 'In progress',
  blocked: 'Blocked',
  in_review: 'In review',
  done: 'Done',
  cancelled: 'Cancelled',
};

vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  canChangeIssueOwner: () => true,
  canCloseIssue: () => true,
  canEditIssues: () => true,
  isClosing: () => false,
  STAGE_MAX: 99,
  statusTone: () => 'grey',
  useExecutorOptions: () => [
    { type: 'agent', id: 'studio-project-manager', name: 'Project manager' },
  ],
  useStatusName: () => (_statuses: unknown, key: string) => NAMES[key] ?? key,
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  canUseSetting: () => false,
  pmKeys: { members: ['members'], projects: ['projects'], labels: ['labels'] },
  usePmApi: () => ({
    members: () => Promise.resolve([{ userId: 'alice', name: 'Alice' }]),
    projects: () => Promise.resolve([]),
    labels: () => Promise.resolve([]),
  }),
  useViewer: () => ({ userId: 'alice' }),
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));
vi.mock('../../client/previews/preference-field.js', () => ({
  PreviewPreferenceField: () => null,
}));
vi.mock('../../client/agents/executor-agent.js', () => ({
  useExecutorAgent: () => (_id: string, name: string) => name,
}));
vi.mock('../../client/projects/init-query.js', () => ({
  useInitExecutorLabel: () => null,
}));

const { IssuePropertiesCard } =
  await import('../../client/issues/detail/issue-aside.js');

const detail = {
  id: 'i1',
  identifier: 'PM-1',
  statusKey: 'backlog',
  statuses: FIXED_STATUSES,
  priority: 'none',
  ownerUserId: 'alice',
  owner: { id: 'alice', name: 'Alice' },
  executor: { type: 'agent', id: 'studio-project-manager' },
  executorName: 'Project manager',
  labels: [],
  projectId: null,
  project: null,
  parentIssueId: null,
  startDate: null,
  dueDate: null,
} as never;

describe('the issue properties', () => {
  it('lists the six fixed statuses and moves the issue with a plain change', async () => {
    const mutate = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <IssuePropertiesCard
          detail={detail}
          update={{ mutate, isPending: false } as never}
          pageActions={{} as never}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByText('issuePage.arrange')).toBeInTheDocument();
    expect(screen.queryByText('properties.executor')).toBeNull();
    const executor = document.getElementById('pm-prop-executor')!;
    expect(executor).toHaveTextContent('Project manager');

    await userEvent.click(document.getElementById('pm-prop-status')!);
    const list = await screen.findByRole('listbox');
    expect(
      within(list)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(Object.values(NAMES));
    await userEvent.click(
      within(list).getByRole('option', { name: 'Blocked' }),
    );
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith({ statusKey: 'blocked' }),
    );
  });

  it('offers the project manager and the members to arrange the work', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <IssuePropertiesCard
          detail={detail}
          update={{ mutate: vi.fn(), isPending: false } as never}
          pageActions={{} as never}
        />
      </QueryClientProvider>,
    );
    await userEvent.click(document.getElementById('pm-prop-executor')!);
    const list = await screen.findByRole('listbox');
    await waitFor(() =>
      expect(
        within(list)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Project manager'),
          expect.stringContaining('Alice'),
        ]),
      ),
    );
  });
});
