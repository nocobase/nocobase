/**
 * The projects plugin's files on the issue page previewed with Studio's file component UI: images, PDFs,
 * text and Markdown, audio and video, and Office documents, with stepping through the files and a download. What the
 * dialog cannot show it offers to download.
 */
import type { Attachment } from '@nocobase/app-plugin-projects/shared/attachments';
import type { ReactElement } from 'react';

import {
  FilePreviewDialog,
  type FileRecord,
} from '@/extensions/nocobase-file-component-ui';

/** A file as the file component UI reads it; its bytes are only ever read through `contentUrl`. */
function fileRecordOf(file: Attachment): FileRecord {
  return {
    id: file.id,
    disk: '',
    key: '',
    filename: file.filename,
    ext: file.ext,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: file.createdAt,
    updatedAt: file.createdAt,
    contentUrl: file.contentUrl,
  };
}

export function StudioFilePreview({
  files,
  index,
  open,
  onOpenChange,
}: {
  readonly files: readonly Attachment[];
  readonly index: number;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}): ReactElement | null {
  return (
    <FilePreviewDialog
      files={files.map(fileRecordOf)}
      initialIndex={index}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
