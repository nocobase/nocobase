/** @vitest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIConversationsSettingsPage from '../client/pages/conversation-center-settings-page.js';

const mocks = vi.hoisted(() => ({ list: vi.fn(), messages: vi.fn(), api: {} }));
vi.mock('@nocobase/app-client', () => ({
  apiClientToken: {},
  useService: () => mocks.api,
  useApiClient: () => mocks.api,
  createApiClient: () => mocks.api,
  resolveAppUrl: (value: string) => value,
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ i18n: { resolvedLanguage: 'en-US' } }),
}));
vi.mock('../client/locales/index.js', () => ({
  useT: () => (key: string) => key,
}));
vi.mock('../registry/nocobase-ai/locales/use-ai-translate.js', () => ({
  useAITranslate: () => (_key: string, fallback: string) => fallback,
}));
vi.mock('../client/conversation-center-service.js', () => ({
  listManagedConversations: mocks.list,
  getManagedConversationMessages: mocks.messages,
}));
vi.mock('../registry/nocobase-ai/components/chat/chat-messages.js', () => ({
  AIChatMessageList: ({
    messages,
    readOnly,
    showMessageActions,
    loading,
    emptyState,
    historyHeader,
  }: {
    messages: Array<{ id: string; parts: Array<{ text: string }> }>;
    readOnly: boolean;
    showMessageActions: boolean;
    loading: boolean;
    emptyState: ReactNode;
    historyHeader?: ReactNode;
  }) => (
    <div
      data-testid='history'
      data-readonly={readOnly}
      data-actions={showMessageActions}
    >
      {historyHeader}
      {loading
        ? 'Loading history'
        : messages.length
          ? messages.map((message) => (
              <p key={message.id}>{message.parts[0].text}</p>
            ))
          : emptyState}
    </div>
  ),
}));

const rows = [
  {
    sessionId: 'a',
    title: 'Alice conversation',
    userId: 'alice',
    scope: 'app-one',
    aiEmployeeUsername: 'ellis',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    sessionId: 'b',
    title: 'Bob conversation',
    userId: 'bob',
    scope: 'app-two',
    aiEmployeeUsername: 'dex',
    updatedAt: '2026-09-02T10:00:00Z',
  },
];
const message = (id: string, text: string) => ({
  id,
  role: 'assistant',
  parts: [{ type: 'text', text }],
});

function renderCenter(search = '') {
  const router = createMemoryRouter(
    [
      {
        path: '/settings/ai/conversations',
        element: <AIConversationsSettingsPage />,
      },
    ],
    { initialEntries: [`/settings/ai/conversations${search}`] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.list.mockResolvedValue({ rows, count: 60, page: 1, pageSize: 30 });
  mocks.messages.mockResolvedValue({
    messages: [message('2', 'Latest answer')],
    hasMore: true,
    cursor: '2',
  });
});

describe('Conversation center', () => {
  it('renders one shared settings header with the controls inside the content container', async () => {
    renderCenter();
    await screen.findByRole('button', { name: /Alice conversation/ });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Conversations',
    });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const header = heading.closest('header')!;
    expect(header).toHaveClass('flex', 'flex-col', 'sm:flex-row');
    const container = header.parentElement!;
    expect(container.tagName).toBe('SECTION');
    expect(container).toHaveClass('w-full', 'space-y-6', 'p-6', 'md:p-8');
    const description = 'conversations.pageDescription';
    expect(within(header).getByText(description)).toBeInTheDocument();
    expect(screen.getAllByText(description)).toHaveLength(1);

    const content = screen.getByRole('region', { name: 'Conversations' });
    expect(header.nextElementSibling).toBe(content.parentElement);
    expect(content.parentElement?.parentElement).toBe(container);
    expect(
      within(content).getByRole('searchbox', { name: 'Search conversations' }),
    ).toBeVisible();
    expect(within(content).queryByText('Read only')).not.toBeInTheDocument();
    expect(
      within(content).queryByRole('button', { name: 'Refresh list' }),
    ).not.toBeInTheDocument();
    expect(within(content).queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'AI settings' }),
    ).toBeNull();
  });

  it('reuses the registry list and shows read-only history, details and selected semantics', async () => {
    const router = renderCenter();
    const alice = await screen.findByRole('button', {
      name: /Alice conversation/,
    });
    fireEvent.click(alice);
    await screen.findByText('Latest answer');
    expect(screen.getByTestId('history')).toHaveAttribute(
      'data-readonly',
      'true',
    );
    expect(screen.getByTestId('history')).toHaveAttribute(
      'data-actions',
      'false',
    );
    expect(alice).toHaveAttribute('aria-current', 'true');
    expect(router.state.location.search).toContain('session=a');
    fireEvent.click(
      screen.getByRole('button', { name: 'Conversation details' }),
    );
    expect(await screen.findByText('app-one')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'New conversation' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Conversation actions' }),
    ).not.toBeInTheDocument();
    expect(mocks.messages).toHaveBeenCalledWith(
      mocks.api,
      'a',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('persists search and pagination in the URL and supports history navigation', async () => {
    const router = renderCenter('?keep=value');
    await screen.findByRole('button', { name: /Alice conversation/ });
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() =>
      expect(mocks.list).toHaveBeenLastCalledWith(
        mocks.api,
        expect.objectContaining({ page: 2 }),
      ),
    );
    const search = screen.getByRole('searchbox', {
      name: 'Search conversations',
    });
    fireEvent.change(search, { target: { value: 'Bob' } });
    fireEvent.submit(search.closest('form')!);
    await waitFor(() =>
      expect(mocks.list).toHaveBeenLastCalledWith(
        mocks.api,
        expect.objectContaining({ keyword: 'Bob', page: 1 }),
      ),
    );
    expect(router.state.location.search).toContain('keyword=Bob');
    expect(router.state.location.search).toContain('keep=value');
    await act(() => router.navigate(-1));
    await waitFor(() => expect(search).toHaveValue(''));
    expect(router.state.location.search).toContain('page=2');
  });

  it('restores a direct conversation link and does not refetch the list on selection', async () => {
    const router = renderCenter('?keyword=Alice&page=2&session=a');
    await screen.findByText('Latest answer');
    await screen.findByRole('button', { name: /Bob conversation/ });
    const count = mocks.list.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /Bob conversation/ }));
    expect(router.state.location.search).toContain('session=b');
    await waitFor(() =>
      expect(mocks.messages).toHaveBeenLastCalledWith(
        mocks.api,
        'b',
        expect.anything(),
      ),
    );
    expect(mocks.list).toHaveBeenCalledTimes(count);
  });

  it('loads earlier messages inline, keeps overlaps unique, and retries locally', async () => {
    renderCenter('?session=a');
    await screen.findByText('Latest answer');
    mocks.messages.mockRejectedValueOnce(
      new Error('Temporary network failure'),
    );
    fireEvent.click(
      within(screen.getByTestId('history')).getByRole('button', {
        name: 'Load earlier messages',
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Temporary network failure',
    );
    expect(screen.getByText('Latest answer')).toBeInTheDocument();
    mocks.messages.mockResolvedValueOnce({
      messages: [message('1', 'Earlier answer'), message('2', 'Latest answer')],
      hasMore: false,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('Earlier answer');
    expect(screen.getAllByText('Latest answer')).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: 'Load earlier messages' }),
    ).not.toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledTimes(1);
  });

  it('ignores a late response after switching sessions', async () => {
    let resolveFirst!: (value: unknown) => void;
    mocks.messages.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    renderCenter();
    fireEvent.click(
      await screen.findByRole('button', { name: /Alice conversation/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: /Bob conversation/ }));
    await screen.findByText('Latest answer');
    await act(async () =>
      resolveFirst({
        messages: [message('wrong', 'Stale Alice answer')],
        hasMore: false,
      }),
    );
    expect(screen.queryByText('Stale Alice answer')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Bob conversation' }),
    ).toBeInTheDocument();
  });

  it('surfaces errors without false empty messages and offers independent retries', async () => {
    mocks.list.mockRejectedValueOnce(new Error('Forbidden'));
    renderCenter();
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden');
    expect(screen.queryByText('No conversations yet.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    mocks.messages.mockRejectedValueOnce(new Error('History unavailable'));
    fireEvent.click(
      await screen.findByRole('button', { name: /Alice conversation/ }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'History unavailable',
    );
    expect(
      screen.queryByText('No messages in this conversation.'),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('Latest answer');
  });

  it('keeps the transcript mounted and readable while changing the list page', async () => {
    const router = renderCenter('?session=a');
    await screen.findByText('Latest answer');
    await act(async () => {
      await router.navigate('/settings/ai/conversations?session=a&page=2');
    });
    expect(screen.getByText('Latest answer')).toBeInTheDocument();
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
    expect(mocks.messages).toHaveBeenCalledTimes(1);
  });

  it('returns to the last available page after conversations disappear', async () => {
    mocks.list.mockResolvedValue({ rows, count: 2, page: 1, pageSize: 30 });
    const router = renderCenter('?page=5');
    await waitFor(() =>
      expect(router.state.location.search).not.toContain('page=5'),
    );
    await waitFor(() =>
      expect(mocks.list).toHaveBeenLastCalledWith(
        mocks.api,
        expect.objectContaining({ page: 1 }),
      ),
    );
  });

  it('returns to the list without clearing search or page', async () => {
    const router = renderCenter('?keyword=Alice&page=2&session=a');
    await screen.findByText('Latest answer');
    fireEvent.click(
      screen.getByRole('button', { name: 'Back to conversations' }),
    );
    expect(router.state.location.search).not.toContain('session=');
    expect(router.state.location.search).toContain('keyword=Alice');
    expect(router.state.location.search).toContain('page=2');
  });
});
