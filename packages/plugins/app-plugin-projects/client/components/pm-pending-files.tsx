import { useTranslation } from '@nocobase/i18n/client';
import { FileIcon, PaperclipIcon, XIcon } from 'lucide-react';
import { useRef, type ReactElement } from 'react';

import { ATTACHMENTS_PER_REQUEST_MAX } from '../../shared/attachments.js';
import {
  ATTACHMENT_SIZE_MB,
  type PendingUpload,
} from '../hooks/use-attachment-uploads.js';
import { Button } from './ui/button.js';
import { Spinner } from './ui/spinner.js';

/**
 * The files added to something not sent yet (`useAttachmentUploads`): a button to choose more, and each file with a
 * thumbnail when it is a previewable image, a spinner while it uploads, and a button taking it back. `disabled` holds
 * the list as it is, while what it belongs to is being sent.
 */
export function PmPendingFiles({
  uploads,
  onAdd,
  onRemove,
  disabled = false,
}: {
  readonly uploads: readonly PendingUpload[];
  readonly onAdd: (files: File[]) => void;
  readonly onRemove: (key: string) => void;
  readonly disabled?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled || uploads.length >= ATTACHMENTS_PER_REQUEST_MAX}
          onClick={() => inputRef.current?.click()}
        >
          <PaperclipIcon data-icon='inline-start' />
          {t('attachments.attach')}
        </Button>
        <input
          ref={inputRef}
          type='file'
          multiple
          hidden
          data-testid='pm-pending-files-input'
          onChange={(event) => {
            onAdd([...(event.target.files ?? [])]);
            event.target.value = '';
          }}
        />
        <span className='text-xs text-muted-foreground'>
          {t('attachments.dropHint', { size: ATTACHMENT_SIZE_MB })}
        </span>
      </div>
      {uploads.length > 0 ? (
        <ul
          className='flex flex-wrap gap-2'
          aria-label={t('attachments.pending')}
        >
          {uploads.map((upload) => (
            <li
              key={upload.key}
              className='flex max-w-xs items-center gap-1.5 rounded-md border bg-background py-1 pr-1 pl-1.5 text-sm'
            >
              {upload.attachment === null ? (
                <Spinner
                  className='size-4 shrink-0'
                  aria-label={t('attachments.uploading', {
                    name: upload.name,
                  })}
                />
              ) : upload.attachment.previewable ? (
                <img
                  src={upload.attachment.contentUrl}
                  alt=''
                  className='size-6 shrink-0 rounded-sm object-cover'
                />
              ) : (
                <FileIcon
                  className='size-4 shrink-0 text-muted-foreground'
                  aria-hidden='true'
                />
              )}
              <span className='truncate' title={upload.name}>
                {upload.name}
              </span>
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                disabled={disabled}
                aria-label={t('attachments.remove', { name: upload.name })}
                onClick={() => onRemove(upload.key)}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
