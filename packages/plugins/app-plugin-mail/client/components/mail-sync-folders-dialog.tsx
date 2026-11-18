import { useRealtimeRefresh } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { MAIL_REALTIME_TOPIC } from '../../shared/realtime.js';
import {
  mailErrorMessage,
  type MailAccountView,
  type MailFolder,
} from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { useMailClient } from '../runtime.js';
import { Button } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';

export interface MailSyncFoldersDialogProps {
  /** The account whose folders are chosen; the dialog is open while it is set. */
  readonly account?: MailAccountView;
  readonly onClose: () => void;
  readonly onSaved: (account: MailAccountView) => void;
}

/**
 * Choose the folders an account synchronizes. A newly connected account waits for its folder list, then starts its
 * first import; a narrower selection first shows how many local messages it deletes.
 */
export function MailSyncFoldersDialog({
  account,
  onClose,
  onSaved,
}: MailSyncFoldersDialogProps): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  return (
    <Dialog
      open={account !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className='sm:max-w-lg'
        closeLabel={t('dev.closePanel', { defaultValue: 'Close' })}
      >
        {account ? (
          <SyncFoldersForm
            account={account}
            key={account.id}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SyncFoldersForm({
  account,
  onClose,
  onSaved,
}: {
  readonly account: MailAccountView;
  readonly onClose: () => void;
  readonly onSaved: (account: MailAccountView) => void;
}): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const choosing = account.syncFolderIds?.length === 0;
  const [folders, setFolders] = useState<readonly MailFolder[]>();
  const [allFolders, setAllFolders] = useState(
    account.syncFolderIds === undefined || choosing,
  );
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(account.syncFolderIds ?? []),
  );
  const [removedCount, setRemovedCount] = useState<number>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      const next = await mail.listFolders(account.id, {
        includeUnsynced: true,
      });
      if (signal?.aborted) return;
      setFolders(next);
      // Every folder starts selected until the owner narrows the selection.
      if (account.syncFolderIds === undefined || choosing)
        setSelected(
          (current) =>
            new Set([
              ...current,
              ...next.map((folder) => folder.providerFolderId),
            ]),
        );
    },
    [account.id, account.syncFolderIds, choosing, mail],
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => load(controller.signal))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            mailErrorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Mail request failed.',
              }),
            ),
          );
      });
    return () => controller.abort();
  }, [load, t]);

  // A newly connected account lists its folders in the background; reload until they arrive.
  useRealtimeRefresh(MAIL_REALTIME_TOPIC, load, {
    enabled: folders !== undefined && folders.length === 0,
    refreshIntervalMs: 5_000,
  });

  const selection = useMemo(
    () =>
      (folders ?? [])
        .map((folder) => folder.providerFolderId)
        .filter((id) => selected.has(id)),
    [folders, selected],
  );
  const sentUnselected =
    !allFolders &&
    (folders ?? []).some(
      (folder) =>
        folder.type === 'sent' && !selected.has(folder.providerFolderId),
    );
  const ready =
    folders !== undefined &&
    folders.length > 0 &&
    (allFolders || selection.length > 0);

  const save = (confirmed: boolean): void => {
    const syncFolderIds = allFolders ? null : selection;
    setSaving(true);
    setError(undefined);
    const preview =
      confirmed || choosing || syncFolderIds === null
        ? Promise.resolve(0)
        : mail
            .previewSyncFolders(account.id, syncFolderIds)
            .then((result) => result.removedMessageCount);
    void preview
      .then(async (count) => {
        if (count > 0) {
          setRemovedCount(count);
          return;
        }
        onSaved(
          await mail.updateAccount({ accountId: account.id, syncFolderIds }),
        );
      })
      .catch((cause: unknown) =>
        setError(
          mailErrorMessage(
            cause,
            t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
          ),
        ),
      )
      .finally(() => setSaving(false));
  };

  if (removedCount !== undefined)
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {t('settings.syncFolders.removeTitle', {
              defaultValue: 'Delete local messages?',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('settings.syncFolders.removeDescription', {
              count: removedCount,
              defaultValue:
                '{{count}} local messages are in no selected folder and will be deleted from this app. Messages on the mail server are not affected.',
            })}
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role='alert' className='mt-4 text-sm text-destructive'>
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            disabled={saving}
            onClick={() => setRemovedCount(undefined)}
            type='button'
            variant='outline'
          >
            {t('settings.syncFolders.back', { defaultValue: 'Back' })}
          </Button>
          <Button
            disabled={saving}
            onClick={() => save(true)}
            type='button'
            variant='destructive'
          >
            {saving
              ? t('settings.syncFolders.saving', { defaultValue: 'Saving…' })
              : t('settings.syncFolders.confirm', {
                  defaultValue: 'Delete and save',
                })}
          </Button>
        </DialogFooter>
      </>
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('settings.syncFolders.title', {
            defaultValue: 'Folders to sync',
          })}
        </DialogTitle>
        <DialogDescription>
          {t('settings.syncFolders.description', {
            defaultValue:
              'Choose the folders this account synchronizes. Messages in other folders are not imported, and local copies of them are deleted.',
          })}
        </DialogDescription>
      </DialogHeader>
      <p className='mt-4 text-sm font-medium'>{account.address}</p>
      <div className='mt-3 space-y-3'>
        {folders === undefined || folders.length === 0 ? (
          <p
            className='rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground'
            role='status'
          >
            {folders === undefined
              ? t('settings.syncFolders.loading', {
                  defaultValue: 'Loading folders…',
                })
              : t('settings.syncFolders.waiting', {
                  defaultValue: 'Getting the folder list from the mail server…',
                })}
          </p>
        ) : (
          <>
            <label className='flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium'>
              <Checkbox
                checked={allFolders}
                onCheckedChange={(checked) => setAllFolders(checked === true)}
              />
              {t('settings.syncFolders.allFolders', {
                defaultValue: 'All folders, including folders created later',
              })}
            </label>
            {allFolders ? null : (
              <>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>
                    {t('settings.syncFolders.selectedCount', {
                      count: selection.length,
                      total: folders.length,
                      defaultValue: '{{count}} of {{total}} folders selected',
                    })}
                  </span>
                </div>
                <ul className='max-h-72 space-y-1 overflow-y-auto rounded-lg border p-2'>
                  {folders.map((folder) => (
                    <li key={folder.providerFolderId}>
                      <label className='flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40'>
                        <Checkbox
                          checked={selected.has(folder.providerFolderId)}
                          onCheckedChange={(checked) =>
                            setSelected((current) => {
                              const next = new Set(current);
                              if (checked === true)
                                next.add(folder.providerFolderId);
                              else next.delete(folder.providerFolderId);
                              return next;
                            })
                          }
                        />
                        <span className='min-w-0 truncate'>{folder.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                {sentUnselected ? (
                  <p className='text-xs text-muted-foreground'>
                    {t('settings.syncFolders.sentHint', {
                      defaultValue:
                        'Sent is not selected, so your own replies may be missing from conversations. Sending mail still works.',
                    })}
                  </p>
                ) : null}
              </>
            )}
          </>
        )}
        {error ? (
          <p role='alert' className='text-sm text-destructive'>
            {error}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button
          disabled={saving}
          onClick={onClose}
          type='button'
          variant='outline'
        >
          {choosing
            ? t('settings.syncFolders.later', { defaultValue: 'Later' })
            : t('settings.syncFolders.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button
          disabled={!ready || saving}
          onClick={() => save(false)}
          type='button'
        >
          {saving
            ? t('settings.syncFolders.saving', { defaultValue: 'Saving…' })
            : choosing
              ? t('settings.syncFolders.start', { defaultValue: 'Start sync' })
              : t('settings.syncFolders.save', { defaultValue: 'Save' })}
        </Button>
      </DialogFooter>
    </>
  );
}
