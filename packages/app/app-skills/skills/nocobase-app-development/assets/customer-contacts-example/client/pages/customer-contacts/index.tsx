import { useQuery } from '@tanstack/react-query';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  resolveListState,
  useApiClient,
  useToaster,
} from '@nocobase/app-client';
import {
  useCan,
  useAuthorizationRevision,
} from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FilterIcon } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '#components/data-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RecordLink } from '#components/record-link';
import { StatusBadge } from '#components/status-badge';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
import { Input } from '#components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#components/ui/sheet';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import { useListData } from '#hooks/use-list-data';
import { useListLocation } from '#hooks/use-list-location';
import { useTableUrlState } from '#hooks/use-table-url-state';
import { RelationPicker } from './relation-picker.js';
import { WriteFeedback, StatusChoice } from './shared.js';
import {
  base,
  useCrmAction,
  useWriteLock,
  type Customer,
  type List,
} from './model.js';

export interface CustomerListContext {
  selected: string[];
  selectedCustomers: Pick<Customer, 'id' | 'name'>[];
  reload: () => void;
  clearSelection: () => void;
  onBatchSaved: (
    ids: string[],
    values: { status?: string; ownerId?: string },
  ) => void;
  onSaved: (row: Customer) => void;
}

export default function CustomerContactsPage() {
  const revision = useAuthorizationRevision();
  // A permission change starts a new view so no previous-scope rows or labels survive.
  return <CustomerContactsContent key={revision} />;
}
function CustomerContactsContent() {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { params, setParams, active } = useListLocation();
  const location = useLocation();
  const edit = useCrmAction('customers', 'edit');
  const assign = useCrmAction('customers', 'assign');
  const reset = useCan('unrestricted');
  const authRevision = useAuthorizationRevision();
  const table = useTableUrlState({
    sortColumns: [],
    pageSizeOptions: [10, 20],
    active,
  });
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? 'all';
  const owner = params.get('ownerId') ?? '';
  const query = new URLSearchParams({
    page: String(table.paginationState.pageIndex + 1),
    pageSize: String(table.paginationState.pageSize),
    ...(search ? { search } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(owner ? { ownerId: owner } : {}),
  });
  const path = `${base}/customers?${query}`;
  const request = useListData<List<Customer>>(path, {
    active,
    keepPreviousData: true,
  });
  const selectionKey = `${path}/${request.revision}/${authRevision}`;
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({
    key: '',
    ids: [],
  });
  const selected = selection.key === selectionKey ? selection.ids : [];
  const [confirmReset, setConfirmReset] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const appliedFilters = (status !== 'all' ? 1 : 0) + (owner ? 1 : 0);
  const [resetError, setResetError] = useState<unknown>();
  const lock = useWriteLock();
  const headerRef = useRef<HTMLDivElement>(null);
  const wasCoveredRef = useRef(false);
  useEffect(() => {
    if (!active) {
      wasCoveredRef.current = true;
      return;
    }
    if (wasCoveredRef.current && !request.loading) {
      wasCoveredRef.current = false;
      if (document.activeElement === document.body) headerRef.current?.focus();
    }
  }, [active, request.loading]);
  const updateQuery = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setSelection({ key: '', ids: [] });
    setParams(next, { replace: true });
  };
  const currentData = request.path === path ? request.data : undefined;
  const rows = currentData?.data ?? [];
  const toggle = (id: string, checked: boolean) =>
    setSelection({
      key: selectionKey,
      ids: checked
        ? [...selected.filter((value) => value !== id), id]
        : selected.filter((value) => value !== id),
    });
  const columns: ColumnDef<Customer>[] = [
    ...(edit.can || assign.can
      ? [
          {
            // DataTable shows this header above the phone cards too, as "Select all on this page".
            id: 'select',
            header: () => (
              <Checkbox
                aria-label={t('customerContacts.selectAll')}
                checked={
                  rows.length > 0 &&
                  rows.every((row) => selected.includes(row.id))
                }
                indeterminate={
                  selected.length > 0 &&
                  !rows.every((row) => selected.includes(row.id))
                }
                disabled={request.loading || !active}
                onCheckedChange={(checked) =>
                  setSelection({
                    key: selectionKey,
                    ids: checked ? rows.map((row) => row.id) : [],
                  })
                }
              />
            ),
            cell: ({ row }: { row: { original: Customer } }) => (
              <Checkbox
                aria-label={t('customerContacts.selectRow', {
                  name: row.original.name,
                })}
                checked={selected.includes(row.original.id)}
                disabled={request.loading || !active}
                onCheckedChange={(checked) => toggle(row.original.id, checked)}
              />
            ),
          },
        ]
      : []),
    {
      accessorKey: 'name',
      header: t('customerContacts.customer'),
      cell: ({ row }) => (
        <RecordLink to={{ pathname: row.original.id, search: location.search }}>
          {row.original.name}
        </RecordLink>
      ),
    },
    {
      accessorKey: 'status',
      header: t('customerContacts.status'),
      cell: ({ row }) => (
        <StatusBadge
          tone={row.original.status === 'active' ? 'success' : 'neutral'}
        >
          {t(`customerContacts.${row.original.status}`)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'ownerId',
      header: t('customerContacts.owner'),
      cell: ({ row }) => <OwnerName id={row.original.ownerId} />,
    },
  ];
  const state = resolveListState(
    {
      data: currentData,
      error: request.error,
      isPending: request.loading && !currentData,
    },
    rows.length,
    Boolean(search || status !== 'all' || owner),
  );
  const reload = () => {
    setSelection({ key: '', ids: [] });
    request.reload();
  };
  const context: CustomerListContext = {
    selected,
    selectedCustomers: rows
      .filter((row) => selected.includes(row.id))
      .map(({ id, name }) => ({ id, name })),
    reload,
    clearSelection: () => setSelection({ key: '', ids: [] }),
    onBatchSaved: (ids, values) => {
      if (request.data)
        request.replaceData({
          ...request.data,
          data: request.data.data.map((row) =>
            ids.includes(row.id) ? ({ ...row, ...values } as Customer) : row,
          ),
        });
    },
    onSaved: (row) => {
      if (request.data)
        request.replaceData({
          ...request.data,
          data: request.data.data.map((current) =>
            current.id === row.id ? row : current,
          ),
        });
    },
  };
  return (
    <PageContainer>
      <div tabIndex={-1} ref={headerRef}>
        <PageHeader
          title={t('customerContacts.title')}
          description={t('customerContacts.description')}
          actions={
            <>
              {reset.can && (
                <Button
                  variant='outline'
                  onClick={() => {
                    setResetError(undefined);
                    setConfirmReset(true);
                  }}
                >
                  {t('customerContacts.reset')}
                </Button>
              )}
            </>
          }
        />
      </div>
      {!confirmReset && <WriteFeedback error={resetError} />}
      {/* One row on every width (mobile.md M4.1). Desktop: search, both filters and Clear. Phone: the search box and
          an icon Filters button named with how many filters apply, opening the same controls in a bottom sheet;
          Clear joins while something is applied. */}
      <div className='flex flex-wrap items-center gap-2'>
        <CustomerSearch
          value={search}
          onSearch={(value) => updateQuery('search', value)}
        />
        <div className='hidden md:contents'>
          {filterControls(
            <StatusChoice
              all
              value={status}
              onChange={(value) => updateQuery('status', value)}
            />,
            <RelationPicker
              kind='salesReps'
              value={owner}
              label={t('customerContacts.owner')}
              onChange={(value) => updateQuery('ownerId', value)}
            />,
          )}
        </div>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                className='relative shrink-0 md:hidden'
                aria-label={
                  appliedFilters > 0
                    ? t('customerContacts.filtersApplied', {
                        count: appliedFilters,
                      })
                    : t('customerContacts.filters')
                }
              />
            }
          >
            <FilterIcon />
            {appliedFilters > 0 ? (
              <span
                aria-hidden='true'
                className='absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground tabular-nums'
              >
                {appliedFilters}
              </span>
            ) : null}
          </SheetTrigger>
          <SheetContent
            side='bottom'
            className='max-h-[calc(100dvh-2rem)] gap-0'
          >
            <SheetHeader>
              <SheetTitle>{t('customerContacts.filters')}</SheetTitle>
            </SheetHeader>
            {/* Each control writes the URL as it changes, as on desktop; the sheet is a temporary panel outside it. */}
            <div className='flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
              <FilterField label={t('customerContacts.status')}>
                <StatusChoice
                  all
                  value={status}
                  onChange={(value) => updateQuery('status', value)}
                />
              </FilterField>
              <FilterField label={t('customerContacts.owner')}>
                <RelationPicker
                  kind='salesReps'
                  value={owner}
                  label={t('customerContacts.owner')}
                  onChange={(value) => updateQuery('ownerId', value)}
                />
              </FilterField>
            </div>
          </SheetContent>
        </Sheet>
        {(search || status !== 'all' || owner) && (
          <Button
            variant='ghost'
            onClick={() => {
              const next = new URLSearchParams(params);
              for (const key of ['search', 'status', 'ownerId', 'page'])
                next.delete(key);
              setSelection({ key: '', ids: [] });
              setParams(next, { replace: true });
            }}
          >
            {t('customerContacts.clear')}
          </Button>
        )}
      </div>
      {selected.length > 0 && (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm'>
            {t('customerContacts.selected', { count: selected.length })}
          </span>
          {(edit.can || assign.can) && (
            <Button
              variant='outline'
              render={
                <Link to={{ pathname: 'batch', search: location.search }} />
              }
              nativeButton={false}
            >
              {t('customerContacts.batchTitle')}
            </Button>
          )}
        </div>
      )}
      <DataTable
        columns={columns}
        data={rows}
        manualPagination
        rowCount={currentData?.meta.total ?? 0}
        paginationState={table.paginationState}
        onPaginationChange={(next) => {
          setSelection({ key: '', ids: [] });
          table.onPaginationChange(next);
        }}
        pageSizeOptions={[10, 20]}
        getRowId={(row) => row.id}
        showSelectedCount={false}
        listState={state}
        loading={active && request.loading}
        loadingIdentity={path}
        onRetry={reload}
        renderCard={(row) => (
          <CustomerCard
            customer={row.original}
            search={location.search}
            selection={
              edit.can || assign.can
                ? {
                    checked: selected.includes(row.original.id),
                    disabled: request.loading || !active,
                    onChange: (checked) => toggle(row.original.id, checked),
                  }
                : undefined
            }
          />
        )}
      />
      <AlertDialog
        open={confirmReset}
        onOpenChange={(open) => {
          if (!lock.locked()) setConfirmReset(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('customerContacts.resetTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('customerContacts.resetDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <WriteFeedback error={resetError} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={lock.busy}>
              {t('customerContacts.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={lock.busy}
              onClick={(e) => {
                void (async () => {
                  e.preventDefault();
                  if (!lock.acquire()) return;
                  try {
                    await api.request({
                      path: `${base}/reset`,
                      method: 'POST',
                    });
                    setConfirmReset(false);
                    setResetError(undefined);
                    reload();
                    toaster.show({
                      type: 'success',
                      title: t('customerContacts.resetDone'),
                    });
                  } catch (error) {
                    setResetError(error);
                  } finally {
                    lock.release();
                  }
                })();
              }}
            >
              {lock.busy
                ? t('customerContacts.saving')
                : t('customerContacts.reset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Outlet context={context} />
    </PageContainer>
  );
}
/** The desktop row of filters: the status choice at its own width, then the owner picker. */
function filterControls(statusChoice: ReactNode, ownerPicker: ReactNode) {
  return (
    <>
      {statusChoice}
      <div className='w-48'>{ownerPicker}</div>
    </>
  );
}
/** A filter in the phone sheet, with a visible label above its full-width control. */
function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <span className='text-sm font-medium'>{label}</span>
      {children}
    </div>
  );
}
/**
 * One customer on a phone (mobile.md M3): the selection checkbox when batch actions exist, the name link and status
 * first, then the owner. The table's columns stay for wider screens. Like the rows, the card has no action menu: this
 * list changes customers through selection and the batch action, and a customer's own edit belongs with its contacts
 * on the customer's page (case (c) of M3.1).
 */
function CustomerCard({
  customer,
  search,
  selection,
}: {
  customer: Customer;
  search: string;
  selection?: {
    checked: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
  };
}) {
  const { t } = useTranslation();
  return (
    <div className='flex items-start gap-3 rounded-lg border p-4'>
      {selection ? (
        <Checkbox
          className='mt-0.5'
          aria-label={t('customerContacts.selectRow', { name: customer.name })}
          checked={selection.checked}
          disabled={selection.disabled}
          onCheckedChange={selection.onChange}
        />
      ) : null}
      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <RecordLink
            to={{ pathname: customer.id, search }}
            className='min-w-0 break-words'
          >
            {customer.name}
          </RecordLink>
          <StatusBadge
            tone={customer.status === 'active' ? 'success' : 'neutral'}
          >
            {t(`customerContacts.${customer.status}`)}
          </StatusBadge>
        </div>
        <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-sm'>
          <dt className='text-muted-foreground'>
            {t('customerContacts.owner')}
          </dt>
          <dd className='min-w-0'>
            <OwnerName id={customer.ownerId} />
          </dd>
        </dl>
      </div>
    </div>
  );
}
export function OwnerName({ id }: { id: string }) {
  const { t } = useTranslation();
  const api = useApiClient();
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  const request = useQuery({
    queryKey: [base, 'owner', session?.user.id, revision, id],
    enabled: Boolean(session),
    retry: false,
    queryFn: ({ signal }) =>
      api.request<{ data: { name: string } }>({
        path: `${base}/salesReps/${encodeURIComponent(id)}`,
        signal,
      }),
  });
  return (
    <span
      className='block max-w-48 truncate'
      onMouseEnter={(event) => {
        const element = event.currentTarget;
        element.title =
          element.scrollWidth > element.clientWidth
            ? (element.textContent ?? '')
            : '';
      }}
    >
      {request.error
        ? t('customerContacts.unavailable')
        : (request.data?.data.name ?? t('customerContacts.loading'))}
    </span>
  );
}
function CustomerSearch({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  const [sent, setSent] = useState(value);
  const [composing, setComposing] = useState(false);
  if (value !== seen) {
    setSeen(value);
    if (value !== sent) setText(value);
  }
  useEffect(() => {
    if (composing || text.trim() === value) return;
    const timer = setTimeout(() => {
      setSent(text.trim());
      onSearch(text.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [text, composing, value, onSearch]);
  return (
    <Input
      aria-label={t('customerContacts.search')}
      placeholder={t('customerContacts.search')}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(e) => {
        setComposing(false);
        setText(e.currentTarget.value);
      }}
      className='min-w-0 flex-1 md:max-w-xs md:flex-none'
    />
  );
}
