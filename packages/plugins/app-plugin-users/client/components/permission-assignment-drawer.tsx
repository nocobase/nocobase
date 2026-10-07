import { PermissionSelection } from './permission-selection.js';
import { Spinner } from './ui/spinner.js';
import { useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import type {
  ManagedUser,
  UserRoleScopeOption,
  UserRoleValue,
} from '../user-client.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog.js';

export function PermissionAssignmentDrawer({
  user,
  scope,
  onClose,
  onSave,
}: {
  user: ManagedUser;
  scope: UserRoleScopeOption;
  onClose: () => void;
  onSave: (value: UserRoleValue) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const value = user.roleScopes[scope.key] ?? [];
  const initial = typeof value === 'string' ? (value ? [value] : []) : value;
  const [selected, setSelected] = useState<readonly string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const added = selected.filter((id) => !initial.includes(id)).length;
  const removed = initial.filter((id) => !selected.includes(id)).length;
  const dirty = added + removed > 0;
  const close = () => {
    if (busy) return;
    if (dirty) setDiscarding(true);
    else onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className='top-0 right-0 left-auto flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-y-0 border-r-0 p-0 sm:max-w-xl'>
        <DialogHeader className='shrink-0 border-b p-6 pr-14'>
          <DialogTitle>
            {t('assignment.title')} · {user.name}
          </DialogTitle>
          <p className='text-sm text-muted-foreground'>
            {user.username ? `@${user.username} · ` : ''}
            {user.email}
          </p>
          <DialogDescription>{t('assignment.description')}</DialogDescription>
        </DialogHeader>
        <PermissionSelection
          scope={scope}
          selected={selected}
          initial={initial}
          disabled={busy}
          onChange={(value) => {
            setError(false);
            setSelected(value);
          }}
        />
        <footer className='shrink-0 space-y-3 border-t p-6'>
          {error && (
            <p role='alert' className='text-sm text-destructive'>
              {t('assignment.failed')}
            </p>
          )}
          <div className='flex items-center justify-between gap-3'>
            <p className='text-sm text-muted-foreground'>
              {dirty
                ? t('assignment.changes', { added, removed })
                : t('assignment.noChanges')}
            </p>
            <div className='flex gap-2'>
              <Button variant='outline' disabled={busy} onClick={close}>
                {t('form.cancel')}
              </Button>
              <Button
                disabled={
                  busy ||
                  !dirty ||
                  (scope.selection === 'single' && selected.length !== 1)
                }
                onClick={() => {
                  setBusy(true);
                  setError(false);
                  void onSave(
                    scope.selection === 'single' ? selected[0] : selected,
                  )
                    .catch(() => setError(true))
                    .finally(() => setBusy(false));
                }}
              >
                {busy && (
                  <Spinner
                    data-icon='inline-start'
                    aria-label={t('page.loading')}
                  />
                )}
                {t('form.save')}
              </Button>
            </div>
          </div>
        </footer>
        <AlertDialog
          open={discarding}
          onOpenChange={(open) => {
            if (!open) setDiscarding(false);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('assignment.discard')}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('assignment.keepEditing')}
              </AlertDialogCancel>
              <AlertDialogAction variant='destructive' onClick={onClose}>
                {t('assignment.discardChanges')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
