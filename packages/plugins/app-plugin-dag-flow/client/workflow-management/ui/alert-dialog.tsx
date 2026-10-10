// Adapted from the shadcn base-nova AlertDialog; only the parts this module uses.
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import type { ComponentProps, ReactElement } from 'react';

import { Button } from './button.js';

function classes(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

export function AlertDialog(
  props: AlertDialogPrimitive.Root.Props,
): ReactElement {
  return <AlertDialogPrimitive.Root data-slot='alert-dialog' {...props} />;
}

export interface AlertDialogContentProps extends Omit<
  AlertDialogPrimitive.Popup.Props,
  'className'
> {
  readonly className?: string;
}

export function AlertDialogContent({
  className,
  ...props
}: AlertDialogContentProps): ReactElement {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        data-slot='alert-dialog-overlay'
        className='fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0'
      />
      <AlertDialogPrimitive.Popup
        data-slot='alert-dialog-content'
        className={classes(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-xs -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='alert-dialog-header'
      className={classes('grid gap-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}

export function AlertDialogFooter({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='alert-dialog-footer'
      className={classes(
        '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

export interface AlertDialogTitleProps extends Omit<
  AlertDialogPrimitive.Title.Props,
  'className'
> {
  readonly className?: string;
}

export function AlertDialogTitle({
  className,
  ...props
}: AlertDialogTitleProps): ReactElement {
  return (
    <AlertDialogPrimitive.Title
      data-slot='alert-dialog-title'
      className={classes('font-heading text-base font-medium', className)}
      {...props}
    />
  );
}

export interface AlertDialogDescriptionProps extends Omit<
  AlertDialogPrimitive.Description.Props,
  'className'
> {
  readonly className?: string;
}

export function AlertDialogDescription({
  className,
  ...props
}: AlertDialogDescriptionProps): ReactElement {
  return (
    <AlertDialogPrimitive.Description
      data-slot='alert-dialog-description'
      className={classes('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function AlertDialogCancel(
  props: AlertDialogPrimitive.Close.Props,
): ReactElement {
  return (
    <AlertDialogPrimitive.Close
      data-slot='alert-dialog-cancel'
      render={<Button />}
      {...props}
    />
  );
}
