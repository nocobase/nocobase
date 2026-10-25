import { Link, Outlet, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Monitor, ArrowUpRight } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '#components/ui/card';
import { Button } from '#components/ui/button';
import { useEquipment, type Row } from './api.js';
import { LoadState, Status, Display } from './shared.js';
function ExceptionCard({ kind, title }: { kind: string; title: string }) {
  const { t } = useTranslation();
  const location = useLocation();
  const result = useEquipment<Row[]>(
    'assets?exception=' + kind + '&pageSize=10',
  );
  return (
    <Card className='min-w-0'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='flex-1'>
        <LoadState
          loading={result.isPending}
          error={result.error}
          empty={result.data?.data.length === 0}
          retry={() => void result.refetch()}
        />
        <ul className='divide-y'>
          {result.data?.data.map((row) => (
            <li
              key={row.id}
              className='flex items-center justify-between gap-4 py-3'
            >
              <Link
                className='min-w-0 text-sm hover:text-primary'
                to={{ pathname: 'asset/' + row.id, search: location.search }}
              >
                <span className='block truncate font-medium'>{row.name}</span>
                <span className='text-muted-foreground'>{row.assetNumber}</span>
              </Link>
              <Status value={row.status} />
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          variant='ghost'
          nativeButton={false}
          render={<Link to={'/equipment?exception=' + kind} />}
        >
          {t('equipment.viewAll')}
          <ArrowUpRight aria-hidden />
        </Button>
      </CardFooter>
    </Card>
  );
}
export default function EquipmentDashboard() {
  const { t } = useTranslation();
  const stats = useEquipment<{ counts: { status: string; count: number }[] }>(
    'stats',
  );
  const query = useQueryClient();
  const total = stats.data?.data.counts.reduce(
    (sum, item) => sum + Number(item.count),
    0,
  );
  return (
    <>
      <PageContainer>
        <PageHeader
          title={t('equipment.title')}
          description={t('equipment.description')}
          actions={
            <Button
              variant='outline'
              disabled={stats.isFetching}
              onClick={() =>
                void query.invalidateQueries({ queryKey: ['equipment'] })
              }
            >
              <RefreshCw aria-hidden />
              {t('equipment.refresh')}
            </Button>
          }
        />
        <p className='text-sm text-muted-foreground'>
          {t('equipment.scopeHint')}
        </p>
        <LoadState
          loading={stats.isPending}
          error={stats.error}
          retry={() => void stats.refetch()}
        />
        {stats.data && (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {[
              { status: 'total', count: total },
              ...['idle', 'issued', 'loaned', 'maintenance', 'scrapped'].map(
                (status) => ({
                  status,
                  count:
                    stats.data.data.counts.find((v) => v.status === status)
                      ?.count || 0,
                }),
              ),
            ].map((item) => (
              <Card key={item.status}>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between text-sm text-muted-foreground'>
                    {t(
                      item.status === 'total'
                        ? 'equipment.total'
                        : 'equipment.states.' + item.status,
                    )}
                    <Monitor aria-hidden className='size-4' />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    className='text-3xl font-semibold tracking-tight hover:text-primary'
                    to={
                      '/equipment' +
                      (item.status === 'total' ? '' : '?status=' + item.status)
                    }
                  >
                    <Display value={item.count} />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className='grid items-stretch gap-4 lg:grid-cols-3'>
          <ExceptionCard kind='overdue' title={t('equipment.overdue')} />
          <ExceptionCard kind='warranty' title={t('equipment.warranty')} />
          <ExceptionCard
            kind='maintenance'
            title={t('equipment.maintenanceDue')}
          />
        </div>
      </PageContainer>
      <Outlet />
    </>
  );
}
