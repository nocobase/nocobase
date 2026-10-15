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
      back: 'Back to sessions',
      title: 'My agents',
      computers: 'My computers',
    },
    {
      locale: 'zh-CN',
      archived: '已归档',
      back: '返回会话',
      title: '我的 Agent',
      computers: '我的电脑',
    },
  ])(
    'returns from the archive through the heading in $locale',
    async ({ locale, archived, back, title, computers }) => {
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
      const heading = await screen.findByRole('heading', { name: archived });
      const backButton = screen.getByRole('button', { name: back });
      expect(heading.parentElement!.contains(backButton)).toBe(true);
      expect(footer.contains(backButton)).toBe(false);
      expect(
        within(footer)
          .getByRole('button', { name: archived })
          .getAttribute('aria-pressed'),
      ).toBe('true');
      fireEvent.click(backButton);
      expect(screen.getByRole('heading', { name: title })).toBeTruthy();
      expect(screen.queryByRole('button', { name: back })).toBeNull();
    },
  );
});
