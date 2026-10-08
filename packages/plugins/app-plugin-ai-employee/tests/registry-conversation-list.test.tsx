/**
 * @vitest-environment jsdom
 */

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../client/locales/en-US.js';
import locales from '../client/locales/index.js';
import zhCN from '../client/locales/zh-CN.js';
import {
  AIConversationList,
  ConversationList,
} from '../registry/nocobase-ai/components/chat/conversation-list.js';

const chat = vi.hoisted(() => ({
  conversations: [{ id: 'one', title: 'First conversation', unread: true }],
  activeConversationId: 'one',
  selectConversation: vi.fn(),
  renameConversation: vi.fn(),
  removeConversation: vi.fn(),
  startNewConversation: vi.fn(),
  setConversationListOpen: vi.fn(),
  conversationsLoading: false,
  conversationSearch: '',
  searchConversations: vi.fn(),
  historyError: undefined,
}));
const useChat = vi.hoisted(() => vi.fn());
vi.mock('../registry/nocobase-ai/providers/index.js', () => ({
  useAIChatBase: () => useChat(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useChat.mockImplementation(() => {
    throw new Error('No provider');
  });
  chat.renameConversation.mockResolvedValue(undefined);
  chat.removeConversation.mockResolvedValue(undefined);
  chat.searchConversations.mockResolvedValue(undefined);
});

describe('AIConversationList', () => {
  it('renders slim records without a provider or mutation controls', () => {
    const select = vi.fn();
    render(
      <AIConversationList
        conversations={[
          { id: 'one', title: 'First', owner: 'Alice' },
          { id: 'two', title: 'Second', owner: 'Bob' },
        ]}
        activeConversationId='one'
        onSelect={select}
        renderMetadata={(conversation) => <span>{conversation.owner}</span>}
        footer={<button type='button'>Load more</button>}
      />,
    );
    expect(
      screen.getByRole('button', { name: /First.*Alice/ }),
    ).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByRole('heading', { name: 'Conversations' }),
    ).toBeInTheDocument();
    const second = screen.getByRole('button', { name: /Second.*Bob/ });
    expect(second).not.toHaveAttribute('aria-current');
    expect(second).toHaveAttribute('type', 'button');
    expect(second).toHaveClass('min-h-[44px]', 'focus-visible:ring-2');
    second.focus();
    expect(second).toHaveFocus();
    fireEvent.click(second);
    expect(select).toHaveBeenCalledWith('two');
    expect(
      screen.getByRole('button', { name: 'Load more' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('New conversation')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Conversation actions'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Close conversation list'),
    ).not.toBeInTheDocument();
    expect(useChat).not.toHaveBeenCalled();
  });

  it('renders optional controls and unread state only when requested', () => {
    const onCreate = vi.fn();
    const onClose = vi.fn();
    const action = vi.fn();
    const onSelect = vi.fn();
    render(
      <AIConversationList
        conversations={chat.conversations}
        onSelect={onSelect}
        onCreate={onCreate}
        onClose={onClose}
        renderActions={(conversation) => (
          <button onClick={() => action(conversation.id)}>Custom action</button>
        )}
      />,
    );
    expect(screen.getByLabelText('Unread conversation')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Close conversation list' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Custom action' }));
    expect(onCreate).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledWith('one');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('submits and clears controlled search without submitting on each keystroke', () => {
    const search = vi.fn();
    function SearchList() {
      const [value, setValue] = useState('');
      return (
        <AIConversationList
          conversations={[]}
          onSelect={vi.fn()}
          searchValue={value}
          onSearchChange={setValue}
          onSearch={search}
        />
      );
    }
    render(<SearchList />);
    const input = screen.getByRole('searchbox', {
      name: 'Search conversations',
    });
    expect(input).toHaveAttribute('name', 'conversation-search');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('enterkeyhint', 'search');
    expect(input).toHaveAttribute('placeholder', 'Search conversations…');
    expect(input).toHaveAttribute('data-slot', 'input-group-control');
    expect(input).toHaveClass('min-h-[44px]');
    fireEvent.change(input, { target: { value: 'meeting' } });
    expect(search).not.toHaveBeenCalled();
    const submit = screen.getByRole('button', { name: 'Search conversations' });
    expect(submit).toHaveAttribute('type', 'submit');
    expect(submit).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    fireEvent.click(submit);
    expect(search).toHaveBeenCalledExactlyOnceWith('meeting');
    // Native form submission also covers the keyboard/Enter path.
    fireEvent.submit(input.closest('form')!);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith('meeting');
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear conversation search' }),
    );
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenLastCalledWith('');
    expect(
      screen.queryByRole('button', { name: 'Clear conversation search' }),
    ).not.toBeInTheDocument();
  });

  it('renders loading and empty states based on the applied query, not the draft', () => {
    const { rerender } = render(
      <AIConversationList
        conversations={chat.conversations}
        onSelect={vi.fn()}
        loading
      />,
    );
    expect(screen.queryByText('First conversation')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading conversations…',
    );
    expect(screen.queryByText('No conversations yet.')).not.toBeInTheDocument();
    rerender(
      <AIConversationList
        conversations={[]}
        onSelect={vi.fn()}
        searchValue='draft'
        submittedSearchValue=''
      />,
    );
    expect(screen.getByText('No conversations yet.')).toBeInTheDocument();
    rerender(
      <AIConversationList
        conversations={[]}
        onSelect={vi.fn()}
        submittedSearchValue='applied'
      />,
    );
    expect(screen.getByText('No matching conversations.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps search, clear and header controls available while loading', () => {
    const search = vi.fn();
    const onCreate = vi.fn();
    const onClose = vi.fn();
    function LoadingList() {
      const [value, setValue] = useState('applied');
      return (
        <AIConversationList
          conversations={[]}
          onSelect={vi.fn()}
          loading
          searchValue={value}
          submittedSearchValue='applied'
          onSearchChange={setValue}
          onSearch={search}
          onCreate={onCreate}
          onClose={onClose}
        />
      );
    }
    const { rerender } = render(<LoadingList />);
    const input = screen.getByRole('searchbox', {
      name: 'Search conversations',
    });
    fireEvent.change(input, { target: { value: 'new draft' } });
    rerender(<LoadingList />);
    expect(input).toHaveValue('new draft');
    fireEvent.click(
      screen.getByRole('button', { name: 'Search conversations' }),
    );
    expect(search).toHaveBeenLastCalledWith('new draft');
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear conversation search' }),
    );
    expect(input).toHaveValue('');
    expect(search).toHaveBeenLastCalledWith('');
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Close conversation list' }),
    );
    expect(onCreate).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading conversations…',
    );
  });

  it.each([new Error('History failed'), 'History failed'])(
    'shows an error instead of either empty state and makes retry optional (%s)',
    (error) => {
      const props = { conversations: [], onSelect: vi.fn(), error };
      const { rerender } = render(<AIConversationList {...props} />);
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Unable to load conversations',
      );
      expect(screen.getByRole('alert')).toHaveTextContent('History failed');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(
        screen.queryByText('No conversations yet.'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Retry' }),
      ).not.toBeInTheDocument();
      const retry = vi.fn();
      rerender(
        <AIConversationList
          {...props}
          submittedSearchValue='applied'
          onRetry={retry}
        />,
      );
      expect(
        screen.queryByText('No matching conversations.'),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(retry).toHaveBeenCalledExactlyOnceWith();
      rerender(<AIConversationList {...props} loading onRetry={retry} />);
      expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(retry).toHaveBeenCalledOnce();
    },
  );

  it('keeps existing results selectable when a refresh fails', () => {
    const onSelect = vi.fn();
    render(
      <AIConversationList
        conversations={chat.conversations}
        onSelect={onSelect}
        error='Refresh failed'
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Refresh failed');
    fireEvent.click(screen.getByRole('button', { name: /First conversation/ }));
    expect(onSelect).toHaveBeenCalledWith('one');
    expect(screen.queryByText('No conversations yet.')).not.toBeInTheDocument();
  });

  it('renders heading, leading, metadata, actions and footer slots with full-title tooltips', () => {
    const title =
      'A long conversation title that remains available when the row is truncated';
    const conversation = { id: 'one', title, owner: 'Alice', initials: 'AL' };
    const onSelect = vi.fn();
    render(
      <AIConversationList
        conversations={[conversation]}
        onSelect={onSelect}
        heading={
          <span>
            Team conversations <span>1</span>
          </span>
        }
        renderLeading={(item) => (
          <span aria-hidden='true'>{item.initials}</span>
        )}
        renderMetadata={(item) => (
          <>
            <span>{item.owner}</span>
            <span>Today</span>
          </>
        )}
        renderActions={() => <button type='button'>Options</button>}
        footer={<p>All conversations loaded</p>}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Team conversations 1' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Conversations')).not.toBeInTheDocument();
    const row = screen.getByRole('button', {
      name: /A long conversation title.*Alice.*Today/,
    });
    expect(within(row).getByText('AL')).toBeInTheDocument();
    expect(within(row).getByTitle(title)).toHaveClass('truncate');
    expect(within(row).getByText('Alice')).toBeInTheDocument();
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('All conversations loaded')).toBeInTheDocument();
    fireEvent.click(screen.getByText('AL'));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('one');
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it.each([
    ['en-US', enUS],
    ['zh-CN', zhCN],
  ] as const)(
    'localizes the default heading, search and recovery controls in %s',
    async (locale, messages) => {
      // The Registry translates in the plugin's namespace, from the plugin's own locale files.
      const runtime = await createTestI18nRuntime({
        locale,
        namespaces: { '@nocobase/app-plugin-ai-employee': locales },
      });
      render(
        <TestI18nProvider runtime={runtime}>
          <AIConversationList
            conversations={[]}
            onSelect={vi.fn()}
            onSearchChange={vi.fn()}
            onSearch={vi.fn()}
            error='Offline'
            onRetry={vi.fn()}
          />
        </TestI18nProvider>,
      );
      expect(
        screen.getByRole('heading', { name: messages['chat.conversations'] }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('searchbox', {
          name: messages['chat.searchConversations'],
        }),
      ).toHaveAttribute(
        'placeholder',
        messages['chat.searchConversationsPlaceholder'],
      );
      expect(
        screen.getByRole('button', {
          name: messages['chat.searchConversations'],
        }),
      ).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(
        messages['chat.conversationsError'],
      );
      expect(
        screen.getByRole('button', {
          name: messages['chat.retryConversations'],
        }),
      ).toBeInTheDocument();
    },
  );
});

describe('ConversationList wrapper', () => {
  beforeEach(() => useChat.mockReturnValue(chat));

  it('retains selection, creation, closing, search and unread indicators', () => {
    render(<ConversationList />);
    fireEvent.click(screen.getByRole('button', { name: 'First conversation' }));
    expect(chat.selectConversation).toHaveBeenCalledWith('one');
    expect(
      screen.queryByLabelText('Unread conversation'),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));
    expect(chat.startNewConversation).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole('button', { name: 'Close conversation list' }),
    );
    expect(chat.setConversationListOpen).toHaveBeenCalledWith(false);
    const input = screen.getByRole('searchbox', {
      name: 'Search conversations',
    });
    fireEvent.change(input, { target: { value: 'new query' } });
    fireEvent.submit(input.closest('form')!);
    expect(chat.searchConversations).toHaveBeenLastCalledWith('new query');
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear conversation search' }),
    );
    expect(chat.searchConversations).toHaveBeenLastCalledWith('');
  });

  it('retries the applied search without applying an unsubmitted draft', () => {
    useChat.mockReturnValue({
      ...chat,
      conversationSearch: 'applied',
      historyError: new Error('History failed'),
    });
    chat.searchConversations.mockRejectedValueOnce(new Error('Still offline'));
    render(<ConversationList />);
    const input = screen.getByRole('searchbox', {
      name: 'Search conversations',
    });
    fireEvent.change(input, { target: { value: 'draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(chat.searchConversations).toHaveBeenCalledExactlyOnceWith('applied');
    expect(input).toHaveValue('draft');
  });

  it('preserves close overrides and keeps actions discoverable without hover', () => {
    const onClose = vi.fn();
    const { rerender } = render(<ConversationList onClose={onClose} />);
    const actions = screen.getByRole('button', {
      name: 'Conversation actions',
    });
    expect(actions).not.toHaveClass('opacity-0');
    expect(actions).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    fireEvent.click(
      screen.getByRole('button', { name: 'Close conversation list' }),
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(chat.setConversationListOpen).not.toHaveBeenCalled();
    rerender(<ConversationList showCloseButton={false} />);
    expect(
      screen.queryByRole('button', { name: 'Close conversation list' }),
    ).not.toBeInTheDocument();
  });

  it('retains rename error handling and successful retry', async () => {
    chat.renameConversation.mockRejectedValueOnce(new Error('Rename failed'));
    render(<ConversationList />);
    // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
    await userEvent.click(
      screen.getByRole('button', { name: 'Conversation actions' }),
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Title'), {
      target: { value: 'Renamed' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Rename failed')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(chat.renameConversation).toHaveBeenLastCalledWith('one', 'Renamed');
  });

  it('retains delete confirmation and error handling', async () => {
    chat.removeConversation.mockRejectedValueOnce(new Error('Delete failed'));
    render(<ConversationList />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Conversation actions' }),
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    expect(chat.removeConversation).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Delete failed')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(chat.removeConversation).toHaveBeenLastCalledWith('one');
  });
});
