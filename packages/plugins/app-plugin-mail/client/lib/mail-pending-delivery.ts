import { resolveAppUrl } from '@nocobase/app-client';
import { uploadedImageContentId } from '../../shared/inline-images.js';
import type { MailComposeInput, MailBulkComposeInput } from '../mail-client.js';
export type PendingDelivery =
  | {
      readonly accountId: string;
      readonly mode: 'normal';
      readonly input: MailComposeInput;
    }
  | {
      readonly accountId: string;
      readonly mode: 'bulk';
      readonly input: MailBulkComposeInput;
    };
const PREFIX = 'nocobase:mail:pending-delivery:v1:';
export function writePendingDelivery(delivery: PendingDelivery): void {
  // Failure to preserve the outgoing request must happen before submission.
  window.localStorage.setItem(
    `${PREFIX}${delivery.accountId}:${delivery.input.idempotencyKey}`,
    JSON.stringify(delivery),
  );
}
export function clearPendingDelivery(accountId: string, key: string): void {
  try {
    window.localStorage.removeItem(`${PREFIX}${accountId}:${key}`);
  } catch {
    /* A replay uses the same idempotency key. */
  }
}
export function readPendingDeliveries(
  accountIds: readonly string[],
): readonly PendingDelivery[] {
  const items: PendingDelivery[] = [];
  try {
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(PREFIX)) continue;
      try {
        const value: unknown = JSON.parse(
          window.localStorage.getItem(key) ?? 'null',
        );
        if (
          !value ||
          typeof value !== 'object' ||
          !('accountId' in value) ||
          typeof value.accountId !== 'string' ||
          !accountIds.includes(value.accountId) ||
          !('mode' in value) ||
          !['normal', 'bulk'].includes(String(value.mode)) ||
          !('input' in value) ||
          !value.input ||
          typeof value.input !== 'object' ||
          !('idempotencyKey' in value.input) ||
          typeof value.input.idempotencyKey !== 'string'
        )
          continue;
        items.push(value as PendingDelivery);
      } catch {
        /* Ignore invalid browser records. */
      }
    }
  } catch {
    /* Storage can be unavailable in a restricted browser. */
  }
  return items;
}

export function withoutSubmittedDrafts<
  T extends {
    readonly id: string;
    readonly accountId: string;
    readonly draft: boolean;
    readonly providerMessageId: string;
  },
>(messages: readonly T[]): readonly T[] {
  const pending = readPendingDeliveries([
    ...new Set(messages.map((message) => message.accountId)),
  ]);
  return messages.filter(
    (message) =>
      !message.draft ||
      !pending.some(
        (item) =>
          item.accountId === message.accountId &&
          ((item.mode === 'normal'
            ? item.input.draftMessageId
            : item.input.sourceDraftMessageId) === message.id ||
            (item.input.draftKey &&
              message.providerMessageId ===
                `local-draft:${item.input.draftKey}`)),
      ),
  );
}

/** Outgoing snapshots own uploads independently of removed draft messages. */
export function outgoingMailHtml(
  html: string,
  attachmentIds: readonly string[] = [],
  contentIds: Readonly<Record<string, string>> = {},
): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const normalize = (value: string): string =>
    value.replace(/^cid:/iu, '').replace(/^<|>$/gu, '').toLowerCase();
  const uploads = new Map(
    attachmentIds.map((id) => [
      normalize(contentIds[id] ?? uploadedImageContentId(id)),
      id,
    ]),
  );
  for (const image of document.querySelectorAll('img[src]')) {
    const src = image.getAttribute('src') ?? '';
    if (!/^cid:/iu.test(src)) continue;
    const id = uploads.get(normalize(src));
    if (id)
      image.setAttribute(
        'src',
        resolveAppUrl(`/api/mail/attachments/${encodeURIComponent(id)}`),
      );
  }
  return document.documentElement.outerHTML;
}
