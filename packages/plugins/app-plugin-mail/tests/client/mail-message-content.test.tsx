import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { MailMessageContent } from '../../client/components/mail-message-content.js';
import type { MailMessage } from '../../client/mail-client.js';

const retry = vi.hoisted(() => vi.fn());
vi.mock('../../client/runtime.js', () => ({
  useMailClient: () => ({ retryMessageContent: retry }),
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const message: MailMessage = {
  id: 'mail',
  accountId: 'account',
  providerMessageId: 'remote',
  folderIds: [],
  labelIds: [],
  to: [],
  cc: [],
  bcc: [],
  replyTo: [],
  references: [],
  subject: 'Large mail',
  read: false,
  starred: false,
  draft: false,
  hasAttachments: false,
  attachments: [],
  todo: false,
  contentStatus: 'deferred',
  size: 20_000_000,
};

it('shows deferred content, keeps failures retryable and renders the independently loaded body', async () => {
  retry
    .mockRejectedValueOnce(new Error('Network failure'))
    .mockResolvedValueOnce({
      ...message,
      contentStatus: 'complete',
      text: 'Loaded body',
    });
  render(<MailMessageContent message={message} title='Mail' />);
  expect(screen.getByRole('status')).toHaveTextContent('content.deferred');
  fireEvent.click(screen.getByRole('button', { name: 'content.retry' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'content.retryFailed',
  );
  fireEvent.click(screen.getByRole('button', { name: 'content.retry' }));
  expect(await screen.findByText('Loaded body')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(retry).toHaveBeenLastCalledWith('account', 'mail');
});
