// @vitest-environment jsdom
import { QueryClient } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { ConversationDetail } from '../../../shared/conversations.js';
import { afterEach, expect, it, vi } from 'vitest';
import { SnapshotView } from '../../../client/panel/snapshot-view.js';
import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';

const queries = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
vi.mock('../../../client/chat.js', async (original) => ({
  ...(await original<typeof import('../../../client/chat.js')>()),
  agentsQueryClient: () => queries,
  useChatApi: () => ({
    messages: async () => ({
      items: [
        {
          id: 'reply',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Saved answer' }],
        },
      ],
    }),
    conversationLinks: async () => [],
  }),
}));
afterEach(() => queries.clear());

it.each([
  ['en-US', enUS],
  ['zh-CN', zhCN],
] as const)(
  'shows the %s cutoff and the conversation agent, including its deleted fallback',
  async (locale, resources) => {
    const runtime = await createTestI18nRuntime({
      locale,
      namespaces: { '@nocobase/app-plugin-agents': resources },
    });
    const snapshotAt = '2026-11-04T14:35:00.000Z';
    const conversation = {
      id: 'snapshot',
      updatedAt: snapshotAt,
      snapshot: { cutoffSeq: 2, snapshotAt },
      agent: {
        id: 'actual-agent',
        name: 'Research assistant',
        nameText: null,
        avatar: null,
        archived: false,
      },
    } as ConversationDetail;
    const view = render(
      <TestI18nProvider runtime={runtime}>
        <SnapshotView conversation={conversation} />
      </TestI18nProvider>,
    );
    const cutoff = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(snapshotAt));
    expect(
      screen.getByText(resources.chat.sharing.asOf.replace('{{time}}', cutoff)),
    ).toBeVisible();
    const log = screen.getByRole('log');
    expect(await within(log).findByText('Research assistant')).toBeVisible();
    expect(within(log).getByText('Saved answer')).toBeVisible();
    expect(
      within(log).queryByText(resources.chat.title),
    ).not.toBeInTheDocument();
    view.rerender(
      <TestI18nProvider runtime={runtime}>
        <SnapshotView
          conversation={{
            ...conversation,
            agent: { ...conversation.agent, name: null },
          }}
        />
      </TestI18nProvider>,
    );
    expect(within(log).getByText(resources.chat.agentGone)).toBeVisible();
    expect(
      within(log).queryByText('Research assistant'),
    ).not.toBeInTheDocument();
  },
);
