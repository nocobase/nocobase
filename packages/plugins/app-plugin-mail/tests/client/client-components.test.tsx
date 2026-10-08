import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { format, parseISO } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';

import {
  MailAccountCard,
  MailAccountConnector,
  MailboxSidebar,
  MailConversationView,
  MailMessageList,
  MailProviderCard,
  MailRichTextEditor,
  MailSyncPolicyFields,
} from '../../client/components/index.js';
import type {
  MailAccountView,
  MailMessageSummary,
  MailMessage,
  MailProviderView,
} from '../../client/mail-client.js';

const capabilities: MailProviderView['capabilities'] = {
  receive: true,
  send: true,
  incrementalSync: true,
  pushNotifications: false,
  folders: false,
  labels: true,
  drafts: false,
  moveMessage: false,
  aliases: true,
};

function selectCalendarDate(label: string, date: string): void {
  const selectedDate = parseISO(date);
  fireEvent.click(screen.getByRole('button', { name: label }));

  for (let step = 0; step < 24; step += 1) {
    const caption = screen.getByRole('status');
    const visibleMonth = new Date(`${caption.textContent} 1`);
    if (
      visibleMonth.getFullYear() === selectedDate.getFullYear() &&
      visibleMonth.getMonth() === selectedDate.getMonth()
    ) {
      break;
    }
    fireEvent.click(
      screen.getByRole('button', {
        name:
          visibleMonth > selectedDate
            ? 'Go to the Previous Month'
            : 'Go to the Next Month',
      }),
    );
  }

  fireEvent.click(
    screen.getByRole('button', { name: format(selectedDate, 'PPPP') }),
  );
}

describe('[UI][SEC] mail client components and capability states', () => {
  it('updates heading control when the caret moves between formatted blocks', () => {
    render(
      <MailRichTextEditor
        ariaLabel='Heading body'
        labels={{
          toolbar: 'Format',
          bold: 'Bold',
          italic: 'Italic',
          underline: 'Underline',
          bulletList: 'Bullets',
          numberedList: 'Numbers',
          undo: 'Undo',
          redo: 'Redo',
          clearFormatting: 'Clear',
        }}
        onChange={vi.fn()}
        value='<h2><b>Second</b></h2><h5>Fifth</h5><p>Body</p>'
      />,
    );
    const editor = screen.getByRole('textbox', { name: 'Heading body' });
    for (const [selector, expected] of [
      ['h2 b', 'h2'],
      ['h5', 'h5'],
      ['p', 'p'],
    ]) {
      act(() => {
        const range = document.createRange();
        range.selectNodeContents(editor.querySelector(selector)!);
        range.collapse(true);
        window.getSelection()!.removeAllRanges();
        window.getSelection()!.addRange(range);
        document.dispatchEvent(new Event('selectionchange'));
      });
      expect(screen.getByLabelText('Heading level')).toHaveValue(expected);
    }
  });

  it('keeps soft line breaks separate from paragraph spacing', () => {
    const execCommand = vi.fn(() => true);
    const originalExecCommand = document.execCommand;
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    try {
      render(
        <MailRichTextEditor
          ariaLabel='Message body'
          labels={{ toolbar: 'Formatting toolbar' }}
          onChange={vi.fn()}
          value={'First<div>Second</div><div>Third</div>'}
        />,
      );
      const editor = screen.getByRole('textbox', { name: 'Message body' });
      expect(editor).toHaveClass(
        'leading-6',
        '[&>div]:my-0',
        '[&>div+div]:mt-2',
      );
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });
      expect(execCommand).toHaveBeenCalledWith('insertHTML', false, '<br>');
    } finally {
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: originalExecCommand,
      });
    }
  });

  it('supports rich text size, heading, link, and image controls', () => {
    const execCommand = vi.fn(() => true);
    const originalExecCommand = document.execCommand;
    const prompt = vi
      .spyOn(window, 'prompt')
      .mockReturnValueOnce('https://example.com')
      .mockReturnValueOnce('https://example.com/image.png');
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    try {
      render(
        <MailRichTextEditor
          ariaLabel='Message body'
          labels={{
            toolbar: 'Formatting toolbar',
            bold: 'Bold',
            italic: 'Italic',
            underline: 'Underline',
            bulletList: 'Bulleted list',
            numberedList: 'Numbered list',
            undo: 'Undo',
            redo: 'Redo',
            clearFormatting: 'Clear formatting',
            fontSize: 'Font size',
            heading: 'Heading level',
            link: 'Insert link',
            image: 'Insert image',
          }}
          onChange={vi.fn()}
          value='<p>Message</p>'
        />,
      );

      expect(
        within(screen.getByLabelText('Font size'))
          .getAllByRole('option')
          .filter((option) => !option.hasAttribute('disabled'))
          .map((option) => option.textContent),
      ).toEqual(['10', '12', '14', '16', '18', '24', '32', '48']);
      expect(screen.getByLabelText('Font size')).toHaveValue('14');

      fireEvent.change(screen.getByLabelText('Font size'), {
        target: { value: '12' },
      });
      fireEvent.change(screen.getByLabelText('Heading level'), {
        target: { value: 'h2' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Insert link' }));
      fireEvent.click(screen.getByRole('button', { name: 'Insert image' }));

      expect(execCommand).toHaveBeenCalledWith('fontSize', false, '7');
      expect(execCommand).toHaveBeenCalledWith('formatBlock', false, 'h2');
      expect(execCommand).toHaveBeenCalledWith(
        'createLink',
        false,
        'https://example.com',
      );
      expect(execCommand).toHaveBeenCalledWith(
        'insertImage',
        false,
        'https://example.com/image.png',
      );
    } finally {
      prompt.mockRestore();
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: originalExecCommand,
      });
    }
  });

  it('fills the available message list height and enables vertical scrolling', () => {
    const message: MailMessageSummary = {
      id: 'message-1',
      accountId: 'account-1',
      providerMessageId: 'provider-message-1',
      folderIds: ['INBOX'],
      labelIds: [],
      to: [],
      cc: [],
      bcc: [],
      subject: 'A message',
      read: true,
      starred: false,
      draft: false,
      hasAttachments: false,
      todo: false,
    };

    render(
      <MailMessageList
        labels={{
          empty: 'No messages',
          loadMore: 'Load more',
          noSubject: '(no subject)',
          unknownSender: 'Unknown sender',
        }}
        messages={[message]}
        onLoadMore={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('region', { name: 'Messages' })).toHaveClass(
      'h-full',
      'overflow-y-auto',
    );
  });

  it('renders local message labels as colored tags', () => {
    const message: MailMessageSummary = {
      id: 'message-1',
      accountId: 'account-1',
      providerMessageId: 'provider-message-1',
      folderIds: ['INBOX'],
      labelIds: ['label-1'],
      to: [],
      cc: [],
      bcc: [],
      subject: 'A message',
      read: true,
      starred: false,
      draft: false,
      hasAttachments: false,
      todo: false,
    };

    render(
      <MailMessageList
        availableLabels={[
          {
            id: 'label-1',
            name: 'Customers',
            color: 'orange',
            createdAt: '2026-09-08T00:00:00.000Z',
            updatedAt: '2026-09-08T00:00:00.000Z',
          },
        ]}
        labels={{
          empty: 'No messages',
          loadMore: 'Load more',
          noSubject: '(no subject)',
          unknownSender: 'Unknown sender',
        }}
        messages={[message]}
        onLoadMore={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTitle('Customers')).toHaveClass('bg-orange-50');
  });

  it('connects the mail account type selected by the user', () => {
    const onConnect = vi.fn();
    const providers: readonly MailProviderView[] = [
      {
        type: 'gmail',
        name: 'google',
        label: 'Gmail',
        capabilities,
      },
      {
        type: 'microsoft',
        name: 'work',
        label: 'Microsoft 365',
        capabilities,
      },
    ];
    render(
      <MailAccountConnector
        connectedAccountCount={() => 0}
        labels={{
          accountType: 'Mail account type',
          chooseAccountType: 'Select an account type',
          connect: 'Connect account',
          connecting: 'Opening authorization',
          connectedAccounts: (count) => `${count} connected`,
          capability: (capability) => capability,
          configurationRequired: 'Server setup required',
        }}
        onConnect={onConnect}
        providers={providers}
      />,
    );

    const connect = screen.getByRole('button', { name: 'Connect account' });
    expect(connect).toBeDisabled();
    const accountType = screen.getByLabelText('Mail account type');
    expect(accountType.closest('label')).toHaveClass('grid', 'gap-2');
    fireEvent.change(accountType, {
      target: { value: 'microsoft:work' },
    });
    expect(connect).toBeEnabled();
    fireEvent.click(connect);
    expect(onConnect).toHaveBeenCalledWith(providers[1]);
  });

  it('renders the provider-specific capability matrix in account type cards', () => {
    const providers: readonly MailProviderView[] = [
      {
        type: 'gmail',
        name: 'google',
        label: 'Gmail',
        capabilities: {
          receive: true,
          send: true,
          incrementalSync: true,
          pushNotifications: true,
          folders: true,
          labels: true,
          drafts: true,
          moveMessage: true,
          aliases: true,
        },
      },
      {
        type: 'microsoft',
        name: 'work',
        label: 'Microsoft 365',
        capabilities: {
          receive: true,
          send: true,
          incrementalSync: true,
          pushNotifications: true,
          folders: true,
          labels: false,
          drafts: true,
          moveMessage: true,
          aliases: true,
        },
      },
      {
        type: 'imap-smtp',
        name: 'imap-smtp',
        label: 'IMAP / SMTP',
        capabilities: {
          receive: true,
          send: true,
          incrementalSync: true,
          pushNotifications: false,
          folders: true,
          labels: false,
          drafts: false,
          moveMessage: false,
          aliases: false,
        },
      },
    ];

    for (const provider of providers) {
      const { unmount } = render(
        <MailAccountConnector
          connectedAccountCount={() => 0}
          labels={{
            accountType: 'Mail account type',
            chooseAccountType: 'Select an account type',
            connect: 'Connect account',
            connecting: 'Connecting',
            connectedAccounts: (count) => `${count} connected`,
            capability: (capability) =>
              capability === 'labels' ? 'provider labels' : capability,
            configurationRequired: 'Server setup required',
          }}
          onConnect={vi.fn()}
          providers={[provider]}
        />,
      );

      fireEvent.change(screen.getByLabelText('Mail account type'), {
        target: { value: `${provider.type}:${provider.name}` },
      });

      for (const [capability, enabled] of Object.entries(
        provider.capabilities,
      )) {
        const label = capability === 'labels' ? 'provider labels' : capability;
        if (enabled) {
          expect(screen.getByText(label)).toBeInTheDocument();
        } else {
          expect(screen.queryByText(label)).not.toBeInTheDocument();
        }
      }

      unmount();
    }
  });

  it('collects credentials for a credential-based Provider', () => {
    const onConnectCredentials = vi.fn();
    const provider: MailProviderView = {
      type: 'imap-smtp',
      name: 'other-mailbox',
      label: 'Other mailbox',
      connection: 'credentials',
      capabilities,
    };
    render(
      <MailAccountConnector
        connectedAccountCount={() => 0}
        labels={{
          accountType: 'Mail account type',
          chooseAccountType: 'Select an account type',
          connect: 'Connect account',
          connecting: 'Connecting',
          connectedAccounts: (count) => `${count} connected`,
          capability: (capability) => capability,
          configurationRequired: 'Server setup required',
          emailAddress: 'Email address',
          username: 'Username',
          password: 'Password',
          displayName: 'Display name',
        }}
        onConnect={vi.fn()}
        onConnectCredentials={onConnectCredentials}
        providers={[provider]}
      />,
    );

    fireEvent.change(screen.getByLabelText('Mail account type'), {
      target: { value: 'imap-smtp:other-mailbox' },
    });
    const connect = screen.getByRole('button', { name: 'Connect account' });
    expect(connect).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: 'Mailbox user' },
    });
    expect(connect).toBeEnabled();
    fireEvent.click(connect);

    expect(onConnectCredentials).toHaveBeenCalledWith(provider, {
      address: 'user@example.com',
      username: 'user@example.com',
      password: 'secret',
      displayName: 'Mailbox user',
    });
  });

  it('shows an unconfigured IMAP and SMTP Provider in the account type list', () => {
    const provider: MailProviderView = {
      type: 'imap-smtp',
      name: 'imap-smtp',
      label: 'IMAP / SMTP',
      configured: false,
      connection: 'credentials',
      capabilities,
    };
    render(
      <MailAccountConnector
        connectedAccountCount={() => 0}
        labels={{
          accountType: 'Mail account type',
          chooseAccountType: 'Select an account type',
          connect: 'Connect account',
          connecting: 'Connecting',
          connectedAccounts: (count) => `${count} connected`,
          capability: (capability) => capability,
          configurationRequired: 'Server setup required',
        }}
        onConnect={vi.fn()}
        providers={[provider]}
      />,
    );

    fireEvent.change(screen.getByLabelText('Mail account type'), {
      target: { value: 'imap-smtp:imap-smtp' },
    });
    expect(
      screen.getByRole('option', {
        name: 'IMAP / SMTP · Server setup required',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Server setup required')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Connect account' }),
    ).toBeDisabled();
  });

  it('renders Provider capabilities and starts authorization', () => {
    const onConnect = vi.fn();
    const provider: MailProviderView = {
      type: 'gmail',
      name: 'google',
      label: 'Gmail',
      capabilities,
    };
    render(
      <MailProviderCard
        capabilityLabel={(capability) => capability}
        connectLabel='Connect account'
        connectedAccounts={1}
        connectedLabel='1 connected'
        onConnect={onConnect}
        provider={provider}
      />,
    );

    expect(screen.getByText('incrementalSync')).toBeInTheDocument();
    expect(screen.queryByText('pushNotifications')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Connect account' }));
    expect(onConnect).toHaveBeenCalledWith(provider);
  });

  it('prevents synchronization for an inactive account', () => {
    const account: MailAccountView = {
      id: 'account-1',
      userId: 'user-1',
      provider: { type: 'microsoft', name: 'work' },
      address: 'user@example.com',
      scopes: [],
      status: 'reauthorizationRequired',
    };
    render(
      <MailAccountCard
        account={account}
        onSync={vi.fn()}
        providerLabel='Microsoft 365'
        statusLabel='Reauthorization required'
        syncLabel='Sync mailbox'
      />,
    );

    expect(screen.getByRole('button', { name: 'Sync mailbox' })).toBeDisabled();
  });

  it('shows managed account ownership without exposing a sync action', () => {
    const account: MailAccountView = {
      id: 'account-2',
      userId: 'user-2',
      provider: { type: 'gmail', name: 'google' },
      address: 'other@example.com',
      scopes: [],
      status: 'active',
    };
    render(
      <MailAccountCard
        account={account}
        canSync={false}
        onSync={vi.fn()}
        ownerLabel='User ID: user-2'
        providerLabel='Gmail'
        statusLabel='Active'
        syncLabel='Sync mailbox'
      />,
    );

    expect(screen.getByText('User ID: user-2')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Sync mailbox' }),
    ).not.toBeInTheDocument();
  });

  it('reports received-after changes as one value', () => {
    const onChange = vi.fn();
    render(
      <MailSyncPolicyFields
        labels={{
          receivedAfter: 'Received after',
        }}
        onChange={onChange}
        value={{
          receivedAfter: '2026-01-01',
        }}
      />,
    );

    expect(screen.queryByLabelText('Batch size')).not.toBeInTheDocument();
    selectCalendarDate('Received after', '2026-02-01');
    expect(onChange).toHaveBeenCalledWith({
      receivedAfter: '2026-02-01',
    });
  });

  it('switches mailbox sidebar views and provider folders', () => {
    const onFolderChange = vi.fn();
    const onLabelChange = vi.fn();
    const onSmartViewChange = vi.fn();
    render(
      <MailboxSidebar
        accountId='account-1'
        accounts={[
          {
            id: 'account-1',
            userId: 'user-1',
            provider: { type: 'gmail', name: 'google' },
            address: 'user@example.com',
            scopes: [],
            status: 'active',
          },
        ]}
        folders={[
          {
            id: 'folder-sent',
            accountId: 'account-1',
            providerFolderId: 'SENT',
            type: 'sent',
            name: 'Sent',
            unreadCount: 0,
            kind: 'label',
          },
          {
            id: 'folder-archive',
            accountId: 'account-1',
            providerFolderId: 'ARCHIVE',
            type: 'archive',
            name: 'Archive',
            unreadCount: 0,
            kind: 'folder',
          },
          {
            id: 'folder-inbox',
            accountId: 'account-1',
            providerFolderId: 'INBOX',
            type: 'inbox',
            name: 'Inbox',
            unreadCount: 3,
            kind: 'label',
          },
          {
            id: 'folder-drafts',
            accountId: 'account-1',
            providerFolderId: 'DRAFTS',
            type: 'drafts',
            name: 'Drafts',
            unreadCount: 7,
            kind: 'folder',
          },
        ]}
        accountFolderGroups={[]}
        customLabels={[
          {
            id: 'label-1',
            name: 'Customers',
            color: 'blue',
            createdAt: '2026-09-08T00:00:00.000Z',
            updatedAt: '2026-09-08T00:00:00.000Z',
          },
        ]}
        labelId={undefined}
        labels={{
          account: 'Account',
          allAccounts: 'All accounts',
          unread: 'Unread',
          starred: 'Starred',
          folders: 'Folders',
          accounts: 'Accounts',
          labels: 'Labels',
          folderNames: {
            inbox: 'Inbox',
            sent: 'Sent',
            drafts: 'Drafts',
            trash: 'Trash',
            junk: 'Spam',
            archive: 'Archive',
          },
          systemFolderNames: {
            allMail: 'All Mail',
            chat: 'Chats',
            important: 'Important',
            starred: 'Starred',
            unread: 'Unread',
            personal: 'Personal',
            social: 'Social',
            promotions: 'Promotions',
            updates: 'Updates',
            forums: 'Forums',
          },
        }}
        onAccountChange={vi.fn()}
        onFolderChange={onFolderChange}
        onLabelChange={onLabelChange}
        onSmartViewChange={onSmartViewChange}
        smartView='all'
      />,
    );

    expect(screen.getByRole('complementary')).toHaveClass(
      'h-full',
      'overflow-y-auto',
    );
    const folderNavigation = screen.getAllByRole('navigation', {
      name: 'Folders',
    })[1];
    expect(
      within(folderNavigation)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Sent', 'Drafts', 'Archive']);
    fireEvent.click(screen.getByRole('button', { name: /Inbox/ }));
    expect(onSmartViewChange).toHaveBeenCalledWith('all');
    expect(onFolderChange).toHaveBeenCalledWith('INBOX', 'account-1');
    fireEvent.click(screen.getByRole('button', { name: 'Customers' }));
    expect(onFolderChange).toHaveBeenCalledTimes(1);
    expect(onLabelChange).toHaveBeenCalledWith('label-1');
  });

  it('toggles messages from their headers while keeping message actions independent', () => {
    const reply = vi.fn();
    render(
      <MailConversationView
        actions={{
          delete: vi.fn(),
          reply,
          toggleRead: vi.fn(),
          toggleStarred: vi.fn(),
        }}
        actionLabels={{
          archive: 'Archive',
          collapseMessage: 'Collapse message',
          delete: 'Delete',
          download: 'Download',
          expandMessage: 'Expand message',
          forward: 'Forward',
          markRead: 'Mark read',
          markUnread: 'Mark unread',
          reply: 'Reply',
          star: 'Star',
          unstar: 'Unstar',
        }}
        labels={{
          attachmentCount: (count) => `${count} attachments`,
          conversation: (count) => `${count} messages`,
          loadMore: 'Load more',
          noSubject: '(no subject)',
          selectMessage: 'Select a message',
          unknownSender: 'Unknown sender',
        }}
        messages={[
          {
            ...conversationMessage('message-1', 'Alice', 'First message'),
            read: false,
          },
          {
            ...conversationMessage('message-2', 'Bob', 'Second message'),
            read: false,
          },
        ]}
        onLoadMore={vi.fn()}
        subject='Project update'
      />,
    );

    const headerTrigger = screen.getAllByRole('button', {
      name: 'Collapse message',
    })[0];
    const header = headerTrigger.closest('header')!;
    expect(headerTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(headerTrigger).toBeEmptyDOMElement();
    expect(header.querySelector('.lucide-chevron-down')).toBeInTheDocument();

    fireEvent.click(within(header).getByRole('button', { name: 'Reply' }));
    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'message-1' }),
    );
    expect(headerTrigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(headerTrigger);
    expect(headerTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(header.querySelector('.lucide-chevron-right')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Expand message' }),
    ).toHaveLength(1);
    expect(screen.getAllByText('First message')).toHaveLength(1);
    expect(screen.getByText('Second message')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand message' }));
    expect(headerTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getAllByRole('button', { name: 'Collapse message' }),
    ).toHaveLength(2);
  });

  it('initializes expansion from read state and preserves it through read updates and pagination', () => {
    const unread = {
      ...conversationMessage('unread', 'Alice', 'Unread body'),
      preview: 'Unread preview',
      read: false,
    };
    const read = {
      ...conversationMessage('read', 'Bob', 'Read body'),
      preview: 'Read preview',
    };
    const view = (messages: readonly MailMessage[]) => (
      <MailConversationView
        labels={{
          attachmentCount: (count) => `${count} attachments`,
          conversation: (count) => `${count} messages`,
          loadMore: 'Load more',
          noSubject: '(no subject)',
          selectMessage: 'Select a message',
          unknownSender: 'Unknown sender',
          labels: 'Labels',
          note: 'Note',
          notePlaceholder: 'Add a note',
          saveNote: 'Save note',
          todo: 'To do',
        }}
        messages={messages}
        onLoadMore={vi.fn()}
        subject='Project update'
      />
    );
    const { rerender } = render(view([]));
    rerender(view([unread, read]));
    expect(screen.getByText('Unread body')).toBeInTheDocument();
    expect(screen.queryByText('Read body')).not.toBeInTheDocument();
    expect(screen.getByText('Read preview')).toBeInTheDocument();

    const markedRead = { ...unread, read: true };
    rerender(view([markedRead, read]));
    expect(screen.getByText('Unread body')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand message' }));
    expect(screen.getByText('Read body')).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Collapse message' })[0],
    );

    const older = {
      ...conversationMessage('older', 'Carol', 'Older body'),
      preview: 'Older preview',
    };
    rerender(view([older, markedRead, read]));
    expect(screen.queryByText('Older body')).not.toBeInTheDocument();
    expect(screen.getByText('Older preview')).toBeInTheDocument();
    expect(screen.queryByText('Unread body')).not.toBeInTheDocument();
    expect(screen.getByText('Read body')).toBeInTheDocument();

    rerender(view([]));
    rerender(view([markedRead, read]));
    expect(
      screen.getAllByRole('button', { name: 'Expand message' }),
    ).toHaveLength(2);
    rerender(view([read]));
    expect(screen.getByText('Read body')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Expand message' }),
    ).not.toBeInTheDocument();
  });

  it('renders every synchronized message in a provider conversation', () => {
    render(
      <MailConversationView
        labels={{
          attachmentCount: (count) => `${count} attachments`,
          conversation: (count) => `${count} messages`,
          loadMore: 'Load more',
          noSubject: '(no subject)',
          selectMessage: 'Select a message',
          unknownSender: 'Unknown sender',
        }}
        messages={[
          conversationMessage('message-1', 'Alice', 'First message'),
          conversationMessage('message-2', 'Bob', 'Second message'),
        ]}
        onLoadMore={vi.fn()}
        subject='Project update'
      />,
    );

    expect(screen.getByText('2 messages').closest('section')).toHaveClass(
      'h-full',
      'overflow-y-auto',
    );
    expect(screen.getByText('2 messages')).toBeInTheDocument();
    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('keeps message metadata in the more menu and opens dialogs after it closes', async () => {
    const saveNote = vi.fn();
    const toggleTodo = vi.fn();
    const toggleLabel = vi.fn();
    const message = {
      ...conversationMessage('message-1', 'Alice', 'Message body'),
      note: 'Existing note',
      labelIds: ['label-1'],
    };
    render(
      <MailConversationView
        actions={{
          delete: vi.fn(),
          saveNote,
          toggleLabel,
          toggleRead: vi.fn(),
          toggleStarred: vi.fn(),
          toggleTodo,
        }}
        availableLabels={[
          {
            id: 'label-1',
            name: 'Customers',
            color: 'blue',
            createdAt: '2026-09-08T00:00:00.000Z',
            updatedAt: '2026-09-08T00:00:00.000Z',
          },
        ]}
        labels={{
          attachmentCount: (count) => `${count} attachments`,
          conversation: (count) => `${count} messages`,
          loadMore: 'Load more',
          noSubject: '(no subject)',
          selectMessage: 'Select a message',
          unknownSender: 'Unknown sender',
          labels: 'Labels',
          note: 'Note',
          notePlaceholder: 'Add a private note…',
          saveNote: 'Save note',
          todo: 'To do',
        }}
        messages={[message]}
        onLoadMore={vi.fn()}
        subject='Project update'
      />,
    );

    expect(
      screen.queryByRole('textbox', { name: 'Note' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Note' })).toBeNull();
    const more = screen.getByRole('button', { name: 'More actions' });
    fireEvent.mouseEnter(more);
    fireEvent.mouseMove(more);
    expect(await screen.findByText('More actions')).toBeVisible();
    fireEvent.click(more);
    const todo = await screen.findByRole('menuitemcheckbox', {
      name: 'Mark as to do',
    });
    expect(todo).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(todo);
    expect(toggleTodo).toHaveBeenCalledWith(message);
    fireEvent.click(more);
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Note' }));
    const noteDialog = screen.getByRole('dialog');
    fireEvent.change(
      within(noteDialog).getByRole('textbox', { name: 'Note' }),
      {
        target: { value: 'Updated note' },
      },
    );
    fireEvent.click(
      within(noteDialog).getByRole('button', { name: 'Save note' }),
    );
    expect(saveNote).toHaveBeenCalledWith(message, 'Updated note');

    fireEvent.click(more);
    fireEvent.click(await screen.findByRole('menuitem', { name: /^Labels/ }));
    const labelsDialog = screen.getByRole('dialog');
    expect(
      within(labelsDialog).getByRole('checkbox', { name: 'Customers' }),
    ).toBeChecked();
    fireEvent.click(
      within(labelsDialog).getByRole('checkbox', { name: 'Customers' }),
    );
    expect(toggleLabel).toHaveBeenCalledWith(message, 'label-1', false);
  });

  it('renders sanitized HTML-only messages as HTML', () => {
    render(
      <MailConversationView
        labels={{
          attachmentCount: (count) => `${count} attachments`,
          conversation: (count) => `${count} messages`,
          loadMore: 'Load more',
          noSubject: '(no subject)',
          selectMessage: 'Select a message',
          unknownSender: 'Unknown sender',
        }}
        messages={[
          {
            ...conversationMessage('message-1', 'Alice', ''),
            html: '<p>Hello <strong>team</strong></p><script>bad()</script>',
          },
        ]}
        onLoadMore={vi.fn()}
      />,
    );

    const frame = document.querySelector('iframe');
    expect(frame).toHaveAttribute(
      'sandbox',
      'allow-same-origin allow-popups allow-popups-to-escape-sandbox',
    );
    const body = new DOMParser().parseFromString(
      frame?.getAttribute('srcdoc') ?? '',
      'text/html',
    );
    expect(body.querySelector('strong')?.textContent).toBe('team');
    expect(body.querySelector('script')).toBeNull();
    expect(screen.queryByText(/bad\(\)/)).not.toBeInTheDocument();
    // The configuration block the server renders into every page is the only script allowed there.
    expect(
      document.querySelector('script:not(#nocobase-runtime-config)'),
    ).not.toBeInTheDocument();
  });

  it('dispatches conversation reply, forward, draft, and attachment actions', async () => {
    const reply = vi.fn();
    const forward = vi.fn();
    const editDraft = vi.fn();
    const downloadAttachment = vi.fn();
    const message = {
      ...conversationMessage('message-1', 'Alice', 'Message body'),
      attachments: [
        {
          id: 'message-1:attachment-1',
          messageId: 'message-1',
          providerAttachmentId: 'attachment-1',
          fileName: 'report.pdf',
          contentType: 'application/pdf',
          size: 10,
          inline: false,
        },
      ],
      hasAttachments: true,
    };
    const props = {
      labels: {
        attachmentCount: (count: number) => `${count} attachments`,
        conversation: (count: number) => `${count} messages`,
        loadMore: 'Load more',
        noSubject: '(no subject)',
        selectMessage: 'Select a message',
        unknownSender: 'Unknown sender',
      },
      onLoadMore: vi.fn(),
      actions: {
        delete: vi.fn(),
        downloadAttachment,
        reply,
        forward,
        editDraft,
        toggleRead: vi.fn(),
        toggleStarred: vi.fn(),
      },
      actionLabels: {
        archive: 'Archive',
        delete: 'Delete',
        download: 'Download',
        reply: 'Reply',
        forward: 'Forward',
        editDraft: 'Edit draft',
        markRead: 'Mark read',
        markUnread: 'Mark unread',
        star: 'Star',
        unstar: 'Unstar',
      },
    } as const;
    const view = render(
      <MailConversationView {...props} messages={[message]} />,
    );

    const older = conversationMessage('older', 'Older sender', 'Older body');
    view.rerender(
      <MailConversationView {...props} messages={[older, message]} />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Reply to latest message' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Forward latest message' }),
    );
    expect(reply).toHaveBeenLastCalledWith(message);
    expect(forward).toHaveBeenLastCalledWith(message);
    view.rerender(
      <MailConversationView
        {...props}
        messages={[
          conversationMessage('oldest', 'First sender', 'First body'),
          older,
          message,
        ]}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Reply to latest message' }),
    );
    expect(reply).toHaveBeenLastCalledWith(message);
    view.rerender(<MailConversationView {...props} messages={[message]} />);
    const replyButton = screen.getByRole('button', { name: 'Reply' });
    fireEvent.mouseEnter(replyButton);
    fireEvent.mouseMove(replyButton);
    expect(replyButton).toHaveAttribute('aria-label', 'Reply');
    fireEvent.click(replyButton);
    fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Download report.pdf' }),
    );
    expect(reply).toHaveBeenCalledWith(message);
    expect(forward).toHaveBeenCalledWith(message);
    expect(downloadAttachment).toHaveBeenCalledWith(
      message,
      message.attachments[0],
    );

    view.rerender(
      <MailConversationView
        {...props}
        messages={[{ ...message, draft: true }]}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Reply to latest message' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Forward latest message' }),
    ).not.toBeInTheDocument();
    const draftButton = screen.getByRole('button', { name: 'Edit draft' });
    fireEvent.mouseEnter(draftButton);
    fireEvent.mouseMove(draftButton);
    expect(await screen.findByText('Edit draft')).toBeVisible();
    fireEvent.click(draftButton);
    expect(editDraft).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'message-1', draft: true }),
    );
  });
});

function conversationMessage(id: string, name: string, text: string) {
  return {
    id,
    accountId: 'account-1',
    providerMessageId: id,
    conversationId: 'conversation-1',
    folderIds: ['INBOX'],
    labelIds: [],
    from: { name, address: `${name.toLowerCase()}@example.com` },
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    subject: 'Project update',
    text,
    read: true,
    starred: false,
    draft: false,
    hasAttachments: false,
    attachments: [],
  } as const;
}
