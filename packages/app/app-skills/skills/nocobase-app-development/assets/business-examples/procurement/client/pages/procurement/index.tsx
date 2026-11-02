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
      <div className='flex flex-wrap gap-3'>
        <Input
          className='max-w-sm'
          aria-label={t('procurement.search')}
          placeholder={t('procurement.search')}
          value={q}
          onChange={(e) => filter('q', e.target.value)}
        />
        <Choice
          label={t('procurement.all')}
          value={status}
          onChange={(v) => filter('status', v)}
          options={['', 'draft', 'submitted', 'rejected', 'approved'].map(
            (id) => ({ id, name: t(`procurement.${id || 'all'}`) }),
          )}
        />
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
      />
      <Outlet context={{ reload: request.reload }} />
    </PageContainer>
  );
}
