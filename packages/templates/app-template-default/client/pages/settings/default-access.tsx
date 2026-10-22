import { RecordLink } from '#components/record-link';
import { useTableUrlState } from '#hooks/use-table-url-state';
import { useApiClient, useToaster } from '@nocobase/app-client';
import {
  useCan,
  type AuthorizationOptionsResponse,
  type LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useRef, useState, type ReactElement } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { ListFilterIcon, MoreHorizontalIcon, PlusIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Alert, AlertDescription } from '#components/ui/alert';
import { PermissionManagementPage } from './permission-management-page.js';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { ConfirmAction, SettingsError, SettingsLoading } from './shared.js';
import { useSettingsData } from './hooks.js';
import {
  actionKey,
  resourceKey,
  ruleResources,
  ruleScopes,
  type DefaultAccessRule,
} from './default-access-model.js';

export default function DefaultAccessPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const searchRef = useRef<HTMLInputElement>(null);
  const rules = useSettingsData<{ data: readonly DefaultAccessRule[] }>(
    'authorization/defaultAccess',
  );
  const catalog = useSettingsData<{ data: AuthorizationOptionsResponse }>(
    'authorization/defaultAccess/options',
  );
  const canCreate = useCan({
    resource: { type: 'settings', id: 'authorization.default-access' },
    action: 'create',
  }).can;
  const canDelete = useCan({
    resource: { type: 'settings', id: 'authorization.default-access' },
    action: 'delete',
  }).can;
  const [removing, setRemoving] = useState<DefaultAccessRule>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [conflict, setConflict] = useState(false);
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
  const resources = catalog.data ? ruleResources(catalog.data.data) : [];
  const name = (rule: DefaultAccessRule): string =>
    text(
      resources.find(
        (resource) => resourceKey(resource) === resourceKey(rule.resource),
      )?.title ?? rule.resource.id,
    );
  const summary = (rule: DefaultAccessRule): string => {
    const resource = resources.find(
      (resource) => resourceKey(resource) === resourceKey(rule.resource),
    );
    const scopes = catalog.data ? ruleScopes(resource, catalog.data.data) : [];
    return (
      rule.actions
        .map((entry) => {
          const scope = scopes.find((scope) => scope.id === actionKey(entry));
          const label =
            entry.selection.type === 'all'
              ? t('settings.defaultAccess.all')
              : entry.selection.type === 'records'
                ? t('settings.defaultAccess.records', {
                    count: entry.selection.ids.length,
                  })
                : text(
                    catalog.data?.data.recordAccess.find(
                      (item) =>
                        entry.selection.type === 'recordAccess' &&
                        item.key === entry.selection.key,
                    )?.title ?? entry.selection.key,
                  );
          return `${text(scope?.actionTitle ?? entry.action)}${scope ? ` · ${text(scope.title)}` : entry.scopeKey ? ` · ${entry.scopeKey}` : ''}: ${label}`;
        })
        .join('; ') || t('settings.defaultAccess.none')
    );
  };
  const columns: ColumnDef<DefaultAccessRule>[] = [
    {
      id: 'resource',
      accessorFn: name,
      sortingFn: (a, b) =>
        name(a.original).localeCompare(name(b.original), i18n.language),
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('settings.defaultAccess.resource')}
        />
      ),
      cell: ({ row }) => (
        <RecordLink
          to={{
            pathname: `${encodeURIComponent(row.original.key)}/edit`,
            search: location.search,
          }}
        >
          {name(row.original)}
        </RecordLink>
      ),
    },
    {
      accessorKey: 'key',
      header: t('settings.key'),
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className='block max-w-48 truncate text-muted-foreground'
          title={row.original.key}
        >
          {row.original.key}
        </span>
      ),
    },
    {
      id: 'scopes',
      header: t('settings.defaultAccess.scopes'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className='block max-w-96 truncate' title={summary(row.original)}>
          {summary(row.original)}
        </span>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('settings.actionsFor', {
                  name: name(row.original),
                })}
              >
                <MoreHorizontalIcon />
              </Button>
            }
          />
          <DropdownMenuContent align='end' className='w-auto min-w-40'>
            <DropdownMenuItem
              render={
                <Link
                  to={{
                    pathname: `${encodeURIComponent(row.original.key)}/edit`,
                    search: location.search,
                  }}
                />
              }
            >
              {t('settings.defaultAccess.open')}
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => {
                    setError(undefined);
                    setRemoving(row.original);
                  }}
                >
                  {t('settings.defaultAccess.delete')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  const rows = (rules.data?.data ?? [])
    .filter((rule) =>
      `${name(rule)} ${rule.key}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) => name(a).localeCompare(name(b), i18n.language));
  const tableState = useTableUrlState({
    defaultPageSize: 20,
    sortColumns: ['resource'],
    rowCount:
      rules.data &&
      !rules.loading &&
      !rules.error &&
      catalog.data &&
      !catalog.loading &&
      !catalog.error
        ? rows.length
        : undefined,
  });
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
  const eligible = resources.some(
    (resource) =>
      !rules.data?.data.some(
        (rule) => resourceKey(rule.resource) === resourceKey(resource),
      ),
  );
  const create =
    canCreate && rules.data && catalog.data ? (
      eligible ? (
        <Button
          nativeButton={false}
          render={<Link to={{ pathname: 'create', search: location.search }} />}
        >
          <PlusIcon />
          {t('settings.defaultAccess.new')}
        </Button>
      ) : (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground'>
            {t('settings.defaultAccess.noResourcesShort')}
          </span>
          <Button disabled>
            <PlusIcon />
            {t('settings.defaultAccess.new')}
          </Button>
        </div>
      )
    ) : null;
  const remove = async () => {
    if (!removing || busy || !canDelete) return;
    setBusy(true);
    setError(undefined);
    try {
      const latest = await api.request<{ data: readonly DefaultAccessRule[] }>({
        path: 'authorization/defaultAccess',
      });
      if (
        JSON.stringify(
          latest.data.find((rule) => rule.key === removing.key),
        ) !== JSON.stringify(removing)
      ) {
        rules.reload();
        setRemoving(undefined);
        setConflict(true);
        requestAnimationFrame(() => searchRef.current?.focus());
        return;
      }
      await api.request({
        path: `authorization/defaultAccess/${encodeURIComponent(removing.key)}`,
        method: 'DELETE',
      });
      toaster.show({
        type: 'success',
        title: t('settings.defaultAccess.deleted', { name: name(removing) }),
      });
      rules.replaceData({
        data: (rules.data?.data ?? []).filter(
          (rule) => rule.key !== removing.key,
        ),
      });
      setRemoving(undefined);
      rules.reload();
      requestAnimationFrame(() => searchRef.current?.focus());
    } catch (next) {
      setError(next);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PermissionManagementPage
        tab='default-access'
        actions={
          rules.data && (rules.data.data.length || search) ? create : undefined
        }
      >
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            ref={searchRef}
            className='sm:max-w-xs'
            value={search}
            placeholder={t('settings.defaultAccess.search')}
            aria-label={t('settings.defaultAccess.search')}
            onChange={(event) =>
              setParams(
                (old) => {
                  const next = new URLSearchParams(old);
                  next.delete('page');
                  if (event.target.value) next.set('q', event.target.value);
                  else next.delete('q');
                  return next;
                },
                { replace: true },
              )
            }
          />
          {search && (
            <Button variant='ghost' onClick={clearSearch}>
              {t('settings.clear')}
            </Button>
          )}
        </div>
        {conflict && (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('settings.defaultAccess.deleteChanged')}
            </AlertDescription>
          </Alert>
        )}
        <SettingsError
          error={rules.error || catalog.error || (!removing && error)}
          retry={() => {
            rules.reload();
            catalog.reload();
            setError(undefined);
          }}
        />
        {(rules.loading && !rules.data) ||
        (catalog.loading && !catalog.data) ? (
          <SettingsLoading />
        ) : (
          !rules.error &&
          !catalog.error &&
          (rows.length ? (
            <DataTable
              {...tableState}
              columns={columns}
              data={rows}
              getRowId={(rule) => rule.key}
              showSelectedCount={false}
              pageSize={20}
            />
          ) : (
            <Empty className='min-h-48 border border-dashed'>
              <EmptyMedia variant='icon'>
                <ListFilterIcon />
              </EmptyMedia>
              <EmptyTitle>
                {t(
                  search
                    ? 'settings.noResults'
                    : 'settings.defaultAccess.empty',
                )}
              </EmptyTitle>
              <EmptyDescription>
                {t(
                  search
                    ? 'settings.clearHint'
                    : canCreate
                      ? 'settings.defaultAccess.emptyHint'
                      : 'settings.defaultAccess.readOnlyEmpty',
                )}
              </EmptyDescription>
              <EmptyContent>
                {search ? (
                  <Button variant='outline' onClick={clearSearch}>
                    {t('settings.clear')}
                  </Button>
                ) : (
                  create
                )}
              </EmptyContent>
            </Empty>
          ))
        )}
        <ConfirmAction
          error={<SettingsError error={error} />}
          open={Boolean(removing)}
          title={t('settings.defaultAccess.deleteTitle', {
            name: removing ? name(removing) : '',
          })}
          description={t('settings.defaultAccess.deleteHint')}
          confirmLabel={t('settings.defaultAccess.delete')}
          busy={busy}
          onCancel={() => {
            setRemoving(undefined);
            setError(undefined);
          }}
          onConfirm={() => {
            void remove();
          }}
        />
      </PermissionManagementPage>
      <Outlet
        context={{
          reload: rules.reload,
          saved: (updated: DefaultAccessRule) => {
            rules.replaceData({
              data: [
                ...(rules.data?.data ?? []).filter(
                  (rule) => rule.key !== updated.key,
                ),
                updated,
              ],
            });
            rules.reload();
          },
        }}
      />
    </>
  );
}
