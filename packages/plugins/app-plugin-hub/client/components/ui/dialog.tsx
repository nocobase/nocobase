import { useTranslation } from '@nocobase/i18n/client';
// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';
import { Button } from './button.js';

export function Dialog(props: DialogPrimitive.Root.Props): ReactElement {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />;
}

export function DialogContent(
  inputProps: DialogPrimitive.Popup.Props,
): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const { className, children, ...props } = inputProps;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot='dialog-overlay'
        className='fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0'
      />
      <DialogPrimitive.Popup
        data-slot='dialog-content'
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[90svh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-background p-6 shadow-2xl outline-none',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          render={
            <Button
              aria-label={t('common.close', { defaultValue: 'Close' })}
              className='absolute top-4 right-4'
              size='icon'
              variant='ghost'
            />
          }
        >
          <X />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='dialog-header'
      className={cn('mb-6 shrink-0 space-y-1', className)}
      {...props}
    />
  );
}

/**
 * The one scrolling region of a dialog.
 *
 * The popup itself does not scroll: a dialog tall enough to overflow used to move its own footer below the fold,
 * so the primary action could only be reached by scrolling the whole dialog. Header and footer stay put and this
 * is what moves, which is also why it needs `min-h-0` — a flex child refuses to shrink below its content without
 * it, and the overflow would move back out to the popup.
 *
 * Padding and matching negative margins leave room for focus rings without shifting the content.
 */
export function DialogBody({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='dialog-body'
      className={cn('-m-1 min-h-0 flex-1 overflow-y-auto p-1', className)}
      {...props}
    />
  );
}

/** Actions pinned below the scrolling body, so they are reachable at any content height. */
export function DialogFooter({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='dialog-footer'
      className={cn(
        'mt-6 flex shrink-0 justify-end gap-2 border-t pt-5',
        className,
      )}
      {...props}
    />
  );
}

export function DialogTitle(props: DialogPrimitive.Title.Props): ReactElement {
  return <DialogPrimitive.Title className='text-xl font-semibold' {...props} />;
}

export function DialogDescription(
  props: DialogPrimitive.Description.Props,
): ReactElement {
  return (
    <DialogPrimitive.Description
      className='text-sm text-muted-foreground'
      {...props}
    />
  );
}
