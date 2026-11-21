import { useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { PlusIcon } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

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
  ConfirmDialog,
  ErrorAlert,
  KeyExpiry,
  KeyScopeSummary,
  LastUsed,
} from './key-parts.js';
import { SystemFrame } from './system-frame.js';

const API_KEYS = { type: 'settings', id: 'apiKeys' } as const;

/** What the list's outlet gives a key's pages: a way to refresh the list after a change. */
export interface SystemKeysOutletContext {
  readonly reload: () => void;
}

/** System keys, or the managed ones: name, owner or manager, what each can do, status and expiry, last use. */
export function SystemKeyList({
  managed,
}: {
  readonly managed: boolean;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const admin = useApiKeysAdminApi();
  const toaster = useToaster();
  const location = useLocation();
  const { can: mayManage } = useCan({ resource: API_KEYS, action: 'manage' });
  const [search, setSearch] = useState('');
  const [keys, setKeys] = useState<SystemKey[]>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const [disabling, setDisabling] = useState<SystemKey>();
  const reload = useCallback(() => {
    setError(undefined);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      admin
        .systemKeys({
          managed,
          page,
          ...(search.trim() ? { search: search.trim() } : {}),
        })
        .then(
          (found) => {
            if (!active) return;
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
  }, [admin, managed, search, page, revision, location.pathname]);
  const pages = Math.max(1, Math.ceil(total / SYSTEM_KEYS_PAGE));
  const shown = keys ?? [];
  const toggle = async (key: SystemKey, enabled: boolean) => {
    try {
      await admin.setEnabled(key.identityId, enabled);
      toaster.show({
        type: 'success',
        title: enabled ? t('system.enabled') : t('system.disabled'),
      });
      reload();
    } catch {
      toaster.show({ type: 'error', title: t('system.failed') });
    }
  };
  return (
    <SystemFrame
      tab={managed ? 'managed' : 'system'}
      actions={
        !managed && mayManage ? (
          <Button nativeButton={false} render={<Link to='create' />}>
            <PlusIcon aria-hidden />
            {t('system.newKey')}
          </Button>
        ) : null
      }
    >
      {managed ? (
        <p className='text-sm text-muted-foreground'>
          {t('system.managedHint')}
        </p>
      ) : null}
      <section className='min-w-0 rounded-xl border bg-card text-card-foreground'>
        <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
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
            {managed ? t('system.noManaged') : t('system.empty')}
          </p>
        ) : (
          <div role='table' className='min-w-0'>
            <div
              role='row'
              className='hidden gap-3 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[minmax(10rem,1.3fr)_minmax(12rem,1.6fr)_10rem_8rem_10rem]'
            >
              <span role='columnheader'>{t('personal.columns.name')}</span>
              <span role='columnheader'>{t('personal.columns.scope')}</span>
              <span role='columnheader'>{t('system.columns.status')}</span>
              <span role='columnheader'>{t('personal.columns.lastUsed')}</span>
              <span role='columnheader' className='sr-only'>
                {t('personal.open')}
              </span>
            </div>
            {shown.map((key) => (
              <div
                key={key.identityId}
                role='row'
                data-slot='system-key-row'
                className='grid min-w-0 gap-2 border-t px-4 py-3 text-sm md:grid-cols-[minmax(10rem,1.3fr)_minmax(12rem,1.6fr)_10rem_8rem_10rem] md:items-center md:gap-3'
              >
                <div role='cell' className='min-w-0'>
                  <Link
                    to={encodeURIComponent(key.identityId)}
                    className='font-medium break-words hover:underline'
                  >
                    {key.name}
                  </Link>
                  <div className='text-xs text-muted-foreground'>
                    {key.managedBy
                      ? t('system.managedBy', { title: key.managedBy.title })
                      : key.owner
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
                  {key.managedBy ? (
                    <Badge variant='secondary'>
                      {t('system.managedTag', { title: key.managedBy.title })}
                    </Badge>
                  ) : null}
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
                <div
                  role='cell'
                  className='flex flex-wrap gap-2 md:justify-end'
                >
                  <Button
                    size='sm'
                    variant='outline'
                    nativeButton={false}
                    render={<Link to={encodeURIComponent(key.identityId)} />}
                  >
                    {t('personal.open')}
                  </Button>
                  {mayManage ? (
                    key.enabled ? (
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => setDisabling(key)}
                      >
                        {t('system.disable')}
                      </Button>
                    ) : (
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => void toggle(key, true)}
                      >
                        {t('system.enable')}
                      </Button>
                    )
                  ) : null}
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
      <ConfirmDialog
        open={disabling !== undefined}
        title={t('system.disableTitle', { name: disabling?.name ?? '' })}
        description={
          disabling?.managedBy
            ? t('system.disableManaged', { title: disabling.managedBy.title })
            : t('system.disableDescription')
        }
        action={t('system.disable')}
        destructive
        onCancel={() => setDisabling(undefined)}
        onConfirm={async () => {
          if (disabling) await toggle(disabling, false);
          setDisabling(undefined);
        }}
      />
      <Outlet context={{ reload } satisfies SystemKeysOutletContext} />
    </SystemFrame>
  );
}
