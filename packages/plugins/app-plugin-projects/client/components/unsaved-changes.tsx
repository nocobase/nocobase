import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, type ReactElement, type ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from './ui/alert-dialog.js';

import {
  UnsavedChangesContext,
  type UnsavedChangesGuard,
} from '@nocobase/app-client';

/** Collects the unsaved state of the forms inside and renders the guard's confirmation, nested in the dialog. */
export function UnsavedChangesBoundary({
  guard,
  children,
}: {
  readonly guard: UnsavedChangesGuard;
  readonly children?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const { answer } = guard;
  // A dialog held in component state keeps its guard while closed: a question still open when its content goes away
  // (the submit closed it) must not come back when it reopens.
  useEffect(() => () => answer(false), [answer]);
  return (
    <UnsavedChangesContext.Provider value={guard.scope}>
      {children}
      {/* Inside the dialog, so Escape closes only the confirmation. */}
      <AlertDialog
        open={guard.asking}
        onOpenChange={(open) => {
          if (!open) answer(false);
        }}
      >
        {/* `AlertDialogContent` with a forced backdrop: Base UI renders a nested dialog's backdrop only when forced
            (as `RouteOverlay` does), and without one the form behind stays clickable while asking. */}
        <AlertDialogPortal>
          <AlertDialogOverlay forceRender />
          <AlertDialogPrimitive.Popup
            data-slot='alert-dialog-content'
            data-size='default'
            className='group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full max-w-xs -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{t('unsavedChanges.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('unsavedChanges.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('unsavedChanges.keepEditing')}
              </AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                onClick={() => answer(true)}
              >
                {t('unsavedChanges.discard')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPrimitive.Popup>
        </AlertDialogPortal>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}
