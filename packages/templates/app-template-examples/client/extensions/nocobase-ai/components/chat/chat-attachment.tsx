import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import { cn } from '../../shared/utils.js';
import type { AIChatAttachment } from '../../providers/index.js';
import { FileText, LoaderCircle, TriangleAlert, X } from 'lucide-react';

export function ChatAttachment({
  attachment,
  removable = false,
  onRemove,
}: {
  attachment: AIChatAttachment;
  removable?: boolean;
  onRemove?: () => void;
}) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const preview = attachment.mimetype?.startsWith('image/')
    ? (attachment.preview ?? attachment.url)
    : undefined;
  const content = (
    <div
      className={cn(
        'relative flex h-14 min-w-0 items-center gap-2 rounded-lg border bg-background p-1.5 pr-2',
        attachment.status === 'error' && 'border-destructive/40',
      )}
    >
      <div className='flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted'>
        {preview ? (
          <img src={preview} alt='' className='size-full object-cover' />
        ) : (
          <FileText className='size-4 text-muted-foreground' />
        )}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='max-w-40 truncate text-xs font-medium'>
          {attachment.filename}
        </div>
        <div className='mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground'>
          {attachment.status === 'uploading' ? (
            <>
              <LoaderCircle className='size-3 animate-spin' />
              {t('chat.attachment.uploading', 'Uploading…')}
            </>
          ) : attachment.status === 'error' ? (
            <>
              <TriangleAlert className='size-3 text-destructive' />
              <span className='truncate text-destructive'>
                {attachment.error ??
                  t('chat.attachment.uploadFailed', 'Upload failed')}
              </span>
            </>
          ) : (
            formatFileSize(attachment.size, t('chat.attachment.file', 'File'))
          )}
        </div>
      </div>
      {removable ? (
        <Button
          type='button'
          variant='ghost'
          size='icon-xs'
          className='shrink-0 rounded-full'
          aria-label={t('chat.attachment.remove', 'Remove {{filename}}', {
            filename: attachment.filename,
          })}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove?.();
          }}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );

  if (!removable && attachment.url) {
    return (
      <a
        href={attachment.url}
        target='_blank'
        rel='noreferrer'
        className='block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        {content}
      </a>
    );
  }
  return content;
}

function formatFileSize(size: number | undefined, fallback: string) {
  if (!size) return fallback;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
