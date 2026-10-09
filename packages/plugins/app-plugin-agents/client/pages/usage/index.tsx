/**
 * Route `/usage`: what agent runs used and what they cost at the current model prices, over a date range (the last 30
 * days by default), summed by agent, the person who woke it, the group of its subject (a project, as the application
 * names it), its subject, day, model, coding tool or agent type, with a totals row. A cost reads "—" where no price
 * matches. One toolbar holds the range, the group, agent and person filters and the grouping; all live in the URL
 * (`groupBy`, agent by default). A daily chart of tokens or cost sits above the table, stacked by the top agents or
 * models when grouped by them (`series`). Who reads `agents.prices` also has "Set prices" in the header, opening the
 * prices sheet (`?prices=1`, `prices/`), where the prices costs are worked out from are set.
 *
 * The usage page's grant opens it, and its API checks the same grant (`GET agents/admin/usage`); a reader of agents
 * counts every run, anyone else the runs they started or own, on subjects they may see. Below the runs, a reader of
 * agents also sees the other model use of the range (`GET agents/admin/usage/models`): embeddings, reranking and
 * utility texts the application asked for outside runs, by use, caller and model.
 */
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { CircleDollarSignIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  USAGE_GROUP_BYS,
  type ModelUsageReport,
  type UsageGroupBy,
  type UsageQuery,
  type UsageReport,
  type UsageRow,
} from '../../../shared/reports.js';
import { agentsKeys } from '../../api/keys.js';
import { AgListSkeleton, AgLoadError } from '../../components/ag-states.js';
import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import { RefreshButton } from '../../components/refresh-button.js';
import { Button } from '../../components/ui/button.js';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../components/ui/chart.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';
import { Spinner } from '../../components/ui/spinner.js';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useText, useVocabulary } from '../../hooks/use-vocabulary.js';
import {
  STACKED_GROUP_BYS,
  defaultRange,
  formatAmount,
  formatCost,
  formatDuration,
  formatTokens,
  readGroup,
  rowLink,
  usageChart,
  type ChartMetric,
} from './model.js';
import { DateRangePicker } from './date-range-picker.js';
import { PricesSheet } from './prices/index.js';

const ALL = '__all__';

const COLUMNS = [
  'runs',
  'duration',
  'input',
  'output',
  'cacheRead',
  'cacheWrite',
  'cost',
] as const;

interface Option {
  readonly id: string;
  readonly name: string;
}

function useParams(): [
  UsageQuery & { readonly from: string; readonly to: string },
  (changes: Readonly<Record<string, string | null>>) => void,
] {
  const [params, setParams] = useSearchParams();
  const fallback = defaultRange();
  const text = (name: string) => params.get(name) || undefined;
  const value = {
    from: text('from') ?? fallback.from,
    to: text('to') ?? fallback.to,
    groupBy: readGroup(params.get('groupBy')),
    // The chart stacks the top agents or models, so it needs each day by group.
    ...(STACKED_GROUP_BYS.includes(readGroup(params.get('groupBy')))
      ? { series: true }
      : {}),
    ...(text('group') ? { groupId: text('group') } : {}),
    ...(text('agent') ? { agentId: text('agent') } : {}),
    ...(text('person') ? { userId: text('person') } : {}),
  };
  const update = (changes: Readonly<Record<string, string | null>>) => {
    const next = new URLSearchParams(params);
    for (const [name, change] of Object.entries(changes))
      if (change) next.set(name, change);
      else next.delete(name);
    setParams(next, { replace: true });
  };
  return [value, update];
}

function OptionSelect({
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  readonly label: string;
  readonly allLabel: string;
  readonly options: readonly Option[];
  readonly value: string | undefined;
  readonly onChange: (value: string | null) => void;
}): ReactElement {
  const items = [
    { value: ALL, label: allLabel },
    ...options.map((option) => ({ value: option.id, label: option.name })),
  ];
  if (value && !items.some((item) => item.value === value))
    items.push({ value, label: value });
  return (
    <Select
      items={items}
      value={value ?? ALL}
      onValueChange={(next: string | null) =>
        onChange(!next || next === ALL ? null : next)
      }
    >
      <SelectTrigger className='w-full sm:w-44' aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The toolbar: the range, the group, agent and person filters, and the grouping; the groups offered are those with
 * usage in the range.
 */
function Toolbar({
  params,
  update,
  groupTitle,
  groupLabel,
  fetching,
}: {
  readonly params: ReturnType<typeof useParams>[0];
  readonly update: ReturnType<typeof useParams>[1];
  readonly groupTitle: string;
  readonly groupLabel: (group: UsageGroupBy) => string;
  readonly fetching: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const groups = useQuery({
    queryKey: agentsKeys.usage({
      from: params.from,
      to: params.to,
      groupBy: 'group',
    }),
    queryFn: () =>
      api.usage({ from: params.from, to: params.to, groupBy: 'group' }),
  });
  const agents = useQuery({
    queryKey: [...agentsKeys.agents, 'archived'],
    queryFn: () => api.agents(true),
  });
  const people = useQuery({
    queryKey: agentsKeys.users,
    queryFn: () => api.users(),
  });
  const groupBy = params.groupBy ?? 'agent';
  const groupings = USAGE_GROUP_BYS.map((group) => ({
    value: group,
    label: t('usage.groupByValue', { group: groupLabel(group) }),
  }));
  return (
    <div className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center'>
      <div className='col-span-2 sm:col-auto'>
        <DateRangePicker
          from={params.from}
          to={params.to}
          onChange={(range) => update(range)}
        />
      </div>
      <OptionSelect
        label={groupTitle}
        allLabel={t('usage.filters.allGroups', { group: groupTitle })}
        options={(groups.data?.rows ?? [])
          .filter((row) => row.key)
          .map((row) => ({ id: row.key, name: row.name ?? row.key }))}
        value={params.groupId}
        onChange={(value) => update({ group: value })}
      />
      <OptionSelect
        label={t('usage.filters.agent')}
        allLabel={t('usage.filters.allAgents')}
        options={agents.data ?? []}
        value={params.agentId}
        onChange={(value) => update({ agent: value })}
      />
      <OptionSelect
        label={t('usage.filters.person')}
        allLabel={t('usage.filters.allPeople')}
        options={people.data ?? []}
        value={params.userId}
        onChange={(value) => update({ person: value })}
      />
      <div className='col-span-2 flex items-center gap-2 sm:ml-auto'>
        {fetching ? (
          <Spinner
            className='size-4 shrink-0 text-muted-foreground'
            aria-label={t('common.loading')}
          />
        ) : null}
        <Select
          items={groupings}
          value={groupBy}
          onValueChange={(next: string | null) => {
            if (next) update({ groupBy: next === 'agent' ? null : next });
          }}
        >
          <SelectTrigger
            className='w-full sm:w-44'
            aria-label={t('usage.groupBy')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {USAGE_GROUP_BYS.map((group) => (
              <SelectItem key={group} value={group}>
                {groupLabel(group)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** What a row of `groupBy` reads as: its name, else its key as the page words it. */
function useRowText(groupBy: UsageGroupBy): (row: UsageRow) => string {
  const { t } = useTranslation();
  return (row) =>
    row.name ??
    (!row.key
      ? t(groupBy === 'group' ? 'usage.noGroup' : 'usage.unknown')
      : groupBy === 'tool'
        ? row.key === 'online'
          ? t('usage.onlineTool')
          : t(`tools.${row.key}`, { defaultValue: row.key })
        : groupBy === 'type'
          ? t(`agentTypes.${row.key}`, { defaultValue: row.key })
          : row.key);
}

const SERIES_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

/** Tokens or cost day by day over the range, stacked by the top groups when the report carries series. */
function TrendChart({
  report,
  groupBy,
}: {
  readonly report: UsageReport;
  readonly groupBy: UsageGroupBy;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const rowText = useRowText(groupBy);
  const priced = report.totals.cost !== null;
  const [chosen, setChosen] = useState<ChartMetric>('cost');
  const metric: ChartMetric = priced ? chosen : 'tokens';
  const chart = usageChart(report, metric);
  const names = new Map(report.rows.map((row) => [row.key, rowText(row)]));
  const config: ChartConfig = Object.fromEntries(
    chart.series.map((series, index) => [
      series.id,
      {
        label:
          series.id === 'total'
            ? t('usage.chart.total')
            : series.id === 'other'
              ? t('usage.chart.other')
              : (names.get(series.key ?? '') ?? series.key),
        color:
          series.id === 'other'
            ? 'var(--muted-foreground)'
            : (SERIES_COLORS[index % SERIES_COLORS.length] ?? 'var(--chart-1)'),
      },
    ]),
  );
  const format = (value: number): string =>
    metric === 'cost' && chart.currency
      ? formatAmount(value, chart.currency, locale)
      : formatTokens(value, locale);
  const dayLabel = (day: string): string =>
    new Intl.DateTimeFormat(locale, {
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${day}T00:00:00Z`));
  const stacked = chart.series.length > 1;
  return (
    <Card size='sm' className='min-w-0'>
      <CardHeader>
        <CardTitle>{t('usage.chart.title')}</CardTitle>
        <CardAction>
          <Tabs
            value={metric}
            onValueChange={(value) => setChosen(value as ChartMetric)}
          >
            <TabsList aria-label={t('usage.chart.metric')}>
              <TabsTrigger value='cost' disabled={!priced}>
                {t('usage.chart.cost')}
              </TabsTrigger>
              <TabsTrigger value='tokens'>
                {t('usage.chart.tokens')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className='aspect-auto h-48 w-full'>
          <BarChart accessibilityLayer data={[...chart.points]}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='day'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              tickFormatter={dayLabel}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width='auto'
              tickFormatter={format}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    typeof label === 'string' ? dayLabel(label) : label
                  }
                  formatter={(value, name) => (
                    <span className='flex w-full justify-between gap-3'>
                      <span className='text-muted-foreground'>
                        {config[String(name)]?.label}
                      </span>
                      <span className='font-mono tabular-nums'>
                        {format(Number(value))}
                      </span>
                    </span>
                  )}
                />
              }
            />
            {stacked ? <ChartLegend content={<ChartLegendContent />} /> : null}
            {chart.series.map((series, index) => (
              <Bar
                key={series.id}
                dataKey={series.id}
                stackId='day'
                fill={`var(--color-${series.id})`}
                radius={index === chart.series.length - 1 ? [3, 3, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function UsageTable({
  report,
  groupBy,
  groupLabel,
}: {
  readonly report: UsageReport;
  readonly groupBy: UsageGroupBy;
  readonly groupLabel: string;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { subjects } = useVocabulary();
  const rowText = useRowText(groupBy);
  const tokens = (value: number) => formatTokens(value, locale);
  const label = (row: UsageRow): ReactElement | string => {
    const text = rowText(row);
    const link = rowLink(groupBy, row.key, subjects);
    return link ? (
      <Link to={link} className='hover:underline'>
        {text}
      </Link>
    ) : (
      text
    );
  };
  const cells = (row: UsageRow) => (
    <>
      <TableCell className='text-right tabular-nums'>{row.runs}</TableCell>
      <TableCell className='text-right tabular-nums'>
        {formatDuration(row.durationMs, locale)}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {tokens(row.inputTokens)}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {tokens(row.outputTokens)}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {tokens(row.cacheReadTokens)}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {tokens(row.cacheWriteTokens)}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {formatCost(row.cost, locale)}
      </TableCell>
    </>
  );
  return (
    <div className='overflow-x-auto rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{groupLabel}</TableHead>
            {COLUMNS.map((column) => (
              <TableHead key={column} className='text-right'>
                {t(`usage.columns.${column}`)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length + 1}
                className='h-20 text-center text-muted-foreground'
              >
                {t('usage.empty')}
              </TableCell>
            </TableRow>
          ) : (
            report.rows.map((row) => (
              <TableRow key={row.key || 'none'}>
                <TableCell className='max-w-72 truncate font-medium'>
                  {label(row)}
                </TableCell>
                {cells(row)}
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className='font-semibold'>{t('usage.total')}</TableCell>
            {cells(report.totals)}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

/** Model calls outside runs (embeddings, reranking, utility texts), one row per use, caller and model. */
function OtherModelUse({
  report,
}: {
  readonly report: ModelUsageReport;
}): ReactElement | null {
  const { t } = useTranslation();
  const { locale } = useLocale();
  if (report.rows.length === 0) return null;
  const tokens = (value: number) => formatTokens(value, locale);
  return (
    <section className='space-y-2' aria-labelledby='ag-usage-other'>
      <div>
        <h2 id='ag-usage-other' className='text-sm font-medium'>
          {t('usage.otherUse.title')}
        </h2>
        <p className='text-xs text-muted-foreground'>
          {t('usage.otherUse.description')}
        </p>
      </div>
      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('usage.otherUse.purpose')}</TableHead>
              <TableHead>{t('usage.otherUse.source')}</TableHead>
              <TableHead>{t('usage.otherUse.model')}</TableHead>
              <TableHead className='text-right'>
                {t('usage.otherUse.calls')}
              </TableHead>
              <TableHead className='text-right'>
                {t('usage.otherUse.units')}
              </TableHead>
              <TableHead className='text-right'>
                {t('usage.columns.input')}
              </TableHead>
              <TableHead className='text-right'>
                {t('usage.columns.output')}
              </TableHead>
              <TableHead className='text-right'>
                {t('usage.columns.cost')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((row) => (
              <TableRow
                key={`${row.purpose}:${row.source}:${row.modelService}:${row.model}`}
              >
                <TableCell>
                  {t(`usage.otherUse.purposes.${row.purpose}`)}
                </TableCell>
                <TableCell className='font-mono text-xs'>
                  {row.source}
                </TableCell>
                <TableCell className='max-w-64 truncate'>
                  {row.model}{' '}
                  <span className='text-muted-foreground'>
                    ({row.modelService})
                  </span>
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {row.calls}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {row.units}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {tokens(row.inputTokens)}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {tokens(row.outputTokens)}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {formatCost(row.cost, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default function UsagePage(): ReactElement {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const readPrices = useCan({
    resource: { type: 'settings', id: 'agents.prices' },
    action: 'read',
  }).can;
  const pricesOpen = readPrices && params.get('prices') === '1';
  const queryClient = useQueryClient();
  // What runs used accrues as they run, and nothing announces it: Refresh reads the report again.
  const refresh = () =>
    queryClient.refetchQueries({
      queryKey: ['agents', 'usage'],
      type: 'active',
    });
  const openPrices = (open: boolean) => {
    const next = new URLSearchParams(params);
    if (open) next.set('prices', '1');
    else next.delete('prices');
    setParams(next, { replace: true });
  };
  return (
    <PageContainer>
      <PageHeader
        title={t('usage.title')}
        description={t('usage.description')}
        actions={
          <>
            {readPrices ? (
              <Button variant='outline' onClick={() => openPrices(true)}>
                <CircleDollarSignIcon data-icon='inline-start' />
                {t('usage.setPrices')}
              </Button>
            ) : null}
            <RefreshButton onRefresh={refresh} />
          </>
        }
      />
      <UsageView
        canSetPrices={readPrices}
        onSetPrices={() => openPrices(true)}
      />
      {readPrices ? (
        <PricesSheet open={pricesOpen} onOpenChange={openPrices} />
      ) : null}
    </PageContainer>
  );
}

/** The toolbar, the chart, the table and the other model use. */
function UsageView({
  canSetPrices,
  onSetPrices,
}: {
  readonly canSetPrices: boolean;
  readonly onSetPrices: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const text = useText();
  const { subjects } = useVocabulary();
  const [params, update] = useParams();
  const usage = useQuery({
    queryKey: agentsKeys.usage(params),
    queryFn: () => api.usage(params),
    placeholderData: keepPreviousData,
  });
  const otherUse = useQuery({
    queryKey: agentsKeys.modelUsage(params.from, params.to),
    queryFn: () => api.modelUsage({ from: params.from, to: params.to }),
    placeholderData: keepPreviousData,
  });
  // The application names a subject's group (a project) and, when it has one kind of subject, the subject (an issue).
  const groupTitle = text(
    subjects.find((subject) => subject.groupTitle)?.groupTitle,
    t('usage.groups.group'),
  );
  const own = subjects.filter((subject) => subject.groupTitle);
  const subjectTitle =
    own.length === 1
      ? text(own[0]?.title, t('usage.groups.subject'))
      : t('usage.groups.subject');
  const groupLabel = (group: UsageGroupBy) =>
    group === 'group'
      ? groupTitle
      : group === 'subject'
        ? subjectTitle
        : t(`usage.groups.${group}`);

  let content: ReactElement;
  if (usage.isError && !usage.data)
    content = (
      <AgLoadError
        title={t('usage.loadFailed')}
        error={usage.error}
        onRetry={() => void usage.refetch()}
      />
    );
  else if (!usage.data) content = <AgListSkeleton rows={4} />;
  else {
    const report = usage.data;
    content = (
      <div className='space-y-3'>
        {report.rows.length > 0 ? (
          <TrendChart report={report} groupBy={report.groupBy} />
        ) : null}
        <UsageTable
          report={report}
          groupBy={report.groupBy}
          groupLabel={groupLabel(report.groupBy)}
        />
        {report.totals.pricedRuns < report.totals.runs ? (
          <p className='text-xs text-muted-foreground'>
            {t('usage.pricedNote', {
              priced: report.totals.pricedRuns,
              total: report.totals.runs,
              models: report.unpricedModels
                .map((model) => model || t('usage.unknown'))
                .join(', '),
            })}
            {canSetPrices ? (
              <>
                {' '}
                <Button
                  variant='link'
                  className='h-auto p-0 text-xs'
                  onClick={onSetPrices}
                >
                  {t('usage.setPrices')}
                </Button>
              </>
            ) : null}
          </p>
        ) : null}
        {otherUse.data ? <OtherModelUse report={otherUse.data} /> : null}
      </div>
    );
  }

  return (
    <>
      <Toolbar
        params={params}
        update={update}
        groupTitle={groupTitle}
        groupLabel={groupLabel}
        fetching={usage.isFetching && Boolean(usage.data)}
      />
      {content}
    </>
  );
}
