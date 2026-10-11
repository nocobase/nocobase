/** A projects plugin file as the installed `attachment-list` reads it, and Studio's preview of such files. */
import type { Attachment } from '@nocobase/app-plugin-projects/shared/attachments';
import { createElement, useState, type ReactNode } from 'react';

import type { AttachmentFile } from '@/components/attachment-list';

import { StudioFilePreview } from '../../files/attachment-preview.js';

export function attachmentFile(file: Attachment): AttachmentFile {
  return {
    id: file.id,
    name: file.filename,
    size: file.size,
    url: file.contentUrl,
    downloadUrl: file.downloadUrl,
    image: file.previewable,
    canRemove: file.canDelete,
  };
}

/** The file component UI's preview over `attachment-list`'s `onPreview`: every file, in the order shown. */
export function useFilePreviewState(): {
  readonly open: (
    files: readonly Attachment[],
    shown: readonly AttachmentFile[],
    index: number,
  ) => void;
  readonly dialog: ReactNode;
} {
  const [state, setState] = useState<{
    readonly files: readonly Attachment[];
    readonly index: number;
  } | null>(null);
  return {
    open: (files, shown, index) =>
      setState({
        files: shown.flatMap((file) => {
          const found = files.find((candidate) => candidate.id === file.id);
          return found ? [found] : [];
        }),
        index,
      }),
    dialog: state
      ? createElement(StudioFilePreview, {
          files: state.files,
          index: state.index,
          open: true,
          onOpenChange: (open: boolean) => {
            if (!open) setState(null);
          },
        })
      : null,
  };
}
