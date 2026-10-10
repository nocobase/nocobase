import { useTranslation } from '@nocobase/i18n/client';
import { useToaster } from '@nocobase/app-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react';
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTable } from '#components/data-table';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
import { Input } from '#components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#components/ui/empty';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { completeOrders, statuses, useOrders, type Order } from './data';
import { OrderBadge, PreviewSelect } from './shared';
import { useOrderMoney } from './money';
const sortable = ['number', 'customer', 'quantity', 'total', 'updated'];
export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const toaster = useToaster();
  const money = useOrderMoney();
  const rows = useOrders();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const searchRef = useRef<HTMLInputElement>(null);
  const overlay = location.pathname !== '/theme-lab/orders';
  const wasOverlayRef = useRef(overlay);
  useEffect(() => {
    if (
      wasOverlayRef.current &&
      !overlay &&
      (document.activeElement === document.body ||
        !document.activeElement?.isConnected)
    )
      searchRef.current?.focus();
    wasOverlayRef.current = overlay;
  }, [overlay]);
  const urlQuery = params.get('q') ?? '';
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (lastUrlQuery !== urlQuery) {
    setLastUrlQuery(urlQuery);
    setQuery(urlQuery);
  }
  const status = statuses.includes(
    params.get('status') as (typeof statuses)[number],
  )
    ? params.get('status')!
    : 'all';
  const sortId = sortable.includes(params.get('sort') ?? '')
    ? params.get('sort')!
    : 'updated';
  const sorting: SortingState = [
    { id: sortId, desc: params.get('direction') !== 'asc' },
  ];
  const [selection, setSelection] = useState<RowSelectionState>({});
  const update = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([key, value]) =>
      value === null ? next.delete(key) : next.set(key, value),
    );
    setParams(next);
  };
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (status === 'all' || row.status === status) &&
          `${row.customer} ${row.number}`
            .toLocaleLowerCase()
            .includes((params.get('q') ?? '').toLocaleLowerCase()),
      ),
    [rows, status, params],
  );
  const filterKey = `${status}:${urlQuery}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setSelection({});
  }
  const sortHeader = (id: string) => () => (
    <Button
      variant='ghost'
      size='sm'
      className='-ml-2'
      onClick={() =>
        update({
          sort: id,
          direction: sortId === id && sorting[0].desc ? 'asc' : 'desc',
          page: null,
        })
      }
    >
      {t(`businessPreview.${id}`)}
      {sortId === id ? (
        sorting[0].desc ? (
          <ArrowDown />
        ) : (
          <ArrowUp />
        )
      ) : (
        <ArrowUpDown />
      )}
    </Button>
  );
  const columns: ColumnDef<Order>[] = [
    {
      id: 'select',
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          aria-label={t('businessPreview.selectPage')}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(checked === true)
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t('businessPreview.selectOrder', {
            number: row.original.number,
          })}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        />
      ),
    },
    {
      accessorKey: 'number',
      header: sortHeader('number'),
      cell: ({ row }) => (
        <Button
          variant='link'
          className='h-auto px-0'
          nativeButton={false}
          render={
            <Link to={{ pathname: row.original.id, search: location.search }} />
          }
        >
          {row.original.number}
        </Button>
      ),
    },
    {
      accessorKey: 'customer',
      sortingFn: (a, b) =>
        new Intl.Collator(
          i18n.language.startsWith('zh') ? 'zh-CN-u-co-pinyin' : i18n.language,
          {
            numeric: true,
            sensitivity: 'base',
          },
        ).compare(a.original.customer, b.original.customer),
      header: sortHeader('customer'),
      cell: ({ row }) => (
        <span className='block min-w-40 max-w-xs whitespace-normal break-words'>
          {row.original.customer}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      enableSorting: false,
      header: t('businessPreview.status'),
      cell: ({ row }) => <OrderBadge status={row.original.status} />,
    },
    {
      accessorKey: 'quantity',
      header: sortHeader('quantity'),
      cell: ({ row }) => (
        <span className='block text-right tabular-nums'>
          {new Intl.NumberFormat(i18n.language).format(row.original.quantity)}
        </span>
      ),
    },
    {
      id: 'total',
      accessorFn: (row) => row.quantity * row.price,
      header: sortHeader('total'),
      cell: ({ row }) => (
        <span className='block text-right tabular-nums'>
          {money(row.original.quantity * row.original.price)}
        </span>
      ),
    },
    {
      accessorKey: 'updated',
      header: sortHeader('updated'),
      cell: ({ row }) => (
        <span className='text-muted-foreground'>
          {new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'medium',
          }).format(new Date(row.original.updated))}
        </span>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      header: () => (
        <span className='sr-only'>{t('businessPreview.actions')}</span>
      ),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('businessPreview.actionsFor', {
                  number: row.original.number,
                })}
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-auto min-w-40'>
            <DropdownMenuItem
              render={
                <Link
                  to={{
                    pathname: `edit/${row.original.id}`,
                    search: location.search,
                  }}
                />
              }
            >
              {t('businessPreview.edit')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6));
  const requestedPage = Math.max(
    0,
    Number.parseInt(params.get('page') ?? '1', 10) - 1 || 0,
  );
  const pageIndex = Math.min(pageCount - 1, requestedPage);
  // TanStack intentionally exposes live methods; React Compiler must leave this hook uncompiled.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    autoResetPageIndex: false,
    data: filtered,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      rowSelection: selection,
      pagination: { pageIndex, pageSize: 6 },
    },
    onRowSelectionChange: setSelection,
  });
  const selected = Object.keys(selection).filter(
    (id) => selection[id] && filtered.some((row) => row.id === id),
  );
  const clear = () => {
    setQuery('');
    update({ q: null, status: null, page: null });
  };
  return (
    <PageContainer>
      <PageHeader
        title={t('businessPreview.orders')}
        description={t('businessPreview.ordersHint')}
        actions={
          <Button
            nativeButton={false}
            render={<Link to={{ pathname: 'new', search: location.search }} />}
          >
            <Plus />
            {t('businessPreview.newOrder')}
          </Button>
        }
      />
      <p className='text-sm text-muted-foreground'>
        {t('businessPreview.preview')}
      </p>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative w-full sm:max-w-xs'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            ref={searchRef}
            className='pl-9'
            aria-label={t('businessPreview.search')}
            placeholder={t('businessPreview.search')}
            value={query}
            onCompositionEnd={(event) =>
              update({ q: event.currentTarget.value || null, page: null })
            }
            onChange={(event) => {
              setQuery(event.target.value);
              if (!(event.nativeEvent as InputEvent).isComposing)
                update({ q: event.target.value || null, page: null });
            }}
          />
        </div>
        <div className='w-full sm:w-40'>
          <PreviewSelect
            label={t('businessPreview.status')}
            value={status}
            options={[
              { value: 'all', label: t('businessPreview.allStatuses') },
              ...statuses.map((value) => ({
                value,
                label: t(`businessPreview.${value}`),
              })),
            ]}
            onChange={(value) =>
              update({ status: value === 'all' ? null : value, page: null })
            }
          />
        </div>
        {query || status !== 'all' ? (
          <Button variant='ghost' onClick={clear}>
            {t('businessPreview.clear')}
          </Button>
        ) : null}
        <span className='text-sm text-muted-foreground sm:ml-auto'>
          {t('businessPreview.count', { count: filtered.length })}
        </span>
      </div>
      {selected.length > 0 && (
        <div className='flex flex-wrap items-center gap-3 rounded-lg border bg-primary/5 p-3'>
          <span className='text-sm'>
            {t('businessPreview.selected', { count: selected.length })}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              completeOrders(selected);
              setSelection({});
              toaster.show({
                type: 'success',
                title: t('businessPreview.completedToast', {
                  count: selected.length,
                }),
              });
            }}
          >
            <Check />
            {t('businessPreview.complete')}
          </Button>
        </div>
      )}
      <DataTable
        table={table}
        empty={
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t('businessPreview.noResults')}</EmptyTitle>
              <EmptyDescription>
                {t('businessPreview.noResultsHint')}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant='outline' onClick={clear}>
                {t('businessPreview.clear')}
              </Button>
            </EmptyContent>
          </Empty>
        }
      />
      <div className='flex flex-wrap items-center justify-end gap-3'>
        <span className='text-sm text-muted-foreground'>
          {t('businessPreview.page', {
            current: pageIndex + 1,
            total: pageCount,
          })}
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                className='inline-flex'
                tabIndex={pageIndex === 0 ? 0 : undefined}
              />
            }
          >
            <Button
              variant='outline'
              size='icon-sm'
              aria-label={t('businessPreview.previous')}
              disabled={pageIndex === 0}
              onClick={() => update({ page: String(pageIndex) })}
            >
              <ChevronLeft />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t(
              pageIndex === 0
                ? 'businessPreview.firstPage'
                : 'businessPreview.previous',
            )}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                className='inline-flex'
                tabIndex={pageIndex + 1 === pageCount ? 0 : undefined}
              />
            }
          >
            <Button
              variant='outline'
              size='icon-sm'
              aria-label={t('businessPreview.next')}
              disabled={pageIndex + 1 === pageCount}
              onClick={() => update({ page: String(pageIndex + 2) })}
            >
              <ChevronRight />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t(
              pageIndex + 1 === pageCount
                ? 'businessPreview.lastPage'
                : 'businessPreview.next',
            )}
          </TooltipContent>
        </Tooltip>
      </div>
      <Outlet />
    </PageContainer>
  );
}
