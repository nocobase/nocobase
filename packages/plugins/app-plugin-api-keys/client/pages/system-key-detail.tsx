/**
 * System settings › API keys › a system key: what it is and who owns it, its permissions — changed at once and
 * recorded — and its activity. An administrator who manages system keys edits it, rotates it (its identity, name,
 * permissions and activity stay), disables, enables or deletes it. A managed key is only viewed, disabled or deleted
 * here: its permissions and rotation change where it is managed.
 */
import { useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { InfoIcon } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router';

import { cn } from 'cn';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Skeleton } from '#components/ui/skeleton';
import { Textarea } from '#components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import type {
  CreatedApiKey,
  GrantablePermissions,
  KeyPermissionGrant,
  KeyPermissions,
} from '../../shared/scopes.js';
import {
  ConfirmDialog,
  ErrorAlert,
  KeyExpiry,
  LastUsed,
  RotatedKeyDialog,
} from '../components/key-parts.js';
import { PermissionTable } from '../components/permission-table.js';
import { RecordPicker } from '../components/record-picker.js';
import type { SystemKeysOutletContext } from '../components/system-key-list.js';
import {
  useApiKeysAdminApi,
  type SystemKey,
  type SystemKeyEvent,
} from '../lib/admin-api.js';
import { useApiKeysApi } from '../lib/api.js';
import { formatDate } from '../lib/format.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';

const API_KEYS = { type: 'settings', id: 'apiKeys' } as const;

export default function SystemKeyDetailPage(): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const { identityId = '' } = useParams();
  const admin = useApiKeysAdminApi();
  const api = useApiKeysApi();
  const toaster = useToaster();
  const navigate = useNavigate();
  const outlet = useOutletContext<SystemKeysOutletContext | undefined>();
  const { can: mayManage } = useCan({ resource: API_KEYS, action: 'manage' });
  const [key, setKey] = useState<SystemKey>();
  const [error, setError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState<'permissions' | 'activity'>('permissions');
  const [editing, setEditing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [rotated, setRotated] = useState<CreatedApiKey>();
  const [disabling, setDisabling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [grantable, setGrantable] = useState<GrantablePermissions>();
  const reload = useCallback(() => {
    setError(undefined);
    setRevision((value) => value + 1);
    outlet?.reload();
  }, [outlet]);
  useEffect(() => {
    let active = true;
    admin.systemKey(identityId).then(
      (found) => {
        if (active) setKey(found);
      },
      (failure: unknown) => {
        if (active) setError(failure);
      },
    );
    return () => {
      active = false;
    };
  }, [admin, identityId, revision]);
  useEffect(() => {
    if (!mayManage) return;
    let active = true;
    api.grantable().then(
      (found) => {
        if (active) setGrantable(found);
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [api, mayManage]);
  const managed = key?.managedBy ?? null;
  const act = async (run: () => Promise<unknown>, done: string) => {
    try {
      await run();
      toaster.show({ type: 'success', title: done });
      reload();
    } catch {
      toaster.show({ type: 'error', title: t('system.failed') });
    }
  };

  return (
    <PageContainer className='max-w-[1120px]'>
      <PageHeader
        title={
          key ? (
            <span className='inline-flex flex-wrap items-center gap-2'>
              {key.name}
              {key.enabled ? (
                <Badge className='bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'>
                  {t('system.statusEnabled')}
                </Badge>
              ) : (
                <Badge variant='secondary'>{t('common.disabled')}</Badge>
              )}
              {managed ? (
                <Badge variant='secondary'>
                  {t('system.managedTag', { title: managed.title })}
                </Badge>
              ) : null}
            </span>
          ) : (
            ''
          )
        }
        description={key?.description ?? undefined}
        actions={
          key ? (
            <>
              <Button
                variant='outline'
                nativeButton={false}
                render={
                  <Link
                    to={`/settings/permission-check?as=systemKey&subject=${encodeURIComponent(key.id)}`}
                  />
                }
              >
                {t('system.detail.check')}
              </Button>
              {mayManage && !managed ? (
                <>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setEditing(true)}
                  >
                    {t('system.detail.edit')}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setRotating(true)}
                  >
                    {t('personal.rotate')}
                  </Button>
                </>
              ) : null}
              {mayManage ? (
                <>
                  {key.enabled ? (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setDisabling(true)}
                    >
                      {t('system.disable')}
                    </Button>
                  ) : (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() =>
                        void act(
                          () => admin.setEnabled(identityId, true),
                          t('system.enabled'),
                        )
                      }
                    >
                      {t('system.enable')}
                    </Button>
                  )}
                  <Button
                    type='button'
                    variant='outline'
                    className='text-destructive'
                    onClick={() => setDeleting(true)}
                  >
                    {t('system.delete')}
                  </Button>
                </>
              ) : null}
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
            <dt className='text-muted-foreground'>
              {t('system.create.owner')}
            </dt>
            <dd>{key.owner?.name ?? t('system.noOwner')}</dd>
            <dt className='text-muted-foreground'>{t('detail.expires')}</dt>
            <dd>
              <KeyExpiry expiresAt={key.expiresAt} />
            </dd>
            <dt className='text-muted-foreground'>{t('detail.lastUsed')}</dt>
            <dd>
              <LastUsed value={key.lastUsedAt} />
            </dd>
          </dl>
          {managed ? (
            <Alert>
              <InfoIcon aria-hidden />
              <AlertDescription>
                {t('system.detail.managed', { title: managed.title })}
              </AlertDescription>
            </Alert>
          ) : null}
          <div
            role='tablist'
            aria-label={key.name ?? ''}
            className='flex gap-4 border-b'
          >
            {(['permissions', 'activity'] as const).map((value) => (
              <button
                key={value}
                type='button'
                role='tab'
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={cn(
                  'border-b-2 pb-2 text-sm',
                  tab === value
                    ? 'border-foreground font-medium'
                    : 'border-transparent text-muted-foreground',
                )}
              >
                {t(`system.detail.${value}`)}
              </button>
            ))}
          </div>
          {tab === 'permissions' ? (
            <Permissions
              key={revision}
              systemKey={key}
              editable={mayManage && !managed && grantable !== undefined}
              grantable={grantable}
              onSaved={reload}
            />
          ) : (
            <Activity identityId={identityId} revision={revision} />
          )}
        </section>
      )}
      {key ? (
        <EditDialog
          open={editing}
          systemKey={key}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={rotating}
        title={t('personal.rotateTitle', { name: key?.name ?? '' })}
        description={t('system.detail.rotateDescription')}
        action={t('personal.rotate')}
        onCancel={() => setRotating(false)}
        onConfirm={async () => {
          try {
            setRotated(await admin.rotate(identityId));
            setRotating(false);
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
      <ConfirmDialog
        open={disabling}
        title={t('system.disableTitle', { name: key?.name ?? '' })}
        description={
          managed
            ? t('system.disableManaged', { title: managed.title })
            : t('system.disableDescription')
        }
        action={t('system.disable')}
        destructive
        onCancel={() => setDisabling(false)}
        onConfirm={async () => {
          await act(
            () => admin.setEnabled(identityId, false),
            t('system.disabled'),
          );
          setDisabling(false);
        }}
      />
      <ConfirmDialog
        open={deleting}
        title={t('system.deleteTitle', { name: key?.name ?? '' })}
        description={
          managed
            ? t('system.deleteManaged', { title: managed.title })
            : t('system.deleteDescription')
        }
        action={t('system.delete')}
        destructive
        onCancel={() => setDeleting(false)}
        onConfirm={async () => {
          try {
            await admin.remove(identityId);
            toaster.show({ type: 'success', title: t('system.deleted') });
            setDeleting(false);
            outlet?.reload();
            void navigate('..', { relative: 'path' });
          } catch {
            toaster.show({ type: 'error', title: t('system.failed') });
          }
        }}
      />
    </PageContainer>
  );
}

function Permissions({
  systemKey,
  editable,
  grantable,
  onSaved,
}: {
  readonly systemKey: SystemKey;
  readonly editable: boolean;
  readonly grantable: GrantablePermissions | undefined;
  readonly onSaved: () => void;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const admin = useApiKeysAdminApi();
  const toaster = useToaster();
  const [grants, setGrants] = useState<readonly KeyPermissionGrant[]>(
    systemKey.permissions.grants,
  );
  const [objects, setObjects] = useState<
    Readonly<Record<string, readonly string[]>>
  >(systemKey.permissions.objects ?? {});
  const [saving, setSaving] = useState(false);
  const dirty =
    JSON.stringify(grants) !== JSON.stringify(systemKey.permissions.grants) ||
    JSON.stringify(objects) !==
      JSON.stringify(systemKey.permissions.objects ?? {});
  const sources = new Set(grantable?.objectSources ?? []);
  const granted = new Set(grants.map((grant) => grant.resource.id));
  const save = async () => {
    const picked = Object.fromEntries(
      Object.entries(objects).filter(([business]) => granted.has(business)),
    );
    const permissions: KeyPermissions = {
      grants,
      ...(Object.keys(picked).length ? { objects: picked } : {}),
    };
    setSaving(true);
    try {
      await admin.setPermissions(systemKey.identityId, permissions);
      toaster.show({ type: 'success', title: t('system.detail.saved') });
      onSaved();
    } catch {
      toaster.show({ type: 'error', title: t('system.failed') });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className='grid min-w-0 gap-3'>
      <PermissionTable
        value={grants}
        systemKey
        readOnly={!editable}
        {...(editable && grantable
          ? { onChange: setGrants, ceiling: grantable }
          : {})}
        objectExtra={(resource) =>
          (
            editable
              ? sources.has(resource.id) && granted.has(resource.id)
              : objects[resource.id]
          ) ? (
            <RecordPicker
              business={resource.id}
              value={objects[resource.id]}
              readOnly={!editable}
              onChange={(next) =>
                setObjects((current) => {
                  const { [resource.id]: _removed, ...rest } = current;
                  return next === undefined
                    ? rest
                    : { ...rest, [resource.id]: next };
                })
              }
            />
          ) : undefined
        }
      />
      {editable ? (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            {t('system.detail.saveHint')}
          </span>
          <span className='flex-1' />
          {dirty ? (
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setGrants(systemKey.permissions.grants);
                setObjects(systemKey.permissions.objects ?? {});
              }}
            >
              {t('system.detail.discard')}
            </Button>
          ) : null}
          <Button
            type='button'
            disabled={!dirty || saving}
            onClick={() => void save()}
          >
            {t('system.detail.save')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** "orders: read, update" for each grant. */
function grantLines(value: unknown): string[] {
  const grants =
    value && typeof value === 'object'
      ? (value as { grants?: unknown }).grants
      : undefined;
  if (!Array.isArray(grants)) return [];
  return grants.map(
    (grant: { resource?: { id?: string }; actions?: { action?: string }[] }) =>
      `${grant.resource?.id ?? ''}: ${(grant.actions ?? []).map((entry) => entry.action).join(', ')}`,
  );
}

function Activity({
  identityId,
  revision,
}: {
  readonly identityId: string;
  readonly revision: number;
}): ReactElement {
  const { t, i18n } = useTranslation(API_KEYS_NAMESPACE);
  const admin = useApiKeysAdminApi();
  const [events, setEvents] = useState<SystemKeyEvent[]>();
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    let active = true;
    admin.events(identityId).then(
      (found) => {
        if (active) setEvents(found);
      },
      (failure: unknown) => {
        if (active) setError(failure);
      },
    );
    return () => {
      active = false;
    };
  }, [admin, identityId, revision]);
  if (error) return <ErrorAlert error={error} />;
  if (!events) return <Skeleton className='h-32 w-full' />;
  return (
    <ol className='grid min-w-0 gap-0' data-slot='system-key-activity'>
      {events.map((event) => {
        const before = grantLines(event.details?.before);
        const after = grantLines(event.details?.after);
        return (
          <li
            key={event.id}
            className='grid min-w-0 gap-1 border-t py-2 text-sm first:border-t-0 sm:grid-cols-[10rem_8rem_1fr] sm:gap-3'
          >
            <span className='text-muted-foreground'>
              {formatDate(event.createdAt, i18n.language)}{' '}
              {new Date(event.createdAt).toLocaleTimeString(i18n.language, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span>{event.actor?.name ?? t('system.activity.system')}</span>
            <span className='min-w-0'>
              <span className='font-medium'>
                {t(`system.activity.${event.action}`)}
              </span>
              {event.action === 'permissions' ? (
                <span className='mt-1 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2'>
                  <span>
                    <span className='block font-medium text-foreground'>
                      {t('system.activity.before')}
                    </span>
                    {before.length
                      ? before.map((line) => (
                          <span key={line} className='block'>
                            {line}
                          </span>
                        ))
                      : t('system.activity.nothing')}
                  </span>
                  <span>
                    <span className='block font-medium text-foreground'>
                      {t('system.activity.after')}
                    </span>
                    {after.length
                      ? after.map((line) => (
                          <span key={line} className='block'>
                            {line}
                          </span>
                        ))
                      : t('system.activity.nothing')}
                  </span>
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function EditDialog({
  open,
  systemKey,
  onClose,
  onSaved,
}: {
  readonly open: boolean;
  readonly systemKey: SystemKey;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const admin = useApiKeysAdminApi();
  const toaster = useToaster();
  const [name, setName] = useState(systemKey.name ?? '');
  const [description, setDescription] = useState(systemKey.description ?? '');
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('system.detail.edit')}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className='grid gap-3'>
          <div className='grid gap-1.5'>
            <Label htmlFor='edit-key-name'>{t('create.name')}</Label>
            <Input
              id='edit-key-name'
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className='grid gap-1.5'>
            <Label htmlFor='edit-key-description'>
              {t('create.description')}
            </Label>
            <Textarea
              id='edit-key-description'
              value={description}
              rows={2}
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!name.trim()}
            onClick={() => {
              void admin
                .updateSystemKey(systemKey.identityId, {
                  name: name.trim(),
                  description: description.trim() || null,
                })
                .then(onSaved, () =>
                  toaster.show({ type: 'error', title: t('system.failed') }),
                );
            }}
          >
            {t('system.detail.save')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
