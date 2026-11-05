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
