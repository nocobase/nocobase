import { MailSubmissionStatus } from './mail-submission-status.js';
import { MailPagination, MAIL_PAGE_SIZE } from './mail-pagination.js';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  mailErrorMessage,
  type MailSubmissionLogView,
} from '../mail-client.js';
import { useMailClient } from '../runtime.js';
import { MailStatusBadge } from './mail-status-badge.js';
import { MailErrorDescription } from './mail-error-description.js';
import { Button } from './ui/button.js';
import { Card } from './ui/card.js';

export function MailBulkSendLogs(): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<readonly MailSubmissionLogView[]>([]);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(MAIL_PAGE_SIZE);
  const [visiblePage, setVisiblePage] = useState({
    page: 1,
    pageSize: MAIL_PAGE_SIZE,
  });
  const [total, setTotal] = useState<number>();
  const [hasNext, setHasNext] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const actionLockRef = useRef(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (busy) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async (): Promise<void> => {
      try {
        const result = await mail.listSubmissionsPage({
          bulkOnly: true,
          groupByBatch: true,
          page: offset / pageSize + 1,
          pageSize,
        });
        if (!active) return;
        const next = result.items;
        if (offset > 0 && next.length === 0)
          throw new Error(
            t('pagination.unavailable', {
              defaultValue:
                'This page has no records. Choose another page or refresh.',
            }),
          );
        setVisiblePage({ page: offset / pageSize + 1, pageSize });
        const batchIds = [...new Set(next.map((log) => log.batchId ?? log.id))];
        const visibleIds = new Set(batchIds.slice(0, pageSize));
        setTotal(result.total);
        setHasNext(offset + pageSize < result.total);
        setLogs(next.filter((log) => visibleIds.has(log.batchId ?? log.id)));
        setError(undefined);
        if (
          next.some(
            (log) => log.status === 'pending' || log.status === 'submitting',
          )
        ) {
          timer = setTimeout(() => {
            void load();
          }, 5000);
        }
      } catch (cause) {
        if (active)
          setError(
            mailErrorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Mail request failed.',
              }),
            ),
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [mail, refresh, offset, pageSize, busy, t]);

  const act = async (
    action: 'retry' | 'cancel',
    rows: readonly MailSubmissionLogView[],
  ): Promise<void> => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setBusy(true);
    setActionError(undefined);
    try {
      for (const row of rows) {
        const updated =
          action === 'retry'
            ? await mail.retrySubmission(row.id)
            : await mail.cancelSubmission(row.id);
        setLogs((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }
      setRefresh((value) => value + 1);
    } catch (cause) {
      setActionError(
        mailErrorMessage(
          cause,
          t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
        ),
      );
    } finally {
      actionLockRef.current = false;
      setBusy(false);
    }
  };

  const batches = new Map<string, MailSubmissionLogView[]>();
  for (const log of logs) {
    const key = log.batchId ?? log.id;
    const batch = batches.get(key) ?? [];
    batch.push(log);
    batches.set(key, batch);
  }
  return (
    <Card className='rounded-2xl bg-background p-6 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-lg font-semibold'>
          {t('dev.bulkSend.logsTitle', { defaultValue: 'Bulk send logs' })}
        </h2>
        <div className='flex gap-2'>
          <Button
            disabled={busy || loading}
            onClick={() => {
              setLoading(true);
              setRefresh((value) => value + 1);
            }}
            variant='outline'
          >
            {t('actions.refresh', { defaultValue: 'Refresh' })}
          </Button>
        </div>
      </div>
      <p className='mt-2 text-sm text-muted-foreground'>
        {t('dev.bulkSend.logsHelp', {
          defaultValue:
            'Expand a batch to view the sending result for each recipient. Pending statuses refresh automatically. Provider acceptance does not mean the recipient has received the message.',
        })}
      </p>
      {error || actionError ? (
        <p role='alert' className='mt-3 text-sm text-destructive'>
          {actionError ?? error}
        </p>
      ) : null}
      {loading ? (
        <p role='status' className='mt-4 text-sm text-muted-foreground'>
          {t('dev.bulkSend.logsLoading', {
            defaultValue: 'Loading send logs…',
          })}
        </p>
      ) : logs.length === 0 ? (
        <p className='mt-4 text-sm text-muted-foreground'>
          {t('settings.sendLogs.emptyTitle', { defaultValue: 'No send logs' })}
        </p>
      ) : (
        <div className='mt-4 overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='border-b text-left text-xs text-muted-foreground'>
              <tr>
                <th className='px-3 py-2 font-medium'>
                  {t('dev.bulkSend.batch', {
                    defaultValue: 'Batch / recipient',
                  })}
                </th>
                <th className='px-3 py-2 font-medium'>
                  {t('dev.bulkSend.subject', { defaultValue: 'Subject' })}
                </th>
                <th className='px-3 py-2 font-medium'>
                  {t('dev.bulkSend.status', { defaultValue: 'Status' })}
                </th>
                <th className='px-3 py-2 font-medium'>
                  {t('settings.sendLogs.updatedAt', {
                    defaultValue: 'Updated at',
                  })}
                </th>
                <th className='px-3 py-2 font-medium'>
                  {t('dev.bulkSend.recipientCount', {
                    defaultValue: 'Recipients',
                  })}{' '}
                  /{' '}
                  {t('dev.bulkSend.submission', { defaultValue: 'Submission' })}
                </th>
                <th className='px-3 py-2 font-medium'>
                  {t('dev.bulkSend.logActions', { defaultValue: 'Actions' })}
                </th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {[...batches].map(([batchId, rows]) => {
                const first = rows[0];
                const isExpanded = expanded.has(batchId);
                const retryable = rows.filter((row) => row.canRetry);
                const cancellable = rows.filter((row) => row.canCancel);
                const statuses = [...new Set(rows.map((row) => row.status))];
                const updatedAt = rows.reduce(
                  (latest, row) =>
                    row.updatedAt > latest ? row.updatedAt : latest,
                  first.updatedAt,
                );
                return (
                  <Fragment key={batchId}>
                    <tr className='bg-muted/40 align-top'>
                      <td className='px-3 py-3'>
                        <Button
                          variant='ghost'
                          aria-expanded={isExpanded}
                          aria-label={`${t(isExpanded ? 'dev.bulkSend.collapseBatch' : 'dev.bulkSend.expandBatch', { defaultValue: isExpanded ? 'Collapse batch' : 'Expand batch' })}: ${first.subject ?? '—'}`}
                          onClick={() => {
                            setExpanded((current) => {
                              const next = new Set(current);
                              if (next.has(batchId)) next.delete(batchId);
                              else next.add(batchId);
                              return next;
                            });
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown aria-hidden className='size-4' />
                          ) : (
                            <ChevronRight aria-hidden className='size-4' />
                          )}
                          {new Date(first.createdAt).toLocaleString()}
                        </Button>
                      </td>
                      <td className='break-words px-3 py-3 font-medium'>
                        {first.subject ?? '—'}
                      </td>
                      <td className='px-3 py-3'>
                        <div className='flex flex-wrap gap-2'>
                          {statuses.map((status) => (
                            <MailStatusBadge
                              key={status}
                              label={`${t(`status.submission.${status}`, { defaultValue: status })} ${rows.filter((row) => row.status === status).length}`}
                              tone={
                                status === 'accepted'
                                  ? 'success'
                                  : status === 'failed' || status === 'unknown'
                                    ? 'danger'
                                    : 'info'
                              }
                            />
                          ))}
                        </div>
                      </td>
                      <td className='px-3 py-3 text-xs text-muted-foreground'>
                        {new Date(updatedAt).toLocaleString()}
                      </td>
                      <td className='px-3 py-3'>{rows.length}</td>
                      <td className='px-3 py-3'>
                        <div className='flex flex-wrap gap-2'>
                          {retryable.length > 0 ? (
                            <Button
                              disabled={busy}
                              variant='outline'
                              onClick={() => {
                                void act('retry', retryable);
                              }}
                            >
                              {t('dev.bulkSend.retryFailed', {
                                defaultValue: 'Retry failed',
                              })}
                            </Button>
                          ) : null}
                          {cancellable.length > 0 ? (
                            <Button
                              disabled={busy}
                              variant='outline'
                              onClick={() => {
                                void act('cancel', cancellable);
                              }}
                            >
                              {t('dev.bulkSend.cancelBatch', {
                                defaultValue: 'Cancel pending messages',
                              })}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {isExpanded
                      ? rows.map((log) => (
                          <tr key={log.id} className='align-top'>
                            <td className='break-words py-3 pl-9 pr-3'>
                              {log.recipients
                                ?.map((recipient) => recipient.address)
                                .join(', ') || '—'}
                            </td>
                            <td className='break-words px-3 py-3'>
                              <span className='text-muted-foreground'>—</span>
                            </td>
                            <td className='px-3 py-3'>
                              <MailSubmissionStatus submission={log} />
                            </td>
                            <td className='px-3 py-3 text-xs text-muted-foreground'>
                              {new Date(log.updatedAt).toLocaleString()}
                              {log.status === 'pending' && log.scheduledAt ? (
                                <div>
                                  {t('dev.bulkSend.scheduledAt', {
                                    defaultValue: 'Send later',
                                  })}
                                  : {new Date(log.scheduledAt).toLocaleString()}
                                </div>
                              ) : null}
                            </td>
                            <td className='max-w-64 break-all px-3 py-3 text-xs text-muted-foreground'>
                              <div>{log.id}</div>
                              {log.providerMessageId ? (
                                <div>{log.providerMessageId}</div>
                              ) : null}
                              {log.error ? (
                                <div className='space-y-1 text-xs'>
                                  <div className='text-destructive'>
                                    {log.error.code}
                                  </div>
                                  <div className='text-muted-foreground'>
                                    <MailErrorDescription error={log.error} />
                                  </div>
                                </div>
                              ) : null}
                            </td>
                            <td className='px-3 py-3'>
                              {log.canRetry ? (
                                <Button
                                  disabled={busy}
                                  variant='outline'
                                  onClick={() => {
                                    void act('retry', [log]);
                                  }}
                                >
                                  {t('dev.bulkSend.retry', {
                                    defaultValue: 'Retry',
                                  })}
                                </Button>
                              ) : null}
                              {log.canCancel ? (
                                <Button
                                  disabled={busy}
                                  variant='outline'
                                  onClick={() => {
                                    void act('cancel', [log]);
                                  }}
                                >
                                  {t('dev.bulkSend.cancelSend', {
                                    defaultValue: 'Cancel sending',
                                  })}
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        ))
                      : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <MailPagination
        page={visiblePage.page}
        total={total}
        pageSize={visiblePage.pageSize}
        onPageSizeChange={(size) => {
          setLoading(true);
          setExpanded(new Set());
          setActionError(undefined);
          setError(undefined);
          setPageSize(size);
          setOffset(0);
          setRefresh((value) => value + 1);
        }}
        hasNext={hasNext}
        disabled={busy || loading}
        onPageChange={(page) => {
          setLoading(true);
          setExpanded(new Set());
          setActionError(undefined);
          setPageSize(visiblePage.pageSize);
          setOffset((page - 1) * visiblePage.pageSize);
          setRefresh((value) => value + 1);
        }}
      />
    </Card>
  );
}
