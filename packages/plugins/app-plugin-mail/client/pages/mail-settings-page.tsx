import { copyText } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Copy } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  MailLogPagination,
  MailManagedSubmissionsTable,
  MailSyncRunsTable,
} from '../components/mail-log-tables.js';
import { useMailCursorLogPage } from '../hooks/use-mail-log-page.js';
import { MailPageTabs } from '../components/mail-page-tabs.js';
import { useMailPageTab } from '../hooks/use-mail-page-tab.js';
import { MailStatusBadge } from '../components/mail-status-badge.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Button } from '../components/ui/button.js';
import { Card } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { NativeSelect } from '../components/ui/native-select.js';
import { useMailExtensions } from '../extensions.js';
import {
  mailErrorMessage,
  type MailAdminAccountView,
  type MailSettingSource,
  type MailSettingsOverview,
  type MailSettingValue,
} from '../mail-client.js';
import {
  formatMailDateTime,
  MAIL_TIME_WINDOWS,
  mailWindowStart,
  type MailTimeWindow,
} from '../lib/mail-format.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { useMailClient } from '../runtime.js';

const TABS = [
  'providers',
  'accounts',
  'syncRuns',
  'submissions',
  'runtime',
] as const;

const ATTENTION = ['reauthorizationRequired', 'revoked'];

/**
 * System settings › Messages › Mail (route `mailSettings`): the Providers members can connect, every member's accounts,
 * synchronizations and sends, and the runtime configuration. No subject or body of any message is shown, because the
 * server never answers one here. Retrying and cancelling other members' work needs `settings:mail.admin/manage`; the
 * server marks each row it allows.
 */
export default function MailSettingsPage(): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const mail = useMailClient();
  const [tab, setTab] = useMailPageTab(TABS, 'providers');
  const [overview, setOverview] = useState<MailSettingsOverview>();
  const [accounts, setAccounts] = useState<readonly MailAdminAccountView[]>([]);
  const [error, setError] = useState<string>();
  const [accountFilter, setAccountFilter] = useState<string>();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([mail.getSettingsOverview(), mail.listManagedAccounts()])
      .then(([nextOverview, nextAccounts]) => {
        if (!active) return;
        setOverview(nextOverview);
        setAccounts(nextAccounts);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            mailErrorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Mail request failed.',
              }),
            ),
          );
      });
    return () => {
      active = false;
    };
  }, [mail, t, version]);

  const accountLabel = useCallback(
    (accountId: string): ReactNode => {
      const account = accounts.find((item) => item.id === accountId);
      if (!account) return '—';
      return (
        <span className='grid'>
          <span className='font-medium'>{account.address}</span>
          {account.ownerName ? (
            <span className='text-xs text-muted-foreground'>
              {account.ownerName}
            </span>
          ) : null}
        </span>
      );
    },
    [accounts],
  );
  const members = useMemo(() => {
    const names = new Map<string, string>();
    for (const account of accounts)
      names.set(account.userId, account.ownerName ?? account.userId);
    return [...names].sort((left, right) => left[1].localeCompare(right[1]));
  }, [accounts]);

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.settings.title', { defaultValue: 'Mail' })}
        description={t('pages.settings.description', {
          defaultValue:
            'The mail Providers members can connect, and the connection, synchronization and sending status of every account. No message content is shown here. System notification emails are configured in Notifications.',
        })}
      />
      <MailPageTabs
        label={t('pages.settings.title', { defaultValue: 'Mail' })}
        onChange={(key) => {
          setAccountFilter(undefined);
          setTab(key);
        }}
        tabs={TABS.map((key) => ({
          key,
          label: t(`pages.settings.tabs.${key}`, { defaultValue: key }),
        }))}
        value={tab}
      />
      {error ? (
        <p
          className='rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'
          role='alert'
        >
          {error}
        </p>
      ) : null}
      {tab === 'providers' ? <ProvidersTab overview={overview} /> : null}
      {tab === 'accounts' ? (
        <AccountsTab
          members={members}
          onShowRuns={(accountId) => {
            setAccountFilter(accountId);
            setTab('syncRuns');
          }}
          overview={overview}
        />
      ) : null}
      {tab === 'syncRuns' ? (
        <SyncRunsTab
          accountFilter={accountFilter}
          accountLabel={accountLabel}
          members={members}
          onChanged={() => setVersion((value) => value + 1)}
        />
      ) : null}
      {tab === 'submissions' ? (
        <SubmissionsTab accountLabel={accountLabel} members={members} />
      ) : null}
      {tab === 'runtime' ? <RuntimeTab overview={overview} /> : null}
    </PageContainer>
  );
}

function SourceBadge({
  source,
}: {
  readonly source: MailSettingSource | 'config' | 'code';
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  return (
    <MailStatusBadge
      label={t(`pages.settings.sources.${source}`, { defaultValue: source })}
      tone={source === 'default' ? 'neutral' : 'info'}
    />
  );
}

function ProvidersTab({
  overview,
}: {
  readonly overview?: MailSettingsOverview;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const providerTypes = useMailExtensions().providerTypes;
  const callbackUrl = overview?.runtime.oauthCallbackUrl.value ?? '';
  return (
    <Card className='overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[720px] text-left text-sm'>
          <thead className='border-b bg-muted/30 text-xs text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.providers.name', { defaultValue: 'Name' })}
              </th>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.providers.type', { defaultValue: 'Type' })}
              </th>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.providers.capabilities', {
                  defaultValue: 'Capabilities',
                })}
              </th>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.providers.accounts', {
                  defaultValue: 'Accounts',
                })}
              </th>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.providers.source', {
                  defaultValue: 'Source',
                })}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {(overview?.providers ?? []).map((provider) => {
              const registered = providerTypes.get(provider.type);
              const Icon = registered?.icon;
              return (
                <tr
                  className='align-top'
                  data-slot='mail-provider-row'
                  key={`${provider.type}:${provider.name}`}
                >
                  <td className='px-4 py-3 font-medium'>{provider.name}</td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    <span className='inline-flex items-center gap-2'>
                      {Icon ? <Icon className='size-4' /> : null}
                      {registered?.title ?? provider.label}
                      {provider.connection === 'oauth' ? ' (OAuth)' : ''}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap gap-1.5'>
                      {Object.entries(provider.capabilities)
                        .filter(
                          ([name, enabled]) =>
                            enabled && name !== 'receive' && name !== 'send',
                        )
                        .map(([name]) => (
                          <span
                            className='rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground'
                            key={name}
                          >
                            {t(`capabilities.${name}`, { defaultValue: name })}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <span className='inline-flex flex-wrap items-center gap-2'>
                      {provider.accountCount}
                      {provider.attentionCount > 0 ? (
                        <MailStatusBadge
                          label={t('pages.settings.providers.attention', {
                            count: provider.attentionCount,
                            defaultValue: '{{count}} need reauthorization',
                          })}
                          tone='danger'
                        />
                      ) : null}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <SourceBadge source={provider.source} />
                  </td>
                </tr>
              );
            })}
            {overview && overview.providers.length === 0 ? (
              <tr>
                <td
                  className='px-4 py-10 text-center text-muted-foreground'
                  colSpan={5}
                >
                  {t('settings.providers.emptyTitle', {
                    defaultValue: 'No mail providers configured',
                  })}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <details className='border-t px-4 py-3 text-sm'>
        <summary className='cursor-pointer font-medium'>
          {t('pages.settings.providers.howTo', {
            defaultValue: 'How to add a Provider',
          })}
        </summary>
        <p className='mt-2 text-muted-foreground'>
          {t('pages.settings.providers.howToDescription', {
            defaultValue:
              'Add an entry under mail.providers in the application configuration and keep secrets in environment variables. Restart the application to apply it.',
          })}
        </p>
        <pre className='mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs'>
          {`mail:
  providers:
    gmail:
      type: gmail
      clientId: \${GMAIL_CLIENT_ID}
      clientSecret: \${GMAIL_CLIENT_SECRET}`}
        </pre>
        {callbackUrl ? (
          <p className='mt-2 text-muted-foreground'>
            {t('pages.settings.providers.callbackHint', {
              defaultValue:
                'Register this OAuth redirect URL with Google or Microsoft:',
            })}{' '}
            <code className='break-all rounded bg-muted px-1'>
              {callbackUrl}
            </code>
          </p>
        ) : null}
      </details>
    </Card>
  );
}

function AccountsTab({
  members,
  overview,
  onShowRuns,
}: {
  readonly members: readonly (readonly [string, string])[];
  readonly overview?: MailSettingsOverview;
  readonly onShowRuns: (accountId: string) => void;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const mail = useMailClient();
  const [status, setStatus] = useState<'all' | 'attention' | 'suspended'>(
    'all',
  );
  const [provider, setProvider] = useState('');
  const [userId, setUserId] = useState('');
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<readonly MailAdminAccountView[]>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void mail
        .listManagedAccounts({
          ...(status === 'attention'
            ? { statuses: ATTENTION }
            : status === 'suspended'
              ? { statuses: ['suspended'] }
              : {}),
          ...(provider ? { provider } : {}),
          ...(userId ? { userId } : {}),
          ...(query.trim() ? { q: query.trim() } : {}),
        })
        .then((next) => {
          if (active) {
            setAccounts(next);
            setError(undefined);
          }
        })
        .catch((cause: unknown) => {
          if (active)
            setError(
              mailErrorMessage(
                cause,
                t('errors.requestFailed', {
                  defaultValue: 'Mail request failed.',
                }),
              ),
            );
        });
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mail, provider, query, status, t, userId]);
  const counts = overview?.accounts;
  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        {(
          [
            ['all', counts?.total],
            ['attention', counts?.reauthorizationRequired],
            ['suspended', counts?.suspended],
          ] as const
        ).map(([value, count]) => (
          <Button
            aria-pressed={status === value}
            key={value}
            onClick={() => setStatus(value)}
            variant={status === value ? 'default' : 'outline'}
          >
            {t(`pages.settings.accounts.filter.${value}`, {
              defaultValue: value,
            })}
            {count !== undefined ? ` ${count}` : ''}
          </Button>
        ))}
        <NativeSelect
          aria-label={t('pages.settings.accounts.provider', {
            defaultValue: 'Provider',
          })}
          className='w-auto'
          onChange={(event) => setProvider(event.target.value)}
          value={provider}
        >
          <option value=''>
            {t('pages.settings.accounts.allProviders', {
              defaultValue: 'All Providers',
            })}
          </option>
          {(overview?.providers ?? []).map((item) => (
            <option key={`${item.type}:${item.name}`} value={item.name}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        <MemberSelect members={members} onChange={setUserId} value={userId} />
        <Input
          aria-label={t('pages.settings.accounts.search', {
            defaultValue: 'Member or address',
          })}
          className='w-full sm:w-56'
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('pages.settings.accounts.search', {
            defaultValue: 'Member or address',
          })}
          value={query}
        />
      </div>
      {error ? (
        <p className='px-4 pt-3 text-sm text-destructive' role='alert'>
          {error}
        </p>
      ) : null}
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[720px] text-left text-sm'>
          <thead className='border-b bg-muted/30 text-xs text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 font-medium'>
                {t('pages.logs.accountMember', {
                  defaultValue: 'Account · member',
                })}
              </th>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.accounts.provider', {
                  defaultValue: 'Provider',
                })}
              </th>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.accounts.lastSynced', {
                  defaultValue: 'Last synchronized',
                })}
              </th>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.accounts.status', {
                  defaultValue: 'Status',
                })}
              </th>
              <th className='px-4 py-3' />
            </tr>
          </thead>
          <tbody className='divide-y'>
            {(accounts ?? []).map((account) => (
              <tr
                className='align-top'
                data-slot='mail-admin-account-row'
                key={account.id}
              >
                <td className='px-4 py-3'>
                  <p className='font-medium'>{account.address}</p>
                  <p className='text-xs text-muted-foreground'>
                    {account.ownerName ?? account.userId}
                  </p>
                </td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {account.provider.name}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
                  {formatMailDateTime(account.lastSyncedAt)}
                </td>
                <td className='px-4 py-3'>
                  <MailStatusBadge
                    label={
                      account.removalFailed
                        ? t('status.account.removalFailed', {
                            defaultValue: 'Removal failed',
                          })
                        : t(`status.account.${account.status}`, {
                            defaultValue: account.status,
                          })
                    }
                    tone={
                      ATTENTION.includes(account.status)
                        ? 'danger'
                        : account.status === 'active'
                          ? 'success'
                          : 'warning'
                    }
                  />
                </td>
                <td className='px-4 py-3 text-right'>
                  <Button
                    onClick={() => onShowRuns(account.id)}
                    variant='outline'
                  >
                    {t('pages.settings.accounts.showRuns', {
                      defaultValue: 'Sync runs',
                    })}
                  </Button>
                </td>
              </tr>
            ))}
            {accounts?.length === 0 ? (
              <tr>
                <td
                  className='px-4 py-10 text-center text-muted-foreground'
                  colSpan={5}
                >
                  {t('pages.empty', { defaultValue: 'Nothing to show.' })}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className='border-t px-4 py-3 text-xs text-muted-foreground'>
        {t('pages.settings.accounts.note', {
          defaultValue:
            'Administrators cannot authorize or remove members’ accounts. A member reconnects their own account in Personal settings › Mail accounts.',
        })}
      </p>
    </Card>
  );
}

function MemberSelect({
  members,
  value,
  onChange,
}: {
  readonly members: readonly (readonly [string, string])[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  return (
    <NativeSelect
      aria-label={t('pages.member', { defaultValue: 'Member' })}
      className='w-auto'
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value=''>
        {t('pages.allMembers', { defaultValue: 'All members' })}
      </option>
      {members.map(([id, name]) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </NativeSelect>
  );
}

function LogFilters({
  statuses,
  status,
  onStatusChange,
  members,
  userId,
  onUserChange,
  window: timeWindow,
  onWindowChange,
  statusLabel,
}: {
  readonly statuses: readonly string[];
  readonly status: string;
  readonly onStatusChange: (status: string) => void;
  readonly members: readonly (readonly [string, string])[];
  readonly userId: string;
  readonly onUserChange: (userId: string) => void;
  readonly window: MailTimeWindow;
  readonly onWindowChange: (window: MailTimeWindow) => void;
  readonly statusLabel: (status: string) => string;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  return (
    <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
      <NativeSelect
        aria-label={t('pages.logs.result', { defaultValue: 'Result' })}
        className='w-auto'
        onChange={(event) => onStatusChange(event.target.value)}
        value={status}
      >
        <option value=''>
          {t('pages.logs.allResults', { defaultValue: 'All results' })}
        </option>
        {statuses.map((value) => (
          <option key={value} value={value}>
            {statusLabel(value)}
          </option>
        ))}
      </NativeSelect>
      <MemberSelect members={members} onChange={onUserChange} value={userId} />
      <NativeSelect
        aria-label={t('pages.logs.window', { defaultValue: 'Time' })}
        className='w-auto'
        onChange={(event) =>
          onWindowChange(event.target.value as MailTimeWindow)
        }
        value={timeWindow}
      >
        {MAIL_TIME_WINDOWS.map((value) => (
          <option key={value} value={value}>
            {t(`pages.logs.windows.${value}`, { defaultValue: value })}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

function SyncRunsTab({
  accountFilter,
  accountLabel,
  members,
  onChanged,
}: {
  readonly accountFilter?: string;
  readonly accountLabel: (accountId: string) => ReactNode;
  readonly members: readonly (readonly [string, string])[];
  readonly onChanged: () => void;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const mail = useMailClient();
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [timeWindow, setTimeWindow] = useState<MailTimeWindow>('week');
  const [busyId, setBusyId] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const load = useCallback(
    (pageToken: string | undefined, pageSize: number) =>
      mail.listManagedSyncRunsPage({
        pageToken,
        pageSize,
        ...(status
          ? {
              statuses:
                status === 'running' ? ['pending', 'running'] : [status],
            }
          : {}),
        ...(userId ? { userId } : {}),
        ...(accountFilter ? { accountId: accountFilter } : {}),
        from: mailWindowStart(timeWindow),
      }),
    [accountFilter, mail, status, timeWindow, userId],
  );
  const runs = useMailCursorLogPage(load);
  const act = (id: string, action: () => Promise<unknown>): void => {
    setBusyId(id);
    setActionError(undefined);
    void action()
      .then(() => {
        runs.reload();
        onChanged();
      })
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
  return (
    <Card className='overflow-hidden'>
      <LogFilters
        members={members}
        onStatusChange={setStatus}
        onUserChange={setUserId}
        onWindowChange={setTimeWindow}
        status={status}
        statusLabel={(value) =>
          t(`status.sync.${value}`, { defaultValue: value })
        }
        statuses={['failed', 'running', 'completed', 'partial', 'cancelled']}
        userId={userId}
        window={timeWindow}
      />
      {runs.error || actionError ? (
        <p className='px-4 pt-3 text-sm text-destructive' role='alert'>
          {actionError ?? runs.error}
        </p>
      ) : null}
      <MailSyncRunsTable
        accountLabel={accountLabel}
        actions={{
          busyId,
          onRetry: (run) => act(run.id, () => mail.retryManagedSyncRun(run.id)),
          onCancel: (run) =>
            act(run.id, () => mail.cancelManagedSyncRun(run.id)),
        }}
        loading={runs.loading}
        runs={runs.items}
      />
      <MailLogPagination
        hasNext={runs.hasNext}
        loading={runs.loading}
        maxPage={runs.maxPage}
        onPageChange={runs.setPage}
        onPageSizeChange={runs.setPageSize}
        page={runs.page}
        pageSize={runs.pageSize}
        total={runs.total}
      />
    </Card>
  );
}

function SubmissionsTab({
  accountLabel,
  members,
}: {
  readonly accountLabel: (accountId: string) => ReactNode;
  readonly members: readonly (readonly [string, string])[];
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const mail = useMailClient();
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [timeWindow, setTimeWindow] = useState<MailTimeWindow>('week');
  const [busyId, setBusyId] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const load = useCallback(
    (pageToken: string | undefined, pageSize: number) =>
      mail.listManagedSubmissionsPage({
        pageToken,
        pageSize,
        ...(status ? { statuses: [status] } : {}),
        ...(userId ? { userId } : {}),
        from: mailWindowStart(timeWindow),
      }),
    [mail, status, timeWindow, userId],
  );
  const submissions = useMailCursorLogPage(load);
  const act = (id: string, action: () => Promise<unknown>): void => {
    setBusyId(id);
    setActionError(undefined);
    void action()
      .then(() => submissions.reload())
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
  return (
    <Card className='overflow-hidden'>
      <LogFilters
        members={members}
        onStatusChange={setStatus}
        onUserChange={setUserId}
        onWindowChange={setTimeWindow}
        status={status}
        statusLabel={(value) =>
          t(`status.submission.${value}`, { defaultValue: value })
        }
        statuses={['failed', 'unknown', 'pending', 'accepted', 'cancelled']}
        userId={userId}
        window={timeWindow}
      />
      {submissions.error || actionError ? (
        <p className='px-4 pt-3 text-sm text-destructive' role='alert'>
          {actionError ?? submissions.error}
        </p>
      ) : null}
      <MailManagedSubmissionsTable
        accountLabel={accountLabel}
        actions={{
          busyId,
          onRetry: (submission) =>
            act(submission.id, () =>
              mail.retryManagedSubmission(submission.id),
            ),
          onCancel: (submission) =>
            act(submission.id, () =>
              mail.cancelManagedSubmission(submission.id),
            ),
        }}
        loading={submissions.loading}
        submissions={submissions.items}
      />
      <MailLogPagination
        hasNext={submissions.hasNext}
        loading={submissions.loading}
        maxPage={submissions.maxPage}
        onPageChange={submissions.setPage}
        onPageSizeChange={submissions.setPageSize}
        page={submissions.page}
        pageSize={submissions.pageSize}
        total={submissions.total}
      />
    </Card>
  );
}

function RuntimeTab({
  overview,
}: {
  readonly overview?: MailSettingsOverview;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [copied, setCopied] = useState(false);
  if (!overview)
    return (
      <Card className='p-6 text-sm text-muted-foreground'>
        {t('pages.loading', { defaultValue: 'Loading…' })}
      </Card>
    );
  const runtime = overview.runtime;
  const rows: readonly (readonly [
    string,
    MailSettingValue<unknown>,
    ReactNode,
  ])[] = [
    [
      'automaticSyncInterval',
      runtime.automaticSyncIntervalMinutes,
      t('pages.settings.runtime.minutes', {
        count: runtime.automaticSyncIntervalMinutes.value,
        defaultValue: '{{count}} minutes',
      }),
    ],
    ['syncBatchSize', runtime.syncBatchSize, runtime.syncBatchSize.value],
    [
      'oauthCallbackUrl',
      runtime.oauthCallbackUrl,
      <span className='inline-flex flex-wrap items-center gap-2' key='value'>
        <code className='break-all rounded bg-muted px-1'>
          {runtime.oauthCallbackUrl.value}
        </code>
        <Button
          onClick={() => {
            void copyText(runtime.oauthCallbackUrl.value).then(setCopied);
          }}
          variant='outline'
        >
          <Copy aria-hidden='true' className='size-4' />
          {copied
            ? t('pages.settings.runtime.copied', { defaultValue: 'Copied' })
            : t('pages.settings.runtime.copy', { defaultValue: 'Copy' })}
        </Button>
      </span>,
    ],
    [
      'oauthReturnUrl',
      runtime.oauthReturnUrl,
      <code className='break-all rounded bg-muted px-1' key='value'>
        {runtime.oauthReturnUrl.value}
      </code>,
    ],
    [
      'pushWebhook',
      runtime.pushWebhookUrl,
      runtime.pushWebhookUrl.value ? (
        <span className='grid gap-1' key='value'>
          <code className='break-all rounded bg-muted px-1'>
            {runtime.pushWebhookUrl.value}
          </code>
          <span className='text-xs text-muted-foreground'>
            {runtime.pushWebhookSecretConfigured.value
              ? t('pages.settings.runtime.secretConfigured', {
                  defaultValue: 'Secret configured',
                })
              : t('pages.settings.runtime.secretMissing', {
                  defaultValue: 'No secret configured',
                })}
          </span>
        </span>
      ) : (
        t('pages.settings.runtime.notConfigured', {
          defaultValue: 'Not configured',
        })
      ),
    ],
    [
      'jobs',
      runtime.jobs,
      runtime.jobs.value ??
        t('pages.settings.runtime.jobsDefault', {
          defaultValue: 'Follows jobs.default',
        }),
    ],
    [
      'logRetention',
      runtime.logRetentionDays,
      runtime.logRetentionDays.value > 0
        ? t('pages.settings.runtime.days', {
            count: runtime.logRetentionDays.value,
            defaultValue: '{{count}} days',
          })
        : t('pages.settings.runtime.keepForever', {
            defaultValue: 'Kept forever',
          }),
    ],
    [
      'credentialVault',
      runtime.credentialVault,
      runtime.credentialVault.value === 'application'
        ? t('pages.settings.runtime.vaultApplication', {
            defaultValue: 'Registered by the application',
          })
        : t('pages.settings.runtime.vaultBuiltin', {
            defaultValue: 'Built in, in the application database',
          }),
    ],
  ];
  return (
    <Card className='overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[640px] text-left text-sm'>
          <thead className='border-b bg-muted/30 text-xs text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.runtime.setting', {
                  defaultValue: 'Setting',
                })}
              </th>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.runtime.value', {
                  defaultValue: 'Current value',
                })}
              </th>
              <th className='px-4 py-3 font-medium'>
                {t('pages.settings.runtime.effect', {
                  defaultValue: 'What it affects',
                })}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {rows.map(([key, setting, value]) => (
              <tr className='align-top' data-slot='mail-runtime-row' key={key}>
                <td className='px-4 py-3 font-medium'>
                  {t(`pages.settings.runtime.${key}`, { defaultValue: key })}
                </td>
                <td className='px-4 py-3'>
                  <span className='inline-flex flex-wrap items-center gap-2'>
                    {value}
                    <SourceBadge source={setting.source} />
                  </span>
                </td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {t(`pages.settings.runtime.${key}Effect`, {
                    defaultValue: '',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className='border-t px-4 py-3 text-xs text-muted-foreground'>
        {t('pages.settings.runtime.readOnly', {
          defaultValue:
            'Read only: these settings come from config.yml and MAIL_* environment variables and apply after a restart.',
        })}
      </p>
    </Card>
  );
}
