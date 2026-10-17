import {
  useSettingsLeave,
  useSettingsData,
  useUserPermission,
} from './hooks.js';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import {
  UsersClient,
  type ManagedUser,
  type UsersOptions,
  type UserRoleValue,
  type UserRoleScopeOption,
} from '@nocobase/app-plugin-users/client/user-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { RouteDialog } from '#components/route-dialog';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Switch } from '#components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { SettingsError, SettingsLoading } from './shared.js';

export function RoleSelection({
  scope,
  value,
  onChange,
  disabled = false,
}: {
  readonly scope: UserRoleScopeOption;
  readonly value: UserRoleValue;
  readonly onChange: (value: UserRoleValue) => void;
  readonly disabled?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const label = scope.labelI18nKey
    ? t(scope.labelI18nKey, {
        ns: scope.labelI18nNs,
        defaultValue: scope.label,
      })
    : scope.label;
  const text = (option: UserRoleScopeOption['options'][number]) =>
    option.labelI18nKey
      ? t(option.labelI18nKey, {
          ns: option.labelI18nNs,
          defaultValue: option.label,
        })
      : option.label;
  return (
    <div className='flex flex-col gap-2'>
      <Label>
        {label}
        {scope.requiredOnCreate ? ' *' : ''}
      </Label>
      {scope.selection === 'single' ? (
        <Select
          items={scope.options.map((option) => ({
            value: option.value,
            label: text(option),
          }))}
          value={typeof value === 'string' ? value : ''}
          disabled={
            disabled ||
            scope.options.some(
              (option) => option.value === value && option.removable === false,
            )
          }
          onValueChange={(next) => {
            if (next !== null) onChange(next);
          }}
        >
          <SelectTrigger aria-label={label} className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {scope.options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.assignable === false && value !== option.value}
              >
                {text(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className='flex flex-col gap-2 rounded-lg border p-3'>
          {scope.options.map((option) => {
            const current = typeof value === 'string' ? [] : value;
            const checked = current.includes(option.value);
            return (
              <label
                key={option.value}
                className='flex items-center gap-3 text-sm'
              >
                <Switch
                  checked={checked}
                  disabled={
                    disabled ||
                    (checked
                      ? option.removable === false
                      : option.assignable === false)
                  }
                  onCheckedChange={(next) =>
                    onChange(
                      next
                        ? [...current, option.value]
                        : current.filter((item) => item !== option.value),
                    )
                  }
                />
                {text(option)}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserEditor(): ReactElement {
  const { userId } = useParams();
  const creating = !userId;
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const client = useMemo(() => new UsersClient(api), [api]);
  const navigate = useNavigate();
  const location = useLocation();
  const parent = useOutletContext<{
    reload: (updated?: ManagedUser) => void;
  }>();
  const data = useSettingsData<{ data: ManagedUser }>(
    userId ? `users/${encodeURIComponent(userId)}` : 'users/options',
  );
  const missingRef = useRef<unknown>(undefined);
  useEffect(() => {
    if (
      data.error instanceof ApiClientError &&
      data.error.status === 404 &&
      missingRef.current !== data.error
    ) {
      missingRef.current = data.error;
      parent.reload();
    }
  }, [data.error, parent]);
  const options = useSettingsData<{ data: UsersOptions }>('users/options');
  const canCreate = useUserPermission('create');
  const canAssign = useUserPermission('assign-role', userId ?? '*');
  const canUpdate = useUserPermission('update', userId ?? '*');
  const [draftFields, setDraftFields] = useState<{
    name: string;
    username: string;
    email: string;
    password: string;
  }>();
  const initial = !creating ? data.data?.data : undefined;
  const fields = draftFields ?? {
    name: initial?.name ?? '',
    username: initial?.username ?? '',
    email: initial?.email ?? '',
    password: '',
  };
  const [roles, setRoles] = useState<Record<string, UserRoleValue>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const leave = useSettingsLeave(dirty, busy);
  const [error, setError] = useState<unknown>();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const closeTo = {
    pathname: creating
      ? '/settings/users'
      : `/settings/users/${encodeURIComponent(userId)}`,
    search: location.search,
  };
  const fieldError = (name: keyof typeof fields): string | undefined => {
    if (!submitted) return;
    if (serverErrors[name]) return serverErrors[name];
    if (
      (name === 'name' || (name === 'password' && creating)) &&
      !fields[name].trim()
    )
      return t('settings.required');
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      return t('settings.invalidEmail');
    return;
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const form = event.currentTarget;
    if (
      !fields.name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) ||
      (creating && !fields.password.trim())
    ) {
      form.querySelector<HTMLInputElement>('input:invalid')?.focus();
      return;
    }
    if (data.error || (creating && (options.error || !options.data))) return;
    if (creating) {
      const missing = (options.data?.data.roleScopes ?? []).filter(
        (scope) => scope.requiredOnCreate && !roles[scope.key]?.length,
      );
      if (missing.length) {
        setServerErrors(
          Object.fromEntries(
            missing.map((scope) => [scope.key, t('settings.required')]),
          ),
        );
        return;
      }
    }
    setBusy(true);
    setError(undefined);
    setServerErrors({});
    try {
      let updated: ManagedUser;
      if (creating)
        updated = await client.create({
          ...fields,
          name: fields.name.trim(),
          email: fields.email.trim(),
          ...(fields.username.trim()
            ? { username: fields.username.trim() }
            : { username: undefined }),
          roleScopes: roles,
        });
      else
        updated = await client.update(userId, {
          name: fields.name.trim(),
          email: fields.email.trim(),
          username: fields.username.trim() || null,
        });
      setDirty(false);
      parent.reload(updated);
      toaster.show({
        type: 'success',
        title: t(creating ? 'settings.created' : 'settings.saved', {
          name: fields.name,
        }),
      });
      leave.allow();
      void navigate(closeTo);
    } catch (next) {
      if (
        next instanceof ApiClientError &&
        [
          'PASSWORD_TOO_SHORT',
          'PASSWORD_TOO_LONG',
          'USER_IDENTITY_CONFLICT',
        ].includes(next.reason ?? '')
      ) {
        const field =
          next.reason === 'USER_IDENTITY_CONFLICT' ? 'email' : 'password';
        setServerErrors({
          [field]: t(
            field === 'password'
              ? 'settings.passwordPolicy'
              : 'settings.identityConflict',
          ),
        });
        form.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
      } else {
        setError(next);
      }
    } finally {
      setBusy(false);
    }
  };
  const allowed = creating ? canCreate && canAssign : canUpdate;
  const formId = creating ? 'new-user' : 'edit-user';
  return (
    <RouteDialog
      className={creating ? undefined : 'sm:max-w-md'}
      title={t(creating ? 'settings.newUser' : 'settings.editUser')}
      closeTo={closeTo}
      beforeClose={leave.guard}
      footer={
        <>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => void navigate(closeTo)}
          >
            {t('settings.cancel')}
          </Button>
          {allowed && (
            <Button
              form={formId}
              type='submit'
              disabled={
                busy ||
                Boolean(data.error) ||
                (!creating && data.loading) ||
                (creating &&
                  (options.loading || Boolean(options.error) || !options.data))
              }
            >
              {t(
                busy
                  ? 'settings.saving'
                  : creating
                    ? 'settings.create'
                    : 'settings.save',
              )}
            </Button>
          )}
        </>
      }
    >
      <SettingsError error={data.error} retry={data.reload} />
      {creating && (
        <SettingsError error={options.error} retry={options.reload} />
      )}
      <SettingsError error={error} />
      {!creating && data.loading ? (
        <SettingsLoading />
      ) : (
        !data.error && (
          <form
            id={formId}
            onSubmit={(event) => void save(event)}
            noValidate
            className='flex flex-col gap-4'
          >
            {(
              [
                'name',
                'username',
                'email',
                ...(creating ? ['password'] : []),
              ] as (keyof typeof fields)[]
            ).map((name) => (
              <div key={name} className='flex flex-col gap-2'>
                <Label htmlFor={`${formId}-${name}`}>
                  {t(`settings.${name}`)}
                  {name !== 'username' ? ' *' : ''}
                </Label>
                <Input
                  id={`${formId}-${name}`}
                  name={name}
                  required={name !== 'username'}
                  type={
                    name === 'password'
                      ? 'password'
                      : name === 'email'
                        ? 'email'
                        : 'text'
                  }
                  autoComplete={name === 'password' ? 'new-password' : 'off'}
                  disabled={!allowed || busy}
                  value={fields[name]}
                  aria-invalid={Boolean(fieldError(name))}
                  aria-describedby={
                    fieldError(name) ? `${formId}-${name}-error` : undefined
                  }
                  onChange={(event) => {
                    setDraftFields(() => ({
                      ...fields,
                      [name]: event.target.value,
                    }));
                    setServerErrors((old) => ({ ...old, [name]: '' }));
                    setDirty(true);
                  }}
                />
                {fieldError(name) && (
                  <p
                    id={`${formId}-${name}-error`}
                    className='text-xs text-destructive'
                  >
                    {fieldError(name)}
                  </p>
                )}
              </div>
            ))}
            {creating &&
              options.data?.data.roleScopes.map((scope) => (
                <div key={scope.key}>
                  <RoleSelection
                    scope={scope}
                    disabled={!allowed || busy}
                    value={
                      roles[scope.key] ??
                      (scope.selection === 'single' ? '' : [])
                    }
                    onChange={(value) => {
                      setRoles((old) => ({ ...old, [scope.key]: value }));
                      setServerErrors((old) => ({ ...old, [scope.key]: '' }));
                      setDirty(true);
                    }}
                  />
                  {serverErrors[scope.key] && (
                    <p className='text-xs text-destructive'>
                      {serverErrors[scope.key]}
                    </p>
                  )}
                </div>
              ))}
          </form>
        )
      )}
      {leave.dialog}
    </RouteDialog>
  );
}

export default function UserForm(): ReactElement {
  const { userId } = useParams();
  return <UserEditor key={userId ?? '$new'} />;
}
