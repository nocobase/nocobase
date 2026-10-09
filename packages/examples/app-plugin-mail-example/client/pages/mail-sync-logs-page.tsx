import {
  mailErrorMessage,
  type MailAccountView,
  type MailSyncRunView,
  useMailClient,
} from '@nocobase/app-plugin-mail/client';
import { resolveAppUrl } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCw } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import { DemoMailboxGate } from '../components/demo-mailbox-gate.js';
import {
  ExamplePageContainer,
  ExamplePageHeader,
} from '../components/example-page-layout.js';

const PAGE_SIZE = 20;

interface SyncLogsPage {
  readonly accounts: readonly MailAccountView[];
  readonly runs: readonly MailSyncRunView[];
  readonly total: number;
}

export default function MailExampleSyncLogsPage(): ReactElement {
  return (
    <DemoMailboxGate>
      {(accounts) => <MailExampleSyncLogs accounts={accounts} />}
    </DemoMailboxGate>
  );
}

function MailExampleSyncLogs({
  accounts,
}: {
  readonly accounts: readonly MailAccountView[];
}): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation('@nocobase/app-plugin-mail-example');
  const [data, setData] = useState<SyncLogsPage>();
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback((): void => {
    setLoading(true);
    setError(undefined);
    void Promise.all([
      mail.listSyncRunsPage({ page: pageIndex + 1, pageSize: PAGE_SIZE }),
      mail.listAccounts(),
    ])
      .then(([runsPage, allAccounts]) => {
        setData({
          accounts: allAccounts.length ? allAccounts : accounts,
          runs: runsPage.items,
          total: runsPage.total,
        });
      })
      .catch((cause: unknown) => {
        setError(mailErrorMessage(cause, t('syncLogs.loadFailed')));
      })
      .finally(() => setLoading(false));
  }, [accounts, mail, pageIndex, t]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const accountLabels = useMemo(
    () =>
      new Map(
        data?.accounts.map((account) => [
          account.id,
          {
            address: account.address,
            provider: t(`providers.${account.provider.name}`, {
              defaultValue: account.provider.name,
            }),
          },
        ]),
      ),
    [data?.accounts, t],
  );
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrevious = pageIndex > 0;
  const canNext = pageIndex + 1 < pageCount;

  return (
    <ExamplePageContainer>
      <ExamplePageHeader
        title={t('syncLogs.title')}
        description={t('syncLogs.description')}
        actions={
          <>
            <a
              className='rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted'
              href={resolveAppUrl('/mail-example')}
            >
              {t('navigation.accounts')}
            </a>
            <button
              className='inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50'
              disabled={loading}
              onClick={refresh}
              type='button'
            >
              <RefreshCw
                aria-hidden='true'
                className={`size-4 ${loading ? 'animate-spin' : ''}`}
              />
              {t('demo.refresh')}
            </button>
          </>
        }
      />

      {error ? (
        <p
          className='rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'
          role='alert'
        >
          {error}
        </p>
      ) : null}

      <section className='overflow-hidden rounded-xl border bg-card'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[1000px] text-left text-sm'>
            <thead className='border-b bg-muted/40 text-xs text-muted-foreground'>
              <tr>
                <th className='px-4 py-3 font-medium'>
                  {t('syncLogs.account')}
                </th>
                <th className='px-4 py-3 font-medium'>{t('syncLogs.mode')}</th>
                <th className='px-4 py-3 font-medium'>
                  {t('syncLogs.status')}
                </th>
                <th className='px-4 py-3 font-medium'>{t('syncLogs.phase')}</th>
                <th className='px-4 py-3 font-medium'>
                  {t('syncLogs.progress')}
                </th>
                <th className='px-4 py-3 font-medium'>
                  {t('syncLogs.started')}
                </th>
                <th className='px-4 py-3 font-medium'>
                  {t('syncLogs.completed')}
                </th>
                <th className='px-4 py-3 font-medium'>{t('syncLogs.error')}</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {data?.runs.map((run) => {
                const account = accountLabels.get(run.accountId);
                return (
                  <tr className='align-top' key={run.id}>
                    <td className='px-4 py-4'>
                      <p className='font-medium'>
                        {account?.provider ?? t('syncLogs.unknownAccount')}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {account?.address ?? run.accountId}
                      </p>
                    </td>
                    <td className='px-4 py-4 text-muted-foreground'>
                      {t(`syncLogs.modes.${run.mode}`, {
                        defaultValue: run.mode,
                      })}
                    </td>
                    <td className='px-4 py-4'>
                      <span className={syncStatusClass(run.status)}>
                        {t(`syncLogs.statuses.${run.status}`, {
                          defaultValue: run.status,
                        })}
                      </span>
                    </td>
                    <td className='px-4 py-4 text-muted-foreground'>
                      {t(`syncLogs.phases.${run.phase}`, {
                        defaultValue: run.phase,
                      })}
                    </td>
                    <td className='px-4 py-4'>
                      <p>
                        {t('syncLogs.messages', {
                          count: run.processedMessages,
                        })}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {t('syncLogs.batches', {
                          count: run.processedPages,
                        })}
                      </p>
                    </td>
                    <td className='whitespace-nowrap px-4 py-4 text-muted-foreground'>
                      {formatDate(run.createdAt)}
                    </td>
                    <td className='whitespace-nowrap px-4 py-4 text-muted-foreground'>
                      {run.completedAt ? formatDate(run.completedAt) : '—'}
                    </td>
                    <td className='max-w-56 px-4 py-4 text-xs text-destructive'>
                      {run.error?.code ?? '—'}
                    </td>
                  </tr>
                );
              })}
              {!loading && (data?.runs.length ?? 0) === 0 ? (
                <tr>
                  <td
                    className='px-4 py-10 text-center text-muted-foreground'
                    colSpan={8}
                  >
                    {t('syncLogs.empty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {loading && !data ? (
          <p className='border-t p-8 text-center text-sm text-muted-foreground'>
            {t('demo.loading')}
          </p>
        ) : null}
        <div className='flex items-center justify-between border-t px-5 py-4'>
          <span className='text-sm text-muted-foreground'>
            {t('syncLogs.pageCount', {
              page: Math.min(pageIndex + 1, pageCount),
              pages: pageCount,
              total,
            })}
          </span>
          <div className='flex gap-2'>
            <button
              className='rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
              disabled={!canPrevious || loading}
              onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
              type='button'
            >
              {t('allMail.previous')}
            </button>
            <button
              className='rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
              disabled={!canNext || loading}
              onClick={() => setPageIndex((value) => value + 1)}
              type='button'
            >
              {t('allMail.next')}
            </button>
          </div>
        </div>
      </section>
    </ExamplePageContainer>
  );
}

function syncStatusClass(status: string): string {
  if (status === 'completed') {
    return 'inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300';
  }
  if (status === 'failed' || status === 'cancelled') {
    return 'inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive';
  }
  return 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground';
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}
