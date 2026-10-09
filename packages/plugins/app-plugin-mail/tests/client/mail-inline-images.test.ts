import { describe, expect, it } from 'vitest';

import { resolveMailInlineImages } from '../../client/lib/mail-inline-images.js';

describe('mail inline image rendering', () => {
  it('maps a matching cid image to the authenticated attachment endpoint', () => {
    const html = resolveMailInlineImages(
      {
        accountId: 'account-1',
        id: 'message-1',
        attachments: [
          {
            id: 'message-1:attachment-1',
            messageId: 'message-1',
            providerAttachmentId: 'attachment-1',
            fileName: 'logo.png',
            contentType: 'image/png',
            size: 10,
            contentId: '<logo@example.com>',
            inline: true,
          },
        ],
      },
      '<p>Hello</p><img src="cid:logo%40example.com" alt="Logo">',
    );

    expect(html).toContain(
      'src="/api/mail/accounts/account-1/messages/message-1/attachments/message-1%3Aattachment-1"',
    );
    expect(html).toContain('alt="Logo"');
  });

  it('does not expose an unmatched or non-inline attachment as an image URL', () => {
    const html = resolveMailInlineImages(
      {
        accountId: 'account-1',
        id: 'message-1',
        attachments: [
          {
            id: 'message-1:attachment-1',
            messageId: 'message-1',
            providerAttachmentId: 'attachment-1',
            fileName: 'logo.png',
            contentType: 'image/png',
            size: 10,
            contentId: 'logo@example.com',
            inline: false,
          },
        ],
      },
      '<img src="cid:unknown@example.com"><img src="javascript:alert(1)">',
    );

    expect(html).toBe('<img><img>');
  });

  it('keeps application-relative image URLs after sanitization', () => {
    expect(
      resolveMailInlineImages(
        { accountId: 'account-1', id: 'message-1', attachments: [] },
        '<img src="/main/assets/logo.png">',
      ),
    ).toBe('<img src="/main/assets/logo.png">');
  });
});
