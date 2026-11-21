/**
 * Personal settings › API keys › New key. A key is Custom — permissions picked from what the person holds today, all of
 * them to start with but high-risk ones, narrowed with a template, quick settings or one by one — or, where the
 * application allows it, Same as me. Once made, its secret is shown on this page, this once.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { TriangleAlertIcon } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Skeleton } from '#components/ui/skeleton';
import { Textarea } from '#components/ui/textarea';
import type {
  CreatedApiKey,
  GrantablePermissions,
  KeyPermissionGrant,
  KeyPermissions,
  LocalizedText,
} from '../../shared/scopes.js';
import { ErrorAlert } from '../components/key-parts.js';
import { KeySecret } from '../components/key-secret.js';
import { PermissionTable } from '../components/permission-table.js';
import { RecordPicker } from '../components/record-picker.js';
import { useApiKeysApi } from '../lib/api.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';
import type { PersonalKeysOutletContext } from './personal-keys.js';

const EXPIRY_DAYS = [30, 90, 180, 365] as const;
const NEVER = 'never' as const;

type Mode = 'custom' | 'sameAsMe';

/** Everything the person may give a key, without high-risk actions, which are turned on one by one after a warning. */
function everything(grantable: GrantablePermissions): KeyPermissionGrant[] {
  return grantable.grants.flatMap((grant) => {
    const actions = grant.actions
      .filter((action) => action.humanOnly === null && action.risk !== 'high')
      .map((action) => ({ action: action.action }));
    return actions.length ? [{ resource: grant.resource, actions }] : [];
  });
}

export default function PersonalKeyCreatePage(): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const api = useApiKeysApi();
  const navigate = useNavigate();
  const outlet = useOutletContext<PersonalKeysOutletContext | undefined>();
  const [grantable, setGrantable] = useState<GrantablePermissions>();
  const [loadError, setLoadError] = useState<unknown>();
  const [created, setCreated] = useState<CreatedApiKey>();

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

  const close = (): void => {
    outlet?.reload();
    void navigate('..', { relative: 'path' });
  };

  return (
    <PageContainer className='max-w-[1120px]'>
      <PageHeader title={created ? t('created.title') : t('create.title')} />
      {loadError ? (
        <ErrorAlert error={loadError} />
      ) : !grantable ? (
        <Skeleton className='h-96 w-full' />
      ) : created ? (
        <CreatedKey created={created} onDone={close} />
      ) : (
        <CreateForm
          grantable={grantable}
          onCreated={setCreated}
          onCancel={() => void navigate('..', { relative: 'path' })}
        />
      )}
    </PageContainer>
  );
}

function CreatedKey({
  created,
  onDone,
}: {
  readonly created: CreatedApiKey;
  readonly onDone: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation(API_KEYS_NAMESPACE);
  const { session } = useAuthentication();
  const expires = created.key.expiresAt;
  return (
    <section className='grid min-w-0 gap-4 rounded-xl border bg-card p-4 text-card-foreground sm:p-6'>
      <KeySecret
        secret={created.secret}
        details={[
          { label: t('created.name'), value: created.key.name },
          {
            label: t('created.identity'),
            value: t('created.you', { name: session?.user.name ?? '' }),
          },
          {
            label: t('created.expires'),
            value: expires
              ? new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: 'medium',
                }).format(new Date(expires))
              : t('common.never'),
          },
        ]}
      />
      <div className='flex justify-end'>
        <Button type='button' onClick={onDone}>
          {t('created.done')}
        </Button>
      </div>
    </section>
  );
}

function CreateForm({
  grantable,
  onCreated,
  onCancel,
}: {
  readonly grantable: GrantablePermissions;
  readonly onCreated: (created: CreatedApiKey) => void;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const api = useApiKeysApi();
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.key,
        });
  const max = grantable.maxScopedKeyDays;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<Mode>('custom');
  const [expiry, setExpiry] = useState<number | typeof NEVER>(
    grantable.defaultExpiresInDays,
  );
  const [grants, setGrants] = useState<readonly KeyPermissionGrant[]>(() =>
    everything(grantable),
  );
  const [objects, setObjects] = useState<
    Readonly<Record<string, readonly string[]>>
  >({});
  const [template, setTemplate] = useState<string>('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const scoped = mode === 'custom';
  const choices = EXPIRY_DAYS.filter((days) => max === null || days <= max);
  const neverAllowed = !scoped || max === null;
  // A choice no longer offered, such as Never after switching to Custom, falls back to the default.
  const shownExpiry =
    expiry === NEVER
      ? neverAllowed
        ? NEVER
        : grantable.defaultExpiresInDays
      : expiry;
  const sources = useMemo(
    () => new Set(grantable.objectSources),
    [grantable.objectSources],
  );
  const granted = new Set(grants.map((grant) => grant.resource.id));
  const readOnlyTemplate = grantable.templates.find(
    (entry) => entry.id === 'read-only',
  );

  const applyTemplate = (id: string): void => {
    const found = grantable.templates.find((entry) => entry.id === id);
    if (!found) return;
    setTemplate(id);
    setGrants(found.permissions.grants);
    setObjects(found.permissions.objects ?? {});
    if (found.expiresInDays !== null)
      setExpiry(
        max === null ? found.expiresInDays : Math.min(found.expiresInDays, max),
      );
  };

  const submit = async (): Promise<void> => {
    setError(undefined);
    if (!name.trim()) {
      setError(t('create.errors.INVALID_NAME'));
      return;
    }
    let permissions: KeyPermissions | null = null;
    if (scoped) {
      if (!grants.length) {
        setError(t('create.nothingSelected'));
        return;
      }
      const picked = Object.fromEntries(
        Object.entries(objects).filter(([business]) => granted.has(business)),
      );
      const missing = Object.entries(picked).find(([, ids]) => !ids.length);
      if (missing) {
        setError(t('create.pickRequired', { name: missing[0] }));
        return;
      }
      permissions = {
        grants,
        ...(Object.keys(picked).length ? { objects: picked } : {}),
      };
    }
    setSubmitting(true);
    try {
      onCreated(
        await api.create({
          name: name.trim(),
          description: description.trim() || null,
          expiresInDays: shownExpiry === NEVER ? null : shownExpiry,
          permissions,
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

  const quick = (
    <div className='flex min-w-0 flex-wrap items-center gap-2'>
      <Select
        items={grantable.templates.map((entry) => ({
          value: entry.id,
          label: text(entry.title),
        }))}
        value={template || null}
        onValueChange={(next: string | null) => {
          if (next) applyTemplate(next);
        }}
      >
        <SelectTrigger
          size='sm'
          aria-label={t('create.template')}
          className='min-w-48'
        >
          <SelectValue placeholder={t('create.template')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {grantable.templates.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {text(entry.title)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <span className='ml-auto text-xs text-muted-foreground'>
        {t('create.quick')}
      </span>
      <Button
        type='button'
        size='sm'
        variant='outline'
        onClick={() => {
          setTemplate('');
          setGrants(everything(grantable));
          setObjects({});
        }}
      >
        {t('create.everything')}
      </Button>
      {readOnlyTemplate ? (
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => applyTemplate(readOnlyTemplate.id)}
        >
          {t('create.readOnly')}
        </Button>
      ) : null}
      <Button
        type='button'
        size='sm'
        variant='outline'
        onClick={() => {
          setTemplate('');
          setGrants([]);
          setObjects({});
        }}
      >
        {t('create.clear')}
      </Button>
    </div>
  );

  return (
    <form
      noValidate
      className='grid min-w-0 gap-6 rounded-xl border bg-card p-4 text-card-foreground sm:p-6'
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Field label={t('create.name')} htmlFor='api-key-name'>
        <Input
          id='api-key-name'
          value={name}
          maxLength={100}
          placeholder={t('create.namePlaceholder')}
          className='max-w-md'
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label={t('create.description')} htmlFor='api-key-description'>
        <Textarea
          id='api-key-description'
          value={description}
          maxLength={500}
          rows={2}
          placeholder={t('create.descriptionPlaceholder')}
          className='max-w-md'
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Field label={t('create.scope')}>
        <div
          role='radiogroup'
          aria-label={t('create.scope')}
          className='grid max-w-2xl gap-2'
        >
          <Choice
            checked={mode === 'custom'}
            title={t('create.custom')}
            hint={t('create.customHint')}
            onSelect={() => setMode('custom')}
          />
          <Choice
            checked={mode === 'sameAsMe'}
            disabled={!grantable.allowSameAsMe}
            title={t('create.sameAsMe')}
            hint={
              grantable.allowSameAsMe
                ? t('create.sameAsMeHint')
                : t('create.sameAsMeOff')
            }
            onSelect={() => setMode('sameAsMe')}
          />
        </div>
      </Field>
      <Field label={t('create.expiry')}>
        <div className='grid gap-1.5'>
          <div
            role='radiogroup'
            aria-label={t('create.expiry')}
            className='inline-flex w-fit flex-wrap overflow-hidden rounded-lg border'
          >
            {[...choices, NEVER].map((choice: number | typeof NEVER) => {
              const disabled = choice === NEVER && !neverAllowed;
              const checked = shownExpiry === choice;
              return (
                <button
                  key={choice}
                  type='button'
                  role='radio'
                  aria-checked={checked}
                  disabled={disabled}
                  onClick={() => setExpiry(choice)}
                  className={`border-l px-3 py-1.5 text-sm first:border-l-0 disabled:cursor-not-allowed disabled:opacity-40 ${checked ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  {choice === NEVER
                    ? t('create.never')
                    : t('create.days', { count: choice })}
                </button>
              );
            })}
          </div>
          <p className='text-xs text-muted-foreground'>
            {scoped && max !== null
              ? t('create.maxDays', { count: max })
              : t('create.neverDiscouraged')}
          </p>
        </div>
      </Field>
      {scoped ? (
        <div className='grid min-w-0 gap-2'>
          <span className='text-sm font-medium'>{t('detail.what')}</span>
          <PermissionTable
            value={grants}
            onChange={(next) => {
              setTemplate('');
              setGrants(next);
            }}
            ceiling={grantable}
            header={quick}
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
            {t('create.dataRules')}
          </p>
        </div>
      ) : (
        <Alert variant='destructive'>
          <TriangleAlertIcon aria-hidden />
          <AlertDescription>{t('create.sameAsMeWarning')}</AlertDescription>
        </Alert>
      )}
      {error ? (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      ) : null}
      <div className='flex flex-wrap justify-end gap-2 border-t pt-4'>
        <Button type='button' variant='outline' onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type='submit' disabled={submitting}>
          {submitting ? t('create.submitting') : t('create.submit')}
        </Button>
      </div>
    </form>
  );
}

function Field({
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

function Choice({
  checked,
  disabled = false,
  title,
  hint,
  onSelect,
}: {
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly title: string;
  readonly hint: string;
  readonly onSelect: () => void;
}): ReactElement {
  return (
    <button
      type='button'
      role='radio'
      aria-checked={checked}
      disabled={disabled}
      onClick={onSelect}
      className={`flex min-w-0 items-start gap-3 rounded-lg border p-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
    >
      <span
        aria-hidden
        className={`mt-0.5 size-4 shrink-0 rounded-full border ${checked ? 'border-4 border-primary' : ''}`}
      />
      <span className='grid min-w-0 gap-0.5'>
        <span className='text-sm font-medium'>{title}</span>
        <span className='text-xs text-muted-foreground'>{hint}</span>
      </span>
    </button>
  );
}
