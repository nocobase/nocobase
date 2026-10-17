import { DataTable, DataTableColumnHeader } from '#components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useSettingsData, useUserPermission } from './hooks.js';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  UsersClient,
  type ManagedUser,
} from '@nocobase/app-plugin-users/client/user-client';
import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactElement,
} from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { MoreHorizontalIcon, PlusIcon, UsersIcon } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Badge } from '#components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#components/ui/dropdown-menu';
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { ConfirmAction, SettingsError, SettingsLoading } from './shared.js';

function UserActions({
  user,
  reload,
}: {
  readonly user: ManagedUser;
  readonly reload: (updated?: ManagedUser) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const client = useMemo(() => new UsersClient(api), [api]);
  const canUpdate = useUserPermission('update', user.id);
  const canDisable = useUserPermission('disable', user.id);
  const canEnable = useUserPermission('enable', user.id);
  const canRevoke = useUserPermission('revoke-sessions', user.id);
  const location = useLocation();
  const [action, setAction] = useState<
    'disable' | 'enable' | 'revokeSessions'
  >();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const run = async () => {
    if (!action) return;
    setBusy(true);
    setError(undefined);
    try {
      const updated = await client[action](user.id);
      toaster.show({
        type: 'success',
        title: t('settings.actionSaved', { name: user.name }),
      });
      setAction(undefined);
      reload(updated ?? undefined);
    } catch (next) {
      setError(next);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size='icon-sm'
              variant='ghost'
              aria-label={t('settings.actionsFor', { name: user.name })}
            >
              <MoreHorizontalIcon />
            </Button>
          }
        />
        <DropdownMenuContent align='end' className='w-auto min-w-40'>
          {canUpdate && (
            <DropdownMenuItem
              render={
                <Link
                  to={{ pathname: `${user.id}/edit`, search: location.search }}
                />
              }
            >
              {t('settings.edit')}
            </DropdownMenuItem>
          )}
          {(canDisable || canEnable || canRevoke) && <DropdownMenuSeparator />}
          {!user.disabledAt && canDisable && (
            <DropdownMenuItem
              variant='destructive'
              onClick={() => setAction('disable')}
            >
              {t('settings.disable')}
            </DropdownMenuItem>
          )}
          {user.disabledAt && canEnable && (
            <DropdownMenuItem onClick={() => setAction('enable')}>
              {t('settings.enable')}
            </DropdownMenuItem>
          )}
          {canRevoke && (
            <DropdownMenuItem
              variant='destructive'
              onClick={() => setAction('revokeSessions')}
            >
              {t('settings.revokeSessions')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmAction
        open={Boolean(action)}
        title={t(
          `settings.${action === 'disable' ? 'disableTitle' : action === 'enable' ? 'enableTitle' : 'revokeTitle'}`,
          { name: user.name },
        )}
        description={
          <>
            <p>
              {t(
                action === 'disable'
                  ? 'settings.disableHint'
                  : action === 'enable'
                    ? 'settings.enableHint'
                    : 'settings.revokeHint',
              )}
            </p>
            <SettingsError error={error} />
          </>
        }
        confirmLabel={t(`settings.${action ?? 'confirm'}`)}
        busy={busy}
        onCancel={() => setAction(undefined)}
        onConfirm={() => void run()}
      />
    </>
  );
}

export default function UsersPage(): ReactElement {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [queryDraft, setQueryDraft] = useState<{
    key: string;
    value: string;
  }>();
  const query =
    queryDraft?.key === location.key
      ? queryDraft.value
      : (params.get('q') ?? '');
  const setQuery = (value: string) =>
    setQueryDraft({ key: location.key, value });
  const [composing, setComposing] = useState(false);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const status = params.get('status') ?? 'all';
  const pageSize = [20, 50, 100].includes(Number(params.get('pageSize')))
    ? Number(params.get('pageSize'))
    : 20;
  const update = (key: string, value: string) => {
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };
  useEffect(() => {
    if (composing || query === (params.get('q') ?? '')) return;
    const timer = setTimeout(() => {
      setParams(
        (old) => {
          const next = new URLSearchParams(old);
          if (query) next.set('q', query);
          else next.delete('q');
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [query, composing, params, setParams]);
  const remote = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(params.get('q') ? { q: params.get('q')! } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(params.get('order')
      ? { sort: 'name', order: params.get('order')! }
      : {}),
  });
  const request = useSettingsData<{
    data: readonly ManagedUser[];
    meta: { total: number };
  }>(`users?${remote}`, true);
  const { data: pageData, replaceData, reload: refreshUsers } = request;
  const reload = useCallback(
    (updated?: ManagedUser) => {
      if (updated && pageData)
        replaceData({
          ...pageData,
          data: pageData.data.map((row) =>
            row.id === updated.id ? updated : row,
          ),
        });
      refreshUsers();
    },
    [pageData, replaceData, refreshUsers],
  );
  const canCreate = useUserPermission('create');
  const canAssign = useUserPermission('assign-role');
  const rows = request.data?.data ?? [];
  const columns = useMemo<ColumnDef<ManagedUser>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('settings.name')} />
        ),
        enableHiding: false,
        cell: ({ row }) => (
          <Link
            className='font-medium text-primary hover:underline'
            to={{
              pathname: row.original.id,
              search: location.search,
            }}
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'email',
        header: t('settings.email'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className='block max-w-64 truncate' title={row.original.email}>
            {row.original.email}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('settings.status'),
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant='secondary'>
            {t(
              row.original.disabledAt
                ? 'settings.disabled'
                : 'settings.enabled',
            )}
          </Badge>
        ),
      },
      {
        id: 'roles',
        header: t('settings.assignedRoles'),
        enableSorting: false,
        cell: ({ row }) =>
          Object.values(row.original.roleScopes).flat().join(', ') || '—',
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('settings.actions')}</span>,
        enableSorting: false,
        cell: ({ row }) => <UserActions user={row.original} reload={reload} />,
      },
    ],
    [t, location.search, reload],
  );
  const create =
    canCreate && canAssign ? (
      <Button
        nativeButton={false}
        render={<Link to={{ pathname: 'create', search: location.search }} />}
      >
        <PlusIcon />
        {t('settings.newUser')}
      </Button>
    ) : null;
  const filtered = Boolean(params.get('q')) || status !== 'all';
  return (
    <>
      <PageContainer>
        <PageHeader
          title={t('settings.users')}
          description={t('settings.usersDescription')}
          actions={rows.length || filtered ? create : undefined}
        />
        <div className='flex flex-wrap items-center gap-3'>
          <Input
            className='w-full sm:max-w-xs'
            value={query}
            aria-label={t('settings.userSearch')}
            placeholder={t('settings.userSearch')}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            items={['all', 'enabled', 'disabled'].map((value) => ({
              value,
              label: t(`settings.${value}`),
            }))}
            value={status}
            onValueChange={(value) => update('status', String(value))}
          >
            <SelectTrigger aria-label={t('settings.status')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {['all', 'enabled', 'disabled'].map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`settings.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtered && (
            <Button
              variant='ghost'
              onClick={() => {
                setQuery('');
                setParams({});
              }}
            >
              {t('settings.clear')}
            </Button>
          )}
        </div>
        {request.data && request.loading && (
          <span role='status' className='text-sm text-muted-foreground'>
            {t('settings.loading')}
          </span>
        )}
        <SettingsError error={request.error} retry={request.reload} />
        {request.loading && !request.data ? (
          <SettingsLoading />
        ) : (
          !request.error &&
          (rows.length ? (
            <DataTable<ManagedUser>
              columns={columns}
              data={rows}
              getRowId={(row) => row.id}
              manualPagination
              rowCount={request.data?.meta.total ?? 0}
              paginationState={{ pageIndex: page - 1, pageSize }}
              onPaginationChange={(updater) => {
                const next =
                  typeof updater === 'function'
                    ? updater({ pageIndex: page - 1, pageSize })
                    : updater;
                setParams((old) => {
                  const result = new URLSearchParams(old);
                  result.set('page', String(next.pageIndex + 1));
                  result.set('pageSize', String(next.pageSize));
                  return result;
                });
              }}
              manualSorting
              sortingState={
                params.get('order')
                  ? [{ id: 'name', desc: params.get('order') === 'desc' }]
                  : []
              }
              onSortingChange={(updater) => {
                const previous = params.get('order')
                  ? [{ id: 'name', desc: params.get('order') === 'desc' }]
                  : [];
                const next =
                  typeof updater === 'function' ? updater(previous) : updater;
                update('order', next[0] ? (next[0].desc ? 'desc' : 'asc') : '');
              }}
              pageSizeOptions={[20, 50, 100]}
              showSelectedCount={false}
              loading={request.loading}
            />
          ) : (
            <Empty className='min-h-48 border border-dashed'>
              <EmptyMedia variant='icon'>
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>
                {t(filtered ? 'settings.noResults' : 'settings.noUsers')}
              </EmptyTitle>
              <EmptyDescription>
                {t(
                  filtered ? 'settings.clearHint' : 'settings.usersDescription',
                )}
              </EmptyDescription>
              <EmptyContent>
                {filtered ? (
                  <Button
                    variant='outline'
                    onClick={() => {
                      setQuery('');
                      setParams({});
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
        {request.data && (
          <p className='text-sm text-muted-foreground'>
            {t('settings.total', { count: request.data.meta.total })}
          </p>
        )}
      </PageContainer>
      <Outlet context={{ reload }} />
    </>
  );
}
