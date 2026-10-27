import { useListLocation } from '#hooks/use-list-location';
import { useSettingsData, useRolePermission } from './hooks.js';
import { useTranslation } from '@nocobase/i18n/client';
import type {
  PermissionSet,
  LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import { resolveListState } from '@nocobase/app-client';
import { type ReactElement } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { PlusIcon } from 'lucide-react';
import { PermissionManagementPage } from './permission-management-page.js';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { useTableUrlState } from '#hooks/use-table-url-state';
import { RoleList } from '#components/role-list';
import { ListFeedback, ListFeedbackActions } from '#components/list-feedback';

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
  const listState = resolveListState(
    {
      data: request.data,
      error: tableState.error ?? request.error,
      isPending: request.loading && !request.data,
    },
    rows.length,
    Boolean(search.trim()),
  );
  const canShowCreate =
    canCreate &&
    (listState === 'empty' ||
      listState === 'ready' ||
      listState === 'no-results' ||
      listState === 'refresh-failed');
  const clearSearch = () =>
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
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
        actions={canShowCreate ? create : undefined}
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
          {search && listState !== 'no-results' && (
            <Button variant='ghost' onClick={clearSearch}>
              {t('settings.clear')}
            </Button>
          )}
          <ListFeedbackActions
            state={listState}
            onClear={clearSearch}
            onRetry={request.reload}
            busy={request.loading}
          />
          {active && request.loading && request.data ? (
            <Spinner className='text-muted-foreground' />
          ) : null}
        </div>
        <ListFeedback state={listState}>
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
        </ListFeedback>
      </PermissionManagementPage>
      <Outlet context={{ reload: request.reload }} />
    </>
  );
}
