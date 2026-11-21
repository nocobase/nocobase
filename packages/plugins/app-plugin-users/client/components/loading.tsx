import { usePendingFeedback } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { cn } from 'cn';
import { BrandLoadingMark } from './brand-loading-mark.js';

export interface LoadingProps extends ComponentPropsWithoutRef<'div'> {
  readonly fullscreen?: boolean;
  readonly pending?: boolean;
  readonly identity?: unknown;
  readonly label?: string;
  readonly longWaitLabel?: string;
}

/** Mount inside the region that owns the work; fullscreen is for application startup. */
export function Loading({
  className,
  fullscreen = false,
  pending = true,
  identity,
  label,
  longWaitLabel,
  ...props
}: LoadingProps): ReactElement {
  const { t } = useTranslation();
  const feedback = usePendingFeedback(pending, identity);
  const loadingLabel =
    label ?? t('status.loading', { defaultValue: 'Loading' });
  const waitingLabel =
    longWaitLabel ??
    t('pendingFeedback.longWait', {
      defaultValue: 'This is taking longer than usual. You can keep waiting.',
    });
  const message = feedback.longWaiting ? waitingLabel : loadingLabel;
  return (
    <>
      <div
        {...props}
        data-slot='loading'
        aria-busy={pending}
        className={cn(
          'flex flex-col items-center justify-center',
          fullscreen && 'min-h-svh w-full bg-background',
          className,
        )}
      >
        <div
          aria-hidden='true'
          className={cn(
            'flex flex-col items-center gap-3 text-center',
            !feedback.visible && 'invisible',
          )}
        >
          <BrandLoadingMark />
          <span className='grid text-sm text-muted-foreground'>
            <span
              className={cn(
                'col-start-1 row-start-1',
                feedback.longWaiting && 'invisible',
              )}
            >
              {loadingLabel}
            </span>
            <span
              className={cn(
                'col-start-1 row-start-1',
                !feedback.longWaiting && 'invisible',
              )}
            >
              {waitingLabel}
            </span>
          </span>
        </div>
      </div>
      {feedback.visible && (
        <span
          role='status'
          aria-live='polite'
          aria-label={message}
          className='sr-only'
        >
          {message}
        </span>
      )}
    </>
  );
}

export interface RefreshIndicatorProps {
  readonly pending: boolean;
  readonly identity?: unknown;
  readonly label?: string;
  readonly longWaitLabel?: string;
  readonly className?: string;
}

/**
 * Background refresh of content that still belongs to the current query and permission scope. Render it inside the
 * positioned element that owns that content; it takes no layout space and never replaces the content.
 */
export function RefreshIndicator({
  pending,
  identity,
  label,
  longWaitLabel,
  className,
}: RefreshIndicatorProps): ReactElement | null {
  const { t } = useTranslation();
  const feedback = usePendingFeedback(pending, identity);
  if (!feedback.visible) return null;
  const message = feedback.longWaiting
    ? (longWaitLabel ??
      t('pendingFeedback.longWait', {
        defaultValue: 'This is taking longer than usual. You can keep waiting.',
      }))
    : (label ?? t('status.refreshing', { defaultValue: 'Refreshing' }));
  return (
    <div
      data-slot='refresh-indicator'
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-end',
        className,
      )}
    >
      <div
        aria-hidden='true'
        className='h-0.5 w-full bg-primary/70 motion-safe:animate-pulse'
      />
      {feedback.longWaiting && (
        <span
          aria-hidden='true'
          className='m-2 max-w-[calc(100%-1rem)] rounded-md border border-border bg-popover px-2 py-1 text-xs text-muted-foreground shadow-sm'
        >
          {message}
        </span>
      )}
      <span
        role='status'
        aria-live='polite'
        aria-label={message}
        className='sr-only'
      >
        {message}
      </span>
    </div>
  );
}
