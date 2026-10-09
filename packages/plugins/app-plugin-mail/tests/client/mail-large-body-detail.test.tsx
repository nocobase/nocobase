import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { MailMessage } from '../../shared/mail.js';
const mocks = vi.hoisted(() => ({ retry: vi.fn() }));
vi.mock('../../client/runtime.js', () => ({
  useMailClient: () => ({ retryMessageContent: mocks.retry }),
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../client/components/mail-html-body.js', () => ({
  MailHtmlBody: () => null,
}));
vi.mock('../../client/components/mail-text-body.js', () => ({
  MailTextBody: ({ text }: { text: string }) => <div>{text}</div>,
}));
import { MailMessageContent } from '../../client/components/mail-message-content.js';
const message = {
  id: 'message',
  accountId: 'account',
  contentStatus: 'deferred',
  contentError: 'IMAP_MESSAGE_TOO_LARGE',
} as MailMessage;
it('shows the loaded body after requesting deferred content', async () => {
  mocks.retry.mockResolvedValueOnce({
    ...message,
    contentStatus: 'complete',
    contentError: undefined,
    text: 'Full body',
  });
  render(<MailMessageContent message={message} title='Mail' />);
  fireEvent.click(screen.getByRole('button', { name: 'content.retry' }));
  expect(await screen.findByText('Full body')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'content.retry' }),
  ).not.toBeInTheDocument();
});
it('explains the viewing limit and stops offering ineffective retries', async () => {
  mocks.retry.mockResolvedValueOnce({
    ...message,
    contentError: 'IMAP_DETAIL_BODY_TOO_LARGE',
  });
  render(<MailMessageContent message={message} title='Mail' />);
  fireEvent.click(screen.getByRole('button', { name: 'content.retry' }));
  expect(await screen.findByText('content.tooLarge')).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'content.retry' }),
    ).toBeDisabled(),
  );
});
