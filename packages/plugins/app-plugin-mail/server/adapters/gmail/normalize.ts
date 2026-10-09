import type {
  MailAddress,
  MailProviderResult,
  NormalizedMailAttachment,
} from '../../../shared/mail.js';
import type {
  NormalizedMailFolder,
  NormalizedMailMessage,
} from '../../contracts/provider.js';

import type { GmailHeader, GmailMessageResource, GmailPart } from './types.js';
import { failure } from './errors.js';

export function normalizeMessage(
  message: GmailMessageResource,
): MailProviderResult<NormalizedMailMessage> {
  if (!message.id)
    return failure(
      'GMAIL_MESSAGE_INVALID',
      'Gmail message did not include an ID.',
      'provider',
      false,
    );
  const headers = new Map(
    (message.payload?.headers ?? []).flatMap((header) =>
      header.name && header.value
        ? [[header.name.toLowerCase(), header.value] as const]
        : [],
    ),
  );
  const content = collectParts(message.payload);
  return {
    ok: true,
    value: {
      providerMessageId: message.id,
      internetMessageId: headers.get('message-id'),
      providerConversationId: message.threadId,
      providerFolderIds: gmailFolderIds(message.labelIds ?? []),
      from: parseAddresses(headers.get('from'))[0],
      to: parseAddresses(headers.get('to')),
      cc: parseAddresses(headers.get('cc')),
      bcc: parseAddresses(headers.get('bcc')),
      replyTo: parseAddresses(headers.get('reply-to')),
      inReplyTo: headers.get('in-reply-to'),
      references: headers.get('references')?.split(/\s+/).filter(Boolean) ?? [],
      subject: headers.get('subject') ?? '',
      preview: message.snippet,
      text: content.text,
      html: content.html,
      receivedAt: timestamp(message.internalDate),
      sentAt: timestamp(Date.parse(headers.get('date') ?? '')),
      read: !(message.labelIds ?? []).includes('UNREAD'),
      starred: (message.labelIds ?? []).includes('STARRED'),
      draft: (message.labelIds ?? []).includes('DRAFT'),
      attachments: content.attachments,
    },
  };
}

function collectParts(part: GmailPart | undefined): {
  text?: string;
  html?: string;
  attachments: readonly NormalizedMailAttachment[];
} {
  let text: string | undefined;
  let html: string | undefined;
  const attachments: NormalizedMailAttachment[] = [];
  const visit = (current: GmailPart | undefined): void => {
    if (!current) return;
    const disposition =
      headerValue(current.headers, 'content-disposition') ?? '';
    if (current.body?.attachmentId || current.filename) {
      attachments.push({
        providerAttachmentId:
          current.body?.attachmentId ?? current.partId ?? '',
        fileName: current.filename ?? '',
        contentType: current.mimeType ?? 'application/octet-stream',
        size: current.body?.size ?? 0,
        contentId: headerValue(current.headers, 'content-id'),
        inline: /^inline/i.test(disposition),
      });
    } else if (
      current.body?.data &&
      current.mimeType === 'text/plain' &&
      text === undefined
    ) {
      text = new TextDecoder().decode(decodeBase64Url(current.body.data));
    } else if (
      current.body?.data &&
      current.mimeType === 'text/html' &&
      html === undefined
    ) {
      html = new TextDecoder().decode(decodeBase64Url(current.body.data));
    }
    current.parts?.forEach(visit);
  };
  visit(part);
  return { text, html, attachments };
}

function gmailFolderIds(labelIds: readonly string[]): readonly string[] {
  const archived = !['INBOX', 'TRASH', 'SPAM', 'SENT', 'DRAFT'].some((label) =>
    labelIds.includes(label),
  );
  return archived ? [...labelIds, '__archive__'] : labelIds;
}

function parseAddresses(value: string | undefined): readonly MailAddress[] {
  if (!value) return [];
  return value.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).flatMap((entry) => {
    const match = entry.trim().match(/^(?:"?(.+?)"?\s*)?<([^>]+)>$/);
    const address = (match?.[2] ?? entry).trim();
    return address ? [{ address, name: match?.[1]?.trim() }] : [];
  });
}

function headerValue(
  headers: readonly GmailHeader[] | undefined,
  name: string,
): string | undefined {
  return headers?.find((header) => header.name?.toLowerCase() === name)?.value;
}

export function gmailFolderType(id: string): NormalizedMailFolder['type'] {
  return (
    (
      {
        INBOX: 'inbox',
        SENT: 'sent',
        DRAFT: 'drafts',
        TRASH: 'trash',
        SPAM: 'junk',
      } as const
    )[id as 'INBOX'] ?? 'custom'
  );
}

function timestamp(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  const numeric =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  const date = new Date(numeric);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function decodeBase64Url(value: string): Uint8Array {
  return Buffer.from(value, 'base64url');
}
