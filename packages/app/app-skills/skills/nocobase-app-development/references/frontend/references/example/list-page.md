# List page: `index.tsx`

Part of the [projects worked example](../example.md). For the runnable, continuously tested core, start with the [executable list and edit example](../executable-list-edit.md).

**Depends on**: [delete dialog](delete-dialog.md), [status badge](../i18n.md#dynamic-keys), [session alert](session-expired-alert.md), [types](types.md), [search hook](url-search.md), [copy](copy.md); the `projects` route in [section 1 of `page.md`](../page.md#1-declare-the-route).

**Add first**: `yes n | pnpm exec shadcn add alert empty input-group select skeleton table`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)), and reuse the template's shipped `DataTable` in `client/components/data-table/` with its supported `@tanstack/react-table` v8 dependency ([section 1 of `table.md`](../table.md#1-choosing-a-table-component)).

**On phones**: `DataTable` hands `ProjectCard` the row's own actions cell (its `RowActions` "⋮" menu) as `card.actions`, and the card ends with it (M3.1 in [the phone experience](../../mobile.md)); keep it when adapting this page, and do not add a different action control to the card. Leave it out only together with the row's menu, for one of the three cases M3.1 names. The search box, the filter and the sort sit on one row through `DataTable`'s `search`, `filters` and `getColumnLabel` (M4.1); never lay them out yourself in the `toolbar`.

**Links to**: the [create dialog](create-dialog.md), the [detail drawer](detail-drawer.md) and the [edit dialog](edit-dialog.md), which a row's menu opens alone, are its child routes. Without a detail view, render the name as plain text: a link to a route that does not exist lands on the home page.

**Without detail and delete** (a list with only a create dialog), remove: the `actions` column and the `actions` slot of `ProjectCard`, the `deletion` state, `ProjectDeleteDialog` at the end, `focusSearchAfterReloadRef` with its effect, and `afterDelete`, `onSaved` and `onNotFound`, which leaves `outletContext` as `{ reload }`, `ProjectsOutletContext` in `types.ts` with only `reload` and no `ProjectEditOutletContext`; render the name as plain text.

Use the application's existing authorization hook to resolve create permission before rendering the page-level action. Put the standard create action only in the page header, including for a successful empty query; never wire it through the empty state's `emptyAction`. Let `DataTable` render each built-in state with its matching icon and one short line, and keep clear, retry and sign-in actions in the existing toolbar or authentication flow. Follow [shared list feedback](../list-feedback.md) for the state and request contract.

Rules: sections [3](../table.md#3-known-datatable-behavior), [5](../table.md#5-writing-search-and-filters-to-the-url), [6](../table.md#6-loading-the-list), [7](../table.md#7-list-feedback-states), [8](../table.md#8-column-definitions-and-row-actions) and [9](../table.md#9-child-routes-and-refreshing-the-list) of `table.md`, and its [phone cards](../table.md#phone-cards); [the phone experience](../../mobile.md) M3 and M4.

For deletion recovery and URL-backed pagination use the shared hooks in [delete and recover a list](../table.md#delete-and-recover-a-list), with the integration in [the server table example](server-table.md). The capped client example below corrects local pages only while the response is complete; use server pagination when the cap is exceeded. For complete client data pass the filtered row count to the same URL hook and keep `manualPagination` off. Child delete callbacks must use the shared `reload` from their parent, including on return from detail; batch callbacks refresh only after all outcomes settle.

```tsx
// client/pages/projects/index.tsx
import { listStateShowsData, resolveListState } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PlusIcon, SearchIcon } from 'lucide-react';
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import {
  DataTable,
  DataTableColumnHeader,
  DataTableFilter,
} from '#components/data-table';
import { useUrlSearch } from '#hooks/use-url-search';
import { useListData } from '#hooks/use-list-data';
import { useListLocation } from '#hooks/use-list-location';
import { useTableUrlState } from '#hooks/use-table-url-state';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RowActions } from '#components/row-actions';
import { Button } from '#components/ui/button';
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

  const { active } = useListLocation();
  const remote = new URLSearchParams({
    q: search,
    ...(status ? { status } : {}),
    pageSize: String(PAGE_SIZE),
  });
  const requestPath = `projects?${remote}`;
  const request = useListData<ProjectList>(requestPath, {
    active,
    keepPreviousData: true,
  });
  const hasCurrentResponse = request.path === requestPath;
  const response = hasCurrentResponse ? request.data : undefined;
  const responseRows = response?.data;
  const result = response ? { total: response.meta.total } : undefined;
  const loading = request.loading;
  const tableState = useTableUrlState({
    active,
    revision: request.revision,
    sortColumns: ['name', 'updatedAt'],
    // Only a complete filtered dataset supports local last-page recovery.
    rowCount:
      hasCurrentResponse &&
      !loading &&
      !request.error &&
      responseRows?.length === result?.total
        ? result?.total
        : undefined,
  });
  const reload = request.reload;
  const error = tableState.error ?? request.error;
  const displayedQuery = new URLSearchParams(requestPath.split('?')[1]);
  const rowsFiltered = Boolean(
    displayedQuery.get('q') || displayedQuery.get('status'),
  );
  const listState = resolveListState(
    { data: response, error, isPending: loading && !hasCurrentResponse },
    responseRows?.length ?? 0,
    rowsFiltered,
  );
  const rows = listStateShowsData(listState) ? responseRows : undefined;
  const canShowCreate =
    createPermission.can &&
    !createPermission.isPending &&
    (listState === 'empty' ||
      listState === 'ready' ||
      listState === 'no-results' ||
      listState === 'refresh-failed');

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
        // One "⋮" menu at the end of the row, the same on every page (T1.5); DataTable hands it to the phone card.
        cell: ({ row }) => (
          <RowActions
            label={t('projects.actions.more', { name: row.original.name })}
            actions={[
              {
                // Edit is the list's own child route, edit/:projectId: the item is a link, and the dialog opens
                // alone over the list.
                key: 'edit',
                label: t('projects.actions.edit'),
                render: (
                  <Link
                    to={{
                      pathname: `edit/${encodeURIComponent(row.original.id)}`,
                      search: location.search,
                    }}
                  />
                ),
              },
              {
                key: 'delete',
                label: t('projects.actions.delete'),
                destructive: true,
                onClick: () =>
                  setDeletion({ open: true, project: row.original }),
              },
            ]}
          />
        ),
      },
    ],
    [collator, dateFormat, location.search, t],
  );

  const capped = (result?.total ?? 0) > (rows?.length ?? 0);
  const content = (
    <>
      {rows && capped ? (
        <p className='text-sm text-muted-foreground'>
          {t('projects.capNotice', { count: rows.length })}
        </p>
      ) : null}
      <DataTable
        {...tableState}
        columns={columns}
        data={rows ?? []}
        getRowId={(row) => row.id}
        listState={listState}
        loading={active && loading}
        onRetry={reload}
        onClearFilters={clearFilters}
        // "Clear filters" joins the toolbar row while the search or the filter is applied, with results too, not only
        // when nothing matched (M4.2 in mobile.md); the page renders no Clear button of its own.
        filtered={hasFilters}
        // No row selection on this page, so no "0 of N row(s) selected" summary.
        showSelectedCount={false}
        // One row on every width (M4.1 in mobile.md): DataTable puts the search box first, then the filter inline
        // from md up or, on a phone, behind an icon "Filters" button with the applied count that opens a bottom sheet,
        // and on a phone an icon "Sort" menu with these translated column names. Desktop sorts from the headers.
        search={
          <InputGroup className='min-w-0 flex-1'>
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
        }
        filters={
          <DataTableFilter label={t('projects.filters.status')}>
            <Select
              items={statusItems}
              value={status ?? 'all'}
              onValueChange={changeStatus}
            >
              <SelectTrigger
                className='w-40'
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
          </DataTableFilter>
        }
        filterCount={status === undefined ? 0 : 1}
        getColumnLabel={(column) => t(`projects.fields.${column.id}`)}
        // Other controls on that row. Reserve space even when a fast refresh finishes before feedback appears; on a
        // phone the card list shows DataTable's own refresh indicator, so this slot does not take a place there.
        toolbar={() => (
          <div className='ml-auto hidden h-8 w-8 shrink-0 items-center justify-center md:flex'>
            {active && loading && rows !== undefined ? (
              <RefreshIndicator />
            ) : null}
          </div>
        )}
        // `card.actions` is the row's actions cell (its RowActions menu), which the card ends with.
        renderCard={(row, card) => (
          <ProjectCard
            project={row.original}
            search={location.search}
            updated={dateFormat.format(new Date(row.original.updatedAt))}
            actions={card.actions}
          />
        )}
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
      {content}

      <ProjectDeleteDialog
        onUncertain={reload}
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

function RefreshIndicator(): ReactElement | null {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Unmounting on completion or while covered cancels pending feedback.
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);
  return visible ? <Spinner className='text-muted-foreground' /> : null;
}

/**
 * One project on a phone (M3.1 in mobile.md): the name, which opens the same detail drawer as the table's link, and
 * the status first, then the owner and the last update, and the menu. Other fields are in the detail.
 */
function ProjectCard({
  project,
  search,
  updated,
  actions,
}: {
  readonly project: Project;
  readonly search: string;
  readonly updated: string;
  /** The row's own menu, which `DataTable` passes as `card.actions` at a phone tap size. */
  readonly actions: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex items-start gap-2 rounded-lg border p-4'>
      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Link
            to={{ pathname: project.id, search }}
            className='min-w-0 font-medium break-words hover:underline'
          >
            {project.name}
          </Link>
          <ProjectStatusBadge status={project.status} />
        </div>
        <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 text-sm'>
          <dt className='text-muted-foreground'>
            {t('projects.fields.owner')}
          </dt>
          <dd className='break-words'>{project.owner ?? '—'}</dd>
          <dt className='text-muted-foreground'>
            {t('projects.fields.updatedAt')}
          </dt>
          <dd>{updated}</dd>
        </dl>
      </div>
      {actions}
    </div>
  );
}
```

## Two or more filters on a phone

Every filter goes into `filters` as a `DataTableFilter` with its label, and `filterCount` counts the applied ones. `DataTable` then keeps them inline from `md` up and, on a phone, shows one icon "Filters" button on the search box's row, named and badged with the count (`Filters · 2`), that opens a bottom sheet listing each filter under its label (M4.2). The runnable reference is the customer list of the [executable relation and batch example](../executable-relation-batch.md) (`client/pages/customer-contacts/index.tsx`, tested at phone width in `tests/client/customer-contacts.test.tsx`). Its shape, with this page's names:

```tsx
const appliedFilters = [status, owner].filter(Boolean).length;

<DataTable
  // …as above
  search={search /* the search box */}
  filters={
    <>
      <DataTableFilter label={t('projects.filters.status')}>
        <StatusFilter value={status} onChange={changeStatus} />
      </DataTableFilter>
      <DataTableFilter label={t('projects.filters.owner')}>
        <OwnerFilter value={owner} onChange={changeOwner} />
      </DataTableFilter>
    </>
  }
  filterCount={appliedFilters}
  // "Clear filters" shows on the list's row while any filter is applied, without reopening the sheet (M4.2).
  filtered={hasFilters}
  onClearFilters={clearFilters}
  getColumnLabel={(column) => t(`projects.fields.${column.id}`)}
/>;
```

- **No Apply button.** Each control writes the URL as it changes, exactly as on desktop; the sheet is a temporary panel.
- **One copy at a time.** `DataTable` mounts the filters either inline or in the sheet, never both, so a control may use its own `useId()` IDs and keeps one accessible name. Give each control an `aria-label` for the inline row, where no label shows; in the sheet `DataTableFilter` shows its label above the control, which takes the full width.
- **Not in `toolbar`.** A filter placed in `toolbar`, or a search box and filters wrapped in a `flex-col` of the page's own, stack into rows on a phone and push the first card below the first screen (M1.1).

Test it the way a phone user meets it: at phone width open "Filters", find each control by role and name (`getByRole('combobox', { name: 'Owner' })`), change it, and check the URL and the count on the button; at desktop width find the same controls inline by the same names.
