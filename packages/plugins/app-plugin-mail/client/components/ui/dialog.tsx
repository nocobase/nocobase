// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from '../../lib/utils.js';
import { Button } from './button.js';

export function Dialog(props: DialogPrimitive.Root.Props): ReactElement {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />;
}

export function DialogPortal(
  props: DialogPrimitive.Portal.Props,
): ReactElement {
  return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />;
}

export function DialogBackdrop(
  props: DialogPrimitive.Backdrop.Props,
): ReactElement {
  return (
    <DialogPrimitive.Backdrop
      className='fixed inset-0 z-50 bg-black/45'
      data-slot='dialog-backdrop'
      {...props}
    />
  );
}

export function DialogPopup({
  className,
  ...props
}: DialogPrimitive.Popup.Props): ReactElement {
  return (
    <DialogPrimitive.Popup
      className={className}
      data-slot='dialog-popup'
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  closeLabel = 'Close',
  ...props
}: DialogPrimitive.Popup.Props & {
  readonly closeLabel?: string;
}): ReactElement {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogPopup
        data-slot='dialog-content'
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[90svh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background p-6 shadow-2xl outline-none',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          data-slot='dialog-close'
          render={
            <Button
              aria-label={closeLabel}
              className='absolute top-4 right-4 size-9 p-0'
              variant='ghost'
            />
          }
        >
          <X aria-hidden='true' />
        </DialogPrimitive.Close>
      </DialogPopup>
    </DialogPortal>
  );
}

export function DialogHeader({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return <div className={cn('space-y-1', className)} {...props} />;
}

export function DialogFooter({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />
  );
}

export function DialogTitle(props: DialogPrimitive.Title.Props): ReactElement {
  const { className, ...titleProps } = props;
  return (
    <DialogPrimitive.Title
      className={cn('text-xl font-semibold', className)}
      data-slot='dialog-title'
      {...titleProps}
    />
  );
}

export function DialogDescription(
  props: DialogPrimitive.Description.Props,
): ReactElement {
  const { className, ...descriptionProps } = props;
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      data-slot='dialog-description'
      {...descriptionProps}
    />
  );
}
