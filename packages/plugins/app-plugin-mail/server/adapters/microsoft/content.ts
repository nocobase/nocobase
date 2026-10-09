import type { MailProviderSendInput } from '../../contracts/provider.js';

import type { GraphFileAttachment, GraphMessage } from './types.js';
import { htmlToText } from './normalize.js';

export function graphAttachment(
  attachment: MailProviderSendInput['message']['attachments'][number],
  bytes: Buffer,
): GraphFileAttachment {
  return {
    '@odata.type': '#microsoft.graph.fileAttachment',
    name: attachment.fileName,
    contentType: attachment.contentType,
    contentBytes: bytes.toString('base64'),
    isInline: attachment.inline,
    ...(attachment.contentId ? { contentId: attachment.contentId } : {}),
  };
}

export async function graphAttachments(
  input: MailProviderSendInput,
): Promise<readonly GraphFileAttachment[]> {
  const attachments: GraphFileAttachment[] = [];
  for (const attachment of input.message.attachments) {
    const stream = await attachment.open();
    const bytes = Buffer.from(await new Response(stream).arrayBuffer());
    if (bytes.byteLength !== attachment.size) {
      throw new Error('Mail attachment size changed before submission.');
    }
    attachments.push(graphAttachment(attachment, bytes));
  }
  return attachments;
}

export function relatedBody(
  input: MailProviderSendInput,
  draft: GraphMessage,
): { readonly contentType: 'HTML' | 'Text'; readonly content: string } {
  const contentType = input.message.html ? 'HTML' : 'Text';
  const comment = input.message.html ?? input.message.text;
  if (
    input.message.replyBodyIncluded ||
    (input.message.forwardOfProviderMessageId &&
      input.message.forwardBodyIncluded)
  ) {
    return { contentType, content: comment };
  }
  const original = draft.body?.content ?? '';
  if (!original) return { contentType, content: comment };
  if (contentType === 'HTML') {
    return { contentType, content: `${comment}<br><br>${original}` };
  }
  return { contentType, content: `${comment}\n\n${htmlToText(original)}` };
}
