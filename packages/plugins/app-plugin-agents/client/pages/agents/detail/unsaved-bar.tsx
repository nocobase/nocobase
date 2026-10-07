/** The unsaved-changes bar of the agent page's tabs, and the question asked before discarding (`tab-draft.ts`). */
import { useTranslation } from '@nocobase/i18n/client';
import { SaveIcon } from 'lucide-react';
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
import { Button } from '../../../components/ui/button.js';
import { Spinner } from '../../../components/ui/spinner.js';
import type { DiscardGuard } from './tab-draft.js';

/** The bar at the bottom of a tab with unsaved changes. */
export function UnsavedBar({
  pending,
  onDiscard,
  onSave,
}: {
  readonly pending: boolean;
  readonly onDiscard: () => void;
  readonly onSave: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='region'
      aria-label={t('agentDetail.unsaved')}
      className='sticky bottom-0 z-10 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t bg-background px-6 py-3 md:-mx-8 md:-mb-8 md:px-8'
    >
      <p className='text-sm text-muted-foreground'>
        {t('agentDetail.unsaved')}
      </p>
      <div className='flex gap-2'>
        <Button variant='outline' disabled={pending} onClick={onDiscard}>
          {t('agentDetail.discard')}
        </Button>
        <Button disabled={pending} onClick={onSave}>
          {pending ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <SaveIcon data-icon='inline-start' />
          )}
          {t('actions.save')}
        </Button>
      </div>
    </div>
  );
}

/** "Discard unsaved changes?" while the guard asks. */
export function DiscardDialog({
  guard,
}: {
  readonly guard: DiscardGuard;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <AlertDialog
      open={guard.asking}
      onOpenChange={(open) => {
        if (!open) guard.answer(false);
      }}
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
          <AlertDialogAction
            variant='destructive'
            onClick={() => guard.answer(true)}
          >
            {t('unsavedChanges.discard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
