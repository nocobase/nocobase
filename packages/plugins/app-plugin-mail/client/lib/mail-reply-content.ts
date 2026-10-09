import type {
  MailClient,
  MailMessage,
  MailOutboundAttachmentView,
} from '../mail-client.js';
import { uploadedImageContentId } from '../../shared/inline-images.js';
import {
  createReplyQuote,
  type MailForwardQuote,
} from './mail-forward-content.js';

/** Copy referenced inline images into owned uploads so replies survive draft recovery. */
export async function prepareReplyContent(
  mail: Pick<
    MailClient,
    'retryMessageContent' | 'downloadAttachment' | 'uploadAttachment'
  >,
  message: MailMessage,
): Promise<{
  message: MailMessage;
  quote: MailForwardQuote;
  uploads: readonly MailOutboundAttachmentView[];
}> {
  const source =
    message.contentStatus === 'deferred' || message.contentStatus === 'failed'
      ? await mail.retryMessageContent(message.accountId, message.id)
      : message;
  if (source.contentStatus === 'deferred' || source.contentStatus === 'failed')
    throw new Error(
      'The original message could not be loaded. Please retry before replying.',
    );
  const quote = createReplyQuote(source);
  const document = new DOMParser().parseFromString(quote.html, 'text/html');
  const uploads: MailOutboundAttachmentView[] = [];
  const attachments = [...quote.attachments];
  const normalize = (value: string): string => {
    let result = value.replace(/^cid:/iu, '');
    try {
      result = decodeURIComponent(result);
    } catch {
      /* Keep malformed provider IDs unchanged. */
    }
    return result.replace(/^<|>$/gu, '').toLowerCase();
  };
  for (const [index, attachment] of attachments.entries()) {
    if (!attachment.inline || !attachment.contentId) continue;
    const images = [...document.querySelectorAll('img[src]')].filter(
      (image) => {
        const src = image.getAttribute('src') ?? '';
        return (
          /^cid:/iu.test(src) &&
          normalize(src) === normalize(attachment.contentId!)
        );
      },
    );
    if (!images.length) continue;
    const stream = await mail.downloadAttachment(
      source.accountId,
      source.id,
      attachment.id,
    );
    const blob = await new Response(stream).blob();
    const upload = await mail.uploadAttachment(
      new File([blob], attachment.fileName, { type: attachment.contentType }),
    );
    uploads.push(upload);
    const contentId = uploadedImageContentId(upload.id);
    for (const image of images) image.setAttribute('src', `cid:${contentId}`);
    // The composer preview still reads the source message's attachment endpoint.
    attachments[index] = { ...attachment, contentId };
  }
  return {
    message: source,
    quote: { ...quote, html: document.documentElement.outerHTML, attachments },
    uploads,
  };
}
