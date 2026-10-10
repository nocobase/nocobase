import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Plus,
  Search,
  Target,
  Users,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { StatusBadge } from '#components/status-badge';
import { Input } from '#components/ui/input';
import { Avatar, AvatarFallback } from '#components/ui/avatar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '#components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { Progress } from '#components/ui/progress';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import {
  useMoney,
  stages,
  useCustomers,
  useCreatedMessage,
  type Customer,
  type Stage,
} from './data.js';

export function StageBadge({ stage }: { readonly stage: Stage }): ReactElement {
  const { t } = useTranslation();
  return (
    <StatusBadge
      tone={
        stage === 'won'
          ? 'success'
          : stage === 'proposal'
            ? 'warning'
            : stage === 'qualified'
              ? 'info'
              : 'neutral'
      }
    >
      {t(`themeLab.${stage}`)}
    </StatusBadge>
  );
}
export function Owner({ name }: { readonly name: string }): ReactElement {
  return (
    <span className='inline-flex items-center gap-2'>
      <Avatar size='sm'>
        <AvatarFallback>
          {name
            .split(' ')
            .map((part) => part[0])
            .join('')}
        </AvatarFallback>
      </Avatar>
      <span className='text-sm'>{name}</span>
    </span>
  );
}
function CustomerTable({
  rows,
  compact = false,
}: {
  readonly rows: Customer[];
  readonly compact?: boolean;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const money = useMoney();
  const location = useLocation();
  const [sort, setSort] = useState<{
    key: 'name' | 'amount' | 'updated';
    desc: boolean;
  }>({ key: 'updated', desc: true });
  const sorted = [...rows].sort((a, b) => {
    const result =
      sort.key === 'amount'
        ? a.amount - b.amount
        : a[sort.key].localeCompare(b[sort.key], i18n.language);
    return sort.desc ? -result : result;
  });
  const heading = (key: typeof sort.key) =>
    compact ? (
      t(`themeLab.${key}`)
    ) : (
      <Button
        variant='ghost'
        size='sm'
        onClick={() =>
          setSort({ key, desc: sort.key === key ? !sort.desc : false })
        }
      >
        {t(`themeLab.${key}`)}
        {sort.key === key ? (
          sort.desc ? (
            <ArrowDown data-icon='inline-end' />
          ) : (
            <ArrowUp data-icon='inline-end' />
          )
        ) : null}
      </Button>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            aria-sort={
              !compact && sort.key === 'name'
                ? sort.desc
                  ? 'descending'
                  : 'ascending'
                : undefined
            }
          >
            {heading('name')}
          </TableHead>
          <TableHead>{t('themeLab.stage')}</TableHead>
          {!compact && <TableHead>{t('themeLab.owner')}</TableHead>}
          <TableHead
            className='text-right'
            aria-sort={
              !compact && sort.key === 'amount'
                ? sort.desc
                  ? 'descending'
                  : 'ascending'
                : undefined
            }
          >
            {heading('amount')}
          </TableHead>
          {!compact && (
            <TableHead
              aria-sort={
                sort.key === 'updated'
                  ? sort.desc
                    ? 'descending'
                    : 'ascending'
                  : undefined
              }
            >
              {heading('updated')}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Button
                nativeButton={false}
                variant='link'
                className='h-auto justify-start px-0 text-foreground'
                render={
                  <Link to={{ pathname: row.id, search: location.search }} />
                }
              >
                {row.name}
              </Button>
              {!compact && (
                <p className='text-xs text-muted-foreground'>{row.email}</p>
              )}
            </TableCell>
            <TableCell>
              <StageBadge stage={row.stage} />
            </TableCell>
            {!compact && (
              <TableCell>
                <Owner name={row.owner} />
              </TableCell>
            )}
            <TableCell className='text-right font-medium tabular-nums'>
              {money(row.amount)}
            </TableCell>
            {!compact && (
              <TableCell className='text-muted-foreground'>
                {new Intl.DateTimeFormat(i18n.language, {
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(row.updated))}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
function Dashboard({ rows }: { readonly rows: Customer[] }): ReactElement {
  const { t } = useTranslation();
  const money = useMoney();
  const won = rows.filter((row) => row.stage === 'won');
  const stats = [
    {
      icon: CircleDollarSign,
      label: 'revenue',
      value: money(won.reduce((total, row) => total + row.amount, 0)),
      hint: 'closedValue',
    },
    {
      icon: Building2,
      label: 'totalCustomers',
      value: String(rows.length),
      hint: 'allAccounts',
    },
    {
      icon: Target,
      label: 'openDeals',
      value: String(rows.length - won.length),
      hint: 'activePipeline',
    },
    {
      icon: Users,
      label: 'winRate',
      value: `${Math.round((won.length / rows.length) * 100)}%`,
      hint: 'wonShare',
    },
  ];
  return (
    <>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {stats.map(({ icon: Icon, label, value, hint }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription className='flex items-center justify-between'>
                {t(`themeLab.${label}`)}
                <Icon className='size-4 text-muted-foreground' />
              </CardDescription>
              <CardTitle className='text-3xl tabular-nums'>{value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-muted-foreground'>
                {t(`themeLab.${hint}`)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid items-start gap-6 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader>
            <CardTitle>{t('themeLab.recentCustomers')}</CardTitle>
            <CardDescription>{t('themeLab.recentHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerTable rows={rows.slice(0, 5)} compact />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('themeLab.funnel')}</CardTitle>
            <CardDescription>{t('themeLab.funnelHint')}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-6'>
            {stages.map((stage) => {
              const count = rows.filter((row) => row.stage === stage).length;
              return (
                <div key={stage} className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between'>
                    <StageBadge stage={stage} />
                    <span className='text-sm tabular-nums'>{count}</span>
                  </div>
                  <Progress
                    value={(count / rows.length) * 100}
                    aria-label={t(`themeLab.${stage}`)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <div>
        <h2 className='mb-4 text-base font-medium'>
          {t('themeLab.nextActions')}
        </h2>
        <div className='grid gap-4 md:grid-cols-3'>
          {rows.slice(0, 3).map((row, index) => (
            <Card key={row.id}>
              <CardHeader>
                <CardDescription className='flex items-center gap-2'>
                  <CalendarDays className='size-4' />
                  {t(`themeLab.task${index}`)}
                </CardDescription>
                <CardTitle>{row.name}</CardTitle>
              </CardHeader>
              <CardContent className='flex items-center justify-between gap-2'>
                <Owner name={row.owner} />
                <Button
                  nativeButton={false}
                  size='sm'
                  variant='outline'
                  render={<Link to={row.id} />}
                >
                  {t('themeLab.details')}
                  <ArrowUpRight data-icon='inline-end' />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
function Customers({ rows }: { readonly rows: Customer[] }): ReactElement {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const stage = params.get('stage') ?? 'all';
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const clear = () => {
    setQuery('');
    setParams({}, { replace: true });
  };
  const filtered = rows.filter(
    (row) =>
      (stage === 'all' || row.stage === stage) &&
      `${row.name} ${row.email}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative w-full sm:max-w-xs'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            className='pl-9'
            aria-label={t('themeLab.search')}
            placeholder={t('themeLab.search')}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              change('q', event.target.value);
            }}
          />
        </div>
        <Select
          value={stage}
          onValueChange={(value) => change('stage', String(value))}
          items={[
            { value: 'all', label: t('themeLab.allStages') },
            ...stages.map((value) => ({
              value,
              label: t(`themeLab.${value}`),
            })),
          ]}
        >
          <SelectTrigger
            aria-label={t('themeLab.stage')}
            className='w-full sm:w-40'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {['all', ...stages].map((value) => (
                <SelectItem key={value} value={value}>
                  {t(
                    value === 'all'
                      ? 'themeLab.allStages'
                      : `themeLab.${value}`,
                  )}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {query || stage !== 'all' ? (
          <Button variant='ghost' onClick={clear}>
            {t('themeLab.clear')}
          </Button>
        ) : null}
        <span className='text-sm text-muted-foreground sm:ml-auto'>
          {t('themeLab.count', { count: filtered.length })}
        </span>
      </div>
      <div className='overflow-hidden rounded-xl border bg-card'>
        {filtered.length ? (
          <CustomerTable rows={filtered} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t('themeLab.noResults')}</EmptyTitle>
              <EmptyDescription>{t('themeLab.noResultsHint')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant='outline' onClick={clear}>
                {t('themeLab.clear')}
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </>
  );
}
function Pipeline({ rows }: { readonly rows: Customer[] }): ReactElement {
  const { t } = useTranslation();
  const money = useMoney();
  return (
    <div className='grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {stages.map((stage) => {
        const group = rows.filter((row) => row.stage === stage);
        return (
          <section
            key={stage}
            className='flex min-w-0 flex-col gap-3 rounded-xl bg-muted/50 p-3'
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-sm font-medium'>{t(`themeLab.${stage}`)}</h2>
              <Badge variant='outline'>{group.length}</Badge>
            </div>
            <p className='mb-1 text-xs text-muted-foreground tabular-nums'>
              {money(group.reduce((total, row) => total + row.amount, 0))}
            </p>
            {group.map((row) => (
              <Card key={row.id}>
                <CardHeader>
                  <CardDescription>{row.industry}</CardDescription>
                  <CardTitle>
                    <Button
                      nativeButton={false}
                      variant='link'
                      className='h-auto max-w-full justify-start whitespace-normal px-0 text-left text-foreground'
                      render={<Link to={row.id} />}
                    >
                      {row.name}
                      <ChevronRight data-icon='inline-end' />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className='flex flex-col gap-4'>
                  <p className='text-xl font-semibold tabular-nums'>
                    {money(row.amount)}
                  </p>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <Owner name={row.owner} />
                    <StageBadge stage={row.stage} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        );
      })}
    </div>
  );
}
export default function ThemeLabPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const rows = useCustomers();
  const created = useCreatedMessage();
  const view = location.pathname.includes('/customers')
    ? 'customers'
    : location.pathname.includes('/pipeline')
      ? 'pipeline'
      : 'dashboard';
  return (
    <PageContainer>
      <PageHeader
        title={t(`themeLab.${view}`)}
        description={t(`themeLab.${view}Hint`)}
        actions={
          view === 'customers' ? (
            <Button
              nativeButton={false}
              render={
                <Link to={{ pathname: 'new', search: location.search }} />
              }
            >
              <Plus data-icon='inline-start' />
              {t('themeLab.newCustomer')}
            </Button>
          ) : (
            <Button
              nativeButton={false}
              variant='outline'
              render={<Link to='/theme-lab/customers' />}
            >
              {t('themeLab.viewCustomers')}
              <ArrowUpRight data-icon='inline-end' />
            </Button>
          )
        }
      />
      <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
        <Badge variant='outline'>{t('themeLab.preview')}</Badge>
        {t('themeLab.previewHint')}
      </div>
      {created && (
        <p role='status' className='rounded-lg border bg-primary/5 p-3 text-sm'>
          {t('themeLab.created', { name: created })}
        </p>
      )}
      {view === 'customers' ? (
        <Customers rows={rows} />
      ) : view === 'pipeline' ? (
        <Pipeline rows={rows} />
      ) : (
        <Dashboard rows={rows} />
      )}
      <Outlet />
    </PageContainer>
  );
}
