import { outgoingMailHtml } from '../lib/mail-pending-delivery.js';
import { MailHtmlBody } from '../components/mail-html-body.js';
import { resolveAppUrl } from '@nocobase/app-client';
import { useState } from 'react';
import { mailErrorMessage } from '../mail-client.js';
import { MailPendingDeliveries } from '../components/mail-pending-deliveries.js';
import { MailSubmissionStatus } from '../components/mail-submission-status.js';
import { RefreshCw } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { Button } from '../components/ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible.js';
import { Card } from '../components/ui/card.js';
import { type MailSubmissionLogView } from '../mail-client.js';
import { useMailLogPage } from '../hooks/use-mail-log-page.js';
import { MailPagination } from '../components/mail-pagination.js';
import { useMailClient } from '../runtime.js';
import { MailErrorDescription } from '../components/mail-error-description.js';

export default function MailSendLogsPage(): ReactElement {
  const mail = useMailClient();
  const [retryError, setRetryError] = useState<string>();
  const { t } = useTranslation();
  const load = useCallback(
    (page: number, pageSize: number) =>
      Promise.all([
        mail.listAccounts(),
        mail.listSubmissionsPage({ page, pageSize }),
      ]),
    [mail],
  );
  const {
    accounts,
    rows: submissions,
    loading,
    error,
    refresh,
    page,
    changePage,
    pageSize,
    changePageSize,
    hasNext,
    total,
  } = useMailLogPage<MailSubmissionLogView>(load);

  const accountLabels = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.address])),
    [accounts],
  );

  return (
    <section className='space-y-4'>
      <MailPendingDeliveries
        accountIds={accounts.map((account) => account.id)}
        onResolved={refresh}
      />
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
        {retryError ? <p role='alert'>{retryError}</p> : null}
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
          ) : submissions.length === 0 ? (
            <div className='p-10 text-center'>
              <p className='font-medium'>
                {t('settings.sendLogs.emptyTitle', {
                  defaultValue: 'No send logs',
                })}
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {t('settings.sendLogs.emptyDescription', {
                  defaultValue:
                    'Submitted messages will create delivery records here.',
                })}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[900px] text-sm'>
                <thead className='border-b bg-muted/50 text-left text-xs text-muted-foreground'>
                  <tr>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.sendLogs.account', {
                        defaultValue: 'Account',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.sendLogs.status', {
                        defaultValue: 'Status',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.sendLogs.submissionId', {
                        defaultValue: 'Submission ID',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.sendLogs.providerMessageId', {
                        defaultValue: 'Provider message ID',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.sendLogs.createdAt', {
                        defaultValue: 'Created at',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.sendLogs.updatedAt', {
                        defaultValue: 'Updated at',
                      })}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t('settings.sendLogs.error', { defaultValue: 'Error' })}
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {submissions.map((submission) => (
                    <tr className='align-top' key={submission.id}>
                      <td className='px-4 py-3 font-medium'>
                        {accountLabels.get(submission.accountId) ??
                          t('settings.sendLogs.unknownAccount', {
                            defaultValue: 'Unknown account',
                          })}
                      </td>
                      <td className='px-4 py-3'>
                        <MailSubmissionStatus submission={submission} />
                      </td>
                      <td className='max-w-56 break-all px-4 py-3 text-xs text-muted-foreground'>
                        {submission.id}
                        {submission.text !== undefined ? (
                          <Collapsible>
                            <CollapsibleTrigger className='cursor-pointer text-left underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring'>
                              {t('workspace.sentContent', {
                                defaultValue: 'Message content',
                              })}
                            </CollapsibleTrigger>
                            <CollapsibleContent className='mt-2 space-y-1'>
                              <p>{submission.subject}</p>
                              <p>
                                {submission.recipients
                                  ?.map((recipient) => recipient.address)
                                  .join(', ')}
                              </p>
                              <p>
                                {submission.cc
                                  ?.map((address) => address.address)
                                  .join(', ')}
                              </p>
                              <p>
                                {submission.bcc
                                  ?.map((address) => address.address)
                                  .join(', ')}
                              </p>
                              {submission.html ? (
                                <MailHtmlBody
                                  message={{
                                    accountId: submission.accountId,
                                    id: submission.id,
                                    attachments: [],
                                    html: outgoingMailHtml(
                                      submission.html,
                                      submission.attachmentIds,
                                      submission.attachmentContentIds,
                                    ),
                                  }}
                                  title={
                                    submission.subject ??
                                    t('workspace.sentContent')
                                  }
                                  collapseQuotes={false}
                                />
                              ) : null}
                              <pre className='whitespace-pre-wrap'>
                                {submission.text}
                              </pre>
                              {submission.attachmentIds?.map((id, index) => (
                                <a
                                  className='block underline'
                                  key={id}
                                  href={resolveAppUrl(
                                    `/api/mail/attachments/${encodeURIComponent(id)}`,
                                  )}
                                  download
                                >
                                  {t('workspace.attachmentNumber', {
                                    number: index + 1,
                                    defaultValue: 'Attachment {{number}}',
                                  })}
                                </a>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ) : null}
                        {submission.canRetry ? (
                          <Button
                            onClick={() => {
                              setRetryError(undefined);
                              void mail
                                .retrySubmission(submission.id)
                                .then(refresh)
                                .catch((error: unknown) =>
                                  setRetryError(
                                    mailErrorMessage(
                                      error,
                                      t('errors.requestFailed'),
                                    ),
                                  ),
                                );
                            }}
                          >
                            {t('actions.retry', { defaultValue: 'Retry' })}
                          </Button>
                        ) : null}
                      </td>
                      <td className='max-w-56 break-all px-4 py-3 text-xs text-muted-foreground'>
                        {submission.providerMessageId ?? '—'}
                      </td>
                      <td className='px-4 py-3 text-muted-foreground'>
                        {formatTimestamp(submission.createdAt)}
                      </td>
                      <td className='px-4 py-3 text-muted-foreground'>
                        {formatTimestamp(submission.updatedAt)}
                      </td>
                      <td className='max-w-64 px-4 py-3 text-xs text-muted-foreground'>
                        {submission.error ? (
                          <div className='space-y-1'>
                            <span className='block text-destructive'>
                              {submission.error.code}
                            </span>
                            <span className='block'>
                              <MailErrorDescription error={submission.error} />
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

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
