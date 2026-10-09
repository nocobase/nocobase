import { type AddressObject, type EmailAddress } from 'mailparser';

import type {
  MailAddress,
  NormalizedMailAttachment,
} from '../../../shared/mail.js';

import { encodeAttachmentLocator } from './locators.js';

export function normalizeAttachment(
  folder: string,
  uidValidity: string,
  uid: number,
  attachment: {
    filename?: string;
    contentType: string;
    size: number;
    contentId?: string;
    related?: boolean;
  },
  index: number,
): NormalizedMailAttachment {
  return {
    providerAttachmentId: encodeAttachmentLocator({
      folder,
      uidValidity,
      uid,
      attachment: index,
    }),
    fileName: attachment.filename ?? `attachment-${index + 1}`,
    contentType: attachment.contentType,
    size: attachment.size,
    contentId: attachment.contentId,
    inline: attachment.related ?? false,
  };
}

export function addresses(
  value: AddressObject | AddressObject[] | undefined,
): MailAddress[] {
  const objects = value ? (Array.isArray(value) ? value : [value]) : [];
  return objects.flatMap((object) => object.value.flatMap(flattenAddress));
}

function flattenAddress(value: EmailAddress): MailAddress[] {
  if (value.group?.length) return value.group.flatMap(flattenAddress);
  return value.address
    ? [{ address: value.address, name: value.name || undefined }]
    : [];
}

export function envelopeAddress(
  value: { address?: string; name?: string } | undefined,
): MailAddress | undefined {
  return value?.address
    ? { address: value.address, name: value.name || undefined }
    : undefined;
}

export function envelopeAddresses(
  value: readonly { address?: string; name?: string }[] | undefined,
): MailAddress[] {
  return (
    value?.flatMap((item) => {
      const address = envelopeAddress(item);
      return address ? [address] : [];
    }) ?? []
  );
}

export function references(value: string | string[] | undefined): string[] {
  return value ? (Array.isArray(value) ? value : [value]) : [];
}

export function preview(text: string | undefined): string | undefined {
  return text?.replace(/\s+/g, ' ').trim().slice(0, 240) || undefined;
}

export function toIsoDate(
  value: Date | string | undefined,
): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

export function toHeader(value: MailAddress): {
  address: string;
  name?: string;
} {
  return value.name
    ? { address: value.address, name: value.name }
    : { address: value.address };
}

export function bufferStream(value: Buffer): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(value);
      controller.close();
    },
  });
}
