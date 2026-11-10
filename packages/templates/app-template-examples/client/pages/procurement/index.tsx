import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from '@nocobase/i18n/client';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { DataTable } from '#components/data-table';
import { RecordLink } from '#components/record-link';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { useListData } from '#hooks/use-list-data';
import { useTableUrlState } from '#hooks/use-table-url-state';
import { type ProcurementDetail } from '../../../shared/procurement.js';
import { Choice } from './reference.js';

type Record = ProcurementDetail['record'];
export default function ProcurementPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const table = useTableUrlState({ sortColumns: [] });
  const q = params.get('q') ?? '';
  const status = params.get('status') ?? '';
  const request = useListData<{ data: Record[]; meta: { total: number } }>(
    `procurement?${new URLSearchParams({ q, ...(status ? { status } : {}), page: String(table.paginationState.pageIndex + 1), pageSize: String(table.paginationState.pageSize) })}`,
  );
  const context = useListData<{ data: { request: boolean; review: boolean } }>(
    'procurement/context',
  );
  const filter = (key: string, value: string) =>
    setParams((old) => {
      old.set(key, value);
      old.delete('page');
      return old;
    });
  const columns: ColumnDef<Record>[] = [
    {
      accessorKey: 'title',
      header: t('procurement.name'),
      cell: ({ row }) => (
        <RecordLink to={{ pathname: row.original.id, search: location.search }}>
          {row.original.title || t('procurement.draft')}
        </RecordLink>
      ),
    },
    {
      accessorKey: 'status',
      header: t('procurement.all'),
      cell: ({ row }) => t(`procurement.${row.original.status}`),
    },
    {
      accessorKey: 'totalMinor',
      header: t('procurement.total'),
      cell: ({ row }) => (row.original.totalMinor / 100).toFixed(2),
    },
  ];
  return (
    <PageContainer>
      <PageHeader
        title={t('procurement.title')}
        description={t('procurement.description')}
        actions={
          context.data?.data.request ? (
            <Button
              render={
                <Link to={{ pathname: 'new', search: location.search }} />
              }
              nativeButton={false}
            >
              {t('procurement.new')}
            </Button>
          ) : null
        }
      />
      {context.data &&
      !context.data.data.request &&
      !context.data.data.review ? (
        <Alert>
          <AlertDescription>{t('procurement.denied')}</AlertDescription>
        </Alert>
      ) : null}
      {/* The search box and the status filter share one row on a phone too (mobile.md M4.1). */}
      <div className='flex items-center gap-2'>
        <Input
          className='min-w-0 flex-1 md:max-w-sm md:flex-none'
          aria-label={t('procurement.search')}
          placeholder={t('procurement.search')}
          value={q}
          onChange={(e) => filter('q', e.target.value)}
        />
        <div className='w-36 shrink-0 md:w-48'>
          <Choice
            label={t('procurement.all')}
            value={status}
            onChange={(v) => filter('status', v)}
            options={['', 'draft', 'submitted', 'rejected', 'approved'].map(
              (id) => ({ id, name: t(`procurement.${id || 'all'}`) }),
            )}
          />
        </div>
      </div>
      {request.error ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('procurement.failed')}{' '}
            <Button variant='outline' onClick={request.reload}>
              {t('procurement.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <DataTable
        columns={columns}
        data={request.data?.data ?? []}
        loading={request.loading}
        manualPagination
        rowCount={request.data?.meta.total ?? 0}
        paginationState={table.paginationState}
        onPaginationChange={table.onPaginationChange}
        showSelectedCount={false}
        emptyMessage={t('procurement.empty')}
        // Phones show one card per request (mobile.md M3): title and status first, the total on the right.
        renderCard={(row) => (
          <div className='flex items-start justify-between gap-3 rounded-lg border p-4 text-sm'>
            <div className='flex min-w-0 flex-col gap-1'>
              <RecordLink
                to={{ pathname: row.original.id, search: location.search }}
                className='break-words'
              >
                {row.original.title || t('procurement.draft')}
              </RecordLink>
              <span className='text-muted-foreground'>
                {t(`procurement.${row.original.status}`)}
              </span>
            </div>
            <span className='shrink-0 tabular-nums'>
              {(row.original.totalMinor / 100).toFixed(2)}
            </span>
          </div>
        )}
      />
      <Outlet context={{ reload: request.reload }} />
    </PageContainer>
  );
}
