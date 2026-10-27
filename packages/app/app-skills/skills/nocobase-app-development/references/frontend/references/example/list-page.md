# List page: `index.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [delete dialog](delete-dialog.md), [status badge](../i18n.md#dynamic-keys), [session alert](session-expired-alert.md), [types](types.md), [search hook](url-search.md), [copy](copy.md); the `projects` route in [section 1 of `page.md`](../page.md#1-declare-the-route).

**Add first**: `yes n | pnpm exec shadcn add alert empty input-group select skeleton table`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)), and reuse the template's shipped `DataTable` in `client/components/data-table/` with its supported `@tanstack/react-table` v8 dependency ([section 1 of `table.md`](../table.md#1-choosing-a-table-component)).

**Links to**: the [create dialog](create-dialog.md), the [detail drawer](detail-drawer.md) and the [edit dialog](edit-dialog.md), which a row's menu opens alone, are its child routes. Without a detail view, render the name as plain text: a link to a route that does not exist lands on the home page.

**Without detail and delete** (a list with only a create dialog), remove: the `actions` column and its row menu, the `deletion` state, `ProjectDeleteDialog` at the end, `focusSearchAfterReloadRef` with its effect, and `afterDelete`, `onSaved` and `onNotFound`, which leaves `outletContext` as `{ reload }`, `ProjectsOutletContext` in `types.ts` with only `reload` and no `ProjectEditOutletContext`; render the name as plain text.

Use the application's existing authorization hook to resolve the create permission before rendering the page-level action. Put the standard create action only in the page header, including when a successful query returns no records; do not wire it through the empty state's `emptyAction`. Follow [shared list feedback](../list-feedback.md) for error and query ownership.

Rules: sections [3](../table.md#3-known-datatable-behavior), [5](../table.md#5-writing-search-and-filters-to-the-url), [6](../table.md#6-loading-the-list), [7](../table.md#7-the-four-list-states), [8](../table.md#8-column-definitions-and-row-actions) and [9](../table.md#9-child-routes-and-refreshing-the-list) of `table.md`.

```tsx
// client/pages/projects/index.tsx
import { useApiClient } from '@nocobase/app-client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  type ReactElement,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
} from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import { useQuery } from '@tanstack/react-query';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { resolveListState, listStateShowsData } from '@nocobase/app-client';
import { DataTable } from '#components/data-table';
import { DataTableColumnHeader } from '#components/data-table/column-header';
import { useUrlSearch } from '#hooks/use-url-search';
import { useTableUrlState } from '#hooks/use-table-url-state';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Spinner } from '#components/ui/spinner';

import { ProjectDeleteDialog } from './project-delete-dialog.js';
import { ProjectStatusBadge } from './status-badge.js';
import {
  PROJECT_STATUSES,
  type Project,
  type ProjectEditOutletContext,
  type ProjectList,
  type ProjectStatus,
  type ProjectsOutletContext,
} from './types.js';

// The endpoint pages every list and caps a page at 100 records. This page sorts and paginates in the browser, so it
// asks for the largest page and says so when more records match (guideline T1.10). A list that outgrows it uses the
// server-paginated table (server-table.md).
const PAGE_SIZE = 100;

function isProjectStatus(value: string | null): value is ProjectStatus {
  return PROJECT_STATUSES.some((status) => status === value);
}

export default function ProjectsPage(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const api = useApiClient();
  // Use the same registered business resource and action as the create endpoint.
  const createPermission = useCan({
    resource: { type: 'project', id: '*' },
    action: 'create',
  });
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);

  // The search term lives in the URL behind a search box that keeps its own text (url-search.md): typing, input
  // methods, back and forward all stay in step. The status filter is read from the same parameters.
  const { searchParams, search, text, inputProps, updateParams, clear } =
    useUrlSearch({ resetParams: ['page'] });
  const statusParam = searchParams.get('status');
  // Treat an unrecognized value as no filter.
  const status = isProjectStatus(statusParam) ? statusParam : undefined;

  function changeStatus(value: string | null): void {
    updateParams((params) => {
      if (value && value !== 'all') params.set('status', value);
      else params.delete('status');
      params.delete('page');
    });
  }

  // Decide by the input's text, so "Clear filters" appears as soon as the first character is typed.
  const hasFilters = text.trim() !== '' || status !== undefined;

  function clearFilters(): void {
    clear((params) => params.delete('status'));
    // The "Clear filters" button disappears along with the filters; move focus to the search box (guideline A6).
    searchRef.current?.focus();
  }

  const request = useQuery({
    queryKey: ['projects', search.trim(), status ?? null],
    queryFn: ({ signal }) =>
      api.request<ProjectList>({
        path: 'projects',
        query: { q: search.trim() || undefined, status, pageSize: PAGE_SIZE },
        signal,
      }),
    retry: false,
  });
  const reload = useCallback(() => {
    void request.refetch();
  }, [request.refetch]);
  const loading = request.isFetching;
  const rowsFiltered = Boolean(search.trim() || status);
  const listState = resolveListState(
    request,
    request.data?.data.length ?? 0,
    rowsFiltered,
  );
  const rows = listStateShowsData(listState) ? request.data?.data : undefined;
  const canShowCreate =
    createPermission.can &&
    !createPermission.isPending &&
    (listState === 'empty' ||
      listState === 'ready' ||
      listState === 'no-results' ||
      listState === 'refresh-failed');
  const tableState = useTableUrlState({
    sortColumns: ['name', 'updatedAt'],
    rowCount:
      !loading && listStateShowsData(listState) ? rows?.length : undefined,
  });

  // After a record is deleted in the drawer, its row and the link that opened the drawer disappear once the list refreshes:
  // wait for the refresh to finish, then move focus to the search box (guideline A6).
  const focusSearchAfterReloadRef = useRef(false);
  useEffect(() => {
    if (loading || !focusSearchAfterReloadRef.current) return;
    focusSearchAfterReloadRef.current = false;
    searchRef.current?.focus();
  }, [loading]);

  // Keep the context passed to child routes stable; otherwise effects in child routes that depend on it run again and again.
  // The list opens the create dialog, the drawer and a row's edit dialog, so it passes what each of them reads.
  const outletContext = useMemo<
    ProjectsOutletContext & ProjectEditOutletContext
  >(
    () => ({
      reload,
      afterDelete: () => {
        focusSearchAfterReloadRef.current = true;
        reload();
      },
      // A row's edit dialog: after a save or on finding the record gone, the list is all there is to refresh.
      onSaved: () => reload(),
      onNotFound: reload,
    }),
    [reload],
  );

  // The delete confirmation dialog uses component state. Store the open state and the target separately:
  // closing changes only open, so the title stays the same during the exit animation.
  const [deletion, setDeletion] = useState<{
    readonly open: boolean;
    readonly project: Project | null;
  }>({ open: false, project: null });

  // The formatter and the collator follow the current language and are recreated when it switches.
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );
  const collator = useMemo(() => new Intl.Collator(locale), [locale]);

  const statusItems = [
    { value: 'all', label: t('projects.filters.allStatuses') },
    ...PROJECT_STATUSES.map((value) => ({
      value,
      label: t(`projects.status.${value}`),
    })),
  ];

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: 'name',
        enableHiding: false,
        // The default sort compares character codes, so Chinese does not sort by pinyin; use the current language's collation.
        sortingFn: (a, b) => collator.compare(a.original.name, b.original.name),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('projects.fields.name')}
          />
        ),
        cell: ({ row }) => (
          // The name links to the detail child route and keeps the current query parameters.
          <Link
            to={{ pathname: row.original.id, search: location.search }}
            className='font-medium hover:underline'
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'owner',
        header: t('projects.fields.owner'),
        cell: ({ row }) =>
          row.original.owner ?? (
            <span className='text-muted-foreground'>—</span>
          ),
      },
      {
        accessorKey: 'status',
        header: t('projects.fields.status'),
        cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'updatedAt',
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('projects.fields.updatedAt')}
          />
        ),
        cell: ({ row }) => (
          <span className='whitespace-nowrap text-muted-foreground'>
            {dateFormat.format(new Date(row.original.updatedAt))}
          </span>
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        header: () => (
          <span className='sr-only'>{t('projects.actions.label')}</span>
        ),
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('projects.actions.more', {
                      name: row.original.name,
                    })}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuGroup>
                  {/* Edit is the list's own child route, edit/:projectId: the menu item is a link, and the dialog opens alone over the list. */}
                  <DropdownMenuItem
                    render={
                      <Link
                        to={{
                          pathname: `edit/${encodeURIComponent(row.original.id)}`,
                          search: location.search,
                        }}
                      />
                    }
                  >
                    <PencilIcon />
                    {t('projects.actions.edit')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() =>
                      setDeletion({ open: true, project: row.original })
                    }
                  >
                    <Trash2Icon />
                    {t('projects.actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [collator, dateFormat, location.search, t],
  );

  const content = (
    <>
      {rows && (request.data?.meta.total ?? 0) > rows.length && (
        <p role='status'>{t('projects.capNotice', { count: rows.length })}</p>
      )}
      <DataTable
        {...tableState}
        columns={columns}
        data={rows ?? []}
        listState={listState}
        loading={loading}
        onRetry={reload}
        onClearFilters={clearFilters}
        getRowId={(row) => row.id}
        showSelectedCount={false}
        emptyMessage={
          <>
            <h2>{t('projects.empty.title')}</h2>
            <p>{t('projects.empty.description')}</p>
          </>
        }
      />
    </>
  );

  return (
    <PageContainer>
      <PageHeader
        title={t('projects.title')}
        description={t('projects.description')}
        actions={
          canShowCreate ? (
            <Button
              render={
                <Link to={{ pathname: 'new', search: location.search }} />
              }
              nativeButton={false}
            >
              <PlusIcon data-icon='inline-start' />
              {t('projects.create.action')}
            </Button>
          ) : null
        }
      />
      <div className='flex flex-wrap items-center gap-2'>
        <InputGroup className='w-full sm:max-w-xs'>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            {...inputProps}
            placeholder={t('projects.search.placeholder')}
            aria-label={t('projects.search.label')}
          />
        </InputGroup>
        <Select
          items={statusItems}
          value={status ?? 'all'}
          onValueChange={changeStatus}
        >
          <SelectTrigger
            className='w-full sm:w-40'
            aria-label={t('projects.filters.status')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            <SelectGroup>
              {statusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button variant='ghost' onClick={clearFilters}>
            {t('projects.filters.clear')}
          </Button>
        ) : null}
        {/* Reloading keeps the old data and shows only a small Spinner here. */}
        {loading && rows !== undefined ? (
          <Spinner className='text-muted-foreground' />
        ) : null}
      </div>
      {content}

      <ProjectDeleteDialog
        open={deletion.open}
        onOpenChange={(open) =>
          setDeletion((current) => ({ ...current, open }))
        }
        project={deletion.project}
        onDeleted={() => {
          setDeletion((current) => ({ ...current, open: false }));
          reload();
        }}
        deletedFocusRef={searchRef}
      />

      {/* The create dialog, the drawer and a row's edit dialog render here and get the list's refresh functions from context. */}
      <Outlet context={outletContext} />
    </PageContainer>
  );
}
```
