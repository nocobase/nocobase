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
import { type OnboardingDetail } from '../../../shared/onboarding.js';
import { Choice } from './choice.js';

type Record = OnboardingDetail['record'];
export default function OnboardingPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const table = useTableUrlState({ sortColumns: [] });
  const q = params.get('q') ?? '';
  const status = params.get('status') ?? '';
  const request = useListData<{ data: Record[]; meta: { total: number } }>(
    `onboarding?${new URLSearchParams({ q, ...(status ? { status } : {}), page: String(table.paginationState.pageIndex + 1), pageSize: String(table.paginationState.pageSize) })}`,
  );
  const context = useListData<{ data: { coordinate: boolean; view: boolean } }>(
    'onboarding/context',
  );
  const filter = (key: string, value: string) =>
    setParams((old) => {
      old.set(key, value);
      old.delete('page');
      return old;
    });
  const columns: ColumnDef<Record>[] = [
    {
      accessorKey: 'fullName',
      header: t('onboarding.fullName'),
      cell: ({ row }) => (
        <RecordLink to={{ pathname: row.original.id, search: location.search }}>
          {row.original.fullName || t('onboarding.draft')}
        </RecordLink>
      ),
    },
    {
      accessorKey: 'status',
      header: t('onboarding.all'),
      cell: ({ row }) => t(`onboarding.${row.original.status}`),
    },
    {
      accessorKey: 'workEmail',
      header: t('onboarding.workEmail'),
      cell: ({ row }) => row.original.workEmail,
    },
  ];
  return (
    <PageContainer>
      <PageHeader
        title={t('onboarding.title')}
        description={t('onboarding.description')}
        actions={
          context.data?.data.coordinate ? (
            <Button
              render={
                <Link to={{ pathname: 'new', search: location.search }} />
              }
              nativeButton={false}
            >
              {t('onboarding.new')}
            </Button>
          ) : null
        }
      />
      {context.data &&
      !context.data.data.coordinate &&
      !context.data.data.view ? (
        <Alert>
          <AlertDescription>{t('onboarding.denied')}</AlertDescription>
        </Alert>
      ) : null}
      <div className='flex flex-wrap gap-3'>
        <Input
          className='max-w-sm'
          aria-label={t('onboarding.search')}
          placeholder={t('onboarding.search')}
          value={q}
          onChange={(e) => filter('q', e.target.value)}
        />
        <Choice
          label={t('onboarding.all')}
          value={status}
          onChange={(v) => filter('status', v)}
          options={['draft', 'submitted'].map((id) => ({
            id,
            name: t(`onboarding.${id || 'all'}`),
          }))}
        />
      </div>
      {request.error ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('onboarding.failed')}{' '}
            <Button variant='outline' onClick={request.reload}>
              {t('onboarding.retry')}
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
        emptyMessage={t('onboarding.empty')}
      />
      <Outlet context={{ reload: request.reload }} />
    </PageContainer>
  );
}
