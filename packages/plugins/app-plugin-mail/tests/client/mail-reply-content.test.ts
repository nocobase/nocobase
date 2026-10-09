import { describe, expect, it, vi } from 'vitest';
import { prepareReplyContent } from '../../client/lib/mail-reply-content.js';
import { relatedBody } from '../../server/adapters/microsoft/content.js';
import type { MailMessage } from '../../client/mail-client.js';
import type { MailProviderSendInput } from '../../server/contracts/provider.js';

const source: MailMessage = {
  id: 'source',
  accountId: 'account',
  providerMessageId: 'remote',
  subject: 'Original',
  to: [],
  cc: [],
  bcc: [],
  replyTo: [],
  references: [],
  folderIds: [],
  labelIds: [],
  read: true,
  starred: false,
  draft: false,
  hasAttachments: true,
  html: '<p>Original</p><img src="cid:logo%40example.com"><img src="cid:logo%40example.com">',
  attachments: [
    {
      id: 'logo',
      messageId: 'source',
      providerAttachmentId: 'remote-logo',
      fileName: 'logo.png',
      contentType: 'image/png',
      size: 3,
      inline: true,
      contentId: '<logo@example.com>',
    },
    {
      id: 'file',
      messageId: 'source',
      providerAttachmentId: 'remote-file',
      fileName: 'file.pdf',
      contentType: 'application/pdf',
      size: 3,
      inline: false,
    },
  ],
};

describe('reply content preparation', () => {
  it('loads deferred originals and copies only referenced inline images once', async () => {
    const mail = {
      retryMessageContent: vi
        .fn()
        .mockResolvedValue({ ...source, contentStatus: 'complete' }),
      downloadAttachment: vi.fn().mockResolvedValue(new Response('png').body),
      uploadAttachment: vi.fn().mockResolvedValue({
        id: 'upload',
        fileName: 'logo.png',
        contentType: 'image/png',
        size: 3,
        expiresAt: '',
      }),
    };
    const result = await prepareReplyContent(mail, {
      ...source,
      html: undefined,
      contentStatus: 'deferred',
    });
    expect(mail.retryMessageContent).toHaveBeenCalledWith('account', 'source');
    expect(mail.downloadAttachment).toHaveBeenCalledExactlyOnceWith(
      'account',
      'source',
      'logo',
    );
    expect(mail.uploadAttachment).toHaveBeenCalledTimes(1);
    expect(result.uploads).toHaveLength(1);
    expect(
      result.quote.html.match(/cid:nocobase-upload@mail.inline/gu),
    ).toHaveLength(2);
    expect(result.quote.html).not.toContain('/api/');
    expect(result.quote.attachments[0]?.contentId).toBe(
      'nocobase-upload@mail.inline',
    );
    expect(source.html).toContain('cid:logo%40example.com');
  });

  it('does not open a partial reply when loading or copying the original fails', async () => {
    const mail = {
      retryMessageContent: vi
        .fn()
        .mockResolvedValue({ ...source, contentStatus: 'failed' }),
      downloadAttachment: vi
        .fn()
        .mockRejectedValue(new Error('Download failed')),
      uploadAttachment: vi.fn(),
    };
    await expect(
      prepareReplyContent(mail, { ...source, contentStatus: 'deferred' }),
    ).rejects.toThrow('could not be loaded');
    await expect(prepareReplyContent(mail, source)).rejects.toThrow(
      'Download failed',
    );
    expect(mail.uploadAttachment).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'avoids duplicate provider history only when the reply body is complete: %s',
    (included) => {
      const input: MailProviderSendInput = {
        trackingId: 'reply',
        identity: {
          id: 'identity',
          accountId: 'account',
          address: 'me@example.com',
          isPrimary: true,
          canSend: true,
        },
        message: {
          to: [],
          cc: [],
          bcc: [],
          subject: 'Re: Original',
          text: 'Reply',
          html: '<p>Reply with original</p>',
          attachments: [],
          references: [],
          replyToProviderMessageId: 'remote',
          replyBodyIncluded: included,
        },
      };
      const body = relatedBody(input, {
        body: { contentType: 'HTML', content: '<p>Provider original</p>' },
      });
      expect(body.content).toContain('Reply with original');
      expect(body.content.includes('Provider original')).toBe(!included);
    },
  );
});
