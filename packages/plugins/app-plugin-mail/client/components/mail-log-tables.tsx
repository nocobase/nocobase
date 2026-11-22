import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement, type ReactNode } from 'react';

import type {
  MailManagedSubmissionView,
  MailPublicError,
  MailSubmissionLogView,
  MailSyncRunView,
} from '../mail-client.js';
import { mailErrorDescription } from '../lib/mail-error-description.js';
import { formatMailDateTime } from '../lib/mail-format.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { submissionTone, syncRunTone } from '../lib/mail-log-tone.js';
import { MailPagination } from './mail-pagination.js';
import { MailStatusBadge } from './mail-status-badge.js';
import { Button } from './ui/button.js';

/** Why a run or a submission failed, in words, with its code. */
export function MailErrorReason({
  error,
}: {
  readonly error?: MailPublicError;
}): ReactElement | null {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  if (!error) return null;
  const description = mailErrorDescription(error);
  return (
    <span className='text-xs text-muted-foreground'>
      {description
        ? t(description.key, { defaultValue: description.defaultValue })
        : null}{' '}
      <code className='rounded bg-muted px-1'>{error.code}</code>
    </span>
  );
}

function LogTable({
  headers,
  children,
  empty,
  loading,
}: {
  readonly headers: readonly {
    readonly key: string;
    readonly label: ReactNode;
  }[];
  readonly children: ReactNode;
  readonly empty: boolean;
  readonly loading: boolean;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[720px] text-left text-sm'>
        <thead className='border-b bg-muted/30 text-xs text-muted-foreground'>
          <tr>
            {headers.map((header) => (
              <th className='px-4 py-3 font-medium' key={header.key}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-y'>
          {empty ? (
            <tr>
              <td
                className='px-4 py-10 text-center text-muted-foreground'
                colSpan={headers.length}
              >
                {loading
                  ? t('pages.loading', { defaultValue: 'Loading…' })
                  : t('pages.empty', { defaultValue: 'Nothing to show.' })}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface MailLogActions<T> {
  readonly busyId?: string;
  readonly onRetry?: (item: T) => void;
  readonly onCancel?: (item: T) => void;
}

function LogActions({
  busy,
  canRetry,
  canCancel,
  onRetry,
  onCancel,
}: {
  readonly busy: boolean;
  readonly canRetry: boolean;
  readonly canCancel: boolean;
  readonly onRetry: () => void;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  return (
    <div className='flex justify-end gap-2'>
      {canRetry ? (
        <Button disabled={busy} onClick={onRetry} variant='outline'>
          {t('pages.logs.retry', { defaultValue: 'Retry' })}
        </Button>
      ) : null}
      {canCancel ? (
        <Button disabled={busy} onClick={onCancel} variant='outline'>
          {t('pages.logs.cancel', { defaultValue: 'Cancel' })}
        </Button>
      ) : null}
    </div>
  );
}

/** Sync runs, newest first: when, which account, how, the result and why it failed. */
export function MailSyncRunsTable({
  runs,
  accountLabel,
  loading,
  actions,
}: {
  readonly runs: readonly MailSyncRunView[];
  readonly accountLabel: (accountId: string) => ReactNode;
  readonly loading: boolean;
  readonly actions?: MailLogActions<MailSyncRunView>;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  return (
    <LogTable
      empty={runs.length === 0}
      headers={[
        {
          key: 'started',
          label: t('pages.logs.started', { defaultValue: 'Started' }),
        },
        {
          key: 'account',
          label: t('pages.logs.account', { defaultValue: 'Account' }),
        },
        { key: 'mode', label: t('pages.logs.mode', { defaultValue: 'Mode' }) },
        {
          key: 'result',
          label: t('pages.logs.result', { defaultValue: 'Result' }),
        },
        {
          key: 'detail',
          label: t('pages.logs.detail', { defaultValue: 'Detail' }),
        },
        { key: 'actions', label: '' },
      ]}
      loading={loading}
    >
      {runs.map((run) => (
        <tr className='align-top' data-slot='mail-sync-run-row' key={run.id}>
          <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
            {formatMailDateTime(run.createdAt)}
          </td>
          <td className='px-4 py-3'>{accountLabel(run.accountId)}</td>
          <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
            {run.mode === 'initial'
              ? t('pages.logs.initial', { defaultValue: 'First sync' })
              : t('pages.logs.incremental', { defaultValue: 'Incremental' })}
          </td>
          <td className='px-4 py-3'>
            <MailStatusBadge
              label={t(`status.sync.${run.status}`, {
                defaultValue: run.status,
              })}
              tone={syncRunTone(run.status)}
            />
          </td>
          <td className='px-4 py-3'>
            {run.error ? (
              <MailErrorReason error={run.error} />
            ) : (
              <span className='text-xs text-muted-foreground'>
                {t('pages.logs.processed', {
                  count: run.processedMessages,
                  defaultValue: '{{count}} messages',
                })}
              </span>
            )}
          </td>
          <td className='px-4 py-3'>
            {actions ? (
              <LogActions
                busy={actions.busyId === run.id}
                canCancel={
                  run.canManage !== false &&
                  Boolean(actions.onCancel) &&
                  (run.status === 'pending' || run.status === 'running')
                }
                canRetry={
                  run.canManage !== false &&
                  Boolean(actions.onRetry) &&
                  (run.status === 'failed' || run.status === 'cancelled')
                }
                onCancel={() => actions.onCancel?.(run)}
                onRetry={() => actions.onRetry?.(run)}
              />
            ) : null}
          </td>
        </tr>
      ))}
    </LogTable>
  );
}

/** One entry of the caller's send history: a single send, or every recipient of one bulk send. */
interface OwnSubmissionEntry {
  readonly key: string;
  readonly submissions: readonly MailSubmissionLogView[];
}

/** Groups the recipients of each bulk send, which the grouped history lists one after another, into one entry. */
function ownSubmissionEntries(
  submissions: readonly MailSubmissionLogView[],
): readonly OwnSubmissionEntry[] {
  const entries: { key: string; submissions: MailSubmissionLogView[] }[] = [];
  for (const submission of submissions) {
    const last = entries.at(-1);
    if (
      submission.batchId !== undefined &&
      last?.key === `batch:${submission.batchId}`
    )
      last.submissions.push(submission);
    else
      entries.push({
        key:
          submission.batchId !== undefined
            ? `batch:${submission.batchId}`
            : submission.id,
        submissions: [submission],
      });
  }
  return entries;
}

/**
 * The caller's own sends: subject, recipients and the result, with retry and cancel. A bulk send is one row, with its
 * recipients' results counted, and opens to a row per recipient, each with its own retry and cancel.
 */
export function MailOwnSubmissionsTable({
  submissions,
  accountLabel,
  loading,
  actions,
}: {
  readonly submissions: readonly MailSubmissionLogView[];
  readonly accountLabel: (accountId: string) => ReactNode;
  readonly loading: boolean;
  readonly actions: MailLogActions<MailSubmissionLogView>;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const row = (
    submission: MailSubmissionLogView,
    nested = false,
  ): ReactElement => (
    <tr
      className={nested ? 'align-top bg-muted/20' : 'align-top'}
      data-slot='mail-submission-row'
      key={submission.id}
    >
      <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
        {nested
          ? null
          : formatMailDateTime(submission.scheduledAt ?? submission.createdAt)}
      </td>
      <td className='max-w-80 px-4 py-3'>
        {nested ? null : (
          <p className='truncate font-medium'>
            {submission.subject ||
              t('workspace.noSubject', { defaultValue: '(no subject)' })}
          </p>
        )}
        <MailErrorReason error={submission.error} />
      </td>
      <td className='max-w-60 truncate px-4 py-3 text-muted-foreground'>
        {(submission.recipients ?? [])
          .map((recipient) => recipient.address)
          .join(', ') || '—'}
      </td>
      <td className='px-4 py-3'>
        <SubmissionStatus
          status={submission.status}
          scheduledAt={submission.scheduledAt}
        />
      </td>
      <td className='px-4 py-3 text-muted-foreground'>
        {nested ? null : accountLabel(submission.accountId)}
      </td>
      <td className='px-4 py-3'>
        <LogActions
          busy={actions.busyId === submission.id}
          canCancel={submission.canCancel === true}
          canRetry={submission.canRetry === true}
          onCancel={() => actions.onCancel?.(submission)}
          onRetry={() => actions.onRetry?.(submission)}
        />
      </td>
    </tr>
  );
  return (
    <LogTable
      empty={submissions.length === 0}
      headers={[
        { key: 'time', label: t('pages.logs.time', { defaultValue: 'Time' }) },
        {
          key: 'subject',
          label: t('pages.logs.subject', { defaultValue: 'Subject' }),
        },
        {
          key: 'recipients',
          label: t('pages.logs.recipients', { defaultValue: 'Recipients' }),
        },
        {
          key: 'result',
          label: t('pages.logs.result', { defaultValue: 'Result' }),
        },
        {
          key: 'account',
          label: t('pages.logs.account', { defaultValue: 'Account' }),
        },
        { key: 'actions', label: '' },
      ]}
      loading={loading}
    >
      {ownSubmissionEntries(submissions).flatMap((entry) => {
        const [first] = entry.submissions;
        if (first.batchId === undefined) return [row(first)];
        const open = expanded.has(entry.key);
        const statuses = new Map<string, MailSubmissionLogView>();
        for (const submission of entry.submissions)
          if (!statuses.has(submission.status))
            statuses.set(submission.status, submission);
        return [
          <tr
            className='align-top'
            data-slot='mail-submission-batch'
            key={entry.key}
          >
            <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
              {formatMailDateTime(first.scheduledAt ?? first.createdAt)}
            </td>
            <td className='max-w-80 px-4 py-3'>
              <p className='truncate font-medium'>
                {first.subject ||
                  t('workspace.noSubject', { defaultValue: '(no subject)' })}
              </p>
              <p className='text-xs text-muted-foreground'>
                {t('pages.logs.bulk', { defaultValue: 'Bulk send' })}
              </p>
            </td>
            <td className='px-4 py-3 text-muted-foreground'>
              {t('pages.logs.bulkCount', {
                defaultValue: `${entry.submissions.length} (bulk)`,
                count: entry.submissions.length,
              })}
            </td>
            <td className='px-4 py-3'>
              <div className='flex flex-wrap gap-1'>
                {[...statuses].map(([status, submission]) => (
                  <span className='flex items-center gap-1' key={status}>
                    <SubmissionStatus
                      status={submission.status}
                      scheduledAt={submission.scheduledAt}
                    />
                    {statuses.size > 1 ? (
                      <span className='text-xs tabular-nums text-muted-foreground'>
                        {
                          entry.submissions.filter(
                            (item) => item.status === status,
                          ).length
                        }
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </td>
            <td className='px-4 py-3 text-muted-foreground'>
              {accountLabel(first.accountId)}
            </td>
            <td className='px-4 py-3'>
              <div className='flex justify-end'>
                <Button
                  aria-expanded={open}
                  onClick={() => toggle(entry.key)}
                  variant='ghost'
                >
                  {open
                    ? t('pages.logs.hideRecipients', {
                        defaultValue: 'Hide recipients',
                      })
                    : t('pages.logs.showRecipients', {
                        defaultValue: 'Show recipients',
                      })}
                </Button>
              </div>
            </td>
          </tr>,
          ...(open
            ? entry.submissions.map((submission) => row(submission, true))
            : []),
        ];
      })}
    </LogTable>
  );
}

/** Every member's sends for the Mail settings page: no subject, no body, no addresses. */
export function MailManagedSubmissionsTable({
  submissions,
  accountLabel,
  loading,
  actions,
}: {
  readonly submissions: readonly MailManagedSubmissionView[];
  readonly accountLabel: (accountId: string) => ReactNode;
  readonly loading: boolean;
  readonly actions: MailLogActions<MailManagedSubmissionView>;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  return (
    <LogTable
      empty={submissions.length === 0}
      headers={[
        { key: 'time', label: t('pages.logs.time', { defaultValue: 'Time' }) },
        {
          key: 'accountMember',
          label: t('pages.logs.accountMember', {
            defaultValue: 'Account · member',
          }),
        },
        {
          key: 'recipientCount',
          label: t('pages.logs.recipientCount', { defaultValue: 'Recipients' }),
        },
        {
          key: 'result',
          label: t('pages.logs.result', { defaultValue: 'Result' }),
        },
        {
          key: 'reason',
          label: t('pages.logs.reason', { defaultValue: 'Reason' }),
        },
        { key: 'actions', label: '' },
      ]}
      loading={loading}
    >
      {submissions.map((submission) => (
        <tr
          className='align-top'
          data-slot='mail-managed-submission-row'
          key={submission.id}
        >
          <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
            {formatMailDateTime(submission.scheduledAt ?? submission.createdAt)}
          </td>
          <td className='px-4 py-3'>{accountLabel(submission.accountId)}</td>
          <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
            {submission.bulk
              ? t('pages.logs.bulkCount', {
                  count: submission.recipientCount,
                  defaultValue: '{{count}} (bulk)',
                })
              : submission.recipientCount}
          </td>
          <td className='px-4 py-3'>
            <SubmissionStatus
              status={submission.status}
              scheduledAt={submission.scheduledAt}
            />
          </td>
          <td className='px-4 py-3'>
            <MailErrorReason error={submission.error} />
          </td>
          <td className='px-4 py-3'>
            <LogActions
              busy={actions.busyId === submission.id}
              canCancel={
                submission.canCancel === true && Boolean(actions.onCancel)
              }
              canRetry={
                submission.canRetry === true && Boolean(actions.onRetry)
              }
              onCancel={() => actions.onCancel?.(submission)}
              onRetry={() => actions.onRetry?.(submission)}
            />
          </td>
        </tr>
      ))}
    </LogTable>
  );
}

function SubmissionStatus({
  status,
  scheduledAt,
}: {
  readonly status: string;
  readonly scheduledAt?: string;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  return (
    <MailStatusBadge
      label={
        status === 'pending' && scheduledAt
          ? t('pages.logs.scheduled', { defaultValue: 'Scheduled' })
          : t(`status.submission.${status}`, { defaultValue: status })
      }
      tone={submissionTone(status)}
    />
  );
}

/** Pagination under a log table. */
export function MailLogPagination({
  page,
  pageSize,
  total,
  hasNext,
  maxPage,
  loading,
  onPageChange,
  onPageSizeChange,
}: {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly loading: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  /** For a list paged by token: whether another page follows, and the furthest page reached so far. */
  readonly hasNext?: boolean;
  readonly maxPage?: number;
}): ReactElement {
  return (
    <MailPagination
      disabled={loading}
      hasNext={hasNext ?? page * pageSize < total}
      maxPage={maxPage}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      page={page}
      pageSize={pageSize}
      total={total}
    />
  );
}
