import type {
  MailAddress,
  MailFolderType,
  MailProviderResult,
  NormalizedMailAttachment,
} from '../../../shared/mail.js';
import type { NormalizedMailMessage } from '../../contracts/provider.js';

import type { GraphEmailAddress, GraphMessage, GraphProfile } from './types.js';
import { failure } from './errors.js';

export function normalizeGraphMessage(
  message: GraphMessage,
  attachments: readonly NormalizedMailAttachment[],
): MailProviderResult<NormalizedMailMessage> {
  if (!message.id)
    return failure(
      'MICROSOFT_MESSAGE_INVALID',
      'Microsoft message did not include an ID.',
      'provider',
      false,
    );
  const html =
    message.body?.contentType?.toLowerCase() === 'html'
      ? message.body.content
      : undefined;
  const text = html ? undefined : message.body?.content;
  return {
    ok: true,
    value: {
      providerMessageId: message.id,
      internetMessageId: message.internetMessageId,
      providerConversationId: message.conversationId,
      providerFolderIds: message.parentFolderId ? [message.parentFolderId] : [],
      from: graphAddress(message.from),
      to: graphAddresses(message.toRecipients),
      cc: graphAddresses(message.ccRecipients),
      bcc: graphAddresses(message.bccRecipients),
      replyTo: graphAddresses(message.replyTo),
      references: [],
      subject: message.subject ?? '',
      preview: message.bodyPreview,
      text,
      html,
      receivedAt: message.receivedDateTime,
      sentAt: message.sentDateTime,
      read: message.isRead ?? false,
      starred: message.flag?.flagStatus === 'flagged',
      draft: message.isDraft ?? false,
      attachments,
    },
  };
}

export function graphRecipient(address: MailAddress): GraphEmailAddress {
  return { emailAddress: { address: address.address, name: address.name } };
}

export function microsoftIdentities(
  profile: GraphProfile,
  primaryAddress: string,
): readonly {
  address: string;
  displayName?: string;
  isPrimary: boolean;
  canSend: boolean;
}[] {
  const addresses = new Map<string, string>();
  addresses.set(primaryAddress.toLowerCase(), primaryAddress);
  for (const value of profile.proxyAddresses ?? []) {
    const match = value.match(/^smtp:(.+)$/iu);
    if (match?.[1]) addresses.set(match[1].toLowerCase(), match[1]);
  }
  return [...addresses.values()].map((address) => ({
    address,
    displayName: profile.displayName,
    isPrimary: address.toLowerCase() === primaryAddress.toLowerCase(),
    canSend: true,
  }));
}

function graphAddress(
  value: GraphEmailAddress | undefined,
): MailAddress | undefined {
  const address = value?.emailAddress?.address;
  return address ? { address, name: value?.emailAddress?.name } : undefined;
}

function graphAddresses(
  values: readonly GraphEmailAddress[] | undefined,
): readonly MailAddress[] {
  return (values ?? []).flatMap((value) => {
    const address = graphAddress(value);
    return address ? [address] : [];
  });
}

export function graphFolderType(
  name: string | undefined,
  wellKnownName?: string,
): MailFolderType {
  const wellKnown = wellKnownName?.trim().toLowerCase();
  if (wellKnown === 'inbox') return 'inbox';
  if (['sentitems', 'sent'].includes(wellKnown ?? '')) return 'sent';
  if (['drafts', 'draft'].includes(wellKnown ?? '')) return 'drafts';
  if (['deleteditems', 'deleted'].includes(wellKnown ?? '')) return 'trash';
  if (['junkemail', 'junk'].includes(wellKnown ?? '')) return 'junk';
  if (['archive', 'archived', '存档'].includes(wellKnown ?? ''))
    return 'archive';
  const value = name?.trim().toLowerCase();
  if (['inbox', '收件箱'].includes(value ?? '')) return 'inbox';
  if (
    ['sent', 'sent items', 'sent mail', '已发送', '已发送邮件'].includes(
      value ?? '',
    )
  )
    return 'sent';
  if (['draft', 'drafts', '草稿', '草稿箱'].includes(value ?? ''))
    return 'drafts';
  if (
    [
      'deleted',
      'deleted items',
      'trash',
      'recycle bin',
      '已删除',
      '已删除邮件',
    ].includes(value ?? '')
  )
    return 'trash';
  if (
    ['junk', 'junk email', 'spam', '垃圾邮件', '垃圾箱'].includes(value ?? '')
  )
    return 'junk';
  if (['archive', 'archived', '存档'].includes(value ?? '')) return 'archive';
  return 'custom';
}

export function htmlToText(value: string): string {
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
