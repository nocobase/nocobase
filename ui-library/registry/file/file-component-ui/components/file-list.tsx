import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';

import type { FileListProps, FileRecord } from '../types.js';
import {
  AttachmentList,
  type AttachmentFile,
} from '#components/attachment-list';
import { resolveSafeFileUrl } from '../lib/file-url.js';
import { FilePreviewDialog } from './file-preview-dialog.js';

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.click();
}

export function FileList(inputProps: FileListProps): ReactElement {
  const { t } = useTranslation();
  const {
    files,
    onPreview,
    onDownload,
    onRemove,
    onError,
    labels,
    emptyState,
  } = inputProps;

  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewLabel =
    labels?.preview ?? t('fileUi.files.preview', { defaultValue: 'Preview' });
  const downloadLabel =
    labels?.download ??
    t('fileUi.files.download', { defaultValue: 'Download' });
  const removeLabel =
    labels?.remove ?? t('fileUi.files.remove', { defaultValue: 'Remove' });

  if (!files.length)
    return (
      <div role='status'>
        {emptyState ??
          labels?.empty ??
          t('fileUi.files.empty', { defaultValue: 'No files.' })}
      </div>
    );

  const downloadFile = (file: FileRecord): void => {
    if (onDownload) {
      onDownload(file);
      return;
    }
    void (async () => {
      const raw = file.contentUrl;
      const url = raw ? resolveSafeFileUrl(raw) : undefined;
      if (!url)
        throw new Error(
          t('fileUi.urlNotAllowed', {
            defaultValue: 'File URL is not allowed.',
          }),
        );
      triggerDownload(url, file.filename);
    })().catch((error: unknown) => {
      onError?.(
        error instanceof Error
          ? error
          : new Error(
              t('fileUi.downloadFailed', {
                defaultValue: 'File download failed.',
              }),
            ),
      );
    });
  };

  const attachments: readonly AttachmentFile[] = files.map((file) => ({
    id: file.id,
    name: file.filename,
    size: Number(file.size),
    url: file.contentUrl ? (resolveSafeFileUrl(file.contentUrl) ?? '') : '',
    downloadUrl: file.contentUrl
      ? (resolveSafeFileUrl(file.contentUrl) ?? '')
      : '',
    image: file.mimeType.startsWith('image/'),
    canRemove: Boolean(onRemove),
  }));
  return (
    <>
      <AttachmentList
        files={attachments}
        labels={{
          title: '',
          images: '',
          files: '',
          pending: '',
          upload: '',
          uploading: '',
          removeTitle: '',
          removeDescription: '',
          removeConfirm: '',
          cancel: '',
          previous: '',
          next: '',
          preview: `${previewLabel}: {name}`,
          download: `${downloadLabel}: {name}`,
          remove: `${removeLabel}: {name}`,
        }}
        onPreview={(ordered, index) => {
          const selected = files.findIndex(
            (file) => file.id === ordered[index]?.id,
          );
          if (selected < 0) return;
          onPreview?.(files[selected]);
          setPreviewIndex(selected);
          setPreviewOpen(true);
        }}
        onDownload={(item) => {
          const file = files.find((file) => file.id === item.id);
          if (file) downloadFile(file);
        }}
        onRemove={
          onRemove
            ? (item) => {
                const file = files.find((file) => file.id === item.id);
                if (file) void onRemove(file);
              }
            : undefined
        }
      />
      <FilePreviewDialog
        files={files}
        initialIndex={previewIndex}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDownload={onDownload}
        labels={labels}
        onError={onError}
      />
    </>
  );
}
