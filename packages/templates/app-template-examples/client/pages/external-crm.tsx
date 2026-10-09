import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactElement } from 'react';
import {
  CheckCircle2,
  Clock,
  Coins,
  Database,
  FileText,
  Lock,
  Plug,
  RefreshCw,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';

/**
 * Reads the external CRM through the read-only repository routes in
 * `server/routes/external-crm.ts`. Everything here is addressed by logical
 * name — `orders`, `customer`, `orderNo` — even though the CRM's tables are
 * `crm_orders` and `crm_customers`: the connection's naming and the metadata
 * in `database/externalCrm/collections` do the mapping on the server.
 */
const statuses = ['all', 'paid', 'shipped', 'draft'] as const;
type Status = (typeof statuses)[number];

interface CrmOrder {
  id: number;
  orderNo: string;
  status: string;
  totalAmount: string | number;
  placedAt: string;
  customer: { id: number; displayName: string; email: string } | null;
}

export default function ExternalCrmPage(): ReactElement {
  const api = useApiClient();
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<Status>('all');
  const orders = useQuery({
    queryKey: ['external-crm', 'orders', status],
    queryFn: ({ signal }) =>
      api.request<{ data: CrmOrder[] }>({
        path: 'crmOrders/findMany',
        method: 'POST',
        json: {
          ...(status === 'all' ? {} : { filter: { status } }),
          sort: {
            kind: 'sort',
            version: 1,
            items: [{ kind: 'field', path: ['placedAt'], direction: 'desc' }],
          },
          select: {
            kind: 'select',
            version: 1,
            root: {
              kind: 'selection',
              fields: ['id', 'orderNo', 'status', 'totalAmount', 'placedAt'],
              includes: [
                {
                  kind: 'include',
                  relation: 'customer',
                  select: {
                    kind: 'selection',
                    fields: ['id', 'displayName', 'email'],
                  },
                },
              ],
            },
          },
        },
        signal,
      }),
    retry: false,
  });
  const customers = useQuery({
    queryKey: ['external-crm', 'customers', 'count'],
    queryFn: ({ signal }) =>
      api.request<{ data: number }>({
        path: 'crmCustomers/count',
        method: 'POST',
        json: {},
        signal,
      }),
    retry: false,
  });

  const date = (value: string): string =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  const amount = (value: string | number): string =>
    new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));

  const rows = useMemo(() => orders.data?.data ?? [], [orders.data?.data]);

  const metrics = useMemo(() => {
    const totalRevenue = rows.reduce(
      (sum, row) => sum + Number(row.totalAmount || 0),
      0,
    );
    const paidCount = rows.filter((row) => row.status === 'paid').length;
    return {
      totalOrders: rows.length,
      paidCount,
      totalRevenue,
    };
  }, [rows]);

  return (
    <PageContainer>
      <PageHeader
        description={t('externalCrm.description')}
        title={t('externalCrm.title')}
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            <Badge
              variant='outline'
              className='gap-1.5 px-3 py-1 text-xs font-medium shadow-2xs'
            >
              <Lock className='size-3 text-amber-500' />
              <span>{t('externalCrm.readOnly')}</span>
            </Badge>
            {customers.data && (
              <Badge
                variant='secondary'
                className='gap-1.5 px-3 py-1 text-xs font-medium shadow-2xs'
              >
                <Users className='size-3 text-primary' />
                <span>
                  {t('externalCrm.customers', { count: customers.data.data })}
                </span>
              </Badge>
            )}
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <div className='flex items-center gap-4 rounded-xl border bg-card p-4 shadow-2xs'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <ShoppingBag className='size-5' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-xs font-medium text-muted-foreground'>
              {t('externalCrm.status.all')}
            </p>
            <p className='text-2xl font-bold font-mono tracking-tight'>
              {orders.isPending ? '—' : metrics.totalOrders}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-4 rounded-xl border bg-card p-4 shadow-2xs'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
            <CheckCircle2 className='size-5' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-xs font-medium text-muted-foreground'>
              {t('externalCrm.status.paid')}
            </p>
            <p className='text-2xl font-bold font-mono tracking-tight'>
              {orders.isPending ? '—' : metrics.paidCount}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-4 rounded-xl border bg-card p-4 shadow-2xs sm:col-span-2 lg:col-span-1'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400'>
            <Coins className='size-5' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-xs font-medium text-muted-foreground'>
              {t('externalCrm.columns.totalAmount')}
            </p>
            <p className='text-2xl font-bold font-mono tracking-tight'>
              {orders.isPending ? '—' : amount(metrics.totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className='flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-3 shadow-2xs'>
        <div
          className='inline-flex flex-wrap rounded-lg bg-muted p-1 gap-1'
          role='group'
          aria-label={t('externalCrm.filter')}
        >
          {statuses.map((value) => (
            <Button
              key={value}
              size='sm'
              variant={status === value ? 'default' : 'ghost'}
              className='h-8 px-3.5 text-xs font-medium'
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {t(`externalCrm.status.${value}`)}
            </Button>
          ))}
        </div>
        <Button
          variant='outline'
          size='sm'
          className='h-8 gap-1.5'
          disabled={orders.isFetching}
          onClick={() => void orders.refetch()}
        >
          <RefreshCw
            className={`size-3.5 ${orders.isFetching ? 'animate-spin' : ''}`}
          />
          {t('externalCrm.refresh')}
        </Button>
      </div>

      {orders.isPending ? (
        <div className='flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground'>
          <RefreshCw className='size-5 animate-spin' />
          <p role='status' className='text-sm'>
            {t('externalCrm.loading')}
          </p>
        </div>
      ) : orders.isError ? (
        <div
          role='alert'
          className='flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center'
        >
          <p className='text-sm font-medium text-destructive'>
            {t('externalCrm.loadError')}
          </p>
          <Button
            variant='outline'
            size='sm'
            onClick={() => void orders.refetch()}
          >
            {t('externalCrm.retry')}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center bg-card/40'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
            <Plug className='size-6 text-muted-foreground' />
          </div>
          <h2 className='font-heading text-base font-semibold'>
            {t('externalCrm.empty')}
          </h2>
          <p className='max-w-md text-xs text-muted-foreground'>
            {t('externalCrm.emptyHint')}
          </p>
        </div>
      ) : (
        <div className='overflow-hidden rounded-xl border bg-card shadow-2xs'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/40 hover:bg-muted/40'>
                <TableHead className='font-semibold text-foreground py-3 pl-4'>
                  {t('externalCrm.columns.orderNo')}
                </TableHead>
                <TableHead className='font-semibold text-foreground py-3'>
                  {t('externalCrm.columns.customer')}
                </TableHead>
                <TableHead className='font-semibold text-foreground py-3'>
                  {t('externalCrm.columns.status')}
                </TableHead>
                <TableHead className='text-right font-semibold text-foreground py-3'>
                  {t('externalCrm.columns.totalAmount')}
                </TableHead>
                <TableHead className='font-semibold text-foreground py-3 pr-4'>
                  {t('externalCrm.columns.placedAt')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((order) => {
                const isPaid = order.status === 'paid';
                const isShipped = order.status === 'shipped';
                const isDraft = order.status === 'draft';

                return (
                  <TableRow
                    key={order.id}
                    className='transition-colors hover:bg-muted/30'
                  >
                    <TableCell className='font-mono font-semibold text-sm text-foreground pl-4'>
                      <div className='flex items-center gap-1.5'>
                        <FileText className='size-3.5 text-muted-foreground' />
                        <span>{order.orderNo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.customer ? (
                        <div className='flex items-center gap-2.5'>
                          <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs'>
                            {order.customer.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className='space-y-0.5'>
                            <div className='font-medium text-foreground text-sm leading-none'>
                              {order.customer.displayName}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {order.customer.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className='text-muted-foreground font-mono'>
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isPaid ? 'default' : 'secondary'}
                        className={`font-medium text-xs capitalize ${
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            : isShipped
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20'
                              : isDraft
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                : ''
                        }`}
                      >
                        {statuses.includes(order.status as Status)
                          ? t(`externalCrm.status.${order.status as Status}`)
                          : order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right font-mono font-semibold tabular-nums text-foreground'>
                      {amount(order.totalAmount)}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-xs text-muted-foreground pr-4'>
                      <div className='flex items-center gap-1.5'>
                        <Clock className='size-3 text-muted-foreground/70' />
                        <span>{date(order.placedAt)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className='flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3.5 text-xs text-muted-foreground'>
        <Database className='size-4 text-muted-foreground shrink-0 mt-0.5' />
        <p>{t('externalCrm.note')}</p>
      </div>
    </PageContainer>
  );
}
