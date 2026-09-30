// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import locales from '../client/locales/index.js';
import ConversationsSettingsPage from '../client/pages/conversations-settings-page.js';
import ConversationDetailPage from '../client/pages/conversations/detail.js';
import type {
  ConversationUser,
  ManagedConversation,
} from '../client/conversation-center-service.js';
import packageMetadata from '../package.json' with { type: 'json' };

const mocks = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => mocks.api,
}));

const sessionA = '0f8fad5b-d9cb-469f-a165-70867728950e';
const sessionB = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const users: ConversationUser[] = [
  { id: 'member', name: 'Mia Member', username: 'mia' },
  { id: 'root', name: 'Root Admin', username: 'root' },
];
const rows: ManagedConversation[] = [
  {
    sessionId: sessionA,
    title: 'Quarterly plan',
    userId: 'member',
    aiEmployeeUsername: 'ada',
    updatedAt: '2026-09-02T08:30:00.000Z',
    user: users[0],
    aiEmployee: { username: 'ada', nickname: 'Ada Analyst', avatar: null },
  },
  {
    sessionId: sessionB,
    title: '',
    userId: 'gone',
    aiEmployeeUsername: 'bob',
    updatedAt: '2026-09-01T08:30:00.000Z',
    user: null,
    aiEmployee: { username: 'bob', nickname: null, avatar: null },
  },
];

interface RequestOptions {
  path: string;
  query?: Record<string, string | number>;
}

function requestsTo(action: string): RequestOptions[] {
  return mocks.api.request.mock.calls
    .map(([options]) => options as RequestOptions)
    .filter((options) => options.path === `ai/${action}`);
}

function historyRow(id: string, role: 'user' | 'assistant', text: string) {
  return { key: id, role, content: { messageId: id, content: text } };
}

function respond(options: RequestOptions): unknown {
  switch (options.path) {
    case 'ai/aiEmployees:list':
      return [
        { username: 'ada', nickname: 'Ada Analyst' },
        { username: 'bob', nickname: 'Bob Builder', deprecated: true },
      ];
    case 'ai/aiConversations:listUsers': {
      const keyword = String(options.query?.keyword ?? '').toLowerCase();
      return {
        rows: users.filter(
          (user) =>
            (!options.query?.userId || user.id === options.query.userId) &&
            `${user.name} ${user.username}`.toLowerCase().includes(keyword),
        ),
      };
    }
    case 'ai/aiConversations:listAll': {
      const page = Number(options.query?.page ?? 1);
      return {
        rows: page === 1 ? rows : [{ ...rows[0], sessionId: sessionB }],
        count: 31,
        page,
        pageSize: 30,
        totalPages: 2,
      };
    }
    case 'ai/aiConversations:getAllMessages':
      if (options.query?.sessionId !== sessionA) {
        return Promise.reject(
          Object.assign(new Error('Conversation not found'), { status: 404 }),
        );
      }
      return options.query?.cursor === '11'
        ? {
            rows: [historyRow('10', 'user', 'The very first question')],
            hasMore: false,
            cursor: '10',
          }
        : {
            rows: [
              historyRow('12', 'assistant', 'Here is the plan'),
              historyRow('11', 'user', 'Draft the quarterly plan'),
            ],
            hasMore: true,
            cursor: '11',
          };
    default:
      throw new Error(`Unexpected request ${options.path}`);
  }
}

async function renderCenter(entry = '/settings/ai/conversations') {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: '@test/app',
  });
  runtime.registerNamespace(packageMetadata.name, locales);
  await runtime.init('en-US');
  const router = createMemoryRouter(
    [
      {
        path: '/settings/ai/conversations',
        Component: ConversationsSettingsPage,
        children: [{ path: ':sessionId', Component: ConversationDetailPage }],
      },
    ],
    { initialEntries: [entry] },
  );
  render(
    <I18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  return router;
}

function search(router: ReturnType<typeof createMemoryRouter>) {
  return Object.fromEntries(new URLSearchParams(router.state.location.search));
}

beforeEach(() => {
  Element.prototype.scrollTo = vi.fn();
  mocks.api.request
    .mockReset()
    .mockImplementation(async (options) => respond(options as RequestOptions));
});

describe('Conversation center page', () => {
  it('lists every user’s conversations with their owner and employee, and pages through the URL', async () => {
    const router = await renderCenter();
    expect(
      screen.getByRole('heading', { name: 'Conversations', level: 1 }),
    ).toBeInTheDocument();
    const table = await screen.findByRole('table');
    const [, first, second] = within(table).getAllByRole('row');
    expect(within(first!).getByText('Quarterly plan')).toBeInTheDocument();
    expect(within(first!).getByText('Mia Member')).toBeInTheDocument();
    expect(within(first!).getByText('mia')).toBeInTheDocument();
    expect(within(first!).getByText('Ada Analyst')).toBeInTheDocument();
    expect(
      within(second!).getByText('Untitled conversation'),
    ).toBeInTheDocument();
    // A user who no longer exists is still identified by the stored id.
    expect(within(second!).getByText('gone')).toBeInTheDocument();
    expect(within(second!).getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('31 conversations')).toBeInTheDocument();
    expect(requestsTo('aiConversations:listAll')).toEqual([
      expect.objectContaining({ query: { page: 1, pageSize: 30 } }),
    ]);

    const pages = screen.getByRole('navigation', {
      name: 'Conversation pages',
    });
    expect(within(pages).getByText('Page 1 of 2')).toBeInTheDocument();
    expect(
      within(pages).getByRole('button', { name: 'Previous' }),
    ).toBeDisabled();
    fireEvent.click(within(pages).getByRole('button', { name: 'Next' }));
    expect(await within(pages).findByText('Page 2 of 2')).toBeInTheDocument();
    expect(search(router)).toEqual({ page: '2' });
    expect(requestsTo('aiConversations:listAll').at(-1)?.query).toEqual({
      page: 2,
      pageSize: 30,
    });
    await act(() => router.navigate(-1));
    expect(await within(pages).findByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('restores combined filters and the page from the URL', async () => {
    await renderCenter(
      '/settings/ai/conversations?userId=member&aiEmployee=bob&title=plan&page=2',
    );
    await screen.findByRole('table');
    expect(requestsTo('aiConversations:listAll')[0]?.query).toEqual({
      keyword: 'plan',
      userId: 'member',
      aiEmployeeUsername: 'bob',
      page: 2,
      pageSize: 30,
    });
    expect(screen.getByLabelText('Title')).toHaveValue('plan');
    // The URL names the user by id; the label comes from one lookup.
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'User' })).toHaveValue(
        'Mia Member',
      ),
    );
    expect(requestsTo('aiConversations:listUsers')).toContainEqual(
      expect.objectContaining({ query: { userId: 'member' } }),
    );
    // A deprecated employee is still offered, since its conversations remain.
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'AI employee' })).toHaveValue(
        'Bob Builder',
      ),
    );
  });

  it('debounces the title search, then starts again from the first page', async () => {
    const router = await renderCenter('/settings/ai/conversations?page=2');
    await screen.findByRole('table');
    const title = screen.getByLabelText('Title');
    for (const value of ['Q', 'Qua', 'Quarter ']) {
      fireEvent.change(title, { target: { value } });
    }
    expect(requestsTo('aiConversations:listAll')).toHaveLength(1);
    await waitFor(() => expect(search(router)).toEqual({ title: 'Quarter' }));
    await waitFor(() =>
      expect(requestsTo('aiConversations:listAll')).toHaveLength(2),
    );
    expect(requestsTo('aiConversations:listAll')[1]?.query).toEqual({
      keyword: 'Quarter',
      page: 1,
      pageSize: 30,
    });
    // Typing replaces the history entry instead of adding one per pause.
    expect(router.state.historyAction).toBe('REPLACE');
    expect(title).toHaveValue('Quarter ');
  });

  it('searches users on the server and filters by the chosen user and employee', async () => {
    const router = await renderCenter();
    await screen.findByRole('table');
    const user = screen.getByRole('combobox', { name: 'User' });
    await act(async () => {
      user.focus();
    });
    // Opening from the keyboard; jsdom has no pointer to press the input with.
    fireEvent.keyDown(user, { key: 'ArrowDown' });
    fireEvent.change(user, { target: { value: 'roo' } });
    fireEvent.click(await screen.findByRole('option', { name: /Root Admin/ }));
    expect(requestsTo('aiConversations:listUsers')).toContainEqual(
      expect.objectContaining({ query: { keyword: 'roo' } }),
    );
    await waitFor(() => expect(search(router)).toEqual({ userId: 'root' }));

    const employee = screen.getByRole('combobox', { name: 'AI employee' });
    await act(async () => {
      employee.focus();
    });
    fireEvent.keyDown(employee, { key: 'ArrowDown' });
    fireEvent.change(employee, { target: { value: 'ada' } });
    fireEvent.click(await screen.findByRole('option', { name: /Ada Analyst/ }));
    await waitFor(() =>
      expect(search(router)).toEqual({ userId: 'root', aiEmployee: 'ada' }),
    );
    await waitFor(() =>
      expect(requestsTo('aiConversations:listAll').at(-1)?.query).toEqual({
        userId: 'root',
        aiEmployeeUsername: 'ada',
        page: 1,
        pageSize: 30,
      }),
    );
  });

  it('opens a read-only transcript in a routed drawer and loads earlier messages on request', async () => {
    const router = await renderCenter(
      '/settings/ai/conversations?aiEmployee=ada',
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Quarterly plan' }),
    );
    const drawer = await screen.findByRole('dialog', {
      name: 'Conversation details',
    });
    expect(router.state.location).toMatchObject({
      pathname: `/settings/ai/conversations/${sessionA}`,
      search: '?aiEmployee=ada',
    });
    expect(await within(drawer).findByText('Here is the plan')).toBeVisible();
    expect(within(drawer).getByText('Draft the quarterly plan')).toBeVisible();
    expect(within(drawer).getByText('Mia Member')).toBeInTheDocument();
    expect(within(drawer).getByText(sessionA)).toBeInTheDocument();
    expect(within(drawer).getByText('Read only')).toBeInTheDocument();
    expect(within(drawer).queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole('button', {
        name: /Send|Retry response|Edit message/,
      }),
    ).not.toBeInTheDocument();
    expect(requestsTo('aiConversations:getAllMessages')).toEqual([
      expect.objectContaining({ query: { sessionId: sessionA } }),
    ]);

    fireEvent.click(
      within(drawer).getByRole('button', { name: 'Load earlier messages' }),
    );
    expect(
      await within(drawer).findByText('The very first question'),
    ).toBeInTheDocument();
    expect(requestsTo('aiConversations:getAllMessages')[1]?.query).toEqual({
      sessionId: sessionA,
      cursor: '11',
    });
    const log = within(drawer).getByRole('log');
    const texts = within(log)
      .getAllByText(/question|plan/)
      .map((element) => element.textContent);
    expect(texts).toEqual([
      'The very first question',
      'Draft the quarterly plan',
      'Here is the plan',
    ]);
    expect(
      within(drawer).queryByRole('button', { name: 'Load earlier messages' }),
    ).not.toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(router.state.location).toMatchObject({
      pathname: '/settings/ai/conversations',
      search: '?aiEmployee=ada',
    });
  });

  it('reports a conversation the URL names but the server does not know', async () => {
    await renderCenter(`/settings/ai/conversations/${sessionB}`);
    const drawer = await screen.findByRole('dialog', {
      name: 'Conversation details',
    });
    expect(
      await within(drawer).findByText('Conversation not found.'),
    ).toBeInTheDocument();
  });

  it('offers a retry when the list cannot be loaded', async () => {
    mocks.api.request.mockImplementation(async (options: RequestOptions) => {
      if (options.path === 'ai/aiConversations:listAll')
        throw new Error('offline');
      return respond(options);
    });
    await renderCenter();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(requestsTo('aiConversations:listAll')).toHaveLength(2);
    mocks.api.request.mockImplementation(async (options) =>
      respond(options as RequestOptions),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
