import { useQuery } from '@tanstack/react-query';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useApiClient,
  useToaster,
  ApiClientError,
  type ListState,
} from '@nocobase/app-client';
import {
  useCan,
  useAuthorizationRevision,
} from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { RefreshCw } from 'lucide-react';
import { DataTable } from '#components/data-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RecordLink } from '#components/record-link';
import { StatusBadge } from '#components/status-badge';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
import { Input } from '#components/ui/input';
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
            id: 'selection',
            header: () => (
              <Checkbox
                aria-label={t('customerContacts.selected', {
                  count: rows.length,
                })}
                checked={
                  rows.length > 0 &&
                  rows.every((row) => selected.includes(row.id))
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
  const state: ListState = request.error
    ? request.error instanceof ApiClientError && request.error.status === 403
      ? 'forbidden'
      : request.error instanceof ApiClientError && request.error.status === 401
        ? 'unauthenticated'
        : rows.length
          ? 'refresh-failed'
          : 'failed'
    : request.loading
      ? rows.length
        ? 'ready'
        : 'loading'
      : rows.length
        ? 'ready'
        : search || status !== 'all' || owner
          ? 'no-results'
          : 'empty';
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
              <Button
                variant='outline'
                onClick={reload}
                disabled={request.loading}
                aria-label={t('customerContacts.refresh')}
              >
                <RefreshCw className={request.loading ? 'animate-spin' : ''} />
                {t('customerContacts.refresh')}
              </Button>
            </>
          }
        />
      </div>
      {!confirmReset && <WriteFeedback error={resetError} />}
      <div className='flex flex-wrap items-center gap-2'>
        <CustomerSearch
          value={search}
          onSearch={(value) => updateQuery('search', value)}
        />
        <StatusChoice
          all
          value={status}
          onChange={(value) => updateQuery('status', value)}
        />
        <div className='w-full sm:w-48'>
          <RelationPicker
            kind='salesReps'
            value={owner}
            label={t('customerContacts.owner')}
            onChange={(value) => updateQuery('ownerId', value)}
          />
        </div>
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
        onRetry={reload}
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
      className='w-full sm:max-w-xs'
    />
  );
}
