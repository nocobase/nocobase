import { useRealtimeRefresh } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import { MAIL_REALTIME_TOPIC } from '../../shared/realtime.js';
import {
  MailLabelManager,
  MailSignatureManager,
  MailTemplateManager,
} from '../components/index.js';
import {
  MailLogPagination,
  MailOwnSubmissionsTable,
  MailSyncRunsTable,
} from '../components/mail-log-tables.js';
import { useMailLogPage } from '../hooks/use-mail-log-page.js';
import { MailPageTabs } from '../components/mail-page-tabs.js';
import { useMailPageTab } from '../hooks/use-mail-page-tab.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Button } from '../components/ui/button.js';
import { Card } from '../components/ui/card.js';
import {
  mailErrorMessage,
  type MailAccountView,
  type MailSubmissionLogView,
  type MailSyncRunView,
} from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { useMailClient } from '../runtime.js';
import MailAccountsPage from './mail-accounts-page.js';

const TABS = [
  'accounts',
  'signatures',
  'templates',
  'labels',
  'activity',
] as const;

/**
 * Personal settings › Integrations › Mail accounts (route `mailAccounts`): the signed-in person's mailboxes, signatures,
 * templates, labels and their own sync and send history. OAuth authorization returns here by default.
 */
export default function MailAccountsSettingsPage(): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [tab, setTab] = useMailPageTab(TABS, 'accounts');
  return (
    <PageContainer>
      <PageHeader
        title={t('pages.accounts.title', { defaultValue: 'Mail accounts' })}
        description={t('pages.accounts.description', {
          defaultValue:
            'Connect your mailboxes to send and receive in Mail. Only you can see your mail; people with Team mail access can read it without changing it.',
        })}
      />
      <MailPageTabs
        label={t('pages.accounts.title', { defaultValue: 'Mail accounts' })}
        onChange={setTab}
        tabs={TABS.map((key) => ({
          key,
          label: t(`pages.accounts.tabs.${key}`, { defaultValue: key }),
        }))}
        value={tab}
      />
      {tab === 'accounts' ? <MailAccountsPage embedded /> : null}
      {tab === 'signatures' ? <SignaturesTab /> : null}
      {tab === 'templates' ? (
        <Card className='p-4'>
          <MailTemplateManager />
        </Card>
      ) : null}
      {tab === 'labels' ? (
        <Card className='p-4'>
          <MailLabelManager />
        </Card>
      ) : null}
      {tab === 'activity' ? <ActivityTab /> : null}
    </PageContainer>
  );
}

function useOwnAccounts(): {
  readonly accounts: readonly MailAccountView[];
  readonly error?: string;
} {
  const mail = useMailClient();
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [accounts, setAccounts] = useState<readonly MailAccountView[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void mail.listAccounts().then(
      (next) => {
        if (active) setAccounts(next);
      },
      (cause: unknown) => {
        if (active)
          setError(
            mailErrorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Mail request failed.',
              }),
            ),
          );
      },
    );
    return () => {
      active = false;
    };
  }, [mail, t]);
  return { accounts, error };
}

function SignaturesTab(): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const { accounts, error: loadError } = useOwnAccounts();
  const [error, setError] = useState<string>();
  return (
    <Card className='space-y-4 p-4'>
      {error || loadError ? (
        <p className='text-sm text-destructive' role='alert'>
          {error ?? loadError}
        </p>
      ) : null}
      {accounts.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('dev.connectedAccountsEmptyDescription', {
            defaultValue:
              'Select Connect account to connect your first mailbox.',
          })}
        </p>
      ) : (
        <MailSignatureManager accounts={accounts} onError={setError} />
      )}
    </Card>
  );
}

/** The person's own sends (scheduled and bulk ones by batch) and synchronizations, with retry and cancel. */
function ActivityTab(): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const { accounts } = useOwnAccounts();
  const [kind, setKind] = useState<'sends' | 'syncs'>('sends');
  const [busyId, setBusyId] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const accountLabels = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.address])),
    [accounts],
  );
  const loadSubmissions = useCallback(
    (page: number, pageSize: number) =>
      mail.listSubmissionsPage({ page, pageSize, groupByBatch: true }),
    [mail],
  );
  const loadRuns = useCallback(
    (page: number, pageSize: number) =>
      mail.listSyncRunsPage({ page, pageSize }),
    [mail],
  );
  const submissions = useMailLogPage(loadSubmissions);
  const runs = useMailLogPage(loadRuns);
  useRealtimeRefresh(MAIL_REALTIME_TOPIC, () => {
    submissions.reload();
    runs.reload();
  });
  const act = (id: string, action: () => Promise<unknown>): void => {
    setBusyId(id);
    setActionError(undefined);
    void action()
      .then(() => (kind === 'sends' ? submissions.reload() : runs.reload()))
      .catch((cause: unknown) =>
        setActionError(
          mailErrorMessage(
            cause,
            t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
          ),
        ),
      )
      .finally(() => setBusyId(undefined));
  };
  const accountLabel = (accountId: string) =>
    accountLabels.get(accountId) ?? '—';
  const current = kind === 'sends' ? submissions : runs;
  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        {(['sends', 'syncs'] as const).map((value) => (
          <Button
            aria-pressed={kind === value}
            key={value}
            onClick={() => setKind(value)}
            variant={kind === value ? 'default' : 'outline'}
          >
            {t(`pages.activity.${value}`, { defaultValue: value })}
          </Button>
        ))}
      </div>
      {current.error || actionError ? (
        <p className='px-4 pt-3 text-sm text-destructive' role='alert'>
          {actionError ?? current.error}
        </p>
      ) : null}
      {kind === 'sends' ? (
        <MailOwnSubmissionsTable
          accountLabel={accountLabel}
          actions={{
            busyId,
            onRetry: (submission: MailSubmissionLogView) =>
              act(submission.id, () => mail.retrySubmission(submission.id)),
            onCancel: (submission: MailSubmissionLogView) =>
              act(submission.id, () => mail.cancelSubmission(submission.id)),
          }}
          loading={submissions.loading}
          submissions={submissions.items}
        />
      ) : (
        <MailSyncRunsTable
          accountLabel={accountLabel}
          actions={{
            busyId,
            onRetry: (run: MailSyncRunView) =>
              act(run.id, () => mail.retrySyncRun(run.id)),
            onCancel: (run: MailSyncRunView) =>
              act(run.id, () => mail.cancelSyncRun(run.id)),
          }}
          loading={runs.loading}
          runs={runs.items}
        />
      )}
      <MailLogPagination
        loading={current.loading}
        onPageChange={current.setPage}
        onPageSizeChange={current.setPageSize}
        page={current.page}
        pageSize={current.pageSize}
        total={current.total}
      />
    </Card>
  );
}
