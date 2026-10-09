import { expect, it, vi } from 'vitest';
import { MailAttachmentsService } from '../../server/services/attachments.js';
import type { MailAccount, MailMessage } from '../../shared/mail.js';

it('does not replace unknown decoded stream size with encoded stored attachment size', async () => {
  const account: MailAccount = {
    id: 'account',
    userId: 'user',
    address: 'user@example.com',
    provider: { type: 'imap-smtp', name: 'mail' },
    credentialReference: 'credential',
    scopes: [],
    status: 'active',
  };
  const message = {
    id: 'message',
    providerMessageId: 'remote-message',
    attachments: [
      {
        id: 'attachment',
        providerAttachmentId: 'remote-attachment',
        fileName: 'file.pdf',
        contentType: 'application/pdf',
        size: 999,
      },
    ],
  } as MailMessage;
  const close = vi.fn(async () => {});
  const service = new MailAttachmentsService({
    store: {
      getAccount: async () => account,
      getMessage: async () => message,
      getMessageForAccount: async () => message,
      getOutboundAttachment: async () => undefined,
    },
    adapters: {
      resolve: async () => ({
        identity: account.provider,
        capabilities: { receive: true, send: false },
        close,
        getAttachment: async () => ({
          ok: true,
          value: {
            fileName: 'file.pdf',
            contentType: 'application/pdf',
            stream: new Response('decoded').body!,
          },
        }),
      }),
    },
  });
  const content = await service.getAttachment(
    { actorId: 'user' },
    'account',
    'message',
    'attachment',
  );
  expect(content.size).toBeUndefined();
  expect(close).not.toHaveBeenCalled();
  expect(await new Response(content.stream).text()).toBe('decoded');
  expect(close).toHaveBeenCalledOnce();
});
