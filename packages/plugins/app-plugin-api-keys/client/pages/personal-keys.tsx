/**
 * Personal settings › API keys: the signed-in person's keys, what each can do, how long it lasts and when it was last
 * used, with rotate and revoke. New key shows only to a person whose role lets them create keys; the create and detail
 * pages open over this list through its outlet.
 */
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { PlusIcon, TriangleAlertIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import type { ApiKeyView, CreatedApiKey } from '../../shared/scopes.js';
import {
  ConfirmDialog,
  ErrorAlert,
  KeyExpiry,
  KeyScopeSummary,
  LastUsed,
  RotatedKeyDialog,
} from '../components/key-parts.js';
import { useApiKeysApi, type OwnKeysMeta } from '../lib/api.js';
import { IDLE_REMINDER_DAYS, formatDate, idleDays } from '../lib/format.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';

/** What the list's outlet gives the create and detail pages: a way to refresh the list after a change. */
export interface PersonalKeysOutletContext {
  readonly reload: () => void;
}

export default function PersonalKeysPage(): ReactElement {
  const { t, i18n } = useTranslation(API_KEYS_NAMESPACE);
  const api = useApiKeysApi();
  const toaster = useToaster();
  const location = useLocation();
  const [state, setState] = useState<{
    keys?: ApiKeyView[];
    meta?: OwnKeysMeta;
    error?: unknown;
  }>({});
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const [revoking, setRevoking] = useState<ApiKeyView>();
  const [rotating, setRotating] = useState<ApiKeyView>();
  const [rotated, setRotated] = useState<CreatedApiKey>();

  useEffect(() => {
    let active = true;
    api.list().then(
      (result) => {
        if (active) setState({ keys: result.data, meta: result.meta });
      },
      (error: unknown) => {
        if (active) setState((current) => ({ ...current, error }));
      },
    );
    return () => {
      active = false;
    };
    // The list reads again when a child page closes, so a key made or revoked there shows.
  }, [api, revision, location.pathname]);

  const keys = state.keys;
  const mayCreate = state.meta?.mayCreate ?? false;
  const reminders: string[] = [];
  for (const key of keys ?? []) {
    if (key.permissions === null)
      reminders.push(t('personal.reminderSameAsMe', { name: key.name ?? '' }));
    else if (idleDays(key) >= IDLE_REMINDER_DAYS)
      reminders.push(
        t('personal.reminderIdle', {
          name: key.name ?? '',
          days: idleDays(key),
        }),
      );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('personal.title')}
        description={t('personal.description')}
        actions={
          mayCreate ? (
            <Button nativeButton={false} render={<Link to='create' />}>
              <PlusIcon aria-hidden />
              {t('personal.newKey')}
            </Button>
          ) : null
        }
      />
      {state.error ? (
        <ErrorAlert error={state.error} onRetry={reload} />
      ) : !keys || !state.meta ? (
        <div className='grid gap-2' aria-busy>
          <Skeleton className='h-14 w-full' />
          <Skeleton className='h-14 w-full' />
        </div>
      ) : (
        <>
          {!mayCreate && keys.length > 0 && (
            <p className='text-sm text-muted-foreground'>
              {t('personal.cannotCreate')}
            </p>
          )}
          <section
            data-slot='api-key-list'
            className='min-w-0 rounded-xl border bg-card text-card-foreground'
          >
            <div className='flex items-center gap-2 border-b px-4 py-3'>
              <h2 className='text-sm font-semibold'>{t('personal.myKeys')}</h2>
              <span className='text-xs text-muted-foreground'>
                {t('personal.count', { count: keys.length })}
              </span>
            </div>
            {keys.length === 0 ? (
              <p className='px-4 py-8 text-center text-sm text-muted-foreground'>
                {mayCreate
                  ? t('personal.empty')
                  : t('personal.emptyCannotCreate')}
              </p>
            ) : (
              <div role='table' className='min-w-0'>
                <div
                  role='row'
                  className='hidden gap-3 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[minmax(10rem,1.3fr)_minmax(12rem,1.6fr)_8rem_8rem_10rem]'
                >
                  <span role='columnheader'>{t('personal.columns.name')}</span>
                  <span role='columnheader'>{t('personal.columns.scope')}</span>
                  <span role='columnheader'>
                    {t('personal.columns.expiry')}
                  </span>
                  <span role='columnheader'>
                    {t('personal.columns.lastUsed')}
                  </span>
                  <span role='columnheader' className='sr-only'>
                    {t('personal.open')}
                  </span>
                </div>
                {keys.map((key) => (
                  <div
                    key={key.id}
                    role='row'
                    data-slot='api-key-row'
                    className='grid min-w-0 gap-2 border-t px-4 py-3 text-sm md:grid-cols-[minmax(10rem,1.3fr)_minmax(12rem,1.6fr)_8rem_8rem_10rem] md:items-center md:gap-3'
                  >
                    <div role='cell' className='min-w-0'>
                      <Link
                        to={encodeURIComponent(key.id)}
                        className='font-medium break-words hover:underline'
                      >
                        {key.name}
                      </Link>
                      <div className='text-xs text-muted-foreground'>
                        <code className='font-mono'>{key.start ?? '—'}…</code>
                        {' · '}
                        {t('common.createdOn', {
                          date: formatDate(key.createdAt, i18n.language),
                        })}
                      </div>
                    </div>
                    <div role='cell' className='min-w-0'>
                      <KeyScopeSummary permissions={key.permissions ?? null} />
                    </div>
                    <Cell label={t('personal.columns.expiry')}>
                      {key.enabled ? (
                        <KeyExpiry expiresAt={key.expiresAt} />
                      ) : (
                        <Badge variant='secondary'>
                          {t('common.disabled')}
                        </Badge>
                      )}
                    </Cell>
                    <Cell label={t('personal.columns.lastUsed')}>
                      <LastUsed value={key.lastUsedAt} />
                    </Cell>
                    <div
                      role='cell'
                      className='flex flex-wrap gap-2 md:justify-end'
                    >
                      {mayCreate && (
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() => setRotating(key)}
                        >
                          {t('personal.rotate')}
                        </Button>
                      )}
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className='text-destructive'
                        onClick={() => setRevoking(key)}
                      >
                        {t('personal.revoke')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          {reminders.map((reminder) => (
            <Alert
              key={reminder}
              className='border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-200'
            >
              <TriangleAlertIcon aria-hidden />
              <AlertDescription className='text-inherit'>
                {reminder}
              </AlertDescription>
            </Alert>
          ))}
        </>
      )}
      <ConfirmDialog
        open={revoking !== undefined}
        title={t('personal.revokeTitle', { name: revoking?.name ?? '' })}
        description={t('personal.revokeDescription')}
        action={t('personal.revoke')}
        destructive
        onCancel={() => setRevoking(undefined)}
        onConfirm={async () => {
          if (!revoking) return;
          try {
            await api.revoke(revoking.id);
            toaster.show({ type: 'success', title: t('personal.revoked') });
            setRevoking(undefined);
            reload();
          } catch {
            toaster.show({ type: 'error', title: t('personal.revokeFailed') });
          }
        }}
      />
      <ConfirmDialog
        open={rotating !== undefined}
        title={t('personal.rotateTitle', { name: rotating?.name ?? '' })}
        description={t('personal.rotateDescription')}
        action={t('personal.rotate')}
        onCancel={() => setRotating(undefined)}
        onConfirm={async () => {
          if (!rotating) return;
          try {
            setRotated(await api.rotate(rotating.id));
            setRotating(undefined);
            reload();
          } catch {
            toaster.show({ type: 'error', title: t('personal.rotateFailed') });
          }
        }}
      />
      <RotatedKeyDialog
        created={rotated}
        onClose={() => setRotated(undefined)}
      />
      <Outlet context={{ reload } satisfies PersonalKeysOutletContext} />
    </PageContainer>
  );
}

/** A cell that names its column on a phone, where the header row is hidden. */
function Cell({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div role='cell' className='flex min-w-0 items-center gap-2'>
      <span className='w-20 shrink-0 text-xs text-muted-foreground md:hidden'>
        {label}
      </span>
      {children}
    </div>
  );
}
