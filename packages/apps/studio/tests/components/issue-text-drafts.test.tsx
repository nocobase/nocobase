import { ApiClientError } from '@nocobase/app-client';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import {
  IssueDescription,
  IssueHeader,
} from '../../client/extensions/nocobase-issue-detail/issue-detail.js';
import { IssueSummary } from '../../client/issues/live/issue-summary.js';
import enUS from '../../client/locales/en-US.js';

// Keep the summary's unrelated live sections idle; the title editor itself is real.
vi.mock('@nocobase/app-plugin-projects/client/kit', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => null,
}));
vi.mock('../../client/git/api.js', () => ({
  usePullRequestMark: () => ({}),
  useIssuePullRequests: () => ({}),
}));
vi.mock('../../client/issues/detail/use-issue-progress.js', () => ({
  useIssueProgress: () => ({}),
}));
vi.mock('../../client/issues/detail/issue-progress.js', () => ({
  IssueProgressLine: () => null,
}));
vi.mock('../../client/issues/detail/use-owner-handoff.js', () => ({
  handoffWaitsOn: () => false,
  useOwnerHandoffView: () => ({ data: undefined }),
}));
vi.mock('../../client/issues/detail/use-pending-comment-run.js', () => ({
  usePendingCommentRun: () => ({}),
}));
vi.mock('../../client/previews/use-issue-previews.js', () => ({
  useIssuePreviews: () => ({ query: {} }),
}));

const rejected = (status: number) =>
  new ApiClientError('Rejected', {
    status,
    reason: status === 409 ? 'REVISION_CONFLICT' : 'FORBIDDEN',
    method: 'PATCH',
    url: '/issues/i1',
  });

async function editDescription(value: string) {
  const textbox = screen.getByRole('textbox', { name: 'Description' });
  await act(async () => {
    textbox.innerHTML = `<p>${value}</p>`;
    fireEvent.input(textbox);
  });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled(),
  );
}

describe('description drafts', () => {
  it.each([409, 403])(
    'retains text and the starting revision on %s, then reopens the latest content for a manual merge',
    async (status) => {
      const save = vi
        .fn<(text: string, revision: number) => Promise<void>>()
        .mockRejectedValue(rejected(status));
      const description = (text: string, revision: number) => (
        <IssueDescription
          description={text}
          revision={revision}
          onSave={save}
          renderMarkdown={(value) => <p>{value}</p>}
        />
      );
      const view = render(description('Original', 1));
      fireEvent.click(screen.getByRole('button', { name: 'Edit description' }));
      await editDescription('Original B draft');
      view.rerender(description('A saved', 2));
      expect(screen.getByRole('textbox').textContent).toBe('Original B draft');
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled(),
      );
      expect(save).toHaveBeenCalledExactlyOnceWith('Original B draft', 1);
      expect(screen.getByRole('textbox').textContent).toBe('Original B draft');
      // An explicit retry still belongs to the original draft; no automatic version upgrade or retry.
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
      expect(save).toHaveBeenLastCalledWith('Original B draft', 1);
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Cancel' }),
        ).not.toBeDisabled(),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.getByText('A saved')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Edit description' }));
      expect(screen.getByRole('textbox').textContent).toBe('A saved');
      await editDescription('A saved B merged');
      save.mockResolvedValueOnce();
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
      expect(save).toHaveBeenLastCalledWith('A saved B merged', 2);
    },
  );

  it('compares changes to the original text during refresh, and cancels without saving', async () => {
    const save = vi.fn(() => Promise.resolve());
    const view = render(
      <IssueDescription
        description='Original'
        revision={1}
        onSave={save}
        renderMarkdown={(text) => text}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit description' }));
    view.rerender(
      <IssueDescription
        description='A saved'
        revision={2}
        onSave={save}
        renderMarkdown={(text) => text}
      />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit description' }));
    await editDescription('A changed normally');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(save).toHaveBeenCalledExactlyOnceWith('A changed normally', 2);
  });
});

describe.each(['header', 'summary'] as const)('%s title draft', (kind) => {
  async function setup(
    save: (title: string, revision: number) => Promise<void>,
  ) {
    const runtime = await createTestI18nRuntime({
      locale: 'en-US',
      application: { namespace: 'studio', resources: enUS },
      namespaces: { '@nocobase/i18n': { status: { backlog: 'Backlog' } } },
    });
    const client = new QueryClient();
    const title = (value: string, revision: number) => (
      <TestI18nProvider runtime={runtime} namespace='studio'>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            {kind === 'header' ? (
              <IssueHeader
                identifier='PM-1'
                title={value}
                revision={revision}
                status={{ name: 'Backlog', color: 'gray' }}
                onRename={save}
              />
            ) : (
              <IssueSummary
                issue={
                  {
                    id: 'i1',
                    identifier: 'PM-1',
                    title: value,
                    revision,
                    statusKey: 'backlog',
                  } as IssueDetail
                }
                update={{} as never}
                meta={false}
                rename={{
                  onRename: save,
                  editLabel: 'Edit title',
                  inputLabel: 'Title',
                }}
              />
            )}
          </MemoryRouter>
        </QueryClientProvider>
      </TestI18nProvider>
    );
    return { ...render(title('Original', 1)), title };
  }

  it.each([409, 403])(
    'keeps a rejected draft on %s and saves a new merged draft at the latest revision',
    async (status) => {
      const save = vi
        .fn<(text: string, revision: number) => Promise<void>>()
        .mockRejectedValue(rejected(status));
      const view = await setup(save);
      fireEvent.click(screen.getByRole('button', { name: 'Edit title' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
        target: { value: 'B draft' },
      });
      view.rerender(view.title('A saved', 2));
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      await waitFor(() =>
        expect(screen.getByRole('textbox')).not.toBeDisabled(),
      );
      expect(screen.getByRole('textbox')).toHaveValue('B draft');
      expect(save).toHaveBeenCalledExactlyOnceWith('B draft', 1);
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
      expect(save).toHaveBeenLastCalledWith('B draft', 1);
      await waitFor(() =>
        expect(screen.getByRole('textbox')).not.toBeDisabled(),
      );
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
      expect(screen.getByRole('heading', { name: 'A saved' })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Edit title' }));
      expect(screen.getByRole('textbox')).toHaveValue('A saved');
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'A saved B merged' },
      });
      save.mockResolvedValueOnce();
      fireEvent.blur(screen.getByRole('textbox'));
      await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
      expect(save).toHaveBeenLastCalledWith('A saved B merged', 2);
    },
  );

  it('cancels an unchanged draft after refresh without reverting the saved title', async () => {
    const save = vi.fn(() => Promise.resolve());
    const view = await setup(save);
    fireEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    view.rerender(view.title('A saved', 2));
    fireEvent.blur(screen.getByRole('textbox'));
    expect(screen.getByRole('heading', { name: 'A saved' })).toBeVisible();
    expect(save).not.toHaveBeenCalled();
  });

  it('saves a normal title edit once when Enter also blurs the input', async () => {
    const save = vi.fn(() => Promise.resolve());
    await setup(save);
    fireEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New title' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(save).toHaveBeenCalledExactlyOnceWith('New title', 1);
  });
});
