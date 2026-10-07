import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog.js';

/** Asks before a draft with changes is left. */
export function DiscardDialog({
  open,
  onKeep,
  onDiscard,
}: {
  readonly open: boolean;
  readonly onKeep: () => void;
  readonly onDiscard: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => (next ? undefined : onKeep())}
    >
      <AlertDialogContent>
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
          <AlertDialogAction variant='destructive' onClick={onDiscard}>
            {t('unsavedChanges.discard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
