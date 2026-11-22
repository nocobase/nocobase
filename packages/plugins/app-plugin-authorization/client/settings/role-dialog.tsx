import { useState, type ReactElement } from 'react';
import { ApiClientError, useSubmission } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Button } from '#components/ui/button';
import { useAuthorizationClient } from '../use-authorization-client.js';
import type { PermissionSet } from '../authorization-client.js';
import { useLocalizedText } from './localized-text.js';
import { SettingsError } from './shared.js';

export type RoleAction =
  | { kind: 'create' }
  | { kind: 'edit' | 'copy' | 'delete'; role: PermissionSet };

export function RoleDialog({
  action,
  onClose,
  onSaved,
}: {
  action: RoleAction;
  onClose: () => void;
  onSaved: (role: PermissionSet | null) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation();
  const text = useLocalizedText();
  const client = useAuthorizationClient();
  const { session } = useAuthentication();
  const role = action.kind === 'create' ? undefined : action.role;
  const original = role ? text(role.title ?? role.key) : '';
  const [name, setName] = useState(() =>
    action.kind === 'copy'
      ? t('settings.copyOfRole', { name: original })
      : original,
  );
  const [key, setKey] = useState(
    action.kind === 'copy' ? `${action.role.key}-copy` : (role?.key ?? ''),
  );
  const [error, setError] = useState<unknown>();
  const submission = useSubmission({
    scope: `${session?.user.id}:settings:role-dialog:${action.kind}:${role?.key ?? ''}`,
  });
  const deleting = action.kind === 'delete';
  async function save() {
    setError(undefined);
    const saved = await submission.run(
      {
        kind: action.kind,
        role: role?.key,
        revision: role?.revision,
        name,
        key,
      },
      async (receipt) => {
        if (action.kind === 'delete') {
          await client.deletePermissionSet(action.role.key, receipt);
          return null;
        }
        if (action.kind === 'edit') {
          return client.updatePermissionSet(
            action.role.key,
            { title: name.trim(), expectedRevision: action.role.revision },
            receipt,
          );
        }
        return client.createPermissionSet(
          {
            key: key.trim(),
            title: name.trim(),
            grants: action.kind === 'copy' ? action.role.grants : [],
          },
          receipt,
        );
      },
    );
    if (saved !== undefined) await onSaved(saved);
  }
  const title = {
    create: 'settings.newRole',
    edit: 'settings.editRole',
    copy: 'settings.duplicateRole',
    delete: 'settings.deleteRole',
  }[action.kind];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submission.submitting) onClose();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <form
          className='grid gap-4'
          onSubmit={(event) => {
            event.preventDefault();
            save().catch(setError);
          }}
        >
          <DialogHeader>
            <DialogTitle>{t(title)}</DialogTitle>
          </DialogHeader>
          {deleting ? (
            <p>{t('settings.deleteRoleHint', { name: original })}</p>
          ) : (
            <>
              <div className='grid gap-1.5'>
                <Label htmlFor='dialog-role-name'>
                  {t('settings.roleName')} *
                </Label>
                <Input
                  id='dialog-role-name'
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className='grid gap-1.5'>
                <Label htmlFor='dialog-role-key'>{t('settings.key')}</Label>
                <Input
                  aria-describedby='dialog-role-key-hint'
                  id='dialog-role-key'
                  required
                  readOnly={action.kind === 'edit'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
                <p
                  id='dialog-role-key-hint'
                  className='text-xs text-muted-foreground'
                >
                  {t('settings.roleKeyHint')}
                </p>
              </div>
            </>
          )}
          {(action.kind === 'create' || action.kind === 'copy') &&
          error instanceof ApiClientError &&
          error.status === 409 ? (
            <p role='alert' className='text-sm text-destructive'>
              {t('settings.keyConflict')}
            </p>
          ) : (
            <SettingsError error={error} inline />
          )}
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={submission.submitting}
              onClick={onClose}
            >
              {t('settings.cancel')}
            </Button>
            <Button
              type='submit'
              variant={deleting ? 'destructive' : 'default'}
              disabled={
                submission.submitting ||
                (!deleting && (!name.trim() || !key.trim()))
              }
            >
              {t(
                deleting
                  ? 'settings.deleteRole'
                  : action.kind === 'edit'
                    ? 'settings.save'
                    : 'settings.createRoleAction',
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
