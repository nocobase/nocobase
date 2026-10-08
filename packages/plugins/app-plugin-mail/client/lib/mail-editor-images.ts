import { resolveAppUrl } from '@nocobase/app-client';
import type {
  MailMessage,
  MailOutboundAttachmentView,
} from '../mail-client.js';
import { uploadedImageContentId } from '../../shared/inline-images.js';
import { sanitizeMailHtml } from './mail-template.js';

/** Preview URLs stay in the editor DOM; persisted HTML keeps portable CID references. */
export function editorImageHtml(
  html: string,
  sources: Readonly<Record<string, string>>,
): string {
  const document = new DOMParser().parseFromString(
    sanitizeMailHtml(html),
    'text/html',
  );
  for (const image of document.querySelectorAll('img')) {
    const cid = image.getAttribute('src');
    if (!cid || !/^cid:/iu.test(cid)) continue;
    image.setAttribute('data-mail-cid', cid);
    const normalize = (value: string): string => {
      try {
        return decodeURIComponent(value)
          .replace(/^cid:/iu, '')
          .replace(/^<|>$/gu, '')
          .toLowerCase();
      } catch {
        return value;
      }
    };
    const source = Object.entries(sources).find(
      ([key]) => normalize(key) === normalize(cid),
    )?.[1];
    if (source) image.setAttribute('src', source);
    else image.removeAttribute('src');
  }
  return document.body.innerHTML;
}

export function serializeEditorImages(editor: HTMLElement): string {
  const copy = editor.cloneNode(true) as HTMLElement;
  for (const image of copy.querySelectorAll('img[data-mail-cid]')) {
    const cid = image.getAttribute('data-mail-cid');
    if (cid && /^cid:/iu.test(cid)) image.setAttribute('src', cid);
    image.removeAttribute('data-mail-cid');
  }
  return sanitizeMailHtml(copy.innerHTML);
}

export function composerImageSources(
  accountId: string,
  messageId: string | undefined,
  uploads: readonly MailOutboundAttachmentView[],
  retained: MailMessage['attachments'],
): Readonly<Record<string, string>> {
  const sources: Record<string, string> = {};
  for (const attachment of uploads)
    sources[`cid:${uploadedImageContentId(attachment.id)}`] = resolveAppUrl(
      `/api/mail/attachments/${encodeURIComponent(attachment.id)}`,
    );
  if (messageId)
    for (const attachment of retained) {
      if (!attachment.inline || !attachment.contentId) continue;
      sources[`cid:${attachment.contentId.replace(/^<|>$/gu, '')}`] =
        resolveAppUrl(
          `/api/mail/accounts/${encodeURIComponent(accountId)}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachment.id)}`,
        );
    }
  return sources;
}

export function removeEditorImage(
  html: string,
  contentId: string | undefined,
): string {
  if (!contentId) return html;
  const document = new DOMParser().parseFromString(html, 'text/html');
  for (const image of document.querySelectorAll('img')) {
    if (image.getAttribute('src') === `cid:${contentId.replace(/^<|>$/gu, '')}`)
      image.remove();
  }
  return document.body.innerHTML;
}

/** Match actual body images, including quoted content, rather than text containing a CID. */
export function referencedImageIds(html: string): ReadonlySet<string> {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return new Set(
    [...document.querySelectorAll('img[src]')].flatMap((image) => {
      const source = image.getAttribute('src') ?? '';
      return /^cid:/iu.test(source) ? [normalizeImageId(source)] : [];
    }),
  );
}

export function normalizeImageId(value: string): string {
  let id = value.replace(/^cid:/iu, '');
  try {
    id = decodeURIComponent(id);
  } catch {
    /* Preserve malformed provider IDs. */
  }
  return id.replace(/^<|>$/gu, '').trim().toLowerCase();
}
