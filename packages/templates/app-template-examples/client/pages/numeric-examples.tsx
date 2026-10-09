import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Database,
  Info,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';

type NumericValue = string | number | null;
const fields = [
  ['id', 'increments'],
  ['integerValue', 'INTEGER'],
  ['bigintValue', 'BIGINT'],
  ['decimalValue', 'DECIMAL(30,6)'],
  ['floatValue', 'FLOAT'],
  ['doubleValue', 'DOUBLE'],
] as const;
const sortFields = fields;
const operations = ['count', 'sum', 'avg', 'min', 'max'] as const;
type Field = (typeof fields)[number][0];
type Operation = (typeof operations)[number];
interface NumericExamplesResponse {
  data: {
    dialect: string;
    rows: (Record<Field, NumericValue> & { sample: string })[];
    aggregates: (Record<Operation, NumericValue> & { field: Field })[];
  };
}

function Value({ value }: { value: NumericValue }): ReactElement {
  const isNull = value === null;
  const type = isNull ? 'null' : typeof value;

  return (
    <div className='flex items-center justify-between gap-2 min-w-[100px]'>
      <code
        className={`font-mono text-xs tabular-nums ${
          isNull
            ? 'text-muted-foreground/60 italic'
            : 'font-medium text-foreground'
        }`}
      >
        {JSON.stringify(value)}
      </code>
      <Badge
        variant='secondary'
        className={`px-1.5 py-0 text-[10px] font-mono shrink-0 shadow-2xs ${
          type === 'number'
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
            : type === 'string'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              : 'bg-muted/80 text-muted-foreground border border-border/50'
        }`}
      >
        {type}
      </Badge>
    </div>
  );
}

export default function NumericExamplesPage(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const [source, setSource] = useState<'query' | 'repository'>('query');
  const [sample, setSample] = useState<'all' | 'null' | 'empty'>('all');
  const [sortField, setSortField] = useState<Field>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: ['numeric-examples', source, sample, sortField, sortDirection],
    queryFn: ({ signal }) =>
      api.request<NumericExamplesResponse>({
        path: 'numericExamples',
        // AIP-132 `orderBy`: the field, followed by ` desc` when descending.
        query: {
          source,
          sample,
          orderBy: sortDirection === 'desc' ? `${sortField} desc` : sortField,
        },
        signal,
      }),
    retry: false,
  });

  return (
    <PageContainer>
      <PageHeader
        description={t('numbers.description')}
        title={t('numbers.title')}
        actions={
          data ? (
            <Badge
              variant='outline'
              className='gap-1.5 px-3 py-1.5 text-xs font-mono font-medium shadow-2xs'
            >
              <Database className='size-3.5 text-primary' />
              <span>
                {t('numbers.database', { dialect: data.data.dialect })}
              </span>
            </Badge>
          ) : null
        }
      />

      {/* Unified Filter & Query Control Card */}
      <div className='overflow-hidden rounded-xl border bg-card shadow-2xs divide-y divide-border/60'>
        <div className='flex flex-wrap items-center justify-between gap-4 p-4'>
          <div className='flex flex-wrap items-center gap-6'>
            <fieldset className='flex items-center gap-2.5'>
              <legend className='sr-only'>{t('numbers.source')}</legend>
              <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                {t('numbers.source')}
              </span>
              <div className='inline-flex rounded-lg bg-muted p-1 gap-1'>
                {(['query', 'repository'] as const).map((item) => (
                  <Button
                    key={item}
                    size='sm'
                    variant={source === item ? 'default' : 'ghost'}
                    className='h-7 px-3 text-xs font-medium'
                    aria-pressed={source === item}
                    onClick={() => setSource(item)}
                  >
                    {item === 'query' ? 'Query' : 'Repository'}
                  </Button>
                ))}
              </div>
            </fieldset>

            <div className='h-5 w-px bg-border/60 hidden sm:block' />

            <fieldset className='flex items-center gap-2.5'>
              <legend className='sr-only'>{t('numbers.sample')}</legend>
              <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                {t('numbers.sample')}
              </span>
              <div className='inline-flex flex-wrap rounded-lg bg-muted p-1 gap-1'>
                {(
                  [
                    ['all', 'all'],
                    ['null', 'nullOnly'],
                    ['empty', 'emptyOnly'],
                  ] as const
                ).map(([item, label]) => (
                  <Button
                    key={item}
                    size='sm'
                    variant={sample === item ? 'default' : 'ghost'}
                    className='h-7 px-3 text-xs font-medium'
                    aria-pressed={sample === item}
                    onClick={() => setSample(item)}
                  >
                    {t(`numbers.${label}`)}
                  </Button>
                ))}
              </div>
            </fieldset>
          </div>

          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5'
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`}
            />
            {t('numbers.refresh')}
          </Button>
        </div>

        {/* Sort and secondary controls */}
        <div className='flex flex-wrap items-center justify-between gap-4 bg-muted/20 px-4 py-3'>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-1.5 text-muted-foreground'>
              <SlidersHorizontal className='size-3.5' />
              <span className='text-xs font-medium'>{t('numbers.sort')}</span>
            </div>
            <div className='relative inline-block'>
              <select
                className='h-8 rounded-lg border border-input bg-background pl-2.5 pr-7 font-mono text-xs font-medium shadow-2xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer appearance-none'
                value={sortField}
                onChange={(event) => setSortField(event.target.value as Field)}
              >
                {sortFields.map(([field, type]) => (
                  <option key={field} value={field}>
                    {type} ({field})
                  </option>
                ))}
              </select>
              <ChevronDown className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground' />
            </div>
            <div className='inline-flex rounded-lg bg-muted p-0.5 gap-0.5'>
              {(['asc', 'desc'] as const).map((direction) => (
                <Button
                  key={direction}
                  size='sm'
                  variant={sortDirection === direction ? 'default' : 'ghost'}
                  className='h-7 px-2.5 text-xs font-medium gap-1'
                  aria-pressed={sortDirection === direction}
                  onClick={() => setSortDirection(direction)}
                >
                  {direction === 'asc' ? (
                    <ArrowUp className='size-3' />
                  ) : (
                    <ArrowDown className='size-3' />
                  )}
                  {t(`numbers.${direction}`)}
                </Button>
              ))}
            </div>
          </div>
          <p className='text-xs text-muted-foreground'>
            {t('numbers.sortNote')}
          </p>
        </div>
      </div>

      {/* Legend Banner */}
      <div className='flex items-center gap-2.5 rounded-xl border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground'>
        <Info className='size-4 text-primary shrink-0' />
        <span>{t('numbers.legend')}</span>
      </div>

      {isPending && (
        <div className='flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground'>
          <RefreshCw className='size-4 animate-spin' />
          <p role='status'>{t('numbers.loading')}</p>
        </div>
      )}

      {isError && (
        <div
          role='alert'
          className='flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center'
        >
          <p className='text-sm font-medium text-destructive'>
            {t('numbers.error')}
          </p>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            {t('numbers.retry')}
          </Button>
        </div>
      )}

      {data && (
        <>
          <section className='space-y-3' aria-labelledby='numeric-rows-heading'>
            <div className='flex items-center justify-between'>
              <h2
                id='numeric-rows-heading'
                className='font-heading text-lg font-semibold tracking-tight'
              >
                {t('numbers.rows')}
              </h2>
            </div>
            <div className='overflow-hidden rounded-xl border bg-card shadow-2xs'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/40 hover:bg-muted/40'>
                    <TableHead className='font-semibold text-foreground py-3 pl-4'>
                      {t('numbers.scenario')}
                    </TableHead>
                    {fields.map(([field, type]) => (
                      <TableHead key={field} className='py-3'>
                        <code className='font-mono font-semibold text-foreground'>
                          {type}
                        </code>
                        <div className='text-[11px] font-normal text-muted-foreground'>
                          {field}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='py-8 text-center text-sm text-muted-foreground'
                      >
                        {t('numbers.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.rows.map((row) => (
                      <TableRow
                        key={row.sample}
                        className='transition-colors hover:bg-muted/30'
                      >
                        <TableCell className='font-medium text-foreground whitespace-nowrap pl-4 bg-muted/10'>
                          {t(`numbers.samples.${row.sample}`, {
                            defaultValue: row.sample,
                          })}
                        </TableCell>
                        {fields.map(([field]) => (
                          <TableCell key={field} className='py-2.5'>
                            <Value value={row[field]} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className='text-xs text-muted-foreground'>
              {t('numbers.idNote')}
            </p>
          </section>

          <section
            className='space-y-3'
            aria-labelledby='numeric-aggregates-heading'
          >
            <div className='space-y-1'>
              <h2
                id='numeric-aggregates-heading'
                className='font-heading text-lg font-semibold tracking-tight'
              >
                {t('numbers.aggregates')}
              </h2>
              <p className='text-xs text-muted-foreground'>
                {t('numbers.aggregateNote')}
              </p>
            </div>
            <div className='overflow-hidden rounded-xl border bg-card shadow-2xs'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/40 hover:bg-muted/40'>
                    <TableHead className='font-semibold text-foreground py-3 pl-4'>
                      {t('numbers.field')}
                    </TableHead>
                    {operations.map((op) => (
                      <TableHead key={op} className='py-3'>
                        <code className='font-mono font-semibold text-foreground'>
                          {op.toUpperCase()}
                        </code>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.aggregates.map((row) => (
                    <TableRow
                      key={row.field}
                      className='transition-colors hover:bg-muted/30'
                    >
                      <TableCell className='pl-4 bg-muted/10 whitespace-nowrap'>
                        <code className='font-mono font-medium text-foreground'>
                          {fields.find(([field]) => field === row.field)?.[1]}
                        </code>
                        <div className='text-[11px] text-muted-foreground'>
                          {row.field}
                        </div>
                      </TableCell>
                      {operations.map((op) => (
                        <TableCell key={op} className='py-2.5'>
                          <Value value={row[op]} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}

      <div className='flex items-start gap-2.5 rounded-xl border bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed'>
        <Info className='size-4 text-muted-foreground shrink-0 mt-0.5' />
        <p>{t('numbers.precisionNote')}</p>
      </div>
    </PageContainer>
  );
}
