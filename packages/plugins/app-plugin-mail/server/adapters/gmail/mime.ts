import type { MailAddress } from '../../../shared/mail.js';
import type {
  MailProviderSendInput,
  NormalizedMailMessage,
} from '../../contracts/provider.js';

export function normalizedDraft(
  input: MailProviderSendInput,
  providerMessageId: string,
): NormalizedMailMessage {
  return {
    providerMessageId,
    providerConversationId: input.message.providerConversationId,
    providerFolderIds: ['DRAFT'],
    from: input.identity,
    to: input.message.to,
    cc: input.message.cc,
    bcc: input.message.bcc,
    replyTo: [],
    inReplyTo: input.message.inReplyTo,
    references: input.message.references,
    subject: input.message.subject,
    text: input.message.text,
    html: input.message.html,
    read: true,
    starred: false,
    draft: true,
    attachments: [],
  };
}

export async function buildMime(input: MailProviderSendInput): Promise<string> {
  const headers = [
    `From: ${formatAddress(input.identity)}`,
    `To: ${input.message.to.map(formatAddress).join(', ')}`,
    ...(input.message.cc.length
      ? [`Cc: ${input.message.cc.map(formatAddress).join(', ')}`]
      : []),
    ...(input.message.bcc.length
      ? [`Bcc: ${input.message.bcc.map(formatAddress).join(', ')}`]
      : []),
    `Subject: ${encodeHeader(input.message.subject)}`,
    ...(input.message.inReplyTo
      ? [`In-Reply-To: ${cleanHeader(input.message.inReplyTo)}`]
      : []),
    ...(input.message.references.length
      ? [`References: ${input.message.references.map(cleanHeader).join(' ')}`]
      : []),
    'MIME-Version: 1.0',
  ];
  const token = input.trackingId.replace(/[^a-zA-Z0-9]/g, '') || 'message';
  const alternativeBoundary = `${token}-alternative`;
  const alternativeBody = input.message.html
    ? multipartAlternativeBody(
        input.message.text,
        input.message.html,
        alternativeBoundary,
      )
    : undefined;
  let body: string;
  if (input.message.attachments.length > 0) {
    const boundary = `nocobase-${token}-mixed`;
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    const parts = [
      alternativeBody
        ? [
            `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
            '',
            alternativeBody,
          ].join('\r\n')
        : textPart(input.message.text),
    ];
    for (const attachment of input.message.attachments) {
      const bytes = await readAttachment(attachment.open(), attachment.size);
      const fileName = encodeHeader(attachment.fileName);
      parts.push(
        [
          `Content-Type: ${cleanHeader(attachment.contentType)}; name="${fileName}"`,
          `Content-Disposition: ${attachment.inline ? 'inline' : 'attachment'}; filename="${fileName}"`,
          ...(attachment.contentId
            ? [`Content-ID: <${cleanHeader(attachment.contentId)}>`]
            : []),
          'Content-Transfer-Encoding: base64',
          '',
          wrapBase64(bytes.toString('base64')),
        ].join('\r\n'),
      );
    }
    body = [
      ...parts.flatMap((part) => [`--${boundary}`, part]),
      `--${boundary}--`,
      '',
    ].join('\r\n');
  } else if (alternativeBody) {
    headers.push(
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    );
    body = alternativeBody;
  } else {
    headers.push(
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
    );
    body = input.message.text;
  }
  return Buffer.from(`${headers.join('\r\n')}\r\n\r\n${body}`).toString(
    'base64url',
  );
}

function multipartAlternativeBody(
  text: string,
  html: string,
  boundary: string,
): string {
  return [
    `--${boundary}`,
    textPart(text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    `--${boundary}--`,
  ].join('\r\n');
}

function textPart(text: string): string {
  return [
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
  ].join('\r\n');
}

async function readAttachment(
  streamPromise: Promise<ReadableStream<Uint8Array>>,
  expectedSize: number,
): Promise<Buffer> {
  const stream = await streamPromise;
  const bytes = Buffer.from(await new Response(stream).arrayBuffer());
  if (bytes.byteLength !== expectedSize) {
    throw new Error('Mail attachment size changed before submission.');
  }
  return bytes;
}

function wrapBase64(value: string): string {
  return value.match(/.{1,76}/gu)?.join('\r\n') ?? '';
}

function formatAddress(value: MailAddress): string {
  const address = cleanHeader(value.address);
  return value.name
    ? `${encodeHeader(cleanHeader(value.name))} <${address}>`
    : address;
}

function encodeHeader(value: string): string {
  const clean = cleanHeader(value);
  return /^[\x20-\x7e]*$/.test(clean)
    ? clean
    : `=?UTF-8?B?${Buffer.from(clean).toString('base64')}?=`;
}

function cleanHeader(value: string): string {
  return value.replace(/[\r\n]/g, ' ');
}

export function htmlToText(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return value
    .replace(/<br\s*\/?>/giu, '\n')
    .replace(/<\/p\s*>/giu, '\n')
    .replace(/<[^>]+>/gu, '')
    .replace(/&nbsp;/giu, ' ')
    .replace(/&amp;/giu, '&')
    .replace(/&lt;/giu, '<')
    .replace(/&gt;/giu, '>')
    .trim();
}

export function forwardedText(
  comment: string,
  source: NormalizedMailMessage,
): string {
  const headers = [
    '---------- Forwarded message ---------',
    source.from ? `From: ${formatAddress(source.from)}` : undefined,
    (source.sentAt ?? source.receivedAt)
      ? `Date: ${source.sentAt ?? source.receivedAt}`
      : undefined,
    `Subject: ${source.subject}`,
    source.to.length
      ? `To: ${source.to.map(formatAddress).join(', ')}`
      : undefined,
  ].filter((value): value is string => Boolean(value));
  const body = source.text ?? htmlToText(source.html) ?? source.preview ?? '';
  return [comment.trimEnd(), '', ...headers, '', body].join('\n');
}

export function forwardedHtml(
  commentHtml: string | undefined,
  commentText: string,
  source: NormalizedMailMessage,
): string {
  const comment = commentHtml ?? escapeHtmlBody(commentText);
  const sourceBody =
    source.html ?? escapeHtmlBody(source.text ?? source.preview ?? '');
  const metadata = [
    source.from
      ? `<b>From:</b> ${escapeHtmlBody(formatAddress(source.from))}`
      : undefined,
    (source.sentAt ?? source.receivedAt)
      ? `<b>Date:</b> ${escapeHtmlBody(source.sentAt ?? source.receivedAt ?? '')}`
      : undefined,
    `<b>Subject:</b> ${escapeHtmlBody(source.subject)}`,
    source.to.length
      ? `<b>To:</b> ${escapeHtmlBody(source.to.map(formatAddress).join(', '))}`
      : undefined,
  ].filter((value): value is string => Boolean(value));
  return `${comment}<br><br><div class="gmail_quote"><div>---------- Forwarded message ---------</div>${metadata.join('<br>')}<br><br>${sourceBody}</div>`;
}

function escapeHtmlBody(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;')
    .replace(/\n/gu, '<br>');
}
