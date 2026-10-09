import {
  MailPagination,
  MAIL_PAGE_SIZE,
} from '../components/mail-pagination.js';
import { RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { MailManagementMessageDetail } from '../components/mail-management-message-detail.js';
import { MailDevPageShell } from '../components/index.js';
import { Button } from '../components/ui/button.js';
import { Card } from '../components/ui/card.js';
import { Checkbox } from '../components/ui/checkbox.js';
import { Input } from '../components/ui/input.js';
import { NativeSelect } from '../components/ui/native-select.js';
import {
  mailErrorMessage,
  type MailManagedAccountView,
  type MailAddress,
  type MailFolder,
  type MailManagementMessageAction,
  type MailMessageSummary,
} from '../mail-client.js';
import { useMailClient } from '../runtime.js';

interface ManagedFolderOption extends Pick<MailFolder, 'name' | 'type'> {
  readonly accountId: string;
  readonly providerFolderId: string;
}

export default function MailManagementPage(): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<readonly MailManagedAccountView[]>(
    [],
  );
  const [accountId, setAccountId] = useState('');
  const [folderOptions, setFolderOptions] = useState<
    readonly ManagedFolderOption[]
  >([]);
  const folderNames = useMemo(
    () =>
      new Map(
        folderOptions.map((folder) => [
          `${folder.accountId}:${folder.providerFolderId}`,
          folder.type === 'custom'
            ? folder.name
            : t(`workspace.defaultFolders.${folder.type}`, {
                defaultValue: folder.name,
              }),
        ]),
      ),
    [folderOptions, t],
  );
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [messages, setMessages] = useState<readonly MailMessageSummary[]>([]);
  const [detailMessage, setDetailMessage] = useState<MailMessageSummary>();
  const [total, setTotal] = useState<number>();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<number>(MAIL_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [actionBusy, setActionBusy] = useState<MailManagementMessageAction>();
  const [reloadVersion, setReloadVersion] = useState(0);
  const requestIdRef = useRef(0);

  const reportError = useCallback(
    (cause: unknown): void => {
      setError(
        mailErrorMessage(
          cause,
          t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
        ),
      );
    },
    [t],
  );

  const loadAccounts = useCallback((): void => {
    void mail
      .listManagementAccounts()
      .then(async (nextAccounts) => {
        setAccounts(nextAccounts);
        const folderGroups = await Promise.all(
          nextAccounts.map(async (account) => ({
            accountId: account.id,
            folders: await mail.listManagedFolders(account.id),
          })),
        );
        setFolderOptions(
          folderGroups.flatMap(({ accountId: ownerId, folders }) =>
            folders.map((folder) => ({
              accountId: ownerId,
              providerFolderId: folder.providerFolderId,
              name: folder.name,
              type: folder.type,
            })),
          ),
        );
      })
      .catch(reportError);
  }, [mail, reportError]);

  useEffect(() => {
    void Promise.resolve().then(loadAccounts);
  }, [loadAccounts, reloadVersion]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    void Promise.resolve()
      .then(() => {
        if (requestIdRef.current !== requestId) return undefined;
        setLoading(true);
        setError(undefined);
        setSelectedKeys(new Set());
        setMessages([]);
        setPageIndex(0);
        setTotal(undefined);
        return mail.listManagedMessages({
          accountId: accountId || undefined,
          q: debouncedQuery.trim() || undefined,
          page: 1,
          pageSize,
        });
      })
      .then((page) => {
        if (!page || requestIdRef.current !== requestId) return;
        setMessages(page.items);
        setTotal(page.total);
      })
      .catch((cause: unknown) => {
        if (requestIdRef.current === requestId) reportError(cause);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
    return () => {
      requestIdRef.current += 1;
    };
  }, [accountId, debouncedQuery, mail, pageSize, reloadVersion, reportError]);

  const accountNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.address])),
    [accounts],
  );

  const selectedMessages = useMemo(
    () => messages.filter((message) => selectedKeys.has(messageKey(message))),
    [messages, selectedKeys],
  );
  const selectedNonDraftMessages = selectedMessages.filter(
    (message) => !message.draft,
  );
  const allSelected =
    messages.length > 0 && selectedMessages.length === messages.length;
  const someSelected = selectedMessages.length > 0 && !allSelected;
  const canSoftDelete =
    selectedMessages.length > 0 &&
    selectedMessages.every((message) => {
      const account = accounts.find((item) => item.id === message.accountId);
      return account?.canMoveMessages === true;
    });
  const canPermanentlyDelete =
    selectedMessages.length > 0 &&
    selectedMessages.every((message) =>
      message.folderIds.some(
        (folderId) =>
          folderOptions.find(
            (folder) =>
              folder.accountId === message.accountId &&
              folder.providerFolderId === folderId,
          )?.type === 'trash',
      ),
    );

  const toggleMessage = (message: MailMessageSummary): void => {
    const key = messageKey(message);
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllMessages = (): void => {
    setSelectedKeys(
      allSelected ? new Set() : new Set(messages.map(messageKey)),
    );
  };

  const runAction = (
    action: Exclude<MailManagementMessageAction, 'move'>,
    options: {
      readonly permanently?: boolean;
    } = {},
  ): void => {
    const actionMessages =
      action === 'markRead' || action === 'markUnread'
        ? selectedNonDraftMessages
        : selectedMessages;
    if (actionMessages.length === 0 || actionBusy || loading) return;
    const actionLabel = managementActionLabel(action);
    if (
      !window.confirm(
        t('dev.management.confirmAction', {
          defaultValue: `Apply “${actionLabel}” to ${actionMessages.length} selected messages?`,
          action: actionLabel,
          count: actionMessages.length,
        }),
      )
    ) {
      return;
    }
    if (
      action === 'delete' &&
      options.permanently &&
      !window.confirm(
        t('dev.management.confirmPermanentDelete', {
          defaultValue:
            'This permanently deletes the selected messages from Trash and cannot be undone. Continue?',
        }),
      )
    ) {
      return;
    }
    setActionBusy(action);
    setActionError(undefined);
    void mail
      .manageMessages({
        action,
        items: actionMessages.map((message) => ({
          accountId: message.accountId,
          messageId: message.id,
        })),
        ...(action === 'delete'
          ? { permanently: options.permanently ?? false }
          : {}),
      })
      .then((result) => {
        setSelectedKeys(
          new Set([
            ...selectedMessages
              .filter((message) => !actionMessages.includes(message))
              .map(messageKey),
            ...result.items
              .filter((item) => item.status === 'failed')
              .map((item) => `${item.accountId}:${item.messageId}`),
          ]),
        );
        if (result.failed > 0) {
          setActionError(
            t('dev.management.partialFailure', {
              defaultValue: `${result.succeeded} succeeded, ${result.failed} failed. Failed messages remain selected for retry.`,
              succeeded: result.succeeded,
              failed: result.failed,
            }),
          );
        }
        changePage(pageIndex, false);
      })
      .catch(reportError)
      .finally(() => setActionBusy(undefined));
  };

  const changePage = (targetIndex: number, clearSelection = true): void => {
    if (loading || targetIndex < 0 || !Number.isSafeInteger(targetIndex))
      return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(undefined);
    if (clearSelection) {
      setSelectedKeys(new Set());
      setActionError(undefined);
    }
    void mail
      .listManagedMessages({
        accountId: accountId || undefined,
        q: debouncedQuery.trim() || undefined,
        page: targetIndex + 1,
        pageSize,
      })
      .then((page) => {
        if (requestIdRef.current !== requestId) return;
        if (targetIndex > 0 && page.items.length === 0)
          throw new Error(
            t('pagination.unavailable', {
              defaultValue:
                'This page has no records. Choose another page or refresh.',
            }),
          );
        setMessages(page.items);
        setTotal(page.total);
        setPageIndex(targetIndex);
        setSelectedKeys(
          (current) =>
            new Set(
              page.items.map(messageKey).filter((key) => current.has(key)),
            ),
        );
      })
      .catch((cause: unknown) => {
        if (requestIdRef.current === requestId) reportError(cause);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
  };

  return (
    <MailDevPageShell
      description={t('dev.managementDescription', {
        defaultValue:
          'Browse all synchronized messages across connected accounts.',
      })}
      title={t('dev.managementTitle', { defaultValue: 'Mail management' })}
      actions={
        <Button
          disabled={loading || Boolean(actionBusy)}
          onClick={() => {
            setSelectedKeys(new Set());
            setActionError(undefined);
            setReloadVersion((version) => version + 1);
          }}
          variant='outline'
        >
          <RefreshCw
            aria-hidden='true'
            className={`size-4 ${loading ? 'animate-spin' : ''}`}
          />
          {t('actions.refresh', { defaultValue: 'Refresh' })}
        </Button>
      }
    >
      <div className='space-y-5 pb-12'>
        <section className='flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row'>
          <NativeSelect
            aria-label={t('dev.management.account', {
              defaultValue: 'Account',
            })}
            className='sm:w-72'
            disabled={Boolean(actionBusy)}
            onChange={(event) => {
              setSelectedKeys(new Set());
              setActionError(undefined);
              setAccountId(event.target.value);
            }}
            value={accountId}
          >
            <option value=''>
              {t('dev.management.allAccounts', {
                defaultValue: 'All accounts',
              })}
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.address}
              </option>
            ))}
          </NativeSelect>
          <label className='relative min-w-0 flex-1'>
            <Search
              aria-hidden='true'
              className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              aria-label={t('dev.management.search', {
                defaultValue: 'Search subject or preview',
              })}
              className='pl-9'
              disabled={Boolean(actionBusy)}
              onChange={(event) => {
                setSelectedKeys(new Set());
                setActionError(undefined);
                setQuery(event.target.value);
              }}
              placeholder={t('dev.management.search', {
                defaultValue: 'Search subject or preview',
              })}
              value={query}
            />
          </label>
        </section>

        {!loading && messages.length > 0 ? (
          <section className='flex flex-col gap-3 rounded-2xl border bg-background p-3 shadow-sm lg:flex-row lg:items-center'>
            <label className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Checkbox
                aria-label={t('dev.management.selectAll', {
                  defaultValue: 'Select all messages on this page',
                })}
                checked={allSelected}
                disabled={Boolean(actionBusy)}
                indeterminate={someSelected}
                onCheckedChange={toggleAllMessages}
              />
              {t('dev.management.selectedCount', {
                defaultValue: `${selectedMessages.length} selected`,
                count: selectedMessages.length,
              })}
            </label>
            <div className='flex flex-1 flex-wrap items-center gap-2'>
              <Button
                disabled={
                  selectedNonDraftMessages.length === 0 || Boolean(actionBusy)
                }
                onClick={() => runAction('markRead')}
                variant='outline'
              >
                {t('dev.management.actions.markRead', {
                  defaultValue: 'Mark read',
                })}
              </Button>
              <Button
                disabled={
                  selectedNonDraftMessages.length === 0 || Boolean(actionBusy)
                }
                onClick={() => runAction('markUnread')}
                variant='outline'
              >
                {t('dev.management.actions.markUnread', {
                  defaultValue: 'Mark unread',
                })}
              </Button>
              <Button
                disabled={selectedMessages.length === 0 || Boolean(actionBusy)}
                onClick={() => runAction('star')}
                variant='outline'
              >
                {t('dev.management.actions.star', { defaultValue: 'Star' })}
              </Button>
              <Button
                disabled={selectedMessages.length === 0 || Boolean(actionBusy)}
                onClick={() => runAction('unstar')}
                variant='outline'
              >
                {t('dev.management.actions.unstar', {
                  defaultValue: 'Remove star',
                })}
              </Button>
              <Button
                disabled={selectedMessages.length === 0 || Boolean(actionBusy)}
                onClick={() => runAction('archive')}
                variant='outline'
              >
                {t('dev.management.actions.archive', {
                  defaultValue: 'Archive',
                })}
              </Button>
              <Button
                disabled={!canSoftDelete || Boolean(actionBusy)}
                onClick={() => runAction('delete')}
                variant='destructive'
              >
                {t('dev.management.actions.delete', { defaultValue: 'Delete' })}
              </Button>
              {canPermanentlyDelete ? (
                <Button
                  disabled={Boolean(actionBusy)}
                  onClick={() => runAction('delete', { permanently: true })}
                  variant='destructive'
                >
                  {t('dev.management.actions.permanentDelete', {
                    defaultValue: 'Permanently delete',
                  })}
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}

        {error || actionError ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
            {error ?? actionError}
          </div>
        ) : null}

        <Card className='overflow-hidden rounded-2xl bg-background shadow-sm'>
          {loading ? (
            <div className='p-10 text-center text-sm text-muted-foreground'>
              {t('workspace.loading', { defaultValue: 'Loading mail…' })}
            </div>
          ) : messages.length === 0 ? (
            <div className='p-10 text-center text-sm text-muted-foreground'>
              {t('dev.management.empty', {
                defaultValue: 'No synchronized messages found.',
              })}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[101rem] table-fixed text-sm'>
                <colgroup>
                  <col className='w-20' />
                  <col className='w-44' />
                  <col className='w-48' />
                  <col className='w-48' />
                  <col className='w-72' />
                  <col className='w-28' />
                  <col className='w-40' />
                  <col className='w-28' />
                  <col className='w-44' />
                  <col className='w-32' />
                </colgroup>
                <thead className='border-b bg-muted/50 text-left text-xs text-muted-foreground'>
                  <tr>
                    <Header
                      label={t('dev.management.selection', {
                        defaultValue: 'Select',
                      })}
                    />
                    <Header label={t('dev.management.account')} />
                    <Header label={t('dev.management.sender')} />
                    <Header label={t('dev.management.recipients')} />
                    <Header label={t('dev.management.subject')} />
                    <Header label={t('dev.management.status')} />
                    <Header label={t('dev.management.folders')} />
                    <Header label={t('dev.management.attachments')} />
                    <Header label={t('dev.management.time')} />
                    <Header
                      label={t('dev.management.operations', {
                        defaultValue: 'Actions',
                      })}
                    />
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {messages.map((message) => (
                    <tr
                      className='align-top hover:bg-muted/30'
                      key={messageKey(message)}
                    >
                      <td className='px-4 py-3'>
                        <Checkbox
                          aria-label={t('dev.management.selectMessage', {
                            defaultValue: 'Select message',
                          })}
                          checked={selectedKeys.has(messageKey(message))}
                          disabled={Boolean(actionBusy)}
                          onCheckedChange={() => toggleMessage(message)}
                        />
                      </td>
                      <Cell>
                        {accountNames.get(message.accountId) ??
                          message.accountId}
                      </Cell>
                      <Cell>{formatAddress(message.from)}</Cell>
                      <Cell>{formatAddresses(message.to)}</Cell>
                      <td className='break-words px-4 py-3'>
                        <p className='font-medium'>
                          {message.subject || t('workspace.noSubject')}
                        </p>
                        {message.preview ? (
                          <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
                            {message.preview}
                          </p>
                        ) : null}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex flex-wrap gap-1'>
                          {!message.draft ? (
                            <Status>
                              {t(
                                message.read
                                  ? 'dev.management.read'
                                  : 'dev.management.unread',
                              )}
                            </Status>
                          ) : null}
                          {message.starred ? (
                            <Status>{t('dev.management.starred')}</Status>
                          ) : null}
                          {message.draft ? (
                            <Status>{t('dev.management.draft')}</Status>
                          ) : null}
                        </div>
                      </td>
                      <Cell>
                        {message.folderIds.length
                          ? message.folderIds
                              .map(
                                (id) =>
                                  folderNames.get(
                                    `${message.accountId}:${id}`,
                                  ) ?? id,
                              )
                              .join(', ')
                          : t('dev.management.none')}
                      </Cell>
                      <Cell>
                        {message.hasAttachments
                          ? '✓'
                          : t('dev.management.none')}
                      </Cell>
                      <Cell>
                        {formatTimestamp(message.receivedAt ?? message.sentAt)}
                      </Cell>
                      <td className='px-4 py-3'>
                        <Button
                          variant='ghost'
                          className='h-8 px-2 text-xs'
                          onClick={() => setDetailMessage(message)}
                        >
                          {t('dev.management.viewDetails', {
                            defaultValue: 'View details',
                          })}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <MailPagination
            page={pageIndex + 1}
            total={total}
            pageSize={pageSize}
            hasNext={(pageIndex + 1) * pageSize < (total ?? 0)}
            disabled={loading || Boolean(actionBusy)}
            onPageChange={(page) => changePage(page - 1)}
            onPageSizeChange={(size) => {
              setSelectedKeys(new Set());
              setActionError(undefined);
              setPageSize(size);
            }}
          />
        </Card>
      </div>
      {detailMessage ? (
        <MailManagementMessageDetail
          key={messageKey(detailMessage)}
          selected={detailMessage}
          accountName={
            accountNames.get(detailMessage.accountId) ?? detailMessage.accountId
          }
          onClose={() => setDetailMessage(undefined)}
        />
      ) : null}
    </MailDevPageShell>
  );
}

function Header({ label }: { readonly label: string }): ReactElement {
  return <th className='px-4 py-3 font-medium whitespace-nowrap'>{label}</th>;
}

function Cell({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <td className='break-words px-4 py-3 text-muted-foreground'>{children}</td>
  );
}

function Status({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <span className='rounded-full border bg-background px-2 py-0.5 text-xs whitespace-nowrap'>
      {children}
    </span>
  );
}

function formatAddress(address: MailAddress | undefined): string {
  if (!address) return '—';
  return address.name
    ? `${address.name} <${address.address}>`
    : address.address;
}

function formatAddresses(addresses: readonly MailAddress[]): string {
  return addresses.length ? addresses.map(formatAddress).join(', ') : '—';
}

function formatTimestamp(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function messageKey(message: MailMessageSummary): string {
  return `${message.accountId}:${message.id}`;
}

function managementActionLabel(
  action: Exclude<MailManagementMessageAction, 'move'>,
): string {
  switch (action) {
    case 'markRead':
      return 'Mark read';
    case 'markUnread':
      return 'Mark unread';
    case 'star':
      return 'Star';
    case 'unstar':
      return 'Remove star';
    case 'archive':
      return 'Archive';
    case 'delete':
      return 'Delete';
  }
}
