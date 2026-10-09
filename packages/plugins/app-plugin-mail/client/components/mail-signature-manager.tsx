import { mailEditorLabels } from '../lib/mail-editor-labels.js';
import { ChevronDown, Mail, PenLine, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import type { MailAccountView, MailSignature } from '../mail-client.js';
import { mailErrorMessage } from '../mail-client.js';
import { useMailClient } from '../runtime.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { cn } from '../lib/utils.js';
import { plainTextToMailHtml } from '../lib/mail-template.js';
import { Button } from './ui/button.js';
import { Card } from './ui/card.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Input } from './ui/input.js';
import { MailRichTextEditor } from './mail-rich-text-editor.js';
import { MailManagementFormActions } from './mail-management-form-actions.js';
import { MailManagementListItem } from './mail-management-list-item.js';
import { NativeSelect } from './ui/native-select.js';

export interface MailSignatureManagerProps {
  readonly accounts: readonly MailAccountView[];
  readonly onError: (message: string) => void;
}

interface SignatureDraft {
  readonly id?: string;
  readonly name: string;
  readonly text: string;
  readonly html: string;
  readonly isDefault: boolean;
}

const EMPTY_SIGNATURE: SignatureDraft = {
  name: '',
  text: '',
  html: '',
  isDefault: false,
};

export function MailSignatureManager({
  accounts,
  onError,
}: MailSignatureManagerProps): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [signaturesByAccount, setSignaturesByAccount] = useState<
    Readonly<Record<string, readonly MailSignature[]>>
  >({});
  const [selectedAccountId, setSelectedAccountId] = useState<string>();
  const [draft, setDraft] = useState<SignatureDraft>(EMPTY_SIGNATURE);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signatureToDelete, setSignatureToDelete] = useState<MailSignature>();
  const [deleteError, setDeleteError] = useState<string>();
  const [collapsedAccountIds, setCollapsedAccountIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const showError = useCallback(
    (cause: unknown): void =>
      onError(
        mailErrorMessage(
          cause,
          t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
        ),
      ),
    [onError, t],
  );

  const loadSignatures = useCallback((): void => {
    setLoading(true);
    void Promise.all(
      accounts.map(
        async (account) =>
          [account.id, await mail.listSignatures(account.id)] as const,
      ),
    )
      .then((entries) => {
        setSignaturesByAccount(Object.fromEntries(entries));
      })
      .catch(showError)
      .finally(() => setLoading(false));
  }, [accounts, mail, showError]);

  useEffect(() => {
    void Promise.resolve().then(loadSignatures);
  }, [loadSignatures]);

  const activeAccountId = accounts.some(
    (account) => account.id === selectedAccountId,
  )
    ? selectedAccountId
    : accounts[0]?.id;
  const selectedAccount = accounts.find(
    (account) => account.id === activeAccountId,
  );
  const selectedSignatures = selectedAccount
    ? (signaturesByAccount[selectedAccount.id] ?? [])
    : [];
  const selectedSignature = draft.id
    ? selectedSignatures.find((signature) => signature.id === draft.id)
    : undefined;
  const isEditing = selectedSignature !== undefined;
  const signatureCount = accounts.reduce(
    (count, account) => count + (signaturesByAccount[account.id]?.length ?? 0),
    0,
  );

  const resetDraft = (): void => {
    setDraft(EMPTY_SIGNATURE);
  };

  const toggleAccount = (accountId: string): void => {
    setCollapsedAccountIds((current) => {
      const next = new Set(current);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const selectAccount = (accountId: string): void => {
    setSelectedAccountId(accountId);
    setDraft(EMPTY_SIGNATURE);
  };

  const selectSignature = (
    account: MailAccountView,
    signature: MailSignature,
  ): void => {
    setSelectedAccountId(account.id);
    setDraft({
      id: signature.id,
      name: signature.name,
      text: signature.text,
      html: signature.html ?? plainTextToMailHtml(signature.text),
      isDefault: signature.isDefault,
    });
  };

  const updateSavedSignature = (
    accountId: string,
    saved: MailSignature,
  ): void => {
    setSignaturesByAccount((current) => {
      const currentSignatures = current[accountId] ?? [];
      const nextSignatures = currentSignatures.some(
        (signature) => signature.id === saved.id,
      )
        ? currentSignatures.map((signature) =>
            signature.id === saved.id ? saved : signature,
          )
        : [...currentSignatures, saved];
      return {
        ...current,
        [accountId]: saved.isDefault
          ? nextSignatures.map((signature) => ({
              ...signature,
              isDefault: signature.id === saved.id,
            }))
          : nextSignatures,
      };
    });
  };

  const save = (): void => {
    if (!selectedAccount || !draft.name.trim() || busy) return;
    const isDefault = draft.isDefault;
    setBusy(true);
    const input = {
      accountId: selectedAccount.id,
      name: draft.name.trim(),
      text: draft.text,
      html: draft.html,
      isDefault,
      ...(selectedSignature ? { id: selectedSignature.id } : {}),
    };
    void mail
      .saveSignature(input)
      .then((saved) => {
        updateSavedSignature(selectedAccount.id, saved);
        resetDraft();
        loadSignatures();
      })
      .catch(showError)
      .finally(() => setBusy(false));
  };

  const toggleDefault = (
    account: MailAccountView,
    signature: MailSignature,
  ): void => {
    if (busy) return;
    setBusy(true);
    void mail
      .saveSignature({
        accountId: account.id,
        id: signature.id,
        name: signature.name,
        text: signature.text,
        html: signature.html,
        isDefault: !signature.isDefault,
      })
      .then((saved) => {
        updateSavedSignature(account.id, saved);
        setDraft((current) =>
          current.id === saved.id
            ? {
                id: saved.id,
                name: saved.name,
                text: saved.text,
                html: saved.html ?? plainTextToMailHtml(saved.text),
                isDefault: saved.isDefault,
              }
            : current,
        );
        loadSignatures();
      })
      .catch(showError)
      .finally(() => setBusy(false));
  };

  const confirmDelete = (): void => {
    const signature = signatureToDelete;
    if (!signature || busy) return;
    setDeleteError(undefined);
    setBusy(true);
    void mail
      .deleteSignature(signature.accountId, signature.id)
      .then(() => {
        if (draft.id === signature.id) resetDraft();
        setSignatureToDelete(undefined);
        loadSignatures();
      })
      .catch((cause: unknown) =>
        setDeleteError(
          mailErrorMessage(
            cause,
            t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
          ),
        ),
      )
      .finally(() => setBusy(false));
  };

  return (
    <div className='grid min-h-0 w-full gap-4 lg:h-full lg:grid-cols-[18rem_minmax(0,1fr)]'>
      <Card className='flex min-h-0 flex-col overflow-hidden rounded-2xl bg-background shadow-sm'>
        <div className='flex shrink-0 items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3'>
          <div className='flex min-w-0 items-center gap-2'>
            <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
              <PenLine aria-hidden='true' className='size-4' />
            </span>
            <span className='sr-only'>
              {t('settings.identities.list', { defaultValue: 'Signatures' })}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border bg-background px-2 text-xs font-semibold'>
              {signatureCount}
            </span>
            <Button
              className='h-8 shrink-0 px-3 text-xs'
              disabled={busy || !selectedAccount}
              onClick={resetDraft}
              type='button'
              variant='outline'
            >
              <Plus aria-hidden='true' className='size-3.5' />
              {t('settings.identities.new', { defaultValue: 'New signature' })}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className='p-4 text-sm text-muted-foreground'>
            {t('settings.identities.loading', {
              defaultValue: 'Loading signatures…',
            })}
          </p>
        ) : accounts.length === 0 ? (
          <div className='grid min-h-48 flex-1 place-items-center p-4 text-center'>
            <div>
              <span className='mx-auto grid size-10 place-items-center rounded-full bg-muted text-muted-foreground'>
                <PenLine aria-hidden='true' className='size-4' />
              </span>
              <p className='mt-3 text-sm font-medium'>
                {t('settings.accounts.emptyTitle', {
                  defaultValue: 'No accounts connected.',
                })}
              </p>
            </div>
          </div>
        ) : (
          <div
            aria-label={t('settings.identities.list', {
              defaultValue: 'Signatures',
            })}
            className='min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain'
            role='region'
          >
            {accounts.map((account) => {
              const signatures = signaturesByAccount[account.id] ?? [];
              const collapsed = collapsedAccountIds.has(account.id);
              const accountPanelId = `mail-signatures-account-${encodeURIComponent(account.id)}`;

              return (
                <div key={account.id}>
                  <Button
                    aria-controls={accountPanelId}
                    aria-expanded={!collapsed}
                    className='h-auto w-full justify-between gap-3 border-0 bg-muted/20 px-4 py-2.5 text-left font-normal hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset'
                    onClick={() => toggleAccount(account.id)}
                    type='button'
                    variant='ghost'
                  >
                    <span className='flex min-w-0 items-center gap-2'>
                      <span className='grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
                        <Mail aria-hidden='true' className='size-3.5' />
                      </span>
                      <span className='min-w-0'>
                        <span className='block truncate text-xs font-medium'>
                          {account.address}
                        </span>
                        <span className='block truncate text-[11px] text-muted-foreground'>
                          {account.displayName || account.provider.name}
                        </span>
                      </span>
                    </span>
                    <span className='flex shrink-0 items-center gap-2'>
                      <span className='text-xs text-muted-foreground'>
                        {signatures.length}
                      </span>
                      <ChevronDown
                        aria-hidden='true'
                        className={cn(
                          'size-4 transition-transform',
                          !collapsed && 'rotate-180',
                        )}
                      />
                    </span>
                  </Button>
                  <div
                    className='divide-y'
                    hidden={collapsed}
                    id={accountPanelId}
                  >
                    {signatures.length === 0 ? (
                      <p className='px-4 py-3 text-xs text-muted-foreground'>
                        {t('settings.identities.empty', {
                          defaultValue: 'No signatures yet.',
                        })}
                      </p>
                    ) : (
                      signatures.map((signature) => {
                        const selected = draft.id === signature.id;
                        return (
                          <MailManagementListItem
                            key={signature.id}
                            onSelect={() => selectSignature(account, signature)}
                            selected={selected}
                            actions={
                              <>
                                {signature.isDefault ? (
                                  <Button
                                    aria-label={t(
                                      'settings.identities.clearDefault',
                                      {
                                        defaultValue: 'Clear default',
                                      },
                                    )}
                                    className='h-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/20 focus-visible:ring-2'
                                    disabled={busy}
                                    onClick={() =>
                                      toggleDefault(account, signature)
                                    }
                                    title={t(
                                      'settings.identities.clearDefault',
                                      {
                                        defaultValue: 'Clear default',
                                      },
                                    )}
                                    type='button'
                                    variant='ghost'
                                  >
                                    {t('settings.identities.default', {
                                      defaultValue: 'Default',
                                    })}
                                  </Button>
                                ) : (
                                  <Button
                                    className='h-auto shrink-0 border-0 px-1 py-1 text-xs font-normal text-muted-foreground underline-offset-4 hover:bg-transparent hover:text-primary hover:underline'
                                    disabled={busy}
                                    onClick={() =>
                                      toggleDefault(account, signature)
                                    }
                                    type='button'
                                    variant='ghost'
                                  >
                                    {t('settings.identities.makeDefault', {
                                      defaultValue: 'Make default',
                                    })}
                                  </Button>
                                )}
                                <Button
                                  aria-label={t('settings.identities.delete', {
                                    defaultValue: 'Delete signature',
                                  })}
                                  className='size-8 shrink-0 p-0'
                                  disabled={busy}
                                  onClick={() => {
                                    setDeleteError(undefined);
                                    setSignatureToDelete(signature);
                                  }}
                                  type='button'
                                  variant='ghost'
                                >
                                  <Trash2
                                    aria-hidden='true'
                                    className='size-3.5'
                                  />
                                </Button>
                              </>
                            }
                          >
                            <PenLine
                              aria-hidden='true'
                              className='size-3.5 shrink-0 text-muted-foreground'
                            />
                            <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                              {signature.name}
                            </span>
                          </MailManagementListItem>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className='min-h-0 space-y-5 overflow-y-auto p-5'>
        <div className='flex shrink-0 items-start justify-between gap-3'>
          <div>
            <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
              {t('settings.identities.formEyebrow', {
                defaultValue: 'Signature setup',
              })}
            </p>
            <h2 className='mt-1 font-semibold'>
              {t(
                isEditing
                  ? 'settings.identities.edit'
                  : 'settings.identities.new',
                {
                  defaultValue: isEditing ? 'Edit signature' : 'New signature',
                },
              )}
            </h2>
          </div>
        </div>

        <div className='grid gap-2'>
          <label
            className='text-sm font-medium'
            htmlFor='mail-signature-account'
          >
            {t('settings.identities.account', {
              defaultValue: 'Mail account',
            })}
          </label>
          <NativeSelect
            disabled={busy || accounts.length === 0}
            id='mail-signature-account'
            onChange={(event) => selectAccount(event.target.value)}
            value={activeAccountId ?? ''}
          >
            <option disabled value=''>
              {t('settings.identities.chooseAccount', {
                defaultValue: 'Select a mail account',
              })}
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.displayName
                  ? `${account.displayName} · ${account.address}`
                  : account.address}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className='grid gap-2'>
          <label className='text-sm font-medium' htmlFor='mail-signature-name'>
            {t('settings.identities.name', {
              defaultValue: 'Signature name',
            })}
          </label>
          <Input
            disabled={busy || !selectedAccount}
            id='mail-signature-name'
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder={t('settings.identities.name', {
              defaultValue: 'Signature name',
            })}
            value={draft.name}
          />
        </div>

        <div className='grid gap-2'>
          <label
            className='text-sm font-medium'
            htmlFor='mail-signature-editor'
          >
            {t('settings.identities.signatureFor', {
              defaultValue: 'Signature content',
            })}
          </label>
          <MailRichTextEditor
            ariaLabel={t('settings.identities.signatureFor', {
              defaultValue: 'Signature content',
            })}
            disabled={busy || !selectedAccount}
            labels={mailEditorLabels(t)}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                html: value.html,
                text: value.text,
              }))
            }
            placeholder={t('settings.identities.signaturePlaceholder', {
              defaultValue: 'Signature appended to outgoing messages',
            })}
            value={draft.html}
          />
        </div>

        <MailManagementFormActions
          editing={isEditing}
          busy={busy}
          disabled={!selectedAccount || !draft.name.trim()}
          submitLabel={t(
            isEditing ? 'settings.identities.save' : 'settings.identities.add',
            {
              defaultValue: isEditing ? 'Save signature' : 'Add signature',
            },
          )}
          savingLabel={t('settings.identities.saving', {
            defaultValue: 'Saving…',
          })}
          cancelLabel={t('settings.identities.cancel', {
            defaultValue: 'Cancel',
          })}
          onSubmit={save}
          onCancel={resetDraft}
        />
      </Card>

      <Dialog
        open={Boolean(signatureToDelete)}
        onOpenChange={(open) => {
          if (!open && !busy) setSignatureToDelete(undefined);
        }}
      >
        <DialogContent
          closeLabel={t('settings.identities.close', { defaultValue: 'Close' })}
        >
          <DialogHeader>
            <DialogTitle>
              {t('settings.identities.deleteTitle', {
                defaultValue: 'Delete signature?',
              })}
            </DialogTitle>
            <DialogDescription>
              {t('settings.identities.deleteDescription', {
                defaultValue:
                  'This permanently deletes the signature. This action cannot be undone.',
              })}
            </DialogDescription>
          </DialogHeader>
          <p className='mt-4 text-sm font-medium break-words'>
            {signatureToDelete?.name}
          </p>
          {deleteError ? (
            <p role='alert' className='mt-4 text-sm text-destructive'>
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              disabled={busy}
              onClick={() => setSignatureToDelete(undefined)}
              type='button'
              variant='outline'
            >
              {t('settings.identities.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              disabled={busy}
              onClick={confirmDelete}
              type='button'
              variant='destructive'
            >
              <Trash2 aria-hidden='true' className='size-4' />
              {busy
                ? t('settings.identities.deleting', {
                    defaultValue: 'Deleting…',
                  })
                : t('settings.identities.delete', {
                    defaultValue: 'Delete signature',
                  })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
