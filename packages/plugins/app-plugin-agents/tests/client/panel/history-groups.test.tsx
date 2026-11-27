// @vitest-environment jsdom
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatProvider } from '../../../client/chat.js';
import enUS from '../../../client/locales/en-US.js';
import { historyGroup } from '../../../client/panel/history-groups.js';
import {
  DefaultConversationListItem,
  HistoryList,
  type ConversationListItemProps,
} from '../../../client/panel/history-list.js';
import type { ConversationSummary } from '../../../shared/conversations.js';
import { agentsUi } from '../../../client/ui-registry.js';
import { resetChatDemo } from './fixtures/chat-client.js';
import { appResources } from './fixtures/i18n.js';

// One demo conversation waits for its owner: the list puts it first, under "Waiting for you".
vi.mock('../../../client/chat.js', async () => {
  const demo = await import('./fixtures/chat-client.js');
  return {
    ...demo,
    useConversationList: ((filter) => {
      const list = demo.useConversationList(filter) as unknown as {
        data: { pages: { items: ConversationSummary[] }[] };
      };
      return {
        ...list,
        data: {
          ...list.data,
          pages: list.data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === 'release-follow-up'
                ? {
                    ...item,
                    needsYou: { reason: 'reply', seq: 2, text: null },
                  }
                : item,
            ),
          })),
        },
      };
    }) as typeof demo.useConversationList,
  };
});
afterEach(() => resetChatDemo());

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/test-app', resources: appResources },
  namespaces: { '@nocobase/app-plugin-agents': enUS },
});

function Shell({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ChatProvider>{children}</ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}

const base = {
  needsYou: null,
  run: null,
  execution: undefined,
} as unknown as ConversationSummary;

describe('historyGroup', () => {
  it('puts what needs the owner first, then what is running, then the rest', () => {
    expect(
      historyGroup({
        ...base,
        needsYou: { reason: 'confirm', seq: 1, text: 'Ship it?' },
        run: { id: 'r', status: 'running', acceptsInput: true },
      } as ConversationSummary),
    ).toBe('waiting');
    expect(
      historyGroup({
        ...base,
        run: { id: 'r', status: 'running', acceptsInput: true },
      } as ConversationSummary),
    ).toBe('running');
    expect(
      historyGroup({
        ...base,
        execution: { status: 'running' },
      } as ConversationSummary),
    ).toBe('running');
    expect(
      historyGroup({
        ...base,
        execution: { status: 'idle', outcome: 'failed' },
      } as ConversationSummary),
    ).toBe('recent');
  });
});

describe('HistoryList', () => {
  it('groups the viewer’s own conversations into waiting, in progress and recent', async () => {
    render(
      <Shell>
        <HistoryList mode='runner' activeId={null} onOpen={() => {}} />
      </Shell>,
    );
    const history = await screen.findByTestId('chat-history');
    const sections = [...history.querySelectorAll('[data-history-group]')];
    expect(
      sections.map((node) => node.getAttribute('data-history-group')),
    ).toEqual(['waiting', 'running', 'recent']);
    const waiting = within(history).getByRole('list', {
      name: 'Waiting for you',
    });
    expect(within(waiting).getByText('Release follow-up')).toBeVisible();
    const running = within(history).getByRole('list', { name: 'In progress' });
    expect(
      within(running).getByText('Fix the flaky sign-in test'),
    ).toBeVisible();
    const recent = within(history).getByRole('list', { name: 'Recent' });
    expect(
      within(recent).getByText('Summarize PM-12 Welcome tour'),
    ).toBeVisible();
    expect(within(recent).queryByText('Release follow-up')).toBeNull();
    expect(
      within(history).getByText(
        'Only your conversations are listed. A conversation shared with someone is read-only for them.',
      ),
    ).toBeVisible();
  });

  it('renders a replacement row with the row’s props and the plugin’s own row', async () => {
    const seen: ConversationListItemProps[] = [];
    const undo = agentsUi.components.replace<ConversationListItemProps>(
      'ConversationListItem',
      ({ Default, ...props }) => {
        seen.push(props);
        expect(Default).toBe(DefaultConversationListItem);
        return (
          <li data-testid='custom-row'>
            {`★ ${props.item.title ?? ''}`}
            <ul>
              <Default {...props} />
            </ul>
          </li>
        );
      },
    );
    const view = render(
      <Shell>
        <HistoryList mode='runner' activeId='flaky-test' onOpen={() => {}} />
      </Shell>,
    );
    expect(
      await screen.findByText('★ Fix the flaky sign-in test'),
    ).toBeVisible();
    const active = seen.find((props) => props.item.id === 'flaky-test');
    expect(active?.active).toBe(true);
    expect(typeof active?.onOpen).toBe('function');
    expect(active?.onOpenPage).toBeNull();
    // The default row still renders inside the replacement.
    expect(
      screen.getAllByRole('button', { name: /Fix the flaky sign-in test/u }),
    ).not.toHaveLength(0);
    undo();
    view.rerender(
      <Shell>
        <HistoryList mode='runner' activeId={null} onOpen={() => {}} />
      </Shell>,
    );
    expect(screen.queryByTestId('custom-row')).toBeNull();
    expect(await screen.findByText('Fix the flaky sign-in test')).toBeVisible();
  });
});
