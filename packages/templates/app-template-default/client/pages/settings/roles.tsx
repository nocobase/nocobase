import { useListLocation } from '#hooks/use-list-location';
import { useSettingsData, useRolePermission } from './hooks.js';
import { useTranslation } from '@nocobase/i18n/client';
import type {
  PermissionSet,
  LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import { type ReactElement } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { ShieldCheckIcon, PlusIcon } from 'lucide-react';
import { PermissionManagementPage } from './permission-management-page.js';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import { useTableUrlState } from '#hooks/use-table-url-state';
import { RoleList } from '#components/role-list';
import {
  Empty,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '#components/ui/empty';
import { SettingsError, SettingsLoading } from './shared.js';

export default function RolesPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const { params, setParams, active } = useListLocation();
  const location = useLocation();
  const search = params.get('q') ?? '';
  const request = useSettingsData<{ data: readonly PermissionSet[] }>(
    'authorization/permissionSets',
    { active },
  );
  const canCreate = useRolePermission('create');
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
  const rows = (request.data?.data ?? [])
    .filter((role) =>
      text(role.title ?? role.key)
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) =>
      text(a.title ?? a.key).localeCompare(
        text(b.title ?? b.key),
        i18n.language,
      ),
    );
  const tableState = useTableUrlState({
    active,
    revision: request.revision,
    sortColumns: ['title', 'key'],
    rowCount:
      request.data && !request.loading && !request.error
        ? rows.length
        : undefined,
  });
  const create = canCreate ? (
    <Button
      nativeButton={false}
      render={<Link to={{ pathname: 'create', search: location.search }} />}
    >
      <PlusIcon />
      {t('settings.newRole')}
    </Button>
  ) : null;
  return (
    <>
      <PermissionManagementPage
        tab='roles'
        actions={rows.length || search ? create : undefined}
      >
        <div className='flex items-center gap-3'>
          <Input
            className='sm:max-w-xs'
            value={search}
            placeholder={t('settings.roleSearch')}
            aria-label={t('settings.roleSearch')}
            onChange={(event) => {
              setParams(
                (old) => {
                  const next = new URLSearchParams(old);
                  next.delete('page');
                  if (event.target.value) next.set('q', event.target.value);
                  else next.delete('q');
                  return next;
                },
                { replace: true },
              );
            }}
          />
          {search && (
            <Button
              variant='ghost'
              onClick={() => {
                setParams(
                  (old) => {
                    const next = new URLSearchParams(old);
                    next.delete('q');
                    next.delete('page');
                    return next;
                  },
                  { replace: true },
                );
              }}
            >
              {t('settings.clear')}
            </Button>
          )}
        </div>
        <SettingsError
          error={tableState.error ?? request.error}
          retry={request.reload}
        />
        {request.loading && !request.data ? (
          <SettingsLoading />
        ) : (
          !tableState.error &&
          !request.error &&
          (rows.length ? (
            <RoleList
              tableState={tableState}
              ariaLabel={t('settings.roles')}
              roles={rows.map((role) => ({
                key: role.key,
                title: text(role.title ?? role.key),
                to: {
                  pathname: `${encodeURIComponent(role.key)}/edit`,
                  search: location.search,
                },
                protected: Boolean(role.protection),
              }))}
              labels={{
                name: t('settings.roleName'),
                key: t('settings.key'),
                type: t('settings.roleType'),
                protected: t('settings.protected'),
                custom: t('settings.custom'),
              }}
            />
          ) : (
            <Empty className='min-h-48 border border-dashed'>
              <EmptyMedia variant='icon'>
                <ShieldCheckIcon />
              </EmptyMedia>
              <EmptyTitle>
                {t(search ? 'settings.noResults' : 'settings.noRoles')}
              </EmptyTitle>
              <EmptyDescription>
                {t(
                  search
                    ? 'settings.clearHint'
                    : canCreate
                      ? 'settings.rolesDescription'
                      : 'settings.rolesReadOnlyEmpty',
                )}
              </EmptyDescription>
              <EmptyContent>
                {search ? (
                  <Button
                    variant='outline'
                    onClick={() => {
                      setParams(
                        (old) => {
                          const next = new URLSearchParams(old);
                          next.delete('q');
                          next.delete('page');
                          return next;
                        },
                        { replace: true },
                      );
                    }}
                  >
                    {t('settings.clear')}
                  </Button>
                ) : (
                  create
                )}
              </EmptyContent>
            </Empty>
          ))
        )}
      </PermissionManagementPage>
      <Outlet context={{ reload: request.reload }} />
    </>
  );
}
