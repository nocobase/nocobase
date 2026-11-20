import { useRealtimeRefresh } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Mail } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import { MAIL_REALTIME_TOPIC } from '../../shared/realtime.js';
import {
  mailErrorMessage,
  type MailAccountView,
  type MailFolder,
  type MailSyncRunView,
} from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { useMailClient } from '../runtime.js';
import { cn } from '../lib/utils.js';
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

export interface MailSyncFoldersSaved {
  readonly account: MailAccountView;
  /** Whether the confirmation saved a changed scope into `account`. */
  readonly scopeSaved: boolean;
  /**
   * The run the confirmation started or reused: the normal synchronization of an unchanged scope, or the initial run
   * saving a changed scope scheduled in place of the active one.
   */
  readonly run?: MailSyncRunView;
}

export interface MailSyncFoldersDialogProps {
  /** The account whose sync scope is confirmed; the dialog is open while it is set. */
  readonly account?: MailAccountView;
  /** Shown beside the address. */
  readonly providerLabel?: string;
  /** Start date for an initial synchronization of an account that has none saved. */
  readonly defaultReceivedAfter?: string;
  readonly onClose: () => void;
  readonly onSaved: (saved: MailSyncFoldersSaved) => void;
}

type Scope = 'all' | 'some';

/**
 * Confirm the folders an account synchronizes, then synchronize it. A newly connected account waits for its folder
 * list, then starts its first import. An unchanged scope requests a normal synchronization; a changed scope is saved,
 * which restarts the initial synchronization under it, and a narrower one first shows how many local messages it
 * deletes.
 */
export function MailSyncFoldersDialog({
  account,
  providerLabel,
  defaultReceivedAfter,
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
            defaultReceivedAfter={defaultReceivedAfter}
            key={account.id}
            onClose={onClose}
            onSaved={onSaved}
            providerLabel={providerLabel}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SyncFoldersForm({
  account,
  providerLabel,
  defaultReceivedAfter,
  onClose,
  onSaved,
}: {
  readonly account: MailAccountView;
  readonly providerLabel?: string;
  readonly defaultReceivedAfter?: string;
  readonly onClose: () => void;
  readonly onSaved: (saved: MailSyncFoldersSaved) => void;
}): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  // A newly connected account has not chosen its folders yet and imports nothing until it does.
  const choosing = account.syncFolderIds?.length === 0;
  const savedAll = account.syncFolderIds === undefined;
  const [folders, setFolders] = useState<readonly MailFolder[]>();
  const [complete, setComplete] = useState(false);
  const [listingFailed, setListingFailed] = useState(false);
  const [initialSyncCompleted, setInitialSyncCompleted] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [scope, setScope] = useState<Scope>(
    savedAll || choosing ? 'all' : 'some',
  );
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(account.syncFolderIds ?? []),
  );
  // The deletion count shown for confirmation, bound to the scope it was previewed for.
  const [removal, setRemoval] = useState<{
    readonly count: number;
    readonly syncFolderIds: readonly string[];
  }>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const receivedAfter =
    account.initialSyncReceivedAfter ?? defaultReceivedAfter;

  const load = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      const choices = await mail.listFolderChoices(account.id);
      if (signal?.aborted) return;
      setFolders(choices.folders);
      setComplete(choices.complete);
      setListingFailed(choices.failed);
      setInitialSyncCompleted(choices.initialSyncCompleted);
      // Every folder starts selected until the owner narrows the selection.
      if (savedAll || choosing)
        setSelected(
          (current) =>
            new Set([
              ...current,
              ...choices.folders.map((folder) => folder.providerFolderId),
            ]),
        );
    },
    [account.id, savedAll, choosing, mail],
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

  // A newly connected account lists its folders in the background, page by page; reload until the list is complete.
  useRealtimeRefresh(MAIL_REALTIME_TOPIC, load, {
    enabled: folders !== undefined && !complete && !listingFailed,
    refreshIntervalMs: 5_000,
  });

  const selection = useMemo(
    () =>
      (folders ?? [])
        .map((folder) => folder.providerFolderId)
        .filter((id) => selected.has(id)),
    [folders, selected],
  );
  const listed = folders !== undefined && complete && folders.length > 0;
  const allSelected = listed && selection.length === folders.length;
  const empty = scope === 'some' && selection.length === 0;
  const sentUnselected =
    scope === 'some' &&
    !empty &&
    (folders ?? []).some(
      (folder) =>
        folder.type === 'sent' && !selected.has(folder.providerFolderId),
    );
  // "Entire mailbox" also covers folders created later, so it differs from every current folder being selected. The
  // scope changes only when the owner changes the choice: a saved folder that left the folder list is no change.
  const changed =
    choosing ||
    (scope === 'all'
      ? !savedAll
      : savedAll || !sameFolders(account.syncFolderIds ?? [], [...selected]));
  const ready = listed && !empty && !saving;

  const failure = (cause: unknown): void =>
    setError(
      mailErrorMessage(
        cause,
        t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
      ),
    );

  // The scope a submission would save right now; a preview answered for another scope is asked again.
  const target = scope === 'all' ? null : selection;
  const submittable = listed && !empty;
  const latestRef = useRef({ target, submittable, submit: (): void => {} });
  // Closing the dialog unmounts this form, and reopening it mounts a new one, so answers to an earlier opening find
  // this false and neither preview again, save nor start a sync.
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = true;
    return () => {
      openRef.current = false;
    };
  }, []);

  const save = (syncFolderIds: readonly string[] | null): Promise<void> =>
    // Saving a new scope schedules the initial synchronization under it; no separate sync request follows.
    mail
      .updateAccount({ accountId: account.id, syncFolderIds })
      .then((saved) => {
        if (!openRef.current) return;
        const { syncRun, ...updated } = saved;
        onSaved({
          account: updated,
          scopeSaved: true,
          ...(syncRun ? { run: syncRun } : {}),
        });
      });

  const confirmRemoval = (syncFolderIds: readonly string[]): void => {
    setSaving(true);
    setError(undefined);
    void save(syncFolderIds)
      .catch(failure)
      .finally(() => setSaving(false));
  };

  const submit = (): void => {
    setSaving(true);
    setError(undefined);
    if (!changed) {
      // The saved scope stays; the scheduler picks an incremental or initial run as for any manual sync.
      void mail
        .startSync({
          accountId: account.id,
          ...(receivedAfter ? { receivedAfter } : {}),
        })
        .then((run) => {
          if (openRef.current) onSaved({ account, scopeSaved: false, run });
        })
        .catch(failure)
        .finally(() => setSaving(false));
      return;
    }
    const syncFolderIds = target;
    if (choosing || syncFolderIds === null) {
      void save(syncFolderIds)
        .catch(failure)
        .finally(() => setSaving(false));
      return;
    }
    let stale = false;
    void mail
      .previewSyncFolders(account.id, syncFolderIds)
      .then(async ({ removedMessageCount }) => {
        if (!openRef.current) return;
        const now = latestRef.current.target;
        if (now === null || !sameFolders(syncFolderIds, now)) {
          stale = true;
          return;
        }
        if (removedMessageCount > 0) {
          setRemoval({ count: removedMessageCount, syncFolderIds });
          return;
        }
        await save(syncFolderIds);
      })
      .catch(failure)
      .finally(() => {
        if (!openRef.current) return;
        setSaving(false);
        // The choice changed while the preview was on its way; preview the current choice instead, if it can be
        // submitted at all.
        if (stale && latestRef.current.submittable) latestRef.current.submit();
      });
  };
  useEffect(() => {
    latestRef.current = { target, submittable, submit };
  });

  // A listing that stopped part way is started again; the dialog then waits for it as before.
  const retryListing = (): void => {
    setRetrying(true);
    setError(undefined);
    void mail
      .startSync({ accountId: account.id })
      .then(() => load())
      .catch(failure)
      .finally(() => setRetrying(false));
  };

  const errorMessage = error ? (
    <p role='alert' className='text-sm text-destructive'>
      {error}
    </p>
  ) : null;

  if (removal !== undefined)
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {t('settings.syncFolders.removeTitle', {
              defaultValue: 'Delete local messages outside the scope?',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('settings.syncFolders.removeDescription', {
              count: removal.count,
              defaultValue:
                'This change deletes {{count}} local messages and their local data. Messages on the mail server are not deleted, and messages still in a selected folder are kept.',
            })}
          </DialogDescription>
        </DialogHeader>
        <div className='mt-4'>{errorMessage}</div>
        <DialogFooter>
          <Button
            disabled={saving}
            onClick={() => setRemoval(undefined)}
            type='button'
            variant='outline'
          >
            {t('settings.syncFolders.back', { defaultValue: 'Back' })}
          </Button>
          <Button
            disabled={saving}
            onClick={() => confirmRemoval(removal.syncFolderIds)}
            type='button'
            variant='destructive'
          >
            {saving
              ? t('settings.syncFolders.saving', { defaultValue: 'Saving…' })
              : t('settings.syncFolders.confirm', {
                  defaultValue: 'Delete local messages and sync',
                })}
          </Button>
        </DialogFooter>
      </>
    );

  const date = receivedAfter?.slice(0, 10);
  const outcome = !changed
    ? initialSyncCompleted
      ? t('settings.syncFolders.outcomeIncremental', {
          defaultValue: 'Syncs new and changed messages since the last sync.',
        })
      : date
        ? t('settings.syncFolders.outcomeInitial', {
            date,
            defaultValue: 'Syncs messages received since {{date}}.',
          })
        : undefined
    : choosing
      ? date
        ? t('settings.syncFolders.outcomeInitial', {
            date,
            defaultValue: 'Syncs messages received since {{date}}.',
          })
        : undefined
      : t('settings.syncFolders.outcomeRescan', {
          defaultValue:
            'Syncs again with the new scope; existing messages are not added twice.',
        });

  const scopeOption = (
    value: Scope,
    label: string,
    description: string,
  ): ReactElement => (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
        scope === value ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
      )}
    >
      <input
        checked={scope === value}
        className='mt-0.5 size-4 accent-primary'
        name={`mail-sync-scope-${account.id}`}
        onChange={() => setScope(value)}
        type='radio'
        value={value}
      />
      <span className='min-w-0'>
        <span className='block font-medium'>{label}</span>
        <span className='mt-1 block text-xs text-muted-foreground'>
          {description}
        </span>
      </span>
    </label>
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('settings.syncFolders.title', {
            defaultValue: 'Confirm sync scope',
          })}
        </DialogTitle>
        <DialogDescription>
          {choosing
            ? t('settings.syncFolders.descriptionFirst', {
                defaultValue:
                  'The account is connected. Confirm the scope to start the first sync.',
              })
            : t('settings.syncFolders.description', {
                defaultValue:
                  'Confirm the folders to sync. Automatic syncs will use the same scope.',
              })}
        </DialogDescription>
      </DialogHeader>
      <div className='mt-4 flex min-w-0 items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm'>
        <Mail
          aria-hidden='true'
          className='size-4 shrink-0 text-muted-foreground'
        />
        <span className='min-w-0 truncate font-medium'>{account.address}</span>
        {providerLabel ? (
          <span className='ml-auto shrink-0 text-xs text-muted-foreground'>
            {providerLabel}
          </span>
        ) : null}
      </div>
      <div className='mt-4 space-y-3'>
        <fieldset className='grid gap-2 sm:grid-cols-2'>
          <legend className='sr-only'>
            {t('settings.syncFolders.scope', { defaultValue: 'Sync scope' })}
          </legend>
          {scopeOption(
            'all',
            t('settings.syncFolders.allFolders', {
              defaultValue: 'Entire mailbox',
            }),
            t('settings.syncFolders.allFoldersHint', {
              defaultValue:
                'Syncs every folder, including folders created later.',
            }),
          )}
          {scopeOption(
            'some',
            t('settings.syncFolders.someFolders', {
              defaultValue: 'Selected folders',
            }),
            t('settings.syncFolders.someFoldersHint', {
              defaultValue:
                'Syncs only the checked folders; add new folders yourself.',
            }),
          )}
        </fieldset>
        {!listed ? (
          <p
            className='rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground'
            role='status'
          >
            {folders === undefined
              ? t('settings.syncFolders.loading', {
                  defaultValue: 'Loading folders…',
                })
              : listingFailed
                ? t('settings.syncFolders.listingFailed', {
                    defaultValue:
                      'The folder list could not be read from the mail server.',
                  })
                : t('settings.syncFolders.waiting', {
                    defaultValue:
                      'Getting the folder list from the mail server…',
                  })}
            {folders !== undefined && listingFailed ? (
              <Button
                className='ml-3'
                disabled={retrying}
                onClick={retryListing}
                type='button'
                variant='outline'
              >
                {t('settings.syncFolders.retry', {
                  defaultValue: 'Try again',
                })}
              </Button>
            ) : null}
          </p>
        ) : scope === 'some' ? (
          <div className='rounded-lg border'>
            <div className='flex items-center justify-between gap-3 border-b px-3 py-2 text-xs text-muted-foreground'>
              <span aria-live='polite'>
                {t('settings.syncFolders.selectedCount', {
                  count: selection.length,
                  total: folders.length,
                  defaultValue: '{{count}} of {{total}} folders selected',
                })}
              </span>
              <Button
                className='h-7 px-2 text-xs'
                onClick={() =>
                  setSelected(
                    allSelected
                      ? new Set()
                      : new Set(
                          folders.map((folder) => folder.providerFolderId),
                        ),
                  )
                }
                type='button'
                variant='ghost'
              >
                {allSelected
                  ? t('settings.syncFolders.clearAll', {
                      defaultValue: 'Deselect all',
                    })
                  : t('settings.syncFolders.selectAll', {
                      defaultValue: 'Select all',
                    })}
              </Button>
            </div>
            <ul className='max-h-64 space-y-1 overflow-y-auto p-2'>
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
          </div>
        ) : null}
        {listed && empty ? (
          <p role='alert' className='text-sm text-destructive'>
            {t('settings.syncFolders.emptySelection', {
              defaultValue: 'Select at least one folder.',
            })}
          </p>
        ) : null}
        {listed && sentUnselected ? (
          <p className='rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'>
            {t('settings.syncFolders.sentHint', {
              defaultValue:
                'Sent is not selected, so your own replies may be missing from conversations. Sending mail still works.',
            })}
          </p>
        ) : null}
        {errorMessage}
        {outcome ? (
          <p className='text-xs text-muted-foreground'>{outcome}</p>
        ) : null}
      </div>
      <DialogFooter>
        <Button
          disabled={saving}
          onClick={onClose}
          type='button'
          variant='outline'
        >
          {t('settings.syncFolders.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button disabled={!ready} onClick={submit} type='button'>
          {saving
            ? t('settings.syncFolders.saving', { defaultValue: 'Saving…' })
            : t('settings.syncFolders.submit', {
                defaultValue: 'Confirm and sync',
              })}
        </Button>
      </DialogFooter>
    </>
  );
}

function sameFolders(
  saved: readonly string[],
  selection: readonly string[],
): boolean {
  const current = new Set(selection);
  return (
    new Set(saved).size === current.size && saved.every((id) => current.has(id))
  );
}
