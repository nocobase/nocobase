import { PageContainer } from '../components/page-container.js';
import { FileText, Link2, Mail, PenLine, RefreshCw, Tag } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import {
  MailAccountConnector,
  PageHeader,
  MailLabelManager,
  MailStatusBadge,
  MailSyncPolicyFields,
  MailSignatureManager,
  MailTemplateManager,
  type MailSyncPolicyValue,
  type MailStatusTone,
  type MailAccountCredentials,
} from '../components/index.js';
import { Button } from '../components/ui/button.js';
import { Card } from '../components/ui/card.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet.js';
import {
  mailErrorMessage,
  type MailAccountView,
  type MailProviderView,
  type MailSyncRunView,
} from '../mail-client.js';
import { MailPagination } from '../components/mail-pagination.js';
import { useMailTablePage } from '../hooks/use-mail-table-page.js';
import { mailSyncDateMonthsAgo } from '../../shared/mail-sync-date.js';
import { useMailClient } from '../runtime.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';

export interface MailAccountsPageProps {
  readonly providerKeys?: readonly string[];
  readonly credentialDefaults?: Pick<
    MailAccountCredentials,
    'username' | 'password'
  >;
}

export default function MailAccountsPage({
  providerKeys,
  credentialDefaults,
}: MailAccountsPageProps = {}): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [providers, setProviders] = useState<readonly MailProviderView[]>([]);
  const [accounts, setAccounts] = useState<readonly MailAccountView[]>([]);
  const accountPage = useMailTablePage(accounts);
  const [loading, setLoading] = useState(true);
  const [connectingProviderName, setConnectingProviderName] =
    useState<string>();
  const [syncing, setSyncing] = useState<string>();
  const [updatingAccountId, setUpdatingAccountId] = useState<string>();
  const [syncRuns, setSyncRuns] = useState<
    Readonly<Record<string, MailSyncRunView>>
  >({});
  const [policy, setPolicy] = useState<MailSyncPolicyValue>(() => ({
    receivedAfter: mailSyncDateMonthsAgo(1),
  }));
  const [showConnector, setShowConnector] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showSignatures, setShowSignatures] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState<MailAccountView>();
  const [accountToDeactivate, setAccountToDeactivate] =
    useState<MailAccountView>();
  const [removingAccountId, setRemovingAccountId] = useState<string>();
  const [error, setError] = useState<string>();
  const [authorizationNotice, setAuthorizationNotice] = useState(
    readAuthorizationNotice,
  );

  const refresh = useCallback((): void => {
    setLoading(true);
    setError(undefined);
    void Promise.all([mail.listProviders(), mail.listAccounts()])
      .then(([nextProviders, nextAccounts]) => {
        setProviders(
          nextProviders.filter((provider) =>
            matchesProvider(provider, providerKeys),
          ),
        );
        setAccounts(
          nextAccounts.filter((account) =>
            matchesProvider(account.provider, providerKeys),
          ),
        );
      })
      .catch((cause: unknown) => {
        setError(
          mailErrorMessage(
            cause,
            t('errors.requestFailed', {
              defaultValue: 'Mail request failed.',
            }),
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [mail, providerKeys, t]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  useEffect(() => {
    const activeRuns = Object.values(syncRuns).filter(
      (run) => run.status === 'pending' || run.status === 'running',
    );
    if (activeRuns.length === 0) return undefined;
    const timer = window.setInterval(() => {
      for (const run of activeRuns) {
        void mail.getSyncRun(run.id).then(
          (nextRun) => {
            setSyncRuns((current) => ({
              ...current,
              [nextRun.accountId]: nextRun,
            }));
            if (nextRun.status !== 'pending' && nextRun.status !== 'running') {
              setSyncing((current) =>
                current === nextRun.accountId ? undefined : current,
              );
            }
          },
          (cause: unknown) => {
            setError(
              mailErrorMessage(
                cause,
                t('errors.requestFailed', {
                  defaultValue: 'Mail request failed.',
                }),
              ),
            );
            setSyncRuns((current) => {
              const next = { ...current };
              delete next[run.accountId];
              return next;
            });
            setSyncing((current) =>
              current === run.accountId ? undefined : current,
            );
          },
        );
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [mail, syncRuns, t]);

  const hasRemovingAccounts = accounts.some(
    (account) => account.status === 'removing',
  );
  useEffect(() => {
    if (!hasRemovingAccounts) return;
    let disposed = false;
    let pending = false;
    const timer = window.setInterval(() => {
      if (pending) return;
      pending = true;
      void mail
        .listAccounts()
        .then((next) => {
          if (!disposed) {
            setAccounts(
              next.filter((account) =>
                matchesProvider(account.provider, providerKeys),
              ),
            );
          }
        })
        .catch(() => {
          // Keep the last known state; the next poll can recover a transient failure.
        })
        .finally(() => {
          pending = false;
        });
    }, 2000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [mail, hasRemovingAccounts, providerKeys]);

  const providerLabels = useMemo(
    () =>
      new Map(
        providers.map(
          (provider) => [providerKey(provider), provider.label] as const,
        ),
      ),
    [providers],
  );
  const connect = (provider: MailProviderView): void => {
    setAuthorizationNotice(undefined);
    setConnectingProviderName(provider.name);
    setError(undefined);
    void mail
      .startAuthorization({
        type: provider.type,
        name: provider.name,
        initialSyncReceivedAfter: toSyncDate(policy.receivedAfter),
      })
      .then((authorization) => {
        window.location.assign(authorization.authorizationUrl);
      })
      .catch((cause: unknown) => {
        setError(
          mailErrorMessage(
            cause,
            t('errors.authorizationFailed', {
              defaultValue: 'Could not start mail authorization.',
            }),
          ),
        );
        setConnectingProviderName(undefined);
      });
  };

  const connectWithCredentials = (
    provider: MailProviderView,
    credentials: MailAccountCredentials,
  ): void => {
    setAuthorizationNotice(undefined);
    setConnectingProviderName(provider.name);
    setError(undefined);
    void mail
      .connectAccount({
        type: provider.type,
        name: provider.name,
        initialSyncReceivedAfter: toSyncDate(policy.receivedAfter),
        ...credentials,
      })
      .then(() => {
        setAuthorizationNotice('success');
        setConnectingProviderName(undefined);
        setShowConnector(false);
        refresh();
      })
      .catch((cause: unknown) => {
        setError(
          mailErrorMessage(
            cause,
            t('errors.authorizationFailed', {
              defaultValue: 'Could not connect the mail account.',
            }),
          ),
        );
        setConnectingProviderName(undefined);
      });
  };

  const startSync = (account: MailAccountView): void => {
    setSyncing(account.id);
    setError(undefined);
    void mail
      .startSync({
        accountId: account.id,
        receivedAfter:
          account.initialSyncReceivedAfter ?? toSyncDate(policy.receivedAfter),
      })
      .then((run) =>
        setSyncRuns((current) => ({ ...current, [account.id]: run })),
      )
      .catch((cause: unknown) => {
        setError(
          mailErrorMessage(
            cause,
            t('errors.syncFailed', {
              defaultValue: 'Could not start mailbox synchronization.',
            }),
          ),
        );
        setSyncing(undefined);
      });
  };

  const updateAccount = (
    account: MailAccountView,
    change: {
      readonly status?: 'active' | 'suspended';
    },
  ): void => {
    setError(undefined);
    setUpdatingAccountId(account.id);
    void mail
      .updateAccount({ accountId: account.id, ...change })
      .then(
        () => {
          setAccountToDeactivate(undefined);
          refresh();
        },
        (cause: unknown) => {
          setError(
            mailErrorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Mail request failed.',
              }),
            ),
          );
        },
      )
      .finally(() => setUpdatingAccountId(undefined));
  };

  const requestRemoveAccount = (account: MailAccountView): void => {
    setError(undefined);
    setAccountToRemove(account);
  };

  const confirmRemoveAccount = (): void => {
    const account = accountToRemove;
    if (!account) return;

    setRemovingAccountId(account.id);
    setError(undefined);
    void mail.removeAccount(account.id).then(
      () => {
        setRemovingAccountId(undefined);
        setAccountToRemove(undefined);
        setAccounts((current) =>
          current.map((item) =>
            item.id === account.id ? { ...item, status: 'removing' } : item,
          ),
        );
        setSyncRuns((current) => {
          const next = { ...current };
          delete next[account.id];
          return next;
        });
        setSyncing((current) => (current === account.id ? undefined : current));
        refresh();
      },
      (cause: unknown) => {
        setRemovingAccountId(undefined);
        setError(
          mailErrorMessage(
            cause,
            t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
          ),
        );
      },
    );
  };

  return (
    <PageContainer className='@container/accounts'>
      <PageHeader
        actions={
          <>
            <Button
              onClick={() => {
                setShowConnector(true);
                setShowTemplates(false);
                setShowLabels(false);
                setShowSignatures(false);
              }}
              type='button'
              variant='default'
            >
              <Link2 aria-hidden='true' className='size-4' />
              {t('dev.associateAccount', {
                defaultValue: 'Connect account',
              })}
            </Button>
            <Button
              onClick={() => {
                setShowTemplates((current) => !current);
                setShowConnector(false);
                setShowLabels(false);
                setShowSignatures(false);
              }}
              type='button'
              variant={showTemplates ? 'default' : 'outline'}
            >
              <FileText aria-hidden='true' className='size-4' />
              {t('dev.templateManagement', {
                defaultValue: showTemplates ? 'Close templates' : 'Templates',
              })}
            </Button>
            <Button
              onClick={() => {
                setShowSignatures((current) => !current);
                setShowConnector(false);
                setShowTemplates(false);
                setShowLabels(false);
                setError(undefined);
              }}
              type='button'
              variant={showSignatures ? 'default' : 'outline'}
            >
              <PenLine aria-hidden='true' className='size-4' />
              {t('dev.signatureManagement', { defaultValue: 'Signatures' })}
            </Button>
            <Button
              onClick={() => {
                setShowLabels((current) => !current);
                setShowConnector(false);
                setShowTemplates(false);
                setShowSignatures(false);
              }}
              type='button'
              variant={showLabels ? 'default' : 'outline'}
            >
              <Tag aria-hidden='true' className='size-4' />
              {t('dev.labelManagement', { defaultValue: 'Labels' })}
            </Button>
            <Button disabled={loading} onClick={refresh} variant='outline'>
              <RefreshCw
                aria-hidden='true'
                className={`size-4 ${loading ? 'animate-spin' : ''}`}
              />
              {t('actions.refresh', { defaultValue: 'Refresh' })}
            </Button>
          </>
        }
        description={t('dev.accountsDescription', {
          defaultValue:
            'Connect and manage your mail accounts and choose when to start synchronizing messages.',
        })}
        title={t('nav.devAccounts', { defaultValue: 'Mail accounts' })}
      />
      {authorizationNotice ? (
        <div
          role={authorizationNotice === 'success' ? 'status' : 'alert'}
          className={`rounded-xl border p-4 text-sm ${authorizationNotice === 'success' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}
        >
          {authorizationNotice === 'success'
            ? t('settings.authorizationSuccess', {
                defaultValue:
                  'Account connected successfully. Newly connected mailboxes sync automatically in the background. Initial synchronization may take some time. View progress in Sync logs; there is no need to start another sync.',
              })
            : t('settings.authorizationFailure', {
                defaultValue:
                  'The mail account could not be connected. Try again.',
              })}
        </div>
      ) : null}

      {error ? (
        <div className='rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : null}

      <Card className='overflow-hidden rounded-2xl bg-background shadow-sm'>
        <div className='flex flex-wrap items-start justify-between gap-4 border-b bg-muted/20 px-6 py-5'>
          <div>
            <h2 className='font-semibold'>
              {t('dev.connectedAccountsTitle', {
                defaultValue: 'Connected accounts',
              })}
            </h2>
            <p className='mt-1 max-w-2xl text-sm leading-6 text-muted-foreground'>
              {t('dev.connectedAccountsDescription', {
                defaultValue:
                  'Manage mail accounts and their saved initial synchronization dates.',
              })}
            </p>
          </div>
          <span className='inline-flex h-7 min-w-7 items-center justify-center rounded-full border bg-background px-2 text-xs font-semibold'>
            {accounts.length}
          </span>
        </div>

        {loading ? (
          <div className='p-6'>
            <LoadingState
              label={t('settings.loading', {
                defaultValue: 'Loading mail configuration…',
              })}
            />
          </div>
        ) : accounts.length === 0 ? (
          <div className='p-6'>
            <EmptyState
              description={t('dev.connectedAccountsEmptyDescription', {
                defaultValue:
                  'Select Connect account to connect your first mailbox.',
              })}
              title={t('settings.accounts.emptyTitle', {
                defaultValue: 'No accounts connected',
              })}
            />
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-[640px] w-full text-left text-sm'>
              <thead className='bg-muted/20 text-xs text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>
                    {t('dev.accountColumn', { defaultValue: 'Account' })}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {t('dev.providerColumn', { defaultValue: 'Provider' })}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {t('dev.statusColumn', { defaultValue: 'Status' })}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {t('dev.initialSyncColumn', {
                      defaultValue: 'Initial sync start date',
                    })}
                  </th>
                  <th className='px-4 py-3 text-right font-medium'>
                    {t('dev.actionsColumn', { defaultValue: 'Actions' })}
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {accountPage.rows.map((account) => {
                  const run = syncRuns[account.id];
                  return (
                    <Fragment key={account.id}>
                      <ConnectedAccountRow
                        account={account}
                        onSync={startSync}
                        onRemove={requestRemoveAccount}
                        onToggleStatus={(account) => {
                          if (account.status === 'suspended') {
                            updateAccount(account, { status: 'active' });
                          } else {
                            setError(undefined);
                            setAccountToDeactivate(account);
                          }
                        }}
                        providerLabel={
                          providerLabels.get(providerKey(account.provider)) ??
                          account.provider.name
                        }
                        statusLabel={
                          account.removalFailed
                            ? t('settings.accounts.removalFailed', {
                                defaultValue:
                                  'Removal failed; retrying automatically',
                              })
                            : t(`status.account.${account.status}`, {
                                defaultValue: account.status,
                              })
                        }
                        syncLabel={t('settings.accounts.sync', {
                          defaultValue: 'Sync',
                        })}
                        removeLabel={
                          removingAccountId === account.id ||
                          account.status === 'removing'
                            ? t('settings.accounts.removing', {
                                defaultValue: 'Removing…',
                              })
                            : t('settings.accounts.remove', {
                                defaultValue: 'Remove account',
                              })
                        }
                        toggleStatusLabel={
                          account.status === 'suspended'
                            ? t('settings.accounts.activate', {
                                defaultValue: 'Activate',
                              })
                            : t('settings.accounts.deactivate', {
                                defaultValue: 'Deactivate',
                              })
                        }
                        removing={
                          removingAccountId === account.id ||
                          account.status === 'removing'
                        }
                        updating={updatingAccountId === account.id}
                        syncing={
                          syncing === account.id ||
                          (run !== undefined &&
                            (run.status === 'pending' ||
                              run.status === 'running'))
                        }
                      />
                      {run ? (
                        <tr>
                          <td className='px-6 py-3' colSpan={5}>
                            <SyncProgress run={run} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <MailPagination
          {...accountPage}
          disabled={
            loading || Boolean(removingAccountId) || Boolean(updatingAccountId)
          }
        />
      </Card>
      <Sheet open={showConnector} onOpenChange={setShowConnector}>
        <SheetContent
          className='overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl'
          closeLabel={t('dev.closePanel', { defaultValue: 'Close' })}
          side='right'
        >
          <SheetHeader className='shrink-0 border-b bg-muted/20 pr-14'>
            <SheetTitle>
              {t('settings.providers.title', {
                defaultValue: 'Add mail account',
              })}
            </SheetTitle>
            <SheetDescription>
              {t('settings.providers.description', {
                defaultValue:
                  'Choose an account type, then authorize it or enter its mailbox credentials. Newly connected mailboxes start syncing automatically. Initial sync may take some time, depending on the number of messages and network conditions. Check progress in Sync logs; there is no need to start another sync.',
              })}
            </SheetDescription>
          </SheetHeader>

          <div className='space-y-6 px-4 pb-6'>
            {error ? (
              <div
                role='alert'
                className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'
              >
                {error}
              </div>
            ) : null}
            <section className='space-y-4 pt-2'>
              <div>
                <h2 className='font-semibold'>
                  {t('settings.initialSync.title', {
                    defaultValue: 'Initial sync date',
                  })}
                </h2>
                <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                  {t('settings.initialSync.description', {
                    defaultValue:
                      'Choose the initial sync start date for new accounts. Each account’s saved date is shown in the account list.',
                  })}
                </p>
              </div>
              <MailSyncPolicyFields
                labels={{
                  receivedAfter: t('settings.initialSync.receivedAfter', {
                    defaultValue: 'Import messages received after',
                  }),
                }}
                onChange={setPolicy}
                value={policy}
              />
            </section>

            <section className='space-y-4 border-t pt-6'>
              {loading ? (
                <LoadingState
                  label={t('settings.loading', {
                    defaultValue: 'Loading mail configuration…',
                  })}
                />
              ) : providers.length === 0 ? (
                <EmptyState
                  description={t('settings.providers.emptyDescription', {
                    defaultValue:
                      'Ask an administrator to configure a Gmail, Microsoft, or IMAP/SMTP provider.',
                  })}
                  title={t('settings.providers.emptyTitle', {
                    defaultValue: 'No mail providers configured',
                  })}
                />
              ) : (
                <MailAccountConnector
                  credentialDefaults={credentialDefaults}
                  connectedAccountCount={(provider) =>
                    accounts.filter(
                      (account) =>
                        account.provider.type === provider.type &&
                        account.provider.name === provider.name,
                    ).length
                  }
                  connectingProviderName={connectingProviderName}
                  labels={{
                    accountType: t('settings.providers.accountType', {
                      defaultValue: 'Mail account type',
                    }),
                    chooseAccountType: t(
                      'settings.providers.chooseAccountType',
                      { defaultValue: 'Select an account type' },
                    ),
                    connect: t('settings.providers.connect', {
                      defaultValue: 'Connect account',
                    }),
                    connecting: t('settings.providers.connecting', {
                      defaultValue: 'Connecting…',
                    }),
                    connectedAccounts: (count) =>
                      t('settings.providers.connected', {
                        count,
                        defaultValue: '{{count}} connected',
                      }),
                    capability: (capability) =>
                      t(`capabilities.${capability}`, {
                        defaultValue: capability,
                      }),
                    configurationRequired: t(
                      'settings.providers.configurationRequired',
                      {
                        defaultValue:
                          'Ask an administrator to configure this mail provider first',
                      },
                    ),
                    emailAddress: t('settings.providers.emailAddress', {
                      defaultValue: 'Email address',
                    }),
                    username: t('settings.providers.username', {
                      defaultValue: 'Username',
                    }),
                    password: t('settings.providers.password', {
                      defaultValue: 'Password',
                    }),
                    displayName: t('settings.providers.displayName', {
                      defaultValue: 'Sender name (optional)',
                    }),
                  }}
                  onConnect={connect}
                  onConnectCredentials={connectWithCredentials}
                  providers={providers}
                />
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showLabels} onOpenChange={setShowLabels}>
        <SheetContent
          className='overflow-hidden data-[side=right]:w-full data-[side=right]:sm:max-w-4xl'
          closeLabel={t('dev.closePanel', { defaultValue: 'Close' })}
          side='right'
        >
          <SheetHeader className='shrink-0 border-b bg-muted/20 pr-14'>
            <SheetTitle>
              {t('dev.labelManagementTitle', {
                defaultValue: 'Label management',
              })}
            </SheetTitle>
            <SheetDescription>
              {t('dev.labelManagementDescription', {
                defaultValue: 'Create and review labels stored in NocoBase.',
              })}
            </SheetDescription>
          </SheetHeader>
          <div className='min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pb-6 lg:overflow-hidden'>
            <MailLabelManager />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showTemplates} onOpenChange={setShowTemplates}>
        <SheetContent
          className='overflow-hidden data-[side=right]:w-full data-[side=right]:sm:max-w-4xl'
          closeLabel={t('dev.closePanel', { defaultValue: 'Close' })}
          side='right'
        >
          <SheetHeader className='shrink-0 border-b bg-muted/20 pr-14'>
            <SheetTitle>
              {t('dev.templateManagementTitle', {
                defaultValue: 'Template management',
              })}
            </SheetTitle>
            <SheetDescription>
              {t('dev.templateManagementDescription', {
                defaultValue:
                  'Create reusable subjects and message bodies without leaving the account workspace.',
              })}
            </SheetDescription>
          </SheetHeader>
          <div className='min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pb-6 lg:overflow-hidden'>
            <MailTemplateManager />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={showSignatures}
        onOpenChange={(open) => {
          setShowSignatures(open);
          if (!open) setError(undefined);
        }}
      >
        <SheetContent
          className='overflow-hidden data-[side=right]:w-full data-[side=right]:sm:max-w-4xl'
          closeLabel={t('dev.closePanel', { defaultValue: 'Close' })}
          side='right'
        >
          <SheetHeader className='shrink-0 border-b bg-muted/20 pr-14'>
            <SheetTitle>
              {t('dev.signatureManagementTitle', {
                defaultValue: 'Signature management',
              })}
            </SheetTitle>
            <SheetDescription>
              {t('dev.signatureManagementDescription', {
                defaultValue: 'Manage signatures for each connected account.',
              })}
            </SheetDescription>
          </SheetHeader>

          <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4 pb-6 lg:overflow-hidden'>
            {error ? (
              <div className='mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
                {error}
              </div>
            ) : null}
            {accounts.length === 0 ? (
              <EmptyState
                description={t('dev.connectedAccountsEmptyDescription', {
                  defaultValue:
                    'Select Connect account to connect your first mailbox.',
                })}
                title={t('settings.accounts.emptyTitle', {
                  defaultValue: 'No accounts connected',
                })}
              />
            ) : (
              <MailSignatureManager accounts={accounts} onError={setError} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={accountToDeactivate !== undefined}
        onOpenChange={(open) => {
          if (!open && updatingAccountId === undefined) {
            setAccountToDeactivate(undefined);
            setError(undefined);
          }
        }}
      >
        <DialogContent
          closeLabel={t('dev.closePanel', { defaultValue: 'Close' })}
        >
          <DialogHeader>
            <DialogTitle>
              {t('settings.accounts.deactivateTitle', {
                defaultValue: 'Deactivate mail account?',
              })}
            </DialogTitle>
            <DialogDescription>
              {t('settings.accounts.deactivateDescription', {
                defaultValue:
                  'This account will stop synchronizing and sending mail and will be hidden from the Mail center. Synchronized mail will remain available in Mail management. You can activate the account again later.',
              })}
            </DialogDescription>
          </DialogHeader>
          <p className='mt-5 text-sm font-medium'>
            {accountToDeactivate?.address}
          </p>
          {error ? (
            <p role='alert' className='mt-4 text-sm text-destructive'>
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              disabled={updatingAccountId !== undefined}
              onClick={() => {
                setAccountToDeactivate(undefined);
                setError(undefined);
              }}
              type='button'
              variant='outline'
            >
              {t('settings.accounts.deactivateCancel', {
                defaultValue: 'Cancel',
              })}
            </Button>
            <Button
              disabled={updatingAccountId !== undefined}
              onClick={() => {
                if (accountToDeactivate && updatingAccountId === undefined) {
                  updateAccount(accountToDeactivate, { status: 'suspended' });
                }
              }}
              type='button'
            >
              {updatingAccountId !== undefined
                ? t('settings.accounts.deactivating', {
                    defaultValue: 'Deactivating…',
                  })
                : t('settings.accounts.deactivateConfirm', {
                    defaultValue: 'Deactivate account',
                  })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={accountToRemove !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setAccountToRemove(undefined);
            setError(undefined);
          }
        }}
      >
        <DialogContent
          closeLabel={t('dev.closePanel', { defaultValue: 'Close' })}
        >
          <DialogHeader>
            <DialogTitle>
              {t('settings.accounts.removeTitle', {
                defaultValue: 'Remove mail account?',
              })}
            </DialogTitle>
            <DialogDescription>
              {t('settings.accounts.removeDescription', {
                defaultValue:
                  'This will delete synchronized mail, folders, signatures, sync records, and authorization data stored in this app. It will not delete mail from your provider.',
              })}
            </DialogDescription>
          </DialogHeader>

          {accountToRemove ? (
            <div className='mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm'>
              <p className='font-medium'>{accountToRemove.address}</p>
              <p className='mt-1 text-muted-foreground'>
                {t('settings.accounts.removeLocalDataNotice', {
                  defaultValue:
                    'Only this application’s local account data will be removed.',
                })}
              </p>
            </div>
          ) : null}

          {error ? (
            <p className='mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              disabled={removingAccountId !== undefined}
              onClick={() => setAccountToRemove(undefined)}
              type='button'
              variant='outline'
            >
              {t('settings.accounts.removeCancel', {
                defaultValue: 'Cancel',
              })}
            </Button>
            <Button
              disabled={removingAccountId !== undefined}
              onClick={confirmRemoveAccount}
              type='button'
              variant='destructive'
            >
              {removingAccountId !== undefined
                ? t('settings.accounts.removing', {
                    defaultValue: 'Removing…',
                  })
                : t('settings.accounts.removeConfirm', {
                    defaultValue: 'Remove account',
                  })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function ConnectedAccountRow({
  account,
  onSync,
  onRemove,
  onToggleStatus,
  providerLabel,
  statusLabel,
  syncLabel,
  syncing,
  removeLabel,
  removing,
  updating,
  toggleStatusLabel,
}: {
  readonly account: MailAccountView;
  readonly onSync: (account: MailAccountView) => void;
  readonly onRemove: (account: MailAccountView) => void;
  readonly onToggleStatus: (account: MailAccountView) => void;
  readonly providerLabel: string;
  readonly statusLabel: string;
  readonly syncLabel: string;
  readonly syncing: boolean;
  readonly removeLabel: string;
  readonly removing: boolean;
  readonly updating: boolean;
  readonly toggleStatusLabel: string;
}): ReactElement {
  return (
    <tr className='transition-colors hover:bg-muted/20'>
      <td className='px-4 py-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl border bg-muted/30 text-muted-foreground'>
            <Mail aria-hidden='true' className='size-5' />
          </span>
          <div className='min-w-0'>
            <p className='truncate font-semibold'>{account.address}</p>
            {account.displayName ? (
              <p className='truncate text-xs text-muted-foreground'>
                {account.displayName}
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td className='px-4 py-4'>
        <div className='min-w-0'>
          <p className='font-medium'>{providerLabel}</p>
          <p className='mt-1 font-mono text-xs text-muted-foreground'>
            {account.provider.type}
          </p>
        </div>
      </td>
      <td className='px-4 py-4'>
        <MailStatusBadge
          label={statusLabel}
          tone={accountStatusTone(account.status)}
        />
      </td>
      <td className='px-4 py-4'>
        {account.initialSyncReceivedAfter ? (
          <time dateTime={account.initialSyncReceivedAfter}>
            {account.initialSyncReceivedAfter.slice(0, 10)}
          </time>
        ) : (
          <span className='text-muted-foreground'>—</span>
        )}
      </td>
      <td className='px-4 py-4'>
        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            disabled={syncing || account.status !== 'active'}
            onClick={() => onSync(account)}
            type='button'
            variant='outline'
          >
            {syncLabel}
          </Button>
          <Button
            disabled={syncing || removing || updating}
            onClick={() => onToggleStatus(account)}
            type='button'
            variant='outline'
          >
            {toggleStatusLabel}
          </Button>
          <Button
            disabled={syncing || removing || updating}
            onClick={() => onRemove(account)}
            type='button'
            variant='destructive'
          >
            {removeLabel}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function SyncProgress({
  run,
}: {
  readonly run: MailSyncRunView;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-4 py-3 text-sm'>
      <MailStatusBadge
        label={t(`status.sync.${run.status}`, { defaultValue: run.status })}
        tone={syncStatusTone(run.status)}
      />
      <span>
        {t('settings.accounts.syncProgress', {
          defaultValue: '{{messages}} messages in {{pages}} batches',
          messages: run.processedMessages,
          pages: run.processedPages,
        })}
      </span>
      <span className='text-muted-foreground'>
        · {t(`status.syncPhase.${run.phase}`, { defaultValue: run.phase })}
      </span>
    </div>
  );
}

function accountStatusTone(status: MailAccountView['status']): MailStatusTone {
  if (status === 'active') return 'success';
  if (status === 'connecting') return 'info';
  if (status === 'reauthorizationRequired') return 'warning';
  return 'danger';
}

function syncStatusTone(status: MailSyncRunView['status']): MailStatusTone {
  if (status === 'completed') return 'success';
  if (status === 'failed' || status === 'cancelled') return 'danger';
  return 'info';
}

function LoadingState({ label }: { readonly label: string }): ReactElement {
  return (
    <div className='rounded-xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground'>
      {label}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}): ReactElement {
  return (
    <div className='rounded-xl border border-dashed bg-muted/20 p-8 text-center'>
      <p className='font-medium'>{title}</p>
      <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
    </div>
  );
}

function providerKey(
  provider: Pick<MailProviderView, 'type' | 'name'>,
): string {
  return `${provider.type}:${provider.name}`;
}

function matchesProvider(
  provider: Pick<MailProviderView, 'type' | 'name'>,
  providerKeys?: readonly string[],
): boolean {
  return (
    providerKeys === undefined || providerKeys.includes(providerKey(provider))
  );
}

function readAuthorizationNotice(): 'success' | 'failure' | undefined {
  const value = new URL(window.location.href).searchParams.get(
    'mailAuthorization',
  );
  return value === 'success' || value === 'failure' ? value : undefined;
}

function toSyncDate(value?: string): string {
  return new Date(
    `${value ?? mailSyncDateMonthsAgo(1)}T00:00:00Z`,
  ).toISOString();
}
