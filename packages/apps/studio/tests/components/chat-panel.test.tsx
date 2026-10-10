import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatPanel } from '../../client/extensions/nocobase-agent-chat/chat-panel';

const store = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const initial = {
    open: true,
    mode: 'docked',
    view: 'chat',
    conversationId: 'first' as string | null,
  };
  let state = initial;
  return {
    initial,
    get: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (patch: Partial<typeof initial>) => {
      state = { ...state, ...patch };
      for (const listener of listeners) listener();
    },
    openPage: vi.fn(),
    mobile: false,
  };
});
vi.mock('@nocobase/app-plugin-agents/client/chat', () => ({
  CHAT_MOBILE_QUERY: 'mobile',
  CHAT_DOCK_QUERY: 'wide',
  CHAT_PANEL_ATTRIBUTE: 'data-chat-panel',
  CHAT_PANEL_ID: 'chat-panel',
  useChatPanel: () => ({
    ...useSyncExternalStore(store.subscribe, store.get),
    available: true,
    setMode: (mode: string) => store.update({ mode }),
    setView: (view: string) => store.update({ view }),
    closeChat: () => store.update({ open: false }),
    selectConversation: (conversationId: string | null) =>
      store.update({ conversationId, view: 'chat' }),
    focusComposer: () =>
      queueMicrotask(() =>
        document.querySelector<HTMLTextAreaElement>('textarea')?.focus(),
      ),
    openPage: store.openPage,
  }),
  useConversation: (id: string | null) => ({
    data: id ? { id, title: id } : null,
  }),
  useConversationActions: () => ({
    archive: { mutate: vi.fn() },
    rename: { mutate: vi.fn() },
  }),
  useChatAgents: () => ({ data: [] }),
  useConversationSources: () => [],
  useAgentText: () => ({ name: () => 'Assistant' }),
  useFormatters: () => ({ relative: () => 'now' }),
  useConversationList: () => ({
    data: {
      pages: [
        {
          items: ['first', 'second'].map((id) => ({
            id,
            title: id,
            read: true,
            agent: {},
            source: 'panel',
            lastMessageAt: '2026-10-10',
          })),
        },
      ],
    },
  }),
}));
vi.mock(
  '../../client/extensions/nocobase-agent-chat/use-media-query.js',
  () => ({
    useMediaQuery: (query: string) =>
      query === 'mobile' ? store.mobile : true,
  }),
);
vi.mock('../../client/extensions/nocobase-agent-chat/chat-i18n.js', () => ({
  useChatTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../client/extensions/nocobase-agent-chat/agent-status.js', () => ({
  AgentLine: () => null,
}));
vi.mock('../../client/extensions/nocobase-agent-chat/chat-ui.js', () => ({
  ChatTag: () => null,
  LoadError: () => null,
  Pulse: () => null,
}));
// Local state makes a remount observable. Browser coverage checks the real composer's files and context as well.
vi.mock(
  '../../client/extensions/nocobase-agent-chat/conversation-view.js',
  () => ({
    ConversationView: ({
      conversationId,
    }: {
      conversationId: string | null;
    }) => (
      <section aria-label='Conversation'>
        <span>{conversationId ?? 'new'}</span>
        <textarea aria-label='Draft' defaultValue='' />
      </section>
    ),
  }),
);

beforeEach(() => {
  store.update(store.initial);
  store.mobile = false;
  store.openPage.mockClear();
});

describe('ChatPanel full width', () => {
  it('expands existing conversations in place and preserves the composer when restored', () => {
    render(<ChatPanel />);
    const draft = screen.getByRole('textbox', { name: 'Draft' });
    fireEvent.change(draft, { target: { value: 'unsent draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'chat.expand' }));
    expect(
      screen.getByRole('list', { name: 'chat.history.title' }),
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(draft);
    expect(draft).toHaveValue('unsent draft');
    expect(store.openPage).not.toHaveBeenCalled();
    expect(screen.queryByTestId('chat-history-button')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'chat.restoreSize' }));
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(draft);
    expect(draft).toHaveValue('unsent draft');
  });

  it('switches from the reused history and marks the current conversation, then starts a new one', () => {
    render(<ChatPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'chat.expand' }));
    const list = screen.getByRole('list', { name: 'chat.history.title' });
    expect(
      within(list).getByRole('button', { name: /first/u }),
    ).toHaveAttribute('aria-current', 'true');
    fireEvent.click(within(list).getByRole('button', { name: /second/u }));
    expect(
      screen.getByRole('region', { name: 'Conversation' }),
    ).toHaveTextContent('second');
    expect(
      within(list).getByRole('button', { name: /second/u }),
    ).toHaveAttribute('aria-current', 'true');
    expect(
      within(list).getByRole('button', { name: /first/u }),
    ).not.toHaveAttribute('aria-current');
    expect(
      within(list)
        .getByRole('button', { name: /second/u })
        .querySelector('svg'),
    ).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(
      screen.getByRole('button', { name: 'chat.newConversation' }),
    );
    expect(
      screen.getByRole('region', { name: 'Conversation' }),
    ).toHaveTextContent('new');
    expect(list.querySelector('[aria-current]')).toBeNull();
  });

  it('expands from history and Escape restores the current conversation before closing', () => {
    store.update({ view: 'history' });
    render(<ChatPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'chat.expand' }));
    expect(
      screen.getByRole('region', { name: 'Conversation' }),
    ).toHaveTextContent('first');
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.getByTestId('chat-panel')).toHaveAttribute(
      'data-mode',
      'docked',
    );
    expect(screen.getByRole('region', { name: 'Conversation' })).toBeVisible();
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.getByTestId('chat-panel')).not.toBeVisible();
  });

  it('returns focus to the composer when Escape removes the full-width list', async () => {
    render(<ChatPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'chat.expand' }));
    const row = within(screen.getByRole('list')).getByRole('button', {
      name: /first/u,
    });
    row.focus();
    fireEvent.keyDown(row, { key: 'Escape' });
    expect(screen.queryByRole('list')).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveFocus(),
    );
  });

  it('keeps the phone in a single view even when the saved mode is expanded', async () => {
    store.mobile = true;
    store.update({ mode: 'expanded' });
    render(<ChatPanel />);
    expect(screen.getByTestId('chat-panel')).toHaveAttribute(
      'data-mode',
      'mobile',
    );
    await waitFor(() => expect(screen.getByTestId('chat-panel')).toHaveFocus());
    expect(screen.queryByTestId('chat-expand')).toBeNull();
    fireEvent.click(screen.getByTestId('chat-history-button'));
    expect(screen.queryByRole('region', { name: 'Conversation' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /second/u }));
    expect(screen.queryByRole('list')).toBeNull();
    expect(
      screen.getByRole('region', { name: 'Conversation' }),
    ).toHaveTextContent('second');
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
  });
});
