import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';
import type { FilePreviewFieldProps } from '../types';
import { Button } from '@/components/ui/button';
import { FilePreviewDialog } from './file-preview-dialog';
import { FileThumbnail } from './file-thumbnail';

export function FilePreviewField(
  inputProps: FilePreviewFieldProps,
): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-file');
  const {
    files,
    labels,
    emptyState,
    showFilenames = false,
    onError,
  } = inputProps;

  const [open, setOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  if (!files.length)
    return (
      <>
        {emptyState ?? (
          <span role='status'>
            {t('files.empty', { defaultValue: 'No files.' })}
          </span>
        )}
      </>
    );
  return (
    <>
      <div data-slot='file-preview-field' className='flex flex-wrap gap-2'>
        {files.map((file, index) => (
          <div key={file.id} className='flex max-w-36 flex-col gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-12 w-12 overflow-hidden'
              aria-label={`${labels?.preview ?? t('files.preview', { defaultValue: 'Preview' })}: ${file.filename}`}
              onClick={() => {
                setInitialIndex(index);
                setOpen(true);
              }}
            >
              <FileThumbnail file={file} />
            </Button>
            {showFilenames ? (
              <span className='truncate text-xs' title={file.filename}>
                {file.filename}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <FilePreviewDialog
        files={files}
        initialIndex={initialIndex}
        open={open}
        onOpenChange={setOpen}
        labels={labels}
        onError={onError}
      />
    </>
  );
}
