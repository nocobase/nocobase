import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import type { FileListLabels } from '../components/file-list.js';
import type { FileUploadLabels } from '../components/file-upload-field.js';

export type FileExampleLabels = FileListLabels & FileUploadLabels;

const namespace = '@nocobase/app-plugin-file-example';

/** Labels shared by the upload field, the file list and the preview dialog. */
export function useFileLabels(): FileExampleLabels {
  const { t } = useTranslation(namespace);
  return useMemo(
    (): FileExampleLabels => ({
      choose: t('choose'),
      uploading: t('uploading'),
      dropHint: t('dropHint'),
      tooLarge: t('tooLarge'),
      rejected: t('rejected'),
      uploadFailed: t('uploadFailed'),
      cancel: t('cancelUpload'),
      retry: t('retryUpload'),
      longWait: t('uploadLongWait'),
      preview: t('preview'),
      download: t('download'),
      remove: t('remove'),
      empty: t('empty'),
      close: t('close'),
      previous: t('previous'),
      next: t('next'),
      loading: t('loading'),
      unsupported: t('previewUnsupported'),
      previewFailed: t('previewFailed'),
    }),
    [t],
  );
}
