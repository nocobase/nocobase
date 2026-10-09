import {
  mailErrorMessage,
  type MailAccountView,
  type MailMessageSummary,
  useMailClient,
} from '@nocobase/app-plugin-mail/client';
import { resolveAppUrl } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCw, Search } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';

import { DemoMailboxGate } from '../components/demo-mailbox-gate.js';
import {
  ExamplePageContainer,
  ExamplePageHeader,
} from '../components/example-page-layout.js';

const PAGE_SIZE = 20;

interface MailListPage {
  readonly items: readonly MailMessageSummary[];
  readonly total: number;
  readonly nextPageToken?: string;
}

export default function MailExampleAllMessagesPage(): ReactElement {
  return (
    <DemoMailboxGate>
      {(accounts) => <MailExampleAllMessages accounts={accounts} />}
    </DemoMailboxGate>
  );
}

function MailExampleAllMessages({
  accounts,
}: {
  readonly accounts: readonly MailAccountView[];
}): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation('@nocobase/app-plugin-mail-example');
  const [page, setPage] = useState<MailListPage>();
  const [pageIndex, setPageIndex] = useState(0);
  // The message feed is cursor-paged: page N is reached with the token page N - 1 returned.
  const pageTokensRef = useRef<(string | undefined)[]>([undefined]);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const accountLabels = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.address])),
    [accounts],
  );

  const refresh = useCallback((): void => {
    setLoading(true);
    setError(undefined);
    void mail
      .listMessages({
        ...(query ? { q: query } : {}),
        pageToken: pageTokensRef.current[pageIndex],
        pageSize: PAGE_SIZE,
      })
      .then((result) => {
        pageTokensRef.current = [
          ...pageTokensRef.current.slice(0, pageIndex + 1),
          result.nextCursor,
        ];
        setPage({
          items: result.items,
          total: result.total ?? result.items.length,
          nextPageToken: result.nextCursor,
        });
      })
      .catch((cause: unknown) => {
        setError(mailErrorMessage(cause, t('allMail.loadFailed')));
      })
      .finally(() => setLoading(false));
  }, [mail, pageIndex, query, t]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    pageTokensRef.current = [undefined];
    setPageIndex(0);
    setQuery(searchInput.trim());
  };

  const total = page?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrevious = pageIndex > 0;
  const canNext = Boolean(page?.nextPageToken);

  return (
    <ExamplePageContainer>
      <ExamplePageHeader
        title={t('allMail.title')}
        description={t('allMail.description')}
        actions={
          <a
            className='rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted'
            href={resolveAppUrl('/mail-example')}
          >
            {t('navigation.accounts')}
          </a>
        }
      />

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <form className='flex w-full max-w-xl gap-2' onSubmit={submitSearch}>
          <label className='sr-only' htmlFor='mail-example-search'>
            {t('allMail.searchLabel')}
          </label>
          <input
            className='h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring'
            id='mail-example-search'
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            placeholder={t('allMail.searchPlaceholder')}
            value={searchInput}
          />
          <button
            className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90'
            type='submit'
          >
            <Search aria-hidden='true' className='size-4' />
            {t('allMail.search')}
          </button>
        </form>
        <button
          className='inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50'
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
      </div>

      {error ? (
        <p
          className='rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'
          role='alert'
        >
          {error}
        </p>
      ) : null}

      <section className='overflow-hidden rounded-xl border bg-card'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4'>
          <div>
            <h2 className='font-semibold'>{t('allMail.listTitle')}</h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              {t('allMail.resultCount', { count: total })}
            </p>
          </div>
          <p className='text-xs text-muted-foreground'>
            {t('allMail.pageCount', {
              page: Math.min(pageIndex + 1, pageCount),
              pages: pageCount,
            })}
          </p>
        </div>
        {loading && !page ? (
          <p className='p-8 text-center text-sm text-muted-foreground'>
            {t('demo.loading')}
          </p>
        ) : page?.items.length ? (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[900px] text-left text-sm'>
              <thead className='border-b bg-muted/40 text-xs text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>
                    {t('allMail.account')}
                  </th>
                  <th className='px-4 py-3 font-medium'>{t('allMail.from')}</th>
                  <th className='px-4 py-3 font-medium'>
                    {t('allMail.subject')}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {t('allMail.flags')}
                  </th>
                  <th className='px-4 py-3 font-medium'>{t('allMail.date')}</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {page.items.map((message) => (
                  <tr className='align-top' key={message.id}>
                    <td className='whitespace-nowrap px-4 py-4 text-muted-foreground'>
                      {accountLabels.get(message.accountId) ?? '—'}
                    </td>
                    <td className='max-w-56 px-4 py-4'>
                      <p className='truncate font-medium'>
                        {message.from?.name ?? message.from?.address ?? '—'}
                      </p>
                      {message.from?.name ? (
                        <p className='mt-1 truncate text-xs text-muted-foreground'>
                          {message.from.address}
                        </p>
                      ) : null}
                    </td>
                    <td className='max-w-[32rem] px-4 py-4'>
                      <p className='font-medium'>
                        {message.subject || t('activity.noSubject')}
                      </p>
                      <p className='mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground'>
                        {message.preview || t('demo.noPreview')}
                      </p>
                    </td>
                    <td className='px-4 py-4 text-xs text-muted-foreground'>
                      <div className='flex flex-wrap gap-1.5'>
                        {message.read ? null : (
                          <span className='rounded-full bg-primary/10 px-2 py-1 text-primary'>
                            {t('allMail.unread')}
                          </span>
                        )}
                        {message.starred ? (
                          <span className='rounded-full bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-300'>
                            {t('allMail.starred')}
                          </span>
                        ) : null}
                        {message.hasAttachments ? (
                          <span className='rounded-full bg-muted px-2 py-1'>
                            {t('allMail.attachment')}
                          </span>
                        ) : null}
                        {!message.read &&
                        !message.starred &&
                        !message.hasAttachments
                          ? '—'
                          : null}
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-4 py-4 text-muted-foreground'>
                      {formatDate(message.receivedAt ?? message.sentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='p-10 text-center'>
            <p className='font-medium'>{t('allMail.emptyTitle')}</p>
            <p className='mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground'>
              {t('allMail.emptyDescription')}
            </p>
          </div>
        )}
        <div className='flex items-center justify-between border-t px-5 py-4'>
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
      </section>
    </ExamplePageContainer>
  );
}

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}
