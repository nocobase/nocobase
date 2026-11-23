import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowUpRightIcon,
  EllipsisIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Skeleton } from '#components/ui/skeleton';
import {
  SYSTEM_KEYS_PAGE,
  useApiKeysAdminApi,
  type SystemKey,
} from '../lib/admin-api.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';
import {
  ErrorAlert,
  KeyExpiry,
  KeyScopeSummary,
  LastUsed,
} from '../components/key-parts.js';

const API_KEYS = { type: 'settings', id: 'apiKeys' } as const;

/** What the list's outlet gives a key's pages: a way to refresh the list after a change. */
export interface SystemKeysOutletContext {
  readonly reload: () => void;
}

export default function SystemKeysPage(): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const admin = useApiKeysAdminApi();
  const location = useLocation();
  const { can: mayManage } = useCan({ resource: API_KEYS, action: 'manage' });
  const [search, setSearch] = useState('');
  const [keys, setKeys] = useState<SystemKey[]>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const reload = useCallback(() => {
    setError(undefined);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      admin
        .systemKeys({
          page,
          ...(search.trim() ? { search: search.trim() } : {}),
        })
        .then(
          (found) => {
            if (!active) return;
            const lastPage = Math.max(
              1,
              Math.ceil(found.total / SYSTEM_KEYS_PAGE),
            );
            if (page > lastPage) {
              setPage(lastPage);
              return;
            }
            setError(undefined);
            setKeys(found.data);
            setTotal(found.total);
          },
          (failure: unknown) => {
            if (active) setError(failure);
          },
        );
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [admin, search, page, revision, location.pathname]);
  const pages = Math.max(1, Math.ceil(total / SYSTEM_KEYS_PAGE));
  const shown = keys ?? [];
  return (
    <PageContainer>
      <PageHeader
        title={t('system.title')}
        description={t('system.description')}
        actions={
          <>
            {mayManage && (
              <Button nativeButton={false} render={<Link to='create' />}>
                <PlusIcon aria-hidden />
                {t('system.newKey')}
              </Button>
            )}
            <Popover open={moreOpen} onOpenChange={setMoreOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    aria-label={t('system.more')}
                    title={t('system.more')}
                  />
                }
              >
                <EllipsisIcon aria-hidden />
              </PopoverTrigger>
              <PopoverContent align='end' className='w-auto min-w-36 gap-0 p-1'>
                <Button
                  variant='ghost'
                  className='justify-start'
                  nativeButton={false}
                  render={<Link to='members' />}
                  onClick={() => setMoreOpen(false)}
                >
                  <UsersIcon aria-hidden />
                  {t('system.memberReview')}
                </Button>
                <Button
                  variant='ghost'
                  className='justify-start'
                  nativeButton={false}
                  render={<Link to='rules' />}
                  onClick={() => setMoreOpen(false)}
                >
                  <SlidersHorizontalIcon aria-hidden />
                  {t('system.keyRules')}
                </Button>
              </PopoverContent>
            </Popover>
          </>
        }
      />
      <section className='min-w-0 rounded-xl border bg-card text-card-foreground'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <Input
            value={search}
            placeholder={t('system.search')}
            aria-label={t('system.search')}
            className='max-w-60'
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <Link
            to='/me/api-keys'
            className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline'
          >
            {t('personal.myKeys')}
            <ArrowUpRightIcon aria-hidden className='size-3.5' />
          </Link>
        </div>
        {error ? (
          <div className='p-4'>
            <ErrorAlert error={error} onRetry={reload} />
          </div>
        ) : !keys ? (
          <div className='grid gap-2 p-4'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        ) : shown.length === 0 ? (
          <p className='px-4 py-8 text-center text-sm text-muted-foreground'>
            {search.trim() ? t('members.empty') : t('system.empty')}
          </p>
        ) : (
          <div role='table' className='min-w-0'>
            <div
              role='row'
              className='hidden gap-3 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)]'
            >
              <span role='columnheader'>{t('personal.columns.name')}</span>
              <span role='columnheader'>{t('personal.columns.scope')}</span>
              <span role='columnheader'>{t('system.columns.status')}</span>
              <span role='columnheader'>{t('personal.columns.lastUsed')}</span>
            </div>
            {shown.map((key) => (
              <div
                key={key.identityId}
                role='row'
                data-slot='system-key-row'
                className='grid min-w-0 gap-2 border-t px-4 py-3 text-sm md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)] md:items-center md:gap-3'
              >
                <div role='cell' className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Link
                      to={encodeURIComponent(key.identityId)}
                      className='font-medium break-words hover:underline'
                    >
                      {key.name}
                    </Link>
                    {key.managedBy ? (
                      <Badge variant='secondary'>
                        {t('system.managedTag', { title: key.managedBy.title })}
                      </Badge>
                    ) : null}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {key.owner
                      ? t('system.ownedBy', { name: key.owner.name })
                      : t('system.noOwner')}
                    {' · '}
                    <code className='font-mono'>{key.start ?? '—'}…</code>
                  </div>
                </div>
                <div
                  role='cell'
                  className='flex min-w-0 flex-wrap items-center gap-2'
                >
                  <KeyScopeSummary permissions={key.permissions} />
                </div>
                <div role='cell' className='flex flex-wrap items-center gap-2'>
                  {key.enabled ? (
                    <Badge className='bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'>
                      {t('system.statusEnabled')}
                    </Badge>
                  ) : (
                    <Badge variant='secondary'>{t('common.disabled')}</Badge>
                  )}
                  {key.enabled ? <KeyExpiry expiresAt={key.expiresAt} /> : null}
                </div>
                <div role='cell'>
                  <LastUsed value={key.lastUsedAt} />
                </div>
              </div>
            ))}
            {pages > 1 ? (
              <div className='flex items-center justify-end gap-2 border-t px-4 py-3 text-sm'>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t('members.previous')}
                </Button>
                <span className='text-muted-foreground'>
                  {page} / {pages}
                </span>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                >
                  {t('members.next')}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </section>
      <Outlet context={{ reload } satisfies SystemKeysOutletContext} />
    </PageContainer>
  );
}
