import type { ReactElement } from 'react';
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { useTranslation } from '@nocobase/i18n/client';
import { XIcon } from 'lucide-react';

import { cn } from 'cn';
import { Button } from './button.js';

function Sheet({ ...props }: SheetPrimitive.Root.Props): ReactElement {
  return <SheetPrimitive.Root data-slot='sheet' {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props): ReactElement {
  return <SheetPrimitive.Portal data-slot='sheet-portal' {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: SheetPrimitive.Backdrop.Props): ReactElement {
  return (
    <SheetPrimitive.Backdrop
      data-slot='sheet-overlay'
      className={cn(
        'fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs',
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly showCloseButton?: boolean;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification-example');

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot='sheet-content'
        data-side={side}
        className={cn(
          'fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-lg data-[side=right]:sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot='sheet-close'
            render={
              <Button
                variant='ghost'
                className='absolute top-3 right-3 h-8 w-8 p-0'
                size='sm'
              />
            }
          >
            <XIcon />
            <span className='sr-only'>{t('common.close')}</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='sheet-header'
      className={cn('flex flex-col gap-0.5 p-5', className)}
      {...props}
    />
  );
}

function SheetFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='sheet-footer'
      className={cn('mt-auto flex flex-col gap-2 border-t p-5', className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: SheetPrimitive.Title.Props): ReactElement {
  return (
    <SheetPrimitive.Title
      data-slot='sheet-title'
      className={cn(
        'font-heading text-lg font-semibold text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props): ReactElement {
  return (
    <SheetPrimitive.Description
      data-slot='sheet-description'
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
};
