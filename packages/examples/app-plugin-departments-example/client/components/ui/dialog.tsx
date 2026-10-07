// shadcn base-nova source adapted for declaration-emitting ESM builds; dialogs here close through their own buttons.
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Dialog(props: DialogPrimitive.Root.Props): ReactElement {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />;
}

export function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props): ReactElement {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className='fixed inset-0 z-50 bg-black/45' />
      <DialogPrimitive.Popup
        data-slot='dialog-content'
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[90svh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background p-6 shadow-2xl outline-none',
          className,
        )}
        {...props}
      >
        {children}
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
      className={cn('mb-6 space-y-1', className)}
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
