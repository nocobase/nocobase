import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { WORKFLOW_NS } from '../../namespace.js';

export const dialogCloseButtonClassName: string =
  'inline-flex size-7 items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

function classes(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

export function Dialog(props: DialogPrimitive.Root.Props): ReactElement {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />;
}

export interface DialogOverlayProps extends Omit<
  DialogPrimitive.Backdrop.Props,
  'className'
> {
  readonly className?: string;
}

export function DialogOverlay({
  className,
  ...props
}: DialogOverlayProps): ReactElement {
  return (
    <DialogPrimitive.Backdrop
      data-slot='dialog-overlay'
      className={classes(
        'fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

export interface DialogContentProps extends Omit<
  DialogPrimitive.Popup.Props,
  'className'
> {
  readonly className?: string;
  readonly size?: 'default' | 'md' | 'lg';
  readonly showCloseButton?: boolean;
}

export function DialogContent({
  className,
  children,
  size = 'default',
  showCloseButton = true,
  ...props
}: DialogContentProps): ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot='dialog-content'
        className={classes(
          'fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          // A small form is md; read-only content such as a result or a description is lg.
          size === 'lg' ? 'sm:max-w-4xl' : 'sm:max-w-md',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot='dialog-close'
            className={classes(
              'absolute top-2 right-2',
              dialogCloseButtonClassName,
            )}
          >
            <XIcon className='size-4' />
            <span className='sr-only'>{t('common.close')}</span>
          </DialogPrimitive.Close>
        ) : null}
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
      className={classes('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='dialog-footer'
      className={classes(
        // Sticks to the bottom of the scrolling panel, so a long body never scrolls the buttons away;
        // the tint is a gradient over an opaque background so the content does not show through.
        'sticky -bottom-4 z-10 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-popover bg-linear-to-r from-muted/50 to-muted/50 p-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

export interface DialogTitleProps extends Omit<
  DialogPrimitive.Title.Props,
  'className'
> {
  readonly className?: string;
}

export function DialogTitle({
  className,
  ...props
}: DialogTitleProps): ReactElement {
  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      className={classes(
        'font-heading text-base leading-none font-medium',
        className,
      )}
      {...props}
    />
  );
}

export interface DialogDescriptionProps extends Omit<
  DialogPrimitive.Description.Props,
  'className'
> {
  readonly className?: string;
}

export function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps): ReactElement {
  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      className={classes('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
