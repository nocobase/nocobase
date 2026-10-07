import { useTranslation } from '@nocobase/i18n/client';
// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';
import { Button } from './button.js';

export function Dialog(props: DialogPrimitive.Root.Props): ReactElement {
  return <DialogPrimitive.Root {...props} />;
}
export function DialogContent(
  inputProps: DialogPrimitive.Popup.Props,
): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-api-keys');
  const { className, children, ...props } = inputProps;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className='fixed inset-0 z-50 bg-black/45' />
      <DialogPrimitive.Popup
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] sm:max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background p-6 shadow-2xl outline-none',
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
              size='icon-sm'
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
  return <div className={cn('space-y-1', className)} {...props} />;
}
export function DialogFooter({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  // Sticks to the bottom of the scrolling panel, so a long body never scrolls the buttons away.
  return (
    <div
      className={cn(
        'sticky -bottom-6 z-10 -mx-6 -mb-6 mt-6 flex justify-end gap-2 rounded-b-2xl border-t bg-background px-6 py-4',
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
