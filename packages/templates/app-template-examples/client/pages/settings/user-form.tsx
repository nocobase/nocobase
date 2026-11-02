import { FeedbackForm } from '#components/feedback-form';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useSubmission } from '@nocobase/app-client';
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
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useResolvedPath,
} from 'react-router';
import { RouteDialog } from '#components/route-dialog';
import { RouteDrawer } from '#components/route-drawer';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import {
  Combobox,
  ComboboxTrigger,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '#components/ui/combobox';
import { ConfirmAction, SettingsError, SettingsLoading } from './shared.js';

export function RoleSelection({
  scope,
  value,
  onChange,
  disabled = false,
  id,
  error,
}: {
  readonly scope: UserRoleScopeOption;
  readonly value: UserRoleValue;
  readonly onChange: (value: UserRoleValue) => void;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly error?: string;
}): ReactElement {
  const { t } = useTranslation();
  const generatedId = useId();
  const triggerId = id ?? generatedId;
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
  const selected =
    typeof value === 'string' ? (value ? [value] : []) : [...value];
  const items = [
    ...scope.options.map((option) => option.value),
    ...selected.filter(
      (key) => !scope.options.some((option) => option.value === key),
    ),
  ];
  const itemLabel = (key: string) => {
    const option = scope.options.find((item) => item.value === key);
    return option ? text(option) : key;
  };
  const locked =
    disabled ||
    (scope.selection === 'single' &&
      scope.options.some(
        (option) =>
          selected.includes(option.value) && option.removable === false,
      ));
  const summary = selected.length
    ? selected.map(itemLabel).join(', ')
    : t('settings.selectRoles');
  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor={triggerId}>
        {label}
        {scope.requiredOnCreate ? ' *' : ''}
      </Label>
      <Combobox
        items={items}
        itemToStringLabel={itemLabel}
        multiple={scope.selection === 'multiple'}
        value={scope.selection === 'single' ? (selected[0] ?? null) : selected}
        disabled={locked}
        onValueChange={(next) => {
          const proposed =
            next === null ? [] : typeof next === 'string' ? [next] : next;
          if (
            scope.options.some(
              (option) =>
                (selected.includes(option.value) &&
                  !proposed.includes(option.value) &&
                  option.removable === false) ||
                (!selected.includes(option.value) &&
                  proposed.includes(option.value) &&
                  option.assignable === false),
            )
          )
            return;
          onChange(
            scope.selection === 'single' ? (proposed[0] ?? '') : proposed,
          );
        }}
      >
        <ComboboxTrigger
          id={triggerId}
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${triggerId}-error` : undefined}
          disabled={locked}
          render={
            <Button
              variant='outline'
              className='w-full justify-between font-normal'
            />
          }
        >
          <span className='min-w-0 truncate' title={summary}>
            {summary}
          </span>
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput
            aria-label={t('settings.searchRoles')}
            placeholder={t('settings.searchRoles')}
            showTrigger={false}
          />
          <ComboboxEmpty>{t('settings.noRolesFound')}</ComboboxEmpty>
          <ComboboxList>
            {(key: string) => {
              const option = scope.options.find((item) => item.value === key);
              return (
                <ComboboxItem
                  key={key}
                  value={key}
                  disabled={
                    selected.includes(key)
                      ? option?.removable === false
                      : option?.assignable === false
                  }
                >
                  <span className='min-w-0 whitespace-normal break-words'>
                    {itemLabel(key)}
                  </span>
                </ComboboxItem>
              );
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {scope.key === 'app' && selected.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          {t('settings.noRoleAccess')}
        </p>
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
    listPath?: string;
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
  const [roleDraft, setRoleDraft] = useState<Record<string, UserRoleValue>>({});
  const defaults = creating
    ? Object.fromEntries(
        (options.data?.data.roleScopes ?? [])
          .filter((scope) => scope.defaultValue !== undefined)
          .map((scope) => [scope.key, scope.defaultValue!]),
      )
    : {};
  const roles = { ...defaults, ...(initial?.roleScopes ?? {}), ...roleDraft };
  const changedRoles = Object.fromEntries(
    Object.entries(roleDraft).filter(
      ([key, value]) =>
        JSON.stringify(value) !==
        JSON.stringify(
          initial?.roleScopes[key] ?? (typeof value === 'string' ? '' : []),
        ),
    ),
  );
  const removedRoles = (options.data?.data.roleScopes ?? []).flatMap(
    (scope) => {
      const before = initial?.roleScopes[scope.key] ?? [];
      const after = roles[scope.key] ?? [];
      return (typeof before === 'string' ? [before] : before)
        .filter(
          (key) => !(typeof after === 'string' ? [after] : after).includes(key),
        )
        .map((key) => {
          const option = scope.options.find((item) => item.value === key);
          return option?.labelI18nKey
            ? t(option.labelI18nKey, {
                ns: option.labelI18nNs,
                defaultValue: option.label,
              })
            : (option?.label ?? key);
        });
    },
  );
  const [confirmRoles, setConfirmRoles] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const { session } = useAuthentication();
  const submission = useSubmission({
    scope: `${session?.user.id}:settings:user:${userId}`,
  });
  const [requestBusy, setRequestBusy] = useState(false);
  const busy = requestBusy || submission.submitting;
  const leave = useSettingsLeave(dirty, busy);
  const [error, setError] = useState<unknown>();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const parentPath = useResolvedPath('..').pathname;
  const closeTo = {
    pathname: creating ? parentPath : (parent.listPath ?? parentPath),
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
  const save = async (form: HTMLFormElement, confirmed = false) => {
    if (busy || !(creating ? canCreate && canAssign : canUpdate || canAssign))
      return;
    setSubmitted(true);
    if (
      !fields.name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) ||
      (creating && !fields.password.trim())
    ) {
      form.querySelector<HTMLInputElement>('input:invalid')?.focus();
      return;
    }
    if (
      data.error ||
      data.loading ||
      (canAssign && (options.loading || options.error || !options.data))
    )
      return;
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
        document
          .getElementById(
            `${formId}-roles-${encodeURIComponent(missing[0].key)}`,
          )
          ?.focus();
        return;
      }
    }
    if (!creating && !canUpdate && Object.keys(changedRoles).length === 0)
      return;
    if (!creating && removedRoles.length > 0 && !confirmed) {
      setConfirmRoles(true);
      return;
    }
    setRequestBusy(true);
    setError(undefined);
    setServerErrors({});
    try {
      const input = creating
        ? {
            ...fields,
            name: fields.name.trim(),
            email: fields.email.trim(),
            ...(fields.username.trim()
              ? { username: fields.username.trim() }
              : { username: undefined }),
            roleScopes: roles,
          }
        : {
            ...(canUpdate
              ? {
                  name: fields.name.trim(),
                  email: fields.email.trim(),
                  username: fields.username.trim() || null,
                }
              : {}),
            ...(canAssign && Object.keys(changedRoles).length
              ? { roleScopes: changedRoles }
              : {}),
          };
      const updated = await submission.run(
        { userId, creating, input },
        (idempotencyKey) =>
          creating
            ? client.create(
                input as Parameters<typeof client.create>[0],
                idempotencyKey,
              )
            : client.update(userId, input, idempotencyKey),
      );
      if (!updated) return;
      setDirty(false);
      parent.reload(updated);
      toaster.show({
        type: 'success',
        title: t(creating ? 'settings.created' : 'settings.saved', {
          name: fields.name,
        }),
      });
      setConfirmRoles(false);
      leave.allow();
      void navigate(closeTo, { replace: true });
    } catch (next) {
      setConfirmRoles(false);
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
      setRequestBusy(false);
    }
  };
  const allowed = creating ? canCreate && canAssign : canUpdate || canAssign;
  const formId = creating ? 'new-user' : 'edit-user';
  const focusedRef = useRef(false);
  useEffect(() => {
    if (creating || data.loading || data.error || focusedRef.current) return;
    focusedRef.current = true;
    const frame = requestAnimationFrame(() =>
      document.getElementById(`${formId}-name`)?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [creating, data.error, data.loading, formId]);
  const actions = (
    <>
      <Button
        variant='outline'
        disabled={busy}
        onClick={() => void navigate(closeTo, { replace: true })}
      >
        {t('settings.cancel')}
      </Button>
      {allowed && (
        <Button
          form={formId}
          type='submit'
          disabled={
            busy ||
            (!creating &&
              (!dirty ||
                (!canUpdate && Object.keys(changedRoles).length === 0))) ||
            Boolean(data.error) ||
            (!creating &&
              (data.loading ||
                (canAssign &&
                  (options.loading ||
                    Boolean(options.error) ||
                    !options.data)))) ||
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
  );
  const body = (
    <>
      <SettingsError error={data.error} retry={data.reload} />
      <SettingsError error={options.error} retry={options.reload} />
      {!creating && data.loading ? (
        <SettingsLoading />
      ) : (
        !data.error && (
          <FeedbackForm
            submitting={busy}
            error={error}
            errorContent={<SettingsError error={error} inline />}
            id={formId}
            ref={formRef}
            onSubmit={(event) => {
              event.preventDefault();
              void save(event.currentTarget);
            }}
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
                  disabled={!(creating ? allowed : canUpdate) || busy}
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
                    data-feedback-field-error
                    id={`${formId}-${name}-error`}
                    className='text-xs text-destructive'
                  >
                    {fieldError(name)}
                  </p>
                )}
              </div>
            ))}
            {options.data?.data.roleScopes.map((scope) => (
              <div key={scope.key}>
                <RoleSelection
                  scope={scope}
                  id={`${formId}-roles-${encodeURIComponent(scope.key)}`}
                  error={serverErrors[scope.key]}
                  disabled={!canAssign || busy}
                  value={
                    roles[scope.key] ?? (scope.selection === 'single' ? '' : [])
                  }
                  onChange={(value) => {
                    setRoleDraft((old) => ({ ...old, [scope.key]: value }));
                    setServerErrors((old) => ({ ...old, [scope.key]: '' }));
                    setDirty(true);
                  }}
                />
                {serverErrors[scope.key] && (
                  <p
                    data-feedback-field-error
                    id={`${formId}-roles-${encodeURIComponent(scope.key)}-error`}
                    className='text-xs text-destructive'
                  >
                    {serverErrors[scope.key]}
                  </p>
                )}
              </div>
            ))}
          </FeedbackForm>
        )
      )}
      {leave.dialog}
    </>
  );
  if (!creating)
    return (
      <RouteDrawer
        title={t('settings.editUser')}
        description={initial?.name}
        closeTo={closeTo}
        beforeClose={leave.guard}
        footer={actions}
      >
        {body}
        <ConfirmAction
          open={confirmRoles}
          title={t('settings.revokeRoleTitle', { name: fields.name })}
          description={`${t('settings.revokeRoleHint')} ${removedRoles.join(', ')}`}
          confirmLabel={t('settings.save')}
          busy={busy}
          onCancel={() => setConfirmRoles(false)}
          onConfirm={() => {
            if (formRef.current) void save(formRef.current, true);
          }}
        />
      </RouteDrawer>
    );
  return (
    <RouteDialog
      title={t('settings.newUser')}
      closeTo={closeTo}
      beforeClose={leave.guard}
      footer={actions}
    >
      {body}
    </RouteDialog>
  );
}

export default function UserForm(): ReactElement {
  const { userId } = useParams();
  return <UserEditor key={userId ?? '$new'} />;
}
