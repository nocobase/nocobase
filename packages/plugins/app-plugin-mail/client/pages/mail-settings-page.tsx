import { PageContainer } from '../components/page-container.js';
import { Mail, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import {
  PageHeader,
  MailStatusBadge,
  type MailStatusTone,
} from '../components/index.js';
import { Card } from '../components/ui/card.js';
import {
  mailErrorMessage,
  type MailManagedAccountView,
} from '../mail-client.js';
import { MailPagination } from '../components/mail-pagination.js';
import { useMailTablePage } from '../hooks/use-mail-table-page.js';
import { useMailClient } from '../runtime.js';
import { Button } from '../components/ui/button.js';

export default function MailSettingsPage(): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<readonly MailManagedAccountView[]>(
    [],
  );
  const accountPage = useMailTablePage(accounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback((): void => {
    setLoading(true);
    setError(undefined);
    void mail
      .listManagedAccounts()
      .then(setAccounts)
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
  }, [mail, t]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  return (
    <PageContainer>
      <PageHeader
        actions={
          <Button disabled={loading} onClick={refresh} variant='outline'>
            <RefreshCw
              aria-hidden='true'
              className={`size-4 ${loading ? 'animate-spin' : ''}`}
            />
            {t('actions.refresh', { defaultValue: 'Refresh' })}
          </Button>
        }
        description={t('settings.description', {
          defaultValue: 'View mailboxes connected by all users.',
        })}
        title={t('settings.title', { defaultValue: 'Mail settings' })}
      />
      {error ? (
        <div className='rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : null}

      <section>
        {loading ? (
          <LoadingState
            label={t('settings.loading', {
              defaultValue: 'Loading mail configuration…',
            })}
          />
        ) : accounts.length === 0 ? (
          <EmptyState
            description={t('settings.accounts.emptyDescription', {
              defaultValue: 'No user has connected a mail account.',
            })}
            title={t('settings.accounts.emptyTitle', {
              defaultValue: 'No accounts connected',
            })}
          />
        ) : (
          <Card className='overflow-hidden rounded-2xl bg-background shadow-sm'>
            <div className='flex flex-wrap items-start justify-between gap-4 border-b bg-muted/20 px-6 py-5'>
              <div>
                <h2 className='font-semibold'>
                  {t('settings.accounts.title', {
                    defaultValue: 'All connected accounts',
                  })}
                </h2>
                <p className='mt-1 max-w-2xl text-sm leading-6 text-muted-foreground'>
                  {t('settings.accounts.description', {
                    defaultValue: 'View mailboxes connected by all users.',
                  })}
                </p>
              </div>
              <span className='inline-flex h-7 min-w-7 items-center justify-center rounded-full border bg-background px-2 text-xs font-semibold'>
                {accounts.length}
              </span>
            </div>

            <div className='overflow-x-auto'>
              <table className='min-w-[64rem] w-full text-left text-sm'>
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
                      {t('settings.accounts.ownerColumn', {
                        defaultValue: 'Owner',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('dev.initialSyncColumn', {
                        defaultValue: 'Initial sync start date',
                      })}
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {accountPage.rows.map((account) => (
                    <ManagedAccountRow account={account} key={account.id} />
                  ))}
                </tbody>
              </table>
            </div>
            <MailPagination {...accountPage} disabled={loading} />
          </Card>
        )}
      </section>
    </PageContainer>
  );
}

function ManagedAccountRow({
  account,
}: {
  readonly account: MailManagedAccountView;
}): ReactElement {
  const { t } = useTranslation();

  return (
    <tr className='transition-colors hover:bg-muted/20'>
      <td className='px-4 py-4'>
        <div className='flex min-w-64 items-center gap-3'>
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
        <div className='min-w-32'>
          <p className='font-medium'>
            {account.provider.type} / {account.provider.name}
          </p>
          <p className='mt-1 font-mono text-[11px] text-muted-foreground'>
            {account.provider.type}
          </p>
        </div>
      </td>
      <td className='px-4 py-4'>
        <MailStatusBadge
          label={t(`status.account.${account.status}`, {
            defaultValue: account.status,
          })}
          tone={accountStatusTone(account.status)}
        />
      </td>
      <td className='whitespace-nowrap px-4 py-4 text-muted-foreground'>
        {account.ownerName ||
          t('settings.accounts.owner', {
            defaultValue: 'User ID: {{userId}}',
            userId: account.userId,
          })}
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
    </tr>
  );
}

function accountStatusTone(
  status: MailManagedAccountView['status'],
): MailStatusTone {
  if (status === 'active') return 'success';
  if (status === 'connecting') return 'info';
  if (status === 'reauthorizationRequired') return 'warning';
  return 'danger';
}

function EmptyState({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}): ReactElement {
  return (
    <div className='rounded-xl border border-dashed bg-background p-8 text-center'>
      <p className='font-medium'>{title}</p>
      <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
    </div>
  );
}

function LoadingState({ label }: { readonly label: string }): ReactElement {
  return (
    <div className='rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground'>
      {label}
    </div>
  );
}
