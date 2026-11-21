/**
 * System settings › API keys › Members' personal keys: every member's own keys, to find the ones as broad as their
 * member or long unused, and revoke them. An administrator sees what each key can do, never the key itself, and
 * changes no key's permissions.
 */
import { useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, useEffect, useState, type ReactElement } from 'react';

import { cn } from 'cn';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Skeleton } from '#components/ui/skeleton';
import {
  ConfirmDialog,
  ErrorAlert,
  KeyExpiry,
  KeyScopeSummary,
  LastUsed,
} from '../components/key-parts.js';
import { SystemFrame } from '../components/system-frame.js';
import { useApiKeysAdminApi, type MemberKey } from '../lib/admin-api.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';

const API_KEYS = { type: 'settings', id: 'apiKeys' } as const;
const IDLE_DAYS = 90;
type Filter = 'all' | 'sameAsMember' | 'idle';

export default function MemberKeysPage(): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const admin = useApiKeysAdminApi();
  const toaster = useToaster();
  const { can: mayManage } = useCan({ resource: API_KEYS, action: 'manage' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [found, setFound] = useState<{ data: MemberKey[]; total: number }>();
  const [error, setError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const [revoking, setRevoking] = useState<MemberKey>();
  const reload = useCallback(() => {
    setError(undefined);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      admin
        .memberKeys({
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(filter === 'sameAsMember' ? { sameAsMember: true } : {}),
          ...(filter === 'idle' ? { idleDays: IDLE_DAYS } : {}),
          page,
        })
        .then(
          (answer) => {
            if (active) setFound(answer);
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
  }, [admin, search, filter, page, revision]);
  const pageSize = 20;
  const pages = found ? Math.max(1, Math.ceil(found.total / pageSize)) : 1;
  return (
    <SystemFrame tab='members'>
      <p className='text-sm text-muted-foreground'>{t('members.hint')}</p>
      <section className='min-w-0 rounded-xl border bg-card text-card-foreground'>
        <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
          <Input
            value={search}
            placeholder={t('members.search')}
            aria-label={t('members.search')}
            className='max-w-60'
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <div
            role='radiogroup'
            aria-label={t('members.filter')}
            className='inline-flex flex-wrap overflow-hidden rounded-lg border'
          >
            {(['all', 'sameAsMember', 'idle'] as const).map((value) => (
              <button
                key={value}
                type='button'
                role='radio'
                aria-checked={filter === value}
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
                className={cn(
                  'border-l px-3 py-1.5 text-sm first:border-l-0',
                  filter === value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted',
                )}
              >
                {t(`members.filters.${value}`, { count: IDLE_DAYS })}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <div className='p-4'>
            <ErrorAlert error={error} onRetry={reload} />
          </div>
        ) : !found ? (
          <div className='grid gap-2 p-4'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        ) : found.data.length === 0 ? (
          <p className='px-4 py-8 text-center text-sm text-muted-foreground'>
            {t('members.empty')}
          </p>
        ) : (
          <div role='table' className='min-w-0'>
            <div
              role='row'
              className='hidden gap-3 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[minmax(10rem,1.2fr)_minmax(9rem,1fr)_minmax(12rem,1.6fr)_8rem_7rem]'
            >
              <span role='columnheader'>{t('personal.columns.name')}</span>
              <span role='columnheader'>{t('members.columns.member')}</span>
              <span role='columnheader'>{t('personal.columns.scope')}</span>
              <span role='columnheader'>{t('personal.columns.lastUsed')}</span>
              <span role='columnheader' className='sr-only'>
                {t('personal.revoke')}
              </span>
            </div>
            {found.data.map((key) => (
              <div
                key={key.id}
                role='row'
                data-slot='member-key-row'
                className='grid min-w-0 gap-2 border-t px-4 py-3 text-sm md:grid-cols-[minmax(10rem,1.2fr)_minmax(9rem,1fr)_minmax(12rem,1.6fr)_8rem_7rem] md:items-center md:gap-3'
              >
                <div role='cell' className='min-w-0'>
                  <span className='font-medium break-words'>{key.name}</span>
                  <div className='text-xs text-muted-foreground'>
                    <KeyExpiry expiresAt={key.expiresAt} />
                  </div>
                </div>
                <div role='cell' className='min-w-0 break-words'>
                  {key.member.name}
                  {key.member.disabled ? (
                    <Badge variant='secondary' className='ml-2'>
                      {t('common.disabled')}
                    </Badge>
                  ) : null}
                </div>
                <div
                  role='cell'
                  className='flex min-w-0 flex-wrap items-center gap-2'
                >
                  <KeyScopeSummary permissions={key.permissions ?? null} />
                </div>
                <div role='cell'>
                  <LastUsed value={key.lastUsedAt} />
                </div>
                <div role='cell' className='md:text-right'>
                  {mayManage ? (
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      className='text-destructive'
                      onClick={() => setRevoking(key)}
                    >
                      {t('personal.revoke')}
                    </Button>
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
        open={revoking !== undefined}
        title={t('members.revokeTitle', {
          name: revoking?.name ?? '',
          member: revoking?.member.name ?? '',
        })}
        description={t('members.revokeDescription', {
          member: revoking?.member.name ?? '',
        })}
        action={t('personal.revoke')}
        destructive
        onCancel={() => setRevoking(undefined)}
        onConfirm={async () => {
          if (!revoking) return;
          try {
            await admin.revokeMemberKey(revoking.id);
            toaster.show({ type: 'success', title: t('members.revoked') });
            reload();
          } catch {
            toaster.show({ type: 'error', title: t('system.failed') });
          }
          setRevoking(undefined);
        }}
      />
    </SystemFrame>
  );
}
