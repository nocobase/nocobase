import { usePendingFeedback } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useImperativeHandle,
  useRef,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { cn } from 'cn';
import { Button } from '#components/ui/button';
import { BrandLoadingMark } from './brand-loading-mark.js';

export interface PendingButtonProps extends Omit<
  ComponentProps<typeof Button>,
  'children' | 'className' | 'render' | 'nativeButton'
> {
  readonly busy: boolean;
  readonly identity?: unknown;
  readonly pendingLabel?: string;
  readonly longWaitLabel?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Consume useSubmission().submitting; the submission controller still owns the lock. */
export function PendingButton({
  busy,
  identity,
  pendingLabel,
  longWaitLabel,
  children,
  ref,
  disabled,
  className,
  'aria-label': ariaLabel,
  ...props
}: PendingButtonProps): ReactElement {
  const { t } = useTranslation();
  const anchorRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => anchorRef.current!, []);
  const feedback = usePendingFeedback(busy, identity);
  const label =
    pendingLabel ?? t('pendingFeedback.working', { defaultValue: 'Working…' });
  const message = feedback.longWaiting
    ? (longWaitLabel ??
      t('pendingFeedback.longWait', {
        defaultValue: 'This is taking longer than usual. You can keep waiting.',
      }))
    : label;
  return (
    <>
      <Button
        {...props}
        ref={anchorRef}
        disabled={disabled || busy}
        aria-busy={busy}
        aria-label={feedback.visible ? label : ariaLabel}
        className={cn('motion-reduce:transition-none', className)}
      >
        <span className='grid'>
          <span
            className={cn(
              'col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5',
              feedback.visible && 'invisible',
            )}
            aria-hidden={feedback.visible || undefined}
          >
            {children}
          </span>
          <span
            className={cn(
              'col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5',
              !feedback.visible && 'invisible',
            )}
            aria-hidden='true'
          >
            <BrandLoadingMark className='size-4 text-current' />
            {label}
          </span>
        </span>
      </Button>
      <Tooltip.Root open={feedback.longWaiting}>
        <Tooltip.Portal>
          <Tooltip.Positioner
            anchor={anchorRef}
            side='top'
            sideOffset={8}
            collisionPadding={12}
            // The hint only explains the wait; it must not block the controls it covers.
            className='pointer-events-none z-50'
          >
            <Tooltip.Popup
              data-slot='pending-hint'
              aria-hidden='true'
              className='max-w-64 rounded-md bg-foreground px-3 py-2 text-xs text-background shadow-md'
            >
              {message}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      {feedback.visible && (
        <span className='sr-only' role='status' aria-live='polite'>
          {message}
        </span>
      )}
    </>
  );
}
