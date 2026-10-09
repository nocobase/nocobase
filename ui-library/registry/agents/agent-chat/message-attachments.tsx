/**
 * The files sent with a message, through `attachment-list`: the images as thumbnails that open larger in its dialog
 * (stepping through them, with a download), and the other files as chips that download. Each reads its bytes from the
 * agents plugin's content route, which only the conversation's owner may read.
 */
import type { MessageAttachment } from '@nocobase/app-plugin-agents/shared/conversations';
import { useLocale } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  AttachmentList,
  type AttachmentFile,
} from '#components/attachment-list';
import { cn } from 'cn';

import { useAttachmentLabels } from './chat-i18n.js';

function fileOf(attachment: MessageAttachment): AttachmentFile {
  return {
    id: attachment.id,
    name: attachment.filename,
    size: attachment.size,
    url: attachment.contentUrl,
    downloadUrl: attachment.downloadUrl,
    image: attachment.previewable,
  };
}

export interface MessageAttachmentsProps {
  readonly attachments: readonly MessageAttachment[];
  readonly className?: string;
}

export function MessageAttachments({
  attachments,
  className,
}: MessageAttachmentsProps): ReactElement | null {
  const labels = useAttachmentLabels();
  const { locale } = useLocale();
  if (attachments.length === 0) return null;
  return (
    <div
      className={cn('flex max-w-full min-w-0 justify-end', className)}
      data-testid='chat-message-files'
    >
      <AttachmentList
        files={attachments.map(fileOf)}
        labels={labels}
        {...(locale ? { locale } : {})}
        className='items-end'
      />
    </div>
  );
}
