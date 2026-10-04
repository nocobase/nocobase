import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { GroupByExamples } from '../components/group-by-examples.js';
import type { GroupByExample } from '../group-by.js';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import {
  type AggregateRequest,
  type AggregateResponse,
  type AggregateScalar,
  type AggregateStatus,
} from '../../shared/aggregate.js';
import { loadAggregate, type AggregateCall } from '../aggregate.js';
import { detailPath } from '../model.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card.js';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select.js';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../components/ui/table.js';

const NS = '@nocobase/app-plugin-repository-example';
const statuses: readonly AggregateStatus[] = [
  'all',
  'draft',
  'confirmed',
  'paid',
  'cancelled',
];
const metrics = [
  'count',
  'quantity',
  'averagePrice',
  'minimumPrice',
  'maximumPrice',
] as const;
export default function AggregatePage(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation(NS);
  const [status, setStatus] = useState<AggregateStatus>('all');
  const [minimum, setMinimum] = useState('0');
  const [minimumCount, setMinimumCount] = useState('1');
  const [examples, setExamples] = useState<GroupByExample[]>([]);
  const [query, setQuery] = useState<AggregateRequest>({
    status: 'all',
    minimumQuantity: 0,
  });
  const [calls, setCalls] = useState<AggregateCall[]>([]);
  const [data, setData] = useState<AggregateResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void loadAggregate(api, query)
      .then((response) => {
        if (active) {
          setData(response.data);
          setExamples(response.examples);
          setCalls(response.calls);
        }
      })
      .catch((value: unknown) => {
        if (active)
          setError(value instanceof Error ? value.message : t('loadError'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, query, t]);
  const display = (value: AggregateScalar): string =>
    value === null ? 'NULL' : String(value);
  return (
    <PageContainer>
      <PageHeader
        description={t('aggregateIntro')}
        title={t('aggregateTitle')}
      />
      <form
        className='flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4 shadow-2xs'
        onSubmit={(event) => {
          event.preventDefault();
          setLoading(true);
          setError('');
          setQuery({
            status,
            minimumQuantity: Number(minimum),
            minimumGroupCount: Number(minimumCount),
          });
        }}
      >
        <label className='min-w-0 space-y-2 text-xs font-medium'>
          <span>{t('status')}</span>
          <Select
            value={status}
            items={statuses.map((value) => ({
              value,
              label: t(value === 'all' ? 'aggregateAll' : value),
            }))}
            onValueChange={(value) => {
              if (value) setStatus(value);
            }}
          >
            <SelectTrigger aria-label={t('status')} className='w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(value === 'all' ? 'aggregateAll' : value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className='min-w-0 space-y-2 text-xs font-medium'>
          <span>{t('aggregateHaving')}</span>
          <Input
            required
            type='number'
            min={0}
            max={1000000}
            step={1}
            aria-label={t('aggregateHaving')}
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
          />
        </label>
        <label className='min-w-0 space-y-2 text-xs font-medium'>
          <span>{t('groupByMinimumCount')}</span>
          <Input
            required
            type='number'
            min={1}
            max={1000000}
            step={1}
            aria-label={t('groupByMinimumCount')}
            value={minimumCount}
            onChange={(event) => setMinimumCount(event.target.value)}
          />
        </label>
        <Button type='submit' disabled={loading}>
          {t('aggregateApply')}
        </Button>
      </form>
      {loading && (
        <p
          role='status'
          className='text-xs leading-relaxed text-muted-foreground'
        >
          {t('loading')}
        </p>
      )}
      {error && (
        <p
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs font-medium text-destructive'
        >
          {error}
        </p>
      )}
      {data && !loading && !error && (
        <div className='space-y-6' aria-busy={loading}>
          <section
            className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'
            aria-label={t('aggregateMetrics')}
          >
            {metrics.map((metric) => (
              <Card className='min-w-0 rounded-xl shadow-2xs' key={metric}>
                <CardHeader>
                  <CardTitle className='text-base font-semibold'>
                    {t(`aggregate_${metric}`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <output
                    aria-label={t(`aggregate_${metric}`)}
                    className='block overflow-x-auto font-mono text-2xl font-semibold tabular-nums'
                  >
                    {display(data.summary[metric])}
                  </output>
                </CardContent>
              </Card>
            ))}
          </section>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {t('aggregateSemantics')}
          </p>
          <div className='grid min-w-0 gap-4 lg:grid-cols-2'>
            <Card className='min-w-0 rounded-xl shadow-2xs'>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  {t('aggregateStatuses')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table aria-label={t('aggregateStatuses')}>
                  <TableHeader className='bg-muted/30'>
                    <TableRow>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>COUNT(*)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.statuses.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell>{t(row.status)}</TableCell>
                        <TableCell>{display(row.count)}</TableCell>
                      </TableRow>
                    ))}
                    {!data.statuses.length && (
                      <TableRow>
                        <TableCell colSpan={2}>{t('none')}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className='min-w-0 rounded-xl shadow-2xs'>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  {t('aggregateCustomers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='mb-3 text-sm text-muted-foreground'>
                  {t('aggregateCustomerHint', { count: data.customerLimit })}
                </p>
                <Table aria-label={t('aggregateCustomers')}>
                  <TableHeader className='bg-muted/30'>
                    <TableRow>
                      <TableHead>{t('customer')}</TableHead>
                      <TableHead>COUNT(orders)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.customers.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link
                            className='text-primary hover:underline'
                            to={detailPath('customers', row.id)}
                          >
                            {row.name}
                          </Link>
                        </TableCell>
                        <TableCell>{row.orders}</TableCell>
                      </TableRow>
                    ))}
                    {!data.customers.length && (
                      <TableRow>
                        <TableCell colSpan={2}>{t('none')}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <Card className='min-w-0 rounded-xl shadow-2xs'>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>
                {t('aggregateProducts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table aria-label={t('aggregateProducts')}>
                <TableHeader className='bg-muted/30'>
                  <TableRow>
                    <TableHead>{t('product')}</TableHead>
                    <TableHead>{t('sku')}</TableHead>
                    <TableHead>COUNT(*)</TableHead>
                    <TableHead>SUM(quantity)</TableHead>
                    <TableHead>AVG(price)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((row) => (
                    <TableRow key={row.productId}>
                      <TableCell>
                        <Link
                          className='text-primary hover:underline'
                          to={detailPath('products', row.productId)}
                        >
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell>{row.sku}</TableCell>
                      <TableCell>{display(row.count)}</TableCell>
                      <TableCell>{display(row.quantity)}</TableCell>
                      <TableCell>{display(row.averagePrice)}</TableCell>
                    </TableRow>
                  ))}
                  {!data.products.length && (
                    <TableRow>
                      <TableCell colSpan={5}>{t('none')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
      {data && !loading && !error && <GroupByExamples examples={examples} />}
      <details className='rounded-xl border bg-card p-4 shadow-2xs'>
        <summary className='cursor-pointer text-xs font-medium text-foreground'>
          {t('trace')}
        </summary>
        <p className='my-3 text-sm text-muted-foreground'>
          {t('aggregateTraceHint')}
        </p>
        <div className='grid gap-4 md:grid-cols-2'>
          <section>
            <h3 className='mb-2 text-xs font-medium'>{t('request')}</h3>
            <pre className='overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs text-foreground'>
              {JSON.stringify(
                {
                  query,
                  calls:
                    loading || error
                      ? []
                      : calls.map(({ repository, action, options }) => ({
                          method: 'POST',
                          path: `${repository}/${action}`,
                          options,
                        })),
                },
                null,
                2,
              )}
            </pre>
          </section>
          <section>
            <h3 className='mb-2 text-xs font-medium'>{t('response')}</h3>
            <pre className='max-h-96 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs text-foreground'>
              {JSON.stringify(
                loading ? null : error ? { error } : (data ?? null),
                null,
                2,
              )}
            </pre>
          </section>
        </div>
      </details>
    </PageContainer>
  );
}
