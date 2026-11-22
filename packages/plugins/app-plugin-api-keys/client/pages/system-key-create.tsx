/**
 * System settings › API keys › New system key: a name, a description, an owner who receives its reminders, an expiry,
 * and permissions starting with none, given one by one from what the administrator holds. Its secret is shown once.
 */
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Skeleton } from '#components/ui/skeleton';
import { Textarea } from '#components/ui/textarea';
import type {
  GrantablePermissions,
  KeyPermissionGrant,
} from '../../shared/scopes.js';
import { ErrorAlert } from '../components/key-parts.js';
import { KeyOptionPicker } from '../components/key-option-picker.js';
import { KeyCreateActions } from '../components/key-create-actions.js';
import { KeySecret } from '../components/key-secret.js';
import { PermissionTable } from '../components/permission-table.js';
import { ScopeRecordPicker } from '../components/scope-record-picker.js';
import { RecordPicker } from '../components/record-picker.js';
import type { SystemKeysOutletContext } from './system-keys.js';
import { useApiKeysAdminApi, type SystemKey } from '../lib/admin-api.js';
import { useApiKeysApi } from '../lib/api.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';

const EXPIRY_DAYS = [30, 90, 180, 365] as const;
const NEVER = 'never' as const;

export default function SystemKeyCreatePage(): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const api = useApiKeysApi();
  const navigate = useNavigate();
  const outlet = useOutletContext<SystemKeysOutletContext | undefined>();
  const [grantable, setGrantable] = useState<GrantablePermissions>();
  const [loadError, setLoadError] = useState<unknown>();
  const [created, setCreated] = useState<{
    key: SystemKey;
    secret: string;
  }>();
  useEffect(() => {
    let active = true;
    api.grantable().then(
      (value) => {
        if (active) setGrantable(value);
      },
      (error: unknown) => {
        if (active) setLoadError(error);
      },
    );
    return () => {
      active = false;
    };
  }, [api]);
  const back = (): void => {
    outlet?.reload();
    void navigate('..', { relative: 'path' });
  };
  return (
    <PageContainer>
      <PageHeader
        title={created ? t('system.created.title') : t('system.create.title')}
      />
      {loadError ? (
        <ErrorAlert error={loadError} />
      ) : !grantable ? (
        <Skeleton className='h-96 w-full' />
      ) : created ? (
        <section className='grid min-w-0 gap-4 rounded-xl border bg-card p-4 text-card-foreground sm:p-6'>
          <KeySecret
            secret={created.secret}
            details={[
              { label: t('created.name'), value: created.key.name },
              {
                label: t('created.identity'),
                value: t('system.created.identity'),
              },
            ]}
          />
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              onClick={() => {
                outlet?.reload();
                void navigate(
                  `../${encodeURIComponent(created.key.identityId)}`,
                  {
                    relative: 'path',
                  },
                );
              }}
            >
              {t('created.done')}
            </Button>
          </div>
        </section>
      ) : (
        <CreateForm
          grantable={grantable}
          onCreated={setCreated}
          onCancel={back}
        />
      )}
    </PageContainer>
  );
}

function CreateForm({
  grantable,
  onCreated,
  onCancel,
}: {
  readonly grantable: GrantablePermissions;
  readonly onCreated: (created: { key: SystemKey; secret: string }) => void;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const admin = useApiKeysAdminApi();
  const client = useApiClient();
  const { session } = useAuthentication();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState<string | undefined>(session?.user.id);
  const [expiry, setExpiry] = useState<number | typeof NEVER>(365);
  const [grants, setGrants] = useState<readonly KeyPermissionGrant[]>([]);
  const [objects, setObjects] = useState<
    Readonly<Record<string, readonly string[]>>
  >({});
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const sources = new Set(grantable.objectSources);
  const granted = new Set(grants.map((grant) => grant.resource.id));
  const searchUsers = useCallback(
    async (query: string) => {
      const answer = await client.request<{
        data: { id: string; name: string; email?: string }[];
      }>({
        path: 'users',
        query: { ...(query ? { q: query } : {}), pageSize: '10' },
      });
      return answer.data.map((user) => ({
        id: user.id,
        title: user.name,
        ...(user.email ? { description: user.email } : {}),
      }));
    },
    [client],
  );

  const submit = async (): Promise<void> => {
    setError(undefined);
    if (!name.trim()) {
      setError(t('create.errors.INVALID_NAME'));
      return;
    }
    const picked = Object.fromEntries(
      Object.entries(objects).filter(([business]) => granted.has(business)),
    );
    setSubmitting(true);
    try {
      onCreated(
        await admin.createSystemKey({
          name: name.trim(),
          description: description.trim() || null,
          ownerId: ownerId ?? null,
          expiresInDays: expiry === NEVER ? null : expiry,
          permissions: {
            grants,
            ...(Object.keys(picked).length ? { objects: picked } : {}),
          },
        }),
      );
    } catch (failure) {
      const reason =
        failure instanceof ApiClientError ? failure.reason : undefined;
      setError(
        reason
          ? t(`create.errors.${reason}`, { defaultValue: t('create.failed') })
          : t('create.failed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      noValidate
      className='relative grid min-w-0 gap-6 rounded-xl border bg-card p-4 text-card-foreground sm:p-6'
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Row label={t('create.name')} htmlFor='system-key-name'>
        <Input
          id='system-key-name'
          value={name}
          maxLength={100}
          placeholder={t('system.create.namePlaceholder')}
          className='max-w-md'
          onChange={(event) => setName(event.target.value)}
        />
      </Row>
      <Row label={t('create.description')} htmlFor='system-key-description'>
        <Textarea
          id='system-key-description'
          value={description}
          maxLength={500}
          rows={2}
          placeholder={t('system.create.descriptionPlaceholder')}
          className='max-w-md'
          onChange={(event) => setDescription(event.target.value)}
        />
      </Row>
      <Row label={t('system.create.owner')}>
        <div className='grid gap-1.5'>
          <KeyOptionPicker
            value={ownerId ?? ''}
            onChange={setOwnerId}
            search={searchUsers}
            label={t('system.create.owner')}
          />
          <p className='text-xs text-muted-foreground'>
            {t('system.create.ownerHint')}
          </p>
        </div>
      </Row>
      <Row label={t('create.expiry')}>
        <div className='grid gap-1.5'>
          <div
            role='radiogroup'
            aria-label={t('create.expiry')}
            className='inline-flex w-fit flex-wrap overflow-hidden rounded-lg border'
          >
            {[...EXPIRY_DAYS, NEVER].map((choice: number | typeof NEVER) => {
              const checked = expiry === choice;
              return (
                <button
                  key={choice}
                  type='button'
                  role='radio'
                  aria-checked={checked}
                  onClick={() => setExpiry(choice)}
                  className={`border-l px-3 py-1.5 text-sm first:border-l-0 ${checked ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  {choice === NEVER
                    ? t('create.never')
                    : t('create.days', { count: choice })}
                </button>
              );
            })}
          </div>
          <p className='text-xs text-muted-foreground'>
            {t('system.create.expiryHint')}
          </p>
        </div>
      </Row>
      <div className='grid min-w-0 gap-2'>
        <PermissionTable
          value={grants}
          onChange={setGrants}
          ceiling={grantable}
          systemKey
          scopeRecords={(props) => <ScopeRecordPicker {...props} />}
          objectExtra={(resource) =>
            sources.has(resource.id) && granted.has(resource.id) ? (
              <RecordPicker
                business={resource.id}
                value={objects[resource.id]}
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
        <p className='text-xs text-muted-foreground'>
          {t('system.create.dataRules')}
        </p>
      </div>
      {error ? (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      ) : null}
      <KeyCreateActions submitting={submitting} onCancel={onCancel} />
    </form>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: {
  readonly label: string;
  readonly htmlFor?: string;
  readonly children: ReactElement;
}): ReactElement {
  return (
    <div className='grid min-w-0 gap-1.5 md:grid-cols-[8rem_1fr] md:gap-4'>
      {htmlFor ? (
        <Label htmlFor={htmlFor} className='md:pt-2'>
          {label}
        </Label>
      ) : (
        <span className='text-sm font-medium md:pt-2'>{label}</span>
      )}
      <div className='min-w-0'>{children}</div>
    </div>
  );
}
