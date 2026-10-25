import { useTranslation } from '@nocobase/i18n/client';
import { XIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { cn } from '../lib/utils.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';

export interface IndexingSettingsFrameProps {
  readonly layout: 'dialog' | 'page';
  readonly children: ReactNode;
  readonly status?: ReactNode;
  readonly footer: ReactNode;
  readonly locked?: boolean;
  readonly onClose: () => void;
  readonly className?: string;
}

/** Both presentations keep one editor contract; the application owns the standalone route. */
export function IndexingSettingsFrame(
  props: IndexingSettingsFrameProps,
): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (props.layout === 'page') {
    return (
      <section
        className={cn(
          'mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8',
          props.className,
        )}
      >
        <header className='space-y-2'>
          <h1 className='font-heading text-2xl font-semibold'>
            {t('indexing.title')}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {t('indexing.description')}
          </p>
        </header>
        <section className='min-w-0 overflow-hidden rounded-xl border bg-card text-card-foreground'>
          <div className='space-y-6 p-6'>
            {props.children}
            {props.status}
          </div>
          <footer className='flex flex-wrap items-center justify-end gap-2 border-t bg-card p-4 md:px-6'>
            {props.footer}
          </footer>
        </section>
      </section>
    );
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className='flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl'
      >
        <DialogHeader className='flex-row items-start justify-between gap-4 border-b px-6 py-5'>
          <div className='space-y-2'>
            <DialogTitle>{t('indexing.title')}</DialogTitle>
            <DialogDescription>{t('indexing.description')}</DialogDescription>
          </div>
          <div className='flex shrink-0 items-center gap-1'>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('knowledge.permissions.close')}
              disabled={props.locked}
              onClick={props.onClose}
            >
              <XIcon />
            </Button>
          </div>
        </DialogHeader>
        <div className='min-h-0 space-y-6 overflow-y-auto overscroll-contain px-6 py-5'>
          {props.children}
          {props.status}
        </div>
        {props.footer !== null ? (
          <footer className='flex shrink-0 flex-wrap items-center justify-end gap-2 border-t bg-card px-6 py-4'>
            {props.footer}
          </footer>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
