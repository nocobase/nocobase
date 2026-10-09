import {
  mailErrorMessage,
  type MailAccountView,
  type MailSubmissionLogView,
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

interface ActivityState {
  readonly accounts: readonly MailAccountView[];
  readonly submissions: readonly MailSubmissionLogView[];
}

export default function MailExampleActivityPage(): ReactElement {
  return (
    <DemoMailboxGate>
      {(accounts) => <MailExampleActivity accounts={accounts} />}
    </DemoMailboxGate>
  );
}

function MailExampleActivity({
  accounts,
}: {
  readonly accounts: readonly MailAccountView[];
}): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation('@nocobase/app-plugin-mail-example');
  const [activity, setActivity] = useState<ActivityState>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback((): void => {
    setLoading(true);
    setError(undefined);
    void Promise.all([
      mail.listAccounts(),
      mail.listSubmissionsPage({ pageSize: 50 }),
    ])
      .then(([accounts, page]) => {
        setActivity({
          accounts,
          submissions: page.items.filter((submission) =>
            accounts.some((account) => account.id === submission.accountId),
          ),
        });
      })
      .catch((cause: unknown) => {
        setError(mailErrorMessage(cause, t('activity.loadFailed')));
      })
      .finally(() => setLoading(false));
  }, [accounts, mail, t]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const accountLabels = useMemo(
    () => new Map(activity?.accounts.map((item) => [item.id, item.address])),
    [activity?.accounts],
  );

  return (
    <ExamplePageContainer>
      <ExamplePageHeader
        title={t('activity.title')}
        description={t('activity.description')}
        actions={
          <>
            <a
              className='rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted'
              href={resolveAppUrl('/mail-example/workspace')}
            >
              {t('demo.openWorkspace')}
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
        {loading && !activity ? (
          <p className='p-8 text-center text-sm text-muted-foreground'>
            {t('demo.loading')}
          </p>
        ) : activity?.submissions.length ? (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] text-left text-sm'>
              <thead className='border-b bg-muted/40 text-xs text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>
                    {t('activity.subject')}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {t('activity.recipients')}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {t('activity.account')}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {t('activity.status')}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {t('activity.created')}
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {activity.submissions.map((submission) => (
                  <tr className='align-top' key={submission.id}>
                    <td className='max-w-72 px-4 py-4 font-medium'>
                      {submission.subject || t('activity.noSubject')}
                    </td>
                    <td className='max-w-72 px-4 py-4 text-muted-foreground'>
                      {submission.recipients
                        ?.map((recipient) => recipient.address)
                        .join(', ') || '—'}
                    </td>
                    <td className='px-4 py-4 text-muted-foreground'>
                      {accountLabels.get(submission.accountId) ?? '—'}
                    </td>
                    <td className='px-4 py-4'>
                      <span className={statusClass(submission.status)}>
                        {t(`activity.statuses.${submission.status}`, {
                          defaultValue: submission.status,
                        })}
                      </span>
                    </td>
                    <td className='whitespace-nowrap px-4 py-4 text-muted-foreground'>
                      {formatDate(submission.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='p-10 text-center'>
            <p className='font-medium'>{t('activity.emptyTitle')}</p>
            <p className='mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground'>
              {t('activity.emptyDescription')}
            </p>
            <a
              className='mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90'
              href={resolveAppUrl('/mail-example/workspace')}
            >
              {t('demo.openWorkspace')}
            </a>
          </div>
        )}
      </section>
    </ExamplePageContainer>
  );
}

function statusClass(status: string): string {
  if (status === 'accepted') {
    return 'inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300';
  }
  if (status === 'failed') {
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
