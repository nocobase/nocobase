import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SessionList } from '../../client/components/session-list.js';
import plugin from '../../client/plugin.js';

describe('session list archive navigation', () => {
  it.each([
    {
      locale: 'en-US',
      archived: 'Archived',
      title: 'My agents',
      computers: 'My computers',
      back: 'Back to sessions',
    },
    {
      locale: 'zh-CN',
      archived: '已归档',
      title: '我的 Agent',
      computers: '我的电脑',
      back: '返回会话',
    },
  ])(
    'names the archived list and toggles it from the footer in $locale',
    async ({ locale, archived, title, computers, back }) => {
      await renderWithApp(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <SessionList activeId={undefined} />
        </QueryClientProvider>,
        {
          locale,
          namespace: '@nocobase/app-plugin-agent-sessions',
          plugins: [plugin({ routes: false })],
          fetch: answerApi(() => ({ data: [], meta: {} })),
        },
      );
      const archive = screen.getByRole('button', {
        name: archived,
        exact: true,
      });
      const footer = archive.parentElement!;
      expect(archive.title).toBe(archived);
      expect(
        within(footer).getByRole('button', { name: computers }).title,
      ).toBe(computers);
      fireEvent.click(archive);
      expect(
        await screen.findByRole('heading', { name: archived }),
      ).toBeVisible();
      expect(
        within(footer)
          .getByRole('button', { name: archived })
          .getAttribute('aria-pressed'),
      ).toBe('true');
      fireEvent.click(screen.getByRole('button', { name: back }));
      expect(screen.getByRole('heading', { name: title })).toBeTruthy();
      expect(archive).toHaveAttribute('aria-pressed', 'false');
    },
  );
});

it('shows an unread mark and a permission label together, including an offline computer', async () => {
  const { AgentSessionsConfigContext } = await import('../../client/config.js');
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const session = {
    id: 's',
    title: 'Pending conversation',
    links: [],
    waiting: true,
    computerOnline: false,
    running: false,
    archivedAt: null,
    lastActivityAt: new Date().toISOString(),
  };
  await renderWithApp(
    <QueryClientProvider client={query}>
      <AgentSessionsConfigContext.Provider
        value={{
          cli: 'app',
          connectPrompt: null,
          linkPanels: {},
          sessionMarks: () => <span role='img' aria-label='Unread reply' />,
        }}
      >
        <SessionList activeId={undefined} />
      </AgentSessionsConfigContext.Provider>
    </QueryClientProvider>,
    {
      locale: 'en-US',
      namespace: '@nocobase/app-plugin-agent-sessions',
      plugins: [plugin({ routes: false })],
      fetch: answerApi(() => ({ data: [session], meta: {} })),
    },
  );
  expect(await screen.findByText('Waiting for your permission')).toBeVisible();
  expect(screen.getByRole('img', { name: 'Unread reply' })).toBeVisible();
});

it('keeps standalone search and status filters above a plain empty list and a neutral new-session link', async () => {
  await renderWithApp(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SessionList activeId={undefined} />
    </QueryClientProvider>,
    {
      locale: 'en-US',
      namespace: '@nocobase/app-plugin-agent-sessions',
      plugins: [plugin({ routes: false })],
      fetch: answerApi(() => ({ data: [], meta: {} })),
    },
  );
  const list = screen.getByRole('region', { name: 'Sessions' });
  const create = within(list).getByRole('button', { name: 'New session' });
  expect(create).toHaveAttribute('href', '/agent-sessions?new');
  expect(create).not.toHaveTextContent('New session');
  expect(
    await within(list).findByText(
      'No sessions yet. Start one to talk with an agent on your computer.',
    ),
  ).toBeVisible();
  fireEvent.change(
    within(list).getByRole('textbox', { name: 'Search sessions' }),
    { target: { value: 'no match' } },
  );
  fireEvent.click(within(list).getByRole('button', { name: 'Needs me 0' }));
  expect(
    within(list).getByText(
      'No sessions yet. Start one to talk with an agent on your computer.',
    ),
  ).toBeVisible();
  fireEvent.click(
    within(list).getByRole('button', { name: 'Archived', exact: true }),
  );
  expect(within(list).queryByRole('group', { name: 'Show' })).toBeNull();
  expect(
    within(list).getByRole('textbox', { name: 'Search sessions' }),
  ).toHaveValue('no match');
});

it('calls the new-session handler from the collapsed rail entry', async () => {
  const onNewSession = vi.fn();
  await renderWithApp(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SessionList activeId={undefined} rail onNewSession={onNewSession} />
    </QueryClientProvider>,
    {
      locale: 'en-US',
      namespace: '@nocobase/app-plugin-agent-sessions',
      plugins: [plugin({ routes: false })],
      fetch: answerApi(() => ({ data: [], meta: {} })),
    },
  );

  const create = screen.getByRole('button', { name: 'New session' });
  expect(create).toHaveAttribute('href', '/agent-sessions?new');
  fireEvent.click(create);
  expect(onNewSession).toHaveBeenCalledOnce();
});

it('exposes fold, expand and overlay dismissal without moving the new-session entry', async () => {
  const onFold = vi.fn();
  const onExpand = vi.fn();
  const renderList = (placement: 'column' | 'rail' | 'overlay') => (
    <QueryClientProvider client={new QueryClient()}>
      <SessionList
        activeId={undefined}
        placement={placement}
        onFold={onFold}
        onExpand={onExpand}
      />
    </QueryClientProvider>
  );
  const view = await renderWithApp(renderList('column'), {
    locale: 'en-US',
    namespace: '@nocobase/app-plugin-agent-sessions',
    plugins: [plugin({ routes: false })],
    fetch: answerApi(() => ({ data: [], meta: {} })),
  });
  fireEvent.click(screen.getByRole('button', { name: 'Hide sessions' }));
  expect(onFold).toHaveBeenCalledOnce();
  view.rerender(renderList('rail'));
  fireEvent.click(screen.getByRole('button', { name: 'Show sessions' }));
  expect(onExpand).toHaveBeenCalledOnce();
  view.rerender(renderList('overlay'));
  const show = screen.getByRole('button', { name: 'Show sessions' });
  expect(show).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(show);
  expect(onFold).toHaveBeenCalledTimes(2);
});
