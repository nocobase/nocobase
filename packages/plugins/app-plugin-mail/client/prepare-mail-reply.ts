import {
  EMPTY_MAIL_COMPOSER,
  type MailComposerRequest,
} from './contracts/composer.js';
import type { MailClient, MailMessage } from './mail-client.js';
import { prepareReplyContent } from './lib/mail-reply-content.js';

/**
 * Prepare a browser-side reply request, loading incomplete content and copying
 * referenced CID images into owned uploads. Does not open, save or send mail.
 * Preparation rejects if the original body or a referenced image cannot be copied.
 */
export async function prepareMailReply(
  mail: Pick<
    MailClient,
    'retryMessageContent' | 'downloadAttachment' | 'uploadAttachment'
  >,
  message: MailMessage,
): Promise<MailComposerRequest> {
  const {
    message: source,
    quote,
    uploads,
  } = await prepareReplyContent(mail, message);
  return {
    accountId: source.accountId,
    value: {
      ...EMPTY_MAIL_COMPOSER,
      mode: 'reply',
      relatedMessageId: source.id,
      forwardQuote: quote,
      to: source.replyTo.length
        ? source.replyTo.map((address) => address.address).join(', ')
        : (source.from?.address ?? ''),
      subject: /^re:/iu.test(source.subject.trim())
        ? source.subject
        : `Re: ${source.subject}`,
    },
    attachments: [],
    uploads,
  };
}
