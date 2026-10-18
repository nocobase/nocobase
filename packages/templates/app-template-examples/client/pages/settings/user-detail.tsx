import {
  useSettingsData,
  useUserPermission,
  useSettingsLeave,
} from './hooks.js';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import {
  UsersClient,
  type ManagedUser,
  type UserRoleScopeOption,
  type UserRoleValue,
  type UsersOptions,
} from '@nocobase/app-plugin-users/client/user-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '#components/ui/card';
import { RoleSelection } from './user-form.js';
import { ConfirmAction, SettingsError, SettingsLoading } from './shared.js';

function ScopeCard({
  scope,
  user,
  reload,
  onDirtyChange,
}: {
  readonly scope: UserRoleScopeOption;
  readonly user: ManagedUser;
  readonly reload: (updated?: ManagedUser) => void;
  readonly onDirtyChange: (dirty: boolean, busy: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const client = useMemo(() => new UsersClient(api), [api]);
  const allowed = useUserPermission('assign-role', user.id);
  const current =
    user.roleScopes[scope.key] ?? (scope.selection === 'single' ? '' : []);
  const key = JSON.stringify(current);
  const [draftValue, setDraftValue] = useState<UserRoleValue>();
  const value = draftValue ?? current;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [confirm, setConfirm] = useState(false);
  const changed = JSON.stringify(value) !== key;
  const removed = (typeof current === 'string' ? [current] : current).filter(
    (item) => !(typeof value === 'string' ? [value] : value).includes(item),
  );
  const save = async () => {
    setBusy(true);
    onDirtyChange(changed, true);
    setError(undefined);
    let saved = false;
    try {
      const updated = await client.replaceRoleScope(user.id, scope.key, value);
      saved = true;
      onDirtyChange(false, false);
      reload(updated);
      toaster.show({
        type: 'success',
        title: t('settings.rolesSaved', { name: user.name }),
      });
      setConfirm(false);
    } catch (next) {
      setError(next);
    } finally {
      setBusy(false);
      onDirtyChange(!saved && changed, false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {scope.labelI18nKey
            ? t(scope.labelI18nKey, {
                ns: scope.labelI18nNs,
                defaultValue: scope.label,
              })
            : scope.label}
        </CardTitle>
        <CardDescription>{t('settings.rolesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <RoleSelection
          scope={scope}
          value={value}
          onChange={(next) => {
            setDraftValue(next);
            onDirtyChange(JSON.stringify(next) !== key, false);
          }}
          disabled={!allowed || busy}
        />
        <SettingsError error={error} />
      </CardContent>
      {allowed && (
        <CardFooter className='justify-end'>
          <Button
            disabled={!changed || busy}
            onClick={() => (removed.length ? setConfirm(true) : void save())}
          >
            {t(busy ? 'settings.saving' : 'settings.save')}
          </Button>
        </CardFooter>
      )}
      <ConfirmAction
        open={confirm}
        confirmLabel={t('settings.revokeRoles')}
        title={t('settings.revokeRoleTitle', { name: user.name })}
        description={
          <>
            <p>{t('settings.revokeRoleHint')}</p>
            <p>
              {scope.labelI18nKey
                ? t(scope.labelI18nKey, {
                    ns: scope.labelI18nNs,
                    defaultValue: scope.label,
                  })
                : scope.label}
              :{' '}
              {removed
                .map((key) => {
                  const option = scope.options.find(
                    (item) => item.value === key,
                  );
                  return option?.labelI18nKey
                    ? t(option.labelI18nKey, {
                        ns: option.labelI18nNs,
                        defaultValue: option.label,
                      })
                    : (option?.label ?? key);
                })
                .join(', ')}
            </p>
            <SettingsError error={error} />
          </>
        }
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void save()}
      />
    </Card>
  );
}
function UserDetailView(): ReactElement {
  const { userId = '' } = useParams();
  const [draftRevision, setDraftRevision] = useState(0);
  const [scopeState, setScopeState] = useState<
    Record<string, { dirty: boolean; busy: boolean }>
  >({});
  const leave = useSettingsLeave(
    Object.values(scopeState).some((state) => state.dirty),
    Object.values(scopeState).some((state) => state.busy),
    () => {
      setScopeState({});
      setDraftRevision((value) => value + 1);
    },
  );
  const { t } = useTranslation();
  const location = useLocation();
  const parent = useOutletContext<{ reload: () => void }>();
  const request = useSettingsData<{ data: ManagedUser }>(
    `users/${encodeURIComponent(userId)}`,
  );
  const missingRef = useRef<unknown>(undefined);
  useEffect(() => {
    if (
      request.error instanceof ApiClientError &&
      request.error.status === 404 &&
      missingRef.current !== request.error
    ) {
      missingRef.current = request.error;
      parent.reload();
    }
  }, [request.error, parent]);
  const options = useSettingsData<{ data: UsersOptions }>('users/options');
  const canUpdate = useUserPermission('update', userId);
  const user = request.data?.data;
  const reload = (updated?: ManagedUser) => {
    if (updated) request.replaceData({ data: updated });
    request.reload();
    parent.reload();
  };
  return (
    <RouteDrawer
      beforeClose={leave.guard}
      title={user?.name ?? t('settings.users')}
      closeTo={{ pathname: '/settings/users', search: location.search }}
      footer={
        canUpdate && user ? (
          <Button
            variant='outline'
            nativeButton={false}
            render={<Link to={{ pathname: 'edit', search: location.search }} />}
          >
            {t('settings.edit')}
          </Button>
        ) : undefined
      }
    >
      <SettingsError error={request.error} retry={reload} />
      {request.loading && !user ? (
        <SettingsLoading />
      ) : (
        user && (
          <div className='flex flex-col gap-6'>
            <dl className='grid grid-cols-[8rem_minmax(0,1fr)] gap-3 text-sm'>
              {(['name', 'username', 'email'] as const).map((field) => (
                <div key={field} className='contents'>
                  <dt className='text-muted-foreground'>
                    {t(`settings.${field}`)}
                  </dt>
                  <dd className='min-w-0 break-words'>{user[field] || '—'}</dd>
                </div>
              ))}
              <dt className='text-muted-foreground'>{t('settings.status')}</dt>
              <dd>
                <Badge variant='secondary'>
                  {t(
                    user.disabledAt ? 'settings.disabled' : 'settings.enabled',
                  )}
                </Badge>
              </dd>
            </dl>
            <SettingsError error={options.error} retry={options.reload} />
            {options.data?.data.roleScopes.map((scope) => (
              <ScopeCard
                key={`${draftRevision}:${scope.key}:${JSON.stringify(user.roleScopes[scope.key])}`}
                scope={scope}
                user={user}
                reload={reload}
                onDirtyChange={(dirty, busy) =>
                  setScopeState((old) => ({
                    ...old,
                    [scope.key]: { dirty, busy },
                  }))
                }
              />
            ))}
          </div>
        )
      )}
      {leave.dialog}
      <Outlet context={{ reload }} />
    </RouteDrawer>
  );
}

export default function UserDetail(): ReactElement {
  const { userId } = useParams();
  return <UserDetailView key={userId} />;
}
