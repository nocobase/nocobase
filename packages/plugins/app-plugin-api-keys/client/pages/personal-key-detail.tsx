/**
 * Personal settings › API keys › a key: what it is, when it expires and was last used, and what it can do, read-only.
 * Permissions its owner has lost show struck through as lapsed; they come back when the owner gets them again. A
 * personal key's permissions never change: the page offers rotate and revoke only.
 */
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { TriangleAlertIcon } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import type { ApiKeyDetailView, CreatedApiKey } from '../../shared/scopes.js';
import {
  ConfirmDialog,
  ErrorAlert,
  KeyExpiry,
  KeyScopeSummary,
  LastUsed,
  RotatedKeyDialog,
} from '../components/key-parts.js';
import { PermissionTable } from '../components/permission-table.js';
import { RecordPicker } from '../components/record-picker.js';
import { useApiKeysApi } from '../lib/api.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';
import type { PersonalKeysOutletContext } from './personal-keys.js';

export default function PersonalKeyDetailPage(): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const { keyId = '' } = useParams();
  const api = useApiKeysApi();
  const toaster = useToaster();
  const navigate = useNavigate();
  const outlet = useOutletContext<PersonalKeysOutletContext | undefined>();
  const [key, setKey] = useState<ApiKeyDetailView>();
  const [error, setError] = useState<unknown>();
  const [mayCreate, setMayCreate] = useState(false);
  const [revision, setRevision] = useState(0);
  const [revoking, setRevoking] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [rotated, setRotated] = useState<CreatedApiKey>();
  const reload = useCallback(() => {
    setError(undefined);
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.get(keyId), api.list()]).then(
      ([detail, list]) => {
        if (!active) return;
        setKey(detail);
        setMayCreate(list.meta.mayCreate);
      },
      (failure: unknown) => {
        if (active) setError(failure);
      },
    );
    return () => {
      active = false;
    };
  }, [api, keyId, revision]);

  const lapsedCount = (key?.lapsed ?? []).reduce(
    (total, grant) => total + grant.actions.length,
    0,
  );

  return (
    <PageContainer className='max-w-[1120px]'>
      <PageHeader
        title={key?.name ?? (error ? t('detail.breadcrumb') : '')}
        description={key?.description ?? undefined}
        actions={
          key ? (
            <>
              {mayCreate ? (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setRotating(true)}
                >
                  {t('personal.rotate')}
                </Button>
              ) : null}
              <Button
                type='button'
                variant='outline'
                className='text-destructive'
                onClick={() => setRevoking(true)}
              >
                {t('personal.revoke')}
              </Button>
            </>
          ) : null
        }
      />
      {error ? (
        <ErrorAlert error={error} onRetry={reload} />
      ) : !key ? (
        <Skeleton className='h-80 w-full' />
      ) : (
        <section className='grid min-w-0 gap-4 rounded-xl border bg-card p-4 text-card-foreground sm:p-6'>
          <dl className='grid min-w-0 grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm'>
            <dt className='text-muted-foreground'>{t('detail.key')}</dt>
            <dd>
              <code className='rounded bg-muted px-1.5 font-mono text-xs'>
                {key.start ?? '—'}…
              </code>
            </dd>
            <dt className='text-muted-foreground'>{t('detail.expires')}</dt>
            <dd>
              <KeyExpiry expiresAt={key.expiresAt} />
            </dd>
            <dt className='text-muted-foreground'>{t('detail.lastUsed')}</dt>
            <dd>
              <LastUsed value={key.lastUsedAt} />
            </dd>
          </dl>
          {lapsedCount > 0 ? (
            <Alert className='border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-200'>
              <TriangleAlertIcon aria-hidden />
              <AlertDescription className='text-inherit'>
                {t('detail.lapsed', { count: lapsedCount })}
              </AlertDescription>
            </Alert>
          ) : null}
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-sm font-semibold'>{t('detail.what')}</h2>
            <KeyScopeSummary permissions={key.permissions ?? null} />
          </div>
          {key.permissions ? (
            <PermissionTable
              readOnly
              value={key.permissions.grants.flatMap((grant) => {
                const lost = key.lapsed.find(
                  (entry) =>
                    entry.resource.type === grant.resource.type &&
                    entry.resource.id === grant.resource.id,
                );
                const actions = grant.actions.filter(
                  (entry) =>
                    !lost?.actions.some((item) => item.action === entry.action),
                );
                return actions.length ? [{ ...grant, actions }] : [];
              })}
              lapsed={key.lapsed}
              objectExtra={(resource) => {
                const picked = key.permissions?.objects?.[resource.id];
                return picked ? (
                  <RecordPicker
                    business={resource.id}
                    value={picked}
                    readOnly
                  />
                ) : undefined;
              }}
            />
          ) : (
            <Alert className='border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-200'>
              <TriangleAlertIcon aria-hidden />
              <AlertDescription className='text-inherit'>
                {t('detail.sameAsMe')}
              </AlertDescription>
            </Alert>
          )}
          <p className='text-xs text-muted-foreground'>{t('detail.fixed')}</p>
        </section>
      )}
      <ConfirmDialog
        open={revoking}
        title={t('personal.revokeTitle', { name: key?.name ?? '' })}
        description={t('personal.revokeDescription')}
        action={t('personal.revoke')}
        destructive
        onCancel={() => setRevoking(false)}
        onConfirm={async () => {
          try {
            await api.revoke(keyId);
            toaster.show({ type: 'success', title: t('personal.revoked') });
            setRevoking(false);
            outlet?.reload();
            void navigate('..', { relative: 'path' });
          } catch {
            toaster.show({ type: 'error', title: t('personal.revokeFailed') });
          }
        }}
      />
      <ConfirmDialog
        open={rotating}
        title={t('personal.rotateTitle', { name: key?.name ?? '' })}
        description={t('personal.rotateDescription')}
        action={t('personal.rotate')}
        onCancel={() => setRotating(false)}
        onConfirm={async () => {
          try {
            setRotated(await api.rotate(keyId));
            setRotating(false);
            reload();
            outlet?.reload();
          } catch {
            toaster.show({ type: 'error', title: t('personal.rotateFailed') });
          }
        }}
      />
      <RotatedKeyDialog
        created={rotated}
        onClose={() => setRotated(undefined)}
      />
    </PageContainer>
  );
}
