import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SessionList } from '../../client/components/session-list.js';
import plugin from '../../client/plugin.js';

describe('session list archive navigation', () => {
  it.each([
    {
      locale: 'en-US',
      archived: 'Archived',
      title: 'My agents',
      computers: 'My computers',
    },
    {
      locale: 'zh-CN',
      archived: '已归档',
      title: '我的 Agent',
      computers: '我的电脑',
    },
  ])(
    'keeps the mode title and toggles archive from the footer in $locale',
    async ({ locale, archived, title, computers }) => {
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
      expect(await screen.findByRole('heading', { name: title })).toBeVisible();
      expect(
        within(footer)
          .getByRole('button', { name: archived })
          .getAttribute('aria-pressed'),
      ).toBe('true');
      fireEvent.click(archive);
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
  expect(await within(list).findByText('No conversations')).toBeVisible();
  fireEvent.change(
    within(list).getByRole('textbox', { name: 'Search sessions' }),
    { target: { value: 'no match' } },
  );
  fireEvent.click(within(list).getByRole('button', { name: 'Needs me 0' }));
  expect(within(list).getByText('No conversations')).toBeVisible();
  fireEvent.click(
    within(list).getByRole('button', { name: 'Archived', exact: true }),
  );
  expect(within(list).getByRole('group', { name: 'Show' })).toBeVisible();
  expect(
    within(list).getByRole('button', { name: 'Needs me 0' }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    within(list).getByRole('textbox', { name: 'Search sessions' }),
  ).toHaveValue('no match');
});
