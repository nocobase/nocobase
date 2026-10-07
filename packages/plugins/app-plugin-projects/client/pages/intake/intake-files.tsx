import { useTranslation } from '@nocobase/i18n/client';
import { FileIcon, PaperclipIcon, XIcon } from 'lucide-react';
import { useRef, type ReactElement } from 'react';

import {
  INTAKE_FILES_MAX,
  type IntakeFileRead,
  type IntakeReadState,
} from '../../../shared/intake.js';
import { PmTag, type PmTone } from '../../components/pm-tag.js';
import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';
import { SIZE_MB, type IntakeUploads } from './use-intake-uploads.js';

const STATE_TONE: Readonly<Record<IntakeReadState, PmTone>> = {
  read: 'green',
  truncated: 'amber',
  empty: 'grey',
  image: 'grey',
  unsupported: 'grey',
  legacy: 'amber',
  failed: 'red',
  skipped: 'amber',
};

/** The files added to the intake, with what the last split read of each. */
export function IntakeFiles({
  uploads,
  reads,
}: {
  readonly uploads: IntakeUploads;
  readonly reads: readonly IntakeFileRead[];
}): ReactElement {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className='space-y-2'
      onDragOver={uploads.onDragOver}
      onDrop={uploads.onDrop}
    >
      <div className='flex flex-wrap items-center gap-3'>
        <span className='text-sm font-medium'>{t('intake.files')}</span>
        <Button
          variant='outline'
          size='sm'
          disabled={uploads.uploads.length >= INTAKE_FILES_MAX}
          onClick={() => inputRef.current?.click()}
        >
          <PaperclipIcon data-icon='inline-start' />
          {t('intake.addFiles')}
        </Button>
        <input
          ref={inputRef}
          type='file'
          multiple
          hidden
          data-testid='intake-file-input'
          onChange={(event) => {
            uploads.add([...(event.target.files ?? [])]);
            event.target.value = '';
          }}
        />
        <span className='text-xs text-muted-foreground'>
          {t('intake.filesHint', { count: INTAKE_FILES_MAX, size: SIZE_MB })}
        </span>
      </div>
      {uploads.uploads.length > 0 ? (
        <ul className='flex flex-wrap gap-2' aria-label={t('intake.files')}>
          {uploads.uploads.map((upload) => {
            const read = reads.find((item) => item.fileId === upload.file?.id);
            return (
              <li
                key={upload.key}
                className='flex max-w-xs items-center gap-1.5 rounded-md border bg-background py-1 pr-1 pl-2 text-sm'
              >
                {upload.file ? (
                  <FileIcon
                    className='size-3.5 shrink-0 text-muted-foreground'
                    aria-hidden='true'
                  />
                ) : (
                  <Spinner
                    className='size-3.5'
                    aria-label={t('intake.uploading')}
                  />
                )}
                <span className='truncate' title={upload.name}>
                  {upload.name}
                </span>
                {read ? (
                  <PmTag tone={STATE_TONE[read.state]}>
                    {t(`intake.fileStates.${read.state}`)}
                  </PmTag>
                ) : null}
                <Button
                  variant='ghost'
                  size='icon-xs'
                  aria-label={t('intake.removeFile', { name: upload.name })}
                  onClick={() => uploads.remove(upload.key)}
                >
                  <XIcon />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
