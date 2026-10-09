import { RefreshCw } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { MailStatusBadge } from '../components/index.js';
import { Button } from '../components/ui/button.js';
import { Card } from '../components/ui/card.js';
import { type MailSyncRunView } from '../mail-client.js';
import { useMailLogPage } from '../hooks/use-mail-log-page.js';
import { MailPagination } from '../components/mail-pagination.js';
import { useMailClient } from '../runtime.js';
import { MailErrorDescription } from '../components/mail-error-description.js';

export default function MailSyncLogsPage(): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation();
  const load = useCallback(
    (page: number, pageSize: number) =>
      Promise.all([
        mail.listAccounts(),
        mail.listSyncRunsPage({ page, pageSize }),
      ]),
    [mail],
  );
  const {
    accounts,
    rows: runs,
    loading,
    error,
    refresh,
    page,
    changePage,
    pageSize,
    changePageSize,
    hasNext,
    total,
  } = useMailLogPage<MailSyncRunView>(load);

  const accountLabels = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.address])),
    [accounts],
  );

  return (
    <section className='space-y-4'>
      <div className='flex justify-end'>
        <Button disabled={loading} onClick={refresh} variant='outline'>
          <RefreshCw
            aria-hidden
            className={`size-4 ${loading ? 'animate-spin' : ''}`}
          />
          {t('actions.refresh', { defaultValue: 'Refresh' })}
        </Button>
      </div>
      <div className='space-y-5 pb-12'>
        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        <Card className='overflow-hidden rounded-2xl bg-background shadow-sm'>
          {loading ? (
            <div className='p-8 text-center text-sm text-muted-foreground'>
              {t('settings.loading', {
                defaultValue: 'Loading mail configuration…',
              })}
            </div>
          ) : runs.length === 0 ? (
            <div className='p-10 text-center'>
              <p className='font-medium'>
                {t('settings.syncLogs.emptyTitle', {
                  defaultValue: 'No synchronization runs',
                })}
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {t('settings.syncLogs.emptyDescription', {
                  defaultValue:
                    'Start a mailbox synchronization to create a log.',
                })}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[980px] text-sm'>
                <thead className='border-b bg-muted/50 text-left text-xs text-muted-foreground'>
                  <tr>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.syncLogs.account', {
                        defaultValue: 'Account',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.syncLogs.mode', { defaultValue: 'Mode' })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.syncLogs.status', {
                        defaultValue: 'Status',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.syncLogs.phase', { defaultValue: 'Phase' })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.syncLogs.progress', {
                        defaultValue: 'Progress',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.syncLogs.startedAt', {
                        defaultValue: 'Started at',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.syncLogs.completedAt', {
                        defaultValue: 'Completed at',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.syncLogs.error', { defaultValue: 'Error' })}
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {runs.map((run) => (
                    <tr className='align-top' key={run.id}>
                      <td className='px-4 py-3 font-medium'>
                        {accountLabels.get(run.accountId) ??
                          t('settings.syncLogs.unknownAccount', {
                            defaultValue: 'Unknown account',
                          })}
                      </td>
                      <td className='px-4 py-3'>
                        {t(`settings.syncLogs.${run.mode}`, {
                          defaultValue: run.mode,
                        })}
                      </td>
                      <td className='px-4 py-3'>
                        <MailStatusBadge
                          label={
                            run.recovering
                              ? t('content.recovering')
                              : run.status === 'partial'
                                ? t('content.partial')
                                : run.mode === 'initial' &&
                                    run.status === 'running'
                                  ? t('content.history')
                                  : t(`status.sync.${run.status}`, {
                                      defaultValue: run.status,
                                    })
                          }
                          tone={syncStatusTone(run.status)}
                        />
                      </td>
                      <td className='px-4 py-3 text-muted-foreground'>
                        {t(`status.syncPhase.${run.phase}`, {
                          defaultValue: run.phase,
                        })}
                      </td>
                      <td className='px-4 py-3'>
                        <div>
                          {t('settings.syncLogs.messages', {
                            defaultValue: '{{count}} messages',
                            count: run.processedMessages,
                          })}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {(run.pendingMessages ?? 0) > 0 ? (
                            <p>
                              {t('content.pending', {
                                count: run.pendingMessages,
                              })}
                            </p>
                          ) : null}
                          {t('settings.syncLogs.batches', {
                            defaultValue: '{{count}} batches',
                            count: run.processedPages,
                          })}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-muted-foreground'>
                        {formatTimestamp(run.createdAt)}
                      </td>
                      <td className='px-4 py-3 text-muted-foreground'>
                        {run.completedAt
                          ? formatTimestamp(run.completedAt)
                          : t('settings.syncLogs.notCompleted', {
                              defaultValue: '—',
                            })}
                      </td>
                      <td className='max-w-64 px-4 py-3 text-xs text-muted-foreground'>
                        {run.error ? (
                          <div className='space-y-1'>
                            <span className='block text-destructive'>
                              {run.error.code}
                            </span>
                            <span className='block'>
                              <MailErrorDescription error={run.error} />
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <MailPagination
            page={page}
            total={total}
            pageSize={pageSize}
            onPageSizeChange={changePageSize}
            hasNext={hasNext}
            disabled={loading}
            onPageChange={changePage}
          />
        </Card>
      </div>
    </section>
  );
}

function syncStatusTone(
  status: MailSyncRunView['status'],
): 'success' | 'danger' | 'info' | 'warning' {
  if (status === 'partial') return 'warning';
  if (status === 'completed') return 'success';
  if (status === 'failed' || status === 'cancelled') return 'danger';
  return 'info';
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
