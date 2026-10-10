import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import { IssueListView } from '../../client/issues/list-view.js';
import type { IssuesPage } from '../../client/issues/use-issues-page.js';

const mocks = vi.hoisted(() => ({
  pages: [] as { data: unknown[] }[],
  filters: vi.fn(),
  fetchNextPage: vi.fn(),
  restoreIssue: vi.fn().mockResolvedValue(undefined),
  statuses: vi.fn().mockResolvedValue([]),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/issues')
  >()),
  useIssuePages: (filters: unknown) => {
    mocks.filters(filters);
    return {
      data: { pages: mocks.pages },
      hasNextPage: true,
      fetchNextPage: mocks.fetchNextPage,
    };
  },
  useStatusName: () => () => 'Todo',
  useNotify: () => ({ success: mocks.success, error: mocks.error }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  usePmApi: () => ({
    statuses: mocks.statuses,
    restoreIssue: mocks.restoreIssue,
  }),
}));
vi.mock('../../client/issues/issue-marks.js', () => ({
  IssueMarks: () => null,
}));

const issue = (
  id: string,
  parentIssueId: string | null = null,
): IssueListItem =>
  ({
    id,
    parentIssueId,
    identifier: `TASK-${id}`,
    title: id,
    labels: [],
    priority: 'none',
    statusKey: 'todo',
    updatedAt: '2026-01-01T00:00:00Z',
  }) as unknown as IssueListItem;

async function setup(filters: IssuesPage['filters'], deleted = false) {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'studio', resources: enUS },
  });
  const page = {
    filters,
    filtered: true,
    updateParams: vi.fn(),
    clearFilters: vi.fn(),
  } as unknown as IssuesPage;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const element = () => (
    <QueryClientProvider client={client}>
      <TestI18nProvider runtime={runtime} namespace='studio'>
        <IssueListView
          page={page}
          deleted={deleted}
          issueHref={(id) => `/issues/${id}`}
          onOpen={vi.fn()}
          empty={{ title: 'Empty', description: 'Empty' }}
        />
      </TestI18nProvider>
    </QueryClientProvider>
  );
  return { ...render(element()), element, page };
}
const rowIds = () =>
  within(screen.getByRole('table'))
    .getAllByRole('link')
    .map((link) => link.textContent);

describe('loaded issue pages in the list', () => {
  it('regroups all pages when a parent arrives and keeps counts and load more', async () => {
    mocks.pages = [{ data: [issue('child', 'parent')] }];
    const view = await setup({});
    expect(rowIds()).toEqual(['TASK-child']);
    expect(screen.getByText('1 shown')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(mocks.fetchNextPage).toHaveBeenCalledOnce();
    mocks.pages = [
      ...mocks.pages,
      { data: [issue('parent'), issue('child', 'parent')] },
    ];
    view.rerender(view.element());
    expect(rowIds()).toEqual(['TASK-parent', 'TASK-child']);
    expect(screen.getByText('2 shown')).toBeVisible();
  });

  it('keeps a matching child alone and passes fixed personal filters unchanged', async () => {
    mocks.pages = [{ data: [issue('child', 'hidden')] }];
    const filters = { ownerUserId: 'viewer', q: 'child' };
    await setup(filters);
    expect(mocks.filters).toHaveBeenLastCalledWith(filters);
    expect(rowIds()).toEqual(['TASK-child']);
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });

  it('organizes deleted results and retains restore without links', async () => {
    mocks.pages = [{ data: [issue('child', 'parent'), issue('parent')] }];
    await setup({ deleted: true }, true);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('TASK-parent');
    expect(rows[1]).toHaveTextContent('TASK-child');
    fireEvent.click(within(rows[1]!).getByRole('button', { name: 'Restore' }));
    expect(mocks.restoreIssue).toHaveBeenCalledWith('child');
  });
});
