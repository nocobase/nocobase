import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MailMessageList } from '../../client/components/mail-message-list.js';
import { MailConversationView } from '../../client/components/mail-conversation-view.js';
import type { MailMessage } from '../../client/mail-client.js';

const labels = {
  empty: 'No messages',
  loadMore: 'Load more',
  noSubject: '(no subject)',
  unknownSender: 'Unknown sender',
  selectMessage: 'Select a message',
  attachmentCount: (count: number) => `${count} attachments`,
  conversation: (count: number) => `${count} messages`,
  labels: 'Labels',
  note: 'Note',
  notePlaceholder: 'Note',
  saveNote: 'Save',
  todo: 'To do',
};
const message: MailMessage = {
  id: 'message',
  accountId: 'account',
  providerMessageId: 'provider',
  folderIds: ['INBOX'],
  labelIds: [],
  subject: 'Participants',
  from: { name: ' Alice ', address: 'alice@example.com' },
  to: [{ name: 'Bob', address: 'bob@example.com' }],
  cc: [{ address: 'carol@example.com' }],
  bcc: [{ address: 'dave@example.com' }],
  read: false,
  starred: false,
  draft: false,
  hasAttachments: false,
  todo: false,
  replyTo: [],
  references: [],
  attachments: [],
  text: 'Body',
};

describe('mail participant display', () => {
  it('shows only participant names in the first two list rows', () => {
    render(
      <MailMessageList
        labels={labels}
        messages={[message]}
        onLoadMore={vi.fn()}
        onSelect={vi.fn()}
        showAccount
        accountNames={new Map([['account', 'alice@example.com']])}
      />,
    );
    expect(screen.getByLabelText('From')).toHaveTextContent(/^Alice$/);
    expect(screen.getByLabelText('To')).toHaveTextContent(/^Bob$/);
    expect(screen.getByLabelText('To')).toHaveAttribute(
      'title',
      'Bob <bob@example.com>',
    );
    expect(screen.queryByLabelText('Account')).not.toBeInTheDocument();
  });

  it('falls back to email addresses when participant names are missing', () => {
    render(
      <MailMessageList
        labels={labels}
        messages={[
          {
            ...message,
            from: { name: ' ', address: 'alice@example.com' },
            to: [
              { address: 'bob@example.com' },
              { name: 'Carol', address: 'carol@example.com' },
            ],
          },
        ]}
        onLoadMore={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('From')).toHaveTextContent(
      /^alice@example.com$/,
    );
    expect(screen.getByLabelText('To')).toHaveTextContent(
      /^bob@example.com, Carol$/,
    );
  });

  it('shows To, Cc, and Bcc in message details', () => {
    render(
      <MailConversationView
        labels={labels}
        messages={[message]}
        onLoadMore={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('From')).toHaveTextContent('Alice');
    expect(screen.getByLabelText('To')).toHaveTextContent(
      'Bob <bob@example.com>',
    );
    expect(screen.getByLabelText('Cc')).toHaveTextContent('carol@example.com');
    expect(screen.getByLabelText('Bcc')).toHaveTextContent('dave@example.com');
  });

  it.each(['', '   ', ' ALICE@example.com '])(
    'does not repeat an address used as a sender name: %s',
    (name) => {
      render(
        <MailConversationView
          labels={labels}
          messages={[
            {
              ...message,
              from: { name, address: 'alice@example.com' },
              to: [],
            },
          ]}
          onLoadMore={vi.fn()}
        />,
      );
      expect(screen.getByLabelText('From')).toHaveTextContent(
        'alice@example.com',
      );
      expect(
        screen.getAllByText('alice@example.com', { exact: true }),
      ).toHaveLength(1);
      expect(screen.queryByText('Unknown sender')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('To')).not.toBeInTheDocument();
    },
  );
});
