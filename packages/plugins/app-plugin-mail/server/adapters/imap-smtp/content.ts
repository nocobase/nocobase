import type {
  FetchQueryObject,
  ImapFlow,
  MessageStructureObject,
} from 'imapflow';
import { simpleParser } from 'mailparser';
import type { NormalizedMailAttachment } from '../../../shared/mail.js';
import type { NormalizedMailMessage } from '../../contracts/provider.js';
import { encodeAttachmentLocator } from './locators.js';
import { classifyError, throwIfAborted } from './errors.js';

import { MAX_IMAP_BODY_BYTES } from './constants.js';
const MAX_HEADER_BYTES = 64 * 1024;

export function metadataQuery(): FetchQueryObject {
  return {
    uid: true,
    size: true,
    flags: true,
    internalDate: true,
    envelope: true,
    bodyStructure: true,
    bodyParts: [{ key: 'HEADER', start: 0, maxLength: MAX_HEADER_BYTES }],
  };
}

function isAttachment(part: MessageStructureObject): boolean {
  return (
    !['text/plain', 'text/html', 'message/delivery-status'].includes(
      part.type.toLowerCase(),
    ) ||
    Boolean(part.disposition && part.disposition.toLowerCase() !== 'inline')
  );
}

function leaves(structure?: MessageStructureObject): MessageStructureObject[] {
  if (!structure) return [];
  if (structure.type.toLowerCase().startsWith('multipart/'))
    return (structure.childNodes ?? []).flatMap(leaves);
  // Attached messages remain a single attachment; do not traverse their bodies.
  return [structure];
}

export function attachmentParts(
  structure?: MessageStructureObject,
): MessageStructureObject[] {
  return leaves(structure).filter(isAttachment);
}

export function bodyParts(
  structure?: MessageStructureObject,
): MessageStructureObject[] | undefined {
  return structure
    ? leaves(structure).filter((part) => !isAttachment(part))
    : undefined;
}

export function attachmentMetadata(
  folder: string,
  uidValidity: string,
  uid: number,
  part: MessageStructureObject,
  index: number,
): NormalizedMailAttachment {
  return {
    providerAttachmentId: encodeAttachmentLocator({
      folder,
      uidValidity,
      uid,
      attachment: index,
    }),
    fileName:
      part.dispositionParameters?.filename ??
      part.parameters?.name ??
      `attachment-${index + 1}`,
    contentType: part.type,
    // BODYSTRUCTURE size includes transfer encoding. It is not a Content-Length.
    size: part.size ?? 0,
    inline: part.disposition?.toLowerCase() === 'inline' || Boolean(part.id),
    contentId: part.id?.replace(/^<|>$/g, ''),
  };
}

type BodyContent = Pick<
  NormalizedMailMessage,
  'text' | 'html' | 'contentStatus' | 'contentError'
>;

export async function readBody(
  client: ImapFlow,
  uid: number,
  parts: MessageStructureObject[] | undefined,
  signal?: AbortSignal,
  maxBytes: number = MAX_IMAP_BODY_BYTES,
): Promise<BodyContent> {
  if (!parts)
    return {
      contentStatus: 'failed',
      contentError: 'IMAP_MESSAGE_STRUCTURE_MISSING',
    };
  let inputBytes = 0;
  let outputBytes = 0;
  const text: string[] = [];
  const html: string[] = [];
  const needsTextFallback = !parts.some(
    (part) => part.type.toLowerCase() !== 'text/html',
  );
  try {
    for (const part of parts) {
      throwIfAborted(signal);
      const remaining = maxBytes - inputBytes;
      if ((part.size ?? 0) > remaining) return deferred(maxBytes);
      const key = part.part ?? 'TEXT';
      const chunks: Buffer[] = [];
      let offset = 0;
      let binary = false;
      while (true) {
        throwIfAborted(signal);
        const length = Math.min(
          MAX_IMAP_BODY_BYTES + 1,
          remaining + 1 - offset,
        );
        const fetched = await client.fetchOne(
          uid,
          { bodyParts: [{ key, start: offset, maxLength: length }] },
          { uid: true },
        );
        throwIfAborted(signal);
        const chunk = fetched && fetched.bodyParts?.get(key.toLowerCase());
        if (!chunk) throw new Error('IMAP body part was not returned.');
        binary = Boolean(fetched.binaryParts?.has(key.toLowerCase()));
        offset += chunk.byteLength;
        if (offset > remaining) return deferred(maxBytes);
        if (chunk.byteLength > length)
          throw new Error('IMAP server ignored the requested body window.');
        chunks.push(chunk);
        if (chunk.byteLength < length) break;
        // Probe beyond the reported size as well: metadata may underreport it.
      }
      const raw = Buffer.concat(chunks, offset);
      inputBytes += raw.byteLength;
      if (inputBytes > maxBytes) return deferred(maxBytes);
      const charset = (part.parameters?.charset ?? 'utf-8').replace(
        /[\r\n"\\]/g,
        '',
      );
      const encoding =
        !binary &&
        ['base64', 'quoted-printable'].includes(
          part.encoding?.toLowerCase() ?? '',
        )
          ? part.encoding!.toLowerCase()
          : '8bit';
      const type =
        part.type.toLowerCase() === 'text/html' ? 'text/html' : 'text/plain';
      const format =
        part.parameters?.format?.toLowerCase() === 'flowed'
          ? '; format=flowed' +
            (part.parameters?.delsp?.toLowerCase() === 'yes'
              ? '; delsp=yes'
              : '')
          : '';
      const headers = Buffer.from(
        `Content-Type: ${type}; charset="${charset}"${format}\r\nContent-Transfer-Encoding: ${encoding}\r\n\r\n`,
      );
      const parsed = await simpleParser(Buffer.concat([headers, raw]), {
        skipHtmlToText: !needsTextFallback,
        skipTextToHtml: true,
        skipImageLinks: true,
      });
      const value =
        type === 'text/html' ? parsed.html || '' : (parsed.text ?? '');
      const target = type === 'text/html' ? html : text;
      outputBytes += Buffer.byteLength(value) + (target.length ? 1 : 0);
      if (outputBytes > maxBytes) return deferred(maxBytes);
      target.push(value);
      if (type === 'text/html' && needsTextFallback && parsed.text) {
        outputBytes += Buffer.byteLength(parsed.text) + (text.length ? 1 : 0);
        if (outputBytes > maxBytes) return deferred(maxBytes);
        text.push(parsed.text);
      }
    }
    return {
      contentStatus: 'complete',
      text: text.length ? text.join('\n') : undefined,
      html: html.length ? html.join('\n') : undefined,
    };
  } catch (error) {
    throwIfAborted(signal);
    // Network failures must retry the page instead of advancing past missing mail.
    if (
      classifyError(error, 'IMAP_GET_BODY').retryable ||
      classifyError(error, 'IMAP_GET_BODY').category === 'authentication' ||
      ['LiteralTooLarge', 'ResponseTooLarge', 'LineTooLarge'].includes(
        (error as { code?: string }).code ?? '',
      )
    )
      throw error;
    return {
      contentStatus: 'failed',
      contentError: 'IMAP_MESSAGE_PARSE_FAILED',
    };
  }
}

function deferred(maxBytes: number): BodyContent {
  return {
    contentStatus: 'deferred',
    contentError:
      maxBytes > MAX_IMAP_BODY_BYTES
        ? 'IMAP_DETAIL_BODY_TOO_LARGE'
        : 'IMAP_MESSAGE_TOO_LARGE',
  };
}
