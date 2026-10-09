import { resolveAppUrl } from '@nocobase/app-client';

import type { MailMessage } from '../mail-client.js';
import { sanitizeMailHtml } from './mail-template.js';

/** Rewrites trusted Provider cid references to the authenticated attachment endpoint. */
export function resolveMailInlineImages(
  message: Pick<MailMessage, 'accountId' | 'id' | 'attachments'>,
  html: string,
): string {
  if (!html || typeof DOMParser === 'undefined') {
    return sanitizeMailHtml(html);
  }
  const document = new DOMParser().parseFromString(html, 'text/html');
  rewriteMailInlineImages(document, message);
  return sanitizeMailHtml(document.body.innerHTML);
}

/** Rewrites CID images without changing the document's formatting. */
export function rewriteMailInlineImages(
  document: Document,
  message: Pick<MailMessage, 'accountId' | 'id' | 'attachments'>,
  scope: 'personal' | 'management' = 'personal',
): void {
  for (const image of document.querySelectorAll('img')) {
    const source = image.getAttribute('src');
    const contentId = source?.match(/^cid:(.+)$/iu)?.[1];
    if (!contentId) continue;
    const attachment = message.attachments.find(
      (item) =>
        item.inline &&
        normalizeMailContentId(item.contentId) ===
          normalizeMailContentId(contentId),
    );
    if (!attachment) {
      image.removeAttribute('src');
      continue;
    }
    image.setAttribute(
      'src',
      resolveAppUrl(
        `/api/mail/${scope === 'management' ? 'management/' : ''}accounts/${encodeURIComponent(message.accountId)}/messages/${encodeURIComponent(message.id)}/attachments/${encodeURIComponent(attachment.id)}`,
      ),
    );
  }
}

function normalizeMailContentId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let normalized = value.trim().replace(/^cid:/iu, '');
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Keep the original value when a Provider returns an invalid escape.
  }
  return normalized.replace(/^<|>$/gu, '').trim().toLowerCase();
}
