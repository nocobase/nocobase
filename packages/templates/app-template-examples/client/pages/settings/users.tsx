import { useListLocation } from '#hooks/use-list-location';
import { RecordLink } from '#components/record-link';
import { BackButton } from '#components/back-button';
import { safeReturnTo } from '../../lib/return-to.js';
import {
  readTableUrlState,
  useTableUrlState,
} from '#hooks/use-table-url-state';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useSettingsData, useUserPermission } from './hooks.js';
import { useApiClient, useSubmission, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  UsersClient,
  type ManagedUser,
  type UsersOptions,
} from '@nocobase/app-plugin-users/client/user-client';
import {
  useCallback,
  useRef,
  useMemo,
  useState,
  useEffect,
  type ReactElement,
} from 'react';
import { Link, Outlet, useLocation, useResolvedPath } from 'react-router';
import { PlusIcon, UsersIcon } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { StatusBadge } from '#components/status-badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { ConfirmAction, SettingsError, SettingsLoading } from './shared.js';

function UserName({ user }: { readonly user: ManagedUser }): ReactElement {
  const canUpdate = useUserPermission('update', user.id);
  const canAssign = useUserPermission('assign-role', user.id);
  const location = useLocation();
  return canUpdate || canAssign ? (
    <RecordLink to={{ pathname: `${user.id}/edit`, search: location.search }}>
      {user.name}
    </RecordLink>
  ) : (
    <span className='font-medium'>{user.name}</span>
  );
}

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
  const canDisable = useUserPermission('disable', user.id);
  const canEnable = useUserPermission('enable', user.id);
  const canRevoke = useUserPermission('revoke-sessions', user.id);
  const [action, setAction] = useState<
    'disable' | 'enable' | 'revokeSessions'
  >();
  const [requestBusy, setRequestBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const submission = useSubmission();
  const busy = requestBusy || submission.submitting;
  const run = async () => {
    if (!action) return;
    setRequestBusy(true);
    setError(undefined);
    try {
      const outcome = await submission.run(
        { action, id: user.id },
        async (key) => ({ updated: await client[action](user.id, key) }),
      );
      if (!outcome) return;
      const updated = outcome.updated;
      toaster.show({
        type: 'success',
        title: t(`settings.userActionSaved.${action}`, { name: user.name }),
      });
      setAction(undefined);
      reload(updated ?? undefined);
    } catch (next) {
      setError(next);
    } finally {
      setRequestBusy(false);
    }
  };
  if (!canRevoke && !(user.disabledAt ? canEnable : canDisable)) return <></>;
  return (
    <div className='flex items-center justify-end gap-2 whitespace-nowrap'>
      {!user.disabledAt && canDisable && (
        <Button
          variant='outline'
          size='xs'
          onClick={() => setAction('disable')}
        >
          {t('settings.disable')}
        </Button>
      )}
      {user.disabledAt && canEnable && (
        <Button variant='outline' size='xs' onClick={() => setAction('enable')}>
          {t('settings.enable')}
        </Button>
      )}
      {canRevoke && (
        <Button
          variant='outline'
          size='xs'
          onClick={() => setAction('revokeSessions')}
        >
          {t('settings.revokeSessions')}
        </Button>
      )}
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
    </div>
  );
}

export default function UsersPage(): ReactElement {
  const { t } = useTranslation();
  const { params, setParams, active } = useListLocation();
  const location = useLocation();
  const listPath = useResolvedPath('.').pathname;
  const searchRef = useRef<HTMLInputElement>(null);
  const previousPathRef = useRef(location.pathname);
  useEffect(() => {
    const returned =
      previousPathRef.current !== location.pathname &&
      location.pathname === listPath;
    previousPathRef.current = location.pathname;
    if (!returned) return;
    const frame = requestAnimationFrame(() => {
      if (
        document.activeElement === document.body ||
        !document.activeElement?.isConnected
      )
        searchRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [listPath, location.pathname]);
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
  const options = useSettingsData<{ data: UsersOptions }>('users/options');
  const roleScopes = useMemo(
    () => options.data?.data.roleScopes ?? [],
    [options.data],
  );
  const returnTo = safeReturnTo(params.get('returnTo'));
  const roleScope = params.get('roleScope') ?? '';
  const role = params.get('role') ?? '';
  const roleText = useCallback(
    (option: { label: string; labelI18nKey?: string; labelI18nNs?: string }) =>
      option.labelI18nKey
        ? t(option.labelI18nKey, {
            ns: option.labelI18nNs,
            defaultValue: option.label,
          })
        : option.label,
    [t],
  );
  const roleChoices = roleScopes.flatMap((scope) =>
    scope.options.map((option) => ({
      value: JSON.stringify([scope.key, option.value]),
      label: `${roleText(scope)} · ${roleText(option)}`,
    })),
  );
  const selectedRole =
    roleScope && role ? JSON.stringify([roleScope, role]) : 'all';
  if (
    selectedRole !== 'all' &&
    !roleChoices.some((option) => option.value === selectedRole)
  )
    roleChoices.push({ value: selectedRole, label: `${roleScope} · ${role}` });
  const { paginationState, sortingState } = readTableUrlState(params, {
    defaultPageSize: 20,
    pageSizeOptions: [20, 50, 100],
    sortColumns: ['name'],
  });
  const page = paginationState.pageIndex + 1;
  const status = params.get('status') ?? 'all';
  const pageSize = paginationState.pageSize;
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
    ...(roleScope ? { roleScope } : {}),
    ...(role ? { role } : {}),
    ...(sortingState[0]
      ? {
          sort: sortingState[0].id,
          order: sortingState[0].desc ? 'desc' : 'asc',
        }
      : {}),
  });
  const request = useSettingsData<{
    data: readonly ManagedUser[];
    meta: { total: number };
  }>(`users?${remote}`, { keepPreviousData: true, active });
  const tableState = useTableUrlState({
    active,
    revision: request.revision,
    defaultPageSize: 20,
    pageSizeOptions: [20, 50, 100],
    sortColumns: ['name'],
    rowCount:
      !request.loading && !request.error ? request.data?.meta.total : undefined,
  });
  const clearFilters = () => {
    setQuery('');
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        for (const key of ['q', 'status', 'roleScope', 'role', 'page'])
          next.delete(key);
        return next;
      },
      { replace: true },
    );
  };
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
      if (updated && location.pathname === listPath)
        requestAnimationFrame(() => searchRef.current?.focus());
    },
    [pageData, replaceData, refreshUsers, location.pathname, listPath],
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
        cell: ({ row }) => <UserName user={row.original} />,
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
          <StatusBadge tone={row.original.disabledAt ? 'neutral' : 'success'}>
            {t(
              row.original.disabledAt
                ? 'settings.disabled'
                : 'settings.enabled',
            )}
          </StatusBadge>
        ),
      },
      {
        id: 'roles',
        header: t('settings.assignedRoles'),
        enableSorting: false,
        cell: ({ row }) =>
          Object.entries(row.original.roleScopes)
            .flatMap(([scopeKey, value]) => {
              const scope = roleScopes.find((entry) => entry.key === scopeKey);
              return (typeof value === 'string' ? [value] : value).map(
                (key) => {
                  const option = scope?.options.find(
                    (entry) => entry.value === key,
                  );
                  return option ? roleText(option) : key;
                },
              );
            })
            .join(', ') || t('settings.noAssignedRoles'),
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('settings.actions')}</span>,
        enableSorting: false,
        cell: ({ row }) => <UserActions user={row.original} reload={reload} />,
      },
    ],
    [t, reload, roleScopes, roleText],
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
  const filtered =
    Boolean(params.get('q') || roleScope || role) || status !== 'all';
  return (
    <>
      <PageContainer>
        {returnTo && (
          <BackButton to={returnTo}>{t('settings.backToSource')}</BackButton>
        )}
        <PageHeader
          title={t('settings.users')}
          description={t('settings.usersDescription')}
          actions={rows.length || filtered ? create : undefined}
        />
        <div className='flex flex-wrap items-center gap-3'>
          <Input
            ref={searchRef}
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
          <Select
            items={[
              { value: 'all', label: t('settings.allRoles') },
              ...roleChoices,
            ]}
            value={selectedRole}
            onValueChange={(value) => {
              if (!value) return;
              setParams(
                (old) => {
                  const next = new URLSearchParams(old);
                  next.delete('page');
                  if (value === 'all') {
                    next.delete('roleScope');
                    next.delete('role');
                  } else {
                    const [scope, key] = JSON.parse(value) as [string, string];
                    next.set('roleScope', scope);
                    next.set('role', key);
                  }
                  return next;
                },
                { replace: true },
              );
            }}
          >
            <SelectTrigger aria-label={t('settings.roleFilter')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {[
                { value: 'all', label: t('settings.allRoles') },
                ...roleChoices,
              ].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtered && (
            <Button variant='ghost' onClick={clearFilters}>
              {t('settings.clear')}
            </Button>
          )}
        </div>
        {request.data && request.loading && (
          <span role='status' className='text-sm text-muted-foreground'>
            {t('settings.loading')}
          </span>
        )}
        {Boolean(roleScope) !== Boolean(role) && (
          <p role='alert' className='text-sm text-destructive'>
            {t('settings.roleFilterIncomplete')}
          </p>
        )}
        <SettingsError error={options.error} retry={options.reload} />
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
            <DataTable<ManagedUser>
              columns={columns}
              data={rows}
              getRowId={(row) => row.id}
              manualPagination
              rowCount={request.data?.meta.total ?? 0}
              {...tableState}
              manualSorting
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
                  filtered
                    ? 'settings.clearHint'
                    : canCreate && canAssign
                      ? 'settings.usersDescription'
                      : 'settings.usersReadOnlyEmpty',
                )}
              </EmptyDescription>
              <EmptyContent>
                {filtered ? (
                  <Button variant='outline' onClick={clearFilters}>
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
