import type { NormalizedMailMessage } from '../contracts/provider.js';

/** A durable, retryable message identity when provider content cannot be decoded. */
export function incompleteMessage(
  providerMessageId: string,
  code: string,
  metadata: Partial<NormalizedMailMessage> = {},
): NormalizedMailMessage {
  return {
    providerMessageId,
    providerFolderIds: [],
    subject: '',
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    read: false,
    starred: false,
    draft: false,
    attachments: [],
    ...metadata,
    contentStatus: 'failed',
    contentError: code,
  };
}
