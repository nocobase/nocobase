/**
 * Dashboard — an analytics overview: KPIs with charts, a recent-orders table,
 * an activity feed and goal progress, split across two tabs.
 *
 * Skeleton: `PageHeader` with a range `ToggleGroup` → four `StatCard`s →
 * `Tabs` overview/analytics. Overview: area-plus-target-line revenue chart
 * beside a donut → recent orders `Table` in a card beside an `ItemGroup`
 * activity feed → `Progress` targets card. Analytics: two-series `LineChart`
 * beside a `BarChart` → device donut.
 *
 * Patterns, by the block that holds them:
 * - KPI card with an icon slot: `StatCard`.
 * - Segmented range control: the `ToggleGroup` in `actions`.
 * - Chart colors through tokens: `revenueConfig` and the other `ChartConfig`
 *   objects, every color `var(--chart-N)`.
 * - Combo chart with a gradient fill: the `AreaChart` block.
 * - Donut with a centered total: the `PieChart` block and its `Label` content.
 * - Compact table inside a card: the recent-orders `Card`.
 * - Activity feed: the `ItemGroup` block and `ACTIVITY_ICON`; `relativeLabel`
 *   for coarse relative time.
 * - Goal meters: the `Progress` block.
 *
 * Demonstration filler to leave behind: the inert Export and View-all buttons,
 * the seeded activity feed, the quarterly targets and the second donut, which
 * repeats the first. This is the one example page without a `Toaster`.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { format } from 'date-fns';
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  DownloadIcon,
  EyeIcon,
  FlagIcon,
  PackageIcon,
  StickyNoteIcon,
  TruckIcon,
  UndoDotIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import {
  type ComponentType,
  type ReactElement,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Progress, ProgressLabel } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { ExamplePage } from '../../shared';
import {
  CHANNEL_SALES,
  DASHBOARD_RANGES,
  DEVICE_SHARE,
  MONTHLY_METRICS,
  QUARTER_TARGETS,
  RANGE_MONTHS,
  RECENT_ORDERS,
  TEAM_ACTIVITY,
  type ActivityKind,
  type DashboardRange,
  type RecentOrderStatus,
  lastMonths,
  percentChange,
  previousMonths,
  sumBy,
} from './dashboard.data';

const STATUS_BADGE: Record<
  RecentOrderStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'outline',
  processing: 'secondary',
  shipped: 'secondary',
  completed: 'default',
  refunded: 'destructive',
};

const ACTIVITY_ICON: Record<ActivityKind, ComponentType> = {
  order: PackageIcon,
  shipment: TruckIcon,
  customer: UserPlusIcon,
  refund: UndoDotIcon,
  note: StickyNoteIcon,
  target: FlagIcon,
};

/**
 * A relative label without a plural rule: the mock feed only needs coarse
 * buckets, and a single string per bucket keeps every locale to one key.
 */
function relativeLabel(
  minutesAgo: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (minutesAgo < 60) {
    return t('examples.dashboard.activity.minutesAgo', { count: minutesAgo });
  }
  if (minutesAgo < 60 * 24) {
    return t('examples.dashboard.activity.hoursAgo', {
      count: Math.round(minutesAgo / 60),
    });
  }
  return t('examples.dashboard.activity.daysAgo', {
    count: Math.round(minutesAgo / (60 * 24)),
  });
}

interface StatCardProps {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly delta: number;
  readonly hint: ReactNode;
  readonly icon: ReactNode;
}

function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
}: StatCardProps): ReactElement {
  const up = delta >= 0;
  const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className='font-heading text-2xl tabular-nums'>
          {value}
        </CardTitle>
        <CardAction className='text-muted-foreground'>{icon}</CardAction>
      </CardHeader>
      <CardContent className='flex items-center gap-2 text-sm'>
        <Badge variant={up ? 'secondary' : 'destructive'}>
          <Icon />
          {up ? '+' : ''}
          {delta}%
        </Badge>
        <span className='text-muted-foreground'>{hint}</span>
      </CardContent>
    </Card>
  );
}

export default function DashboardExamplePage(): ReactElement {
  const { t, i18n } = useTranslation();
  const [range, setRange] = useState<DashboardRange>('6m');

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    [i18n.language],
  );

  const compactCurrency = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    [i18n.language],
  );

  const number = useMemo(
    () => new Intl.NumberFormat(i18n.language),
    [i18n.language],
  );

  const months = RANGE_MONTHS[range];
  const current = useMemo(() => lastMonths(MONTHLY_METRICS, months), [months]);
  const previous = useMemo(
    () => previousMonths(MONTHLY_METRICS, months),
    [months],
  );

  const monthLabel = useCallback(
    (iso: string): string => format(new Date(iso), 'MMM'),
    [],
  );

  const revenueSeries = useMemo(
    () =>
      current.map((row) => ({
        month: monthLabel(row.month),
        revenue: row.revenue,
        target: row.target,
      })),
    [current, monthLabel],
  );

  const customerSeries = useMemo(
    () =>
      current.map((row) => ({
        month: monthLabel(row.month),
        newCustomers: row.newCustomers,
        returningCustomers: row.returningCustomers,
      })),
    [current, monthLabel],
  );

  const visitorSeries = useMemo(
    () =>
      current.map((row) => ({
        month: monthLabel(row.month),
        visitors: row.visitors,
      })),
    [current, monthLabel],
  );

  const channelSeries = useMemo(
    () =>
      CHANNEL_SALES.map((row) => ({
        channel: row.channel,
        amount: row.amount,
        fill: `var(--color-${row.channel})`,
      })),
    [],
  );

  const deviceSeries = useMemo(
    () =>
      DEVICE_SHARE.map((row) => ({
        device: row.device,
        sessions: row.sessions,
        fill: `var(--color-${row.device})`,
      })),
    [],
  );

  const channelTotal = CHANNEL_SALES.reduce((sum, row) => sum + row.amount, 0);

  const revenueConfig = {
    revenue: {
      label: t('examples.dashboard.series.revenue'),
      color: 'var(--chart-1)',
    },
    target: {
      label: t('examples.dashboard.series.target'),
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  const channelConfig = {
    amount: { label: t('examples.dashboard.series.amount') },
    web: {
      label: t('examples.dashboard.channel.web'),
      color: 'var(--chart-1)',
    },
    store: {
      label: t('examples.dashboard.channel.store'),
      color: 'var(--chart-2)',
    },
    partner: {
      label: t('examples.dashboard.channel.partner'),
      color: 'var(--chart-3)',
    },
    phone: {
      label: t('examples.dashboard.channel.phone'),
      color: 'var(--chart-4)',
    },
  } satisfies ChartConfig;

  const customerConfig = {
    newCustomers: {
      label: t('examples.dashboard.series.newCustomers'),
      color: 'var(--chart-1)',
    },
    returningCustomers: {
      label: t('examples.dashboard.series.returningCustomers'),
      color: 'var(--chart-3)',
    },
  } satisfies ChartConfig;

  const visitorConfig = {
    visitors: {
      label: t('examples.dashboard.series.visitors'),
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  const deviceConfig = {
    sessions: { label: t('examples.dashboard.series.sessions') },
    desktop: {
      label: t('examples.dashboard.device.desktop'),
      color: 'var(--chart-1)',
    },
    mobile: {
      label: t('examples.dashboard.device.mobile'),
      color: 'var(--chart-2)',
    },
    tablet: {
      label: t('examples.dashboard.device.tablet'),
      color: 'var(--chart-4)',
    },
  } satisfies ChartConfig;

  const comparedTo = t('examples.dashboard.stats.versusPrevious', {
    months,
  });

  return (
    <ExamplePage
      title={t('examples.dashboard.title')}
      description={t('examples.dashboard.description')}
      actions={
        <>
          <ToggleGroup
            variant='outline'
            size='sm'
            spacing={0}
            value={[range]}
            onValueChange={(values: string[]) => {
              const [next] = values;
              if (next) setRange(next as DashboardRange);
            }}
            aria-label={t('examples.dashboard.rangeLabel')}
          >
            {DASHBOARD_RANGES.map((option) => (
              <ToggleGroupItem key={option} value={option}>
                {t(`examples.dashboard.range.${option}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button variant='outline'>
            <DownloadIcon data-icon='inline-start' />
            {t('reference.export')}
          </Button>
        </>
      }
    >
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          label={t('examples.dashboard.stats.revenue')}
          value={currency.format(sumBy(current, 'revenue'))}
          delta={percentChange(
            sumBy(current, 'revenue'),
            sumBy(previous, 'revenue'),
          )}
          hint={comparedTo}
          icon={<BanknoteIcon className='size-4' aria-hidden='true' />}
        />
        <StatCard
          label={t('examples.dashboard.stats.orders')}
          value={number.format(sumBy(current, 'orders'))}
          delta={percentChange(
            sumBy(current, 'orders'),
            sumBy(previous, 'orders'),
          )}
          hint={comparedTo}
          icon={<PackageIcon className='size-4' aria-hidden='true' />}
        />
        <StatCard
          label={t('examples.dashboard.stats.newCustomers')}
          value={number.format(sumBy(current, 'newCustomers'))}
          delta={percentChange(
            sumBy(current, 'newCustomers'),
            sumBy(previous, 'newCustomers'),
          )}
          hint={comparedTo}
          icon={<UsersIcon className='size-4' aria-hidden='true' />}
        />
        <StatCard
          label={t('examples.dashboard.stats.visitors')}
          value={number.format(sumBy(current, 'visitors'))}
          delta={percentChange(
            sumBy(current, 'visitors'),
            sumBy(previous, 'visitors'),
          )}
          hint={comparedTo}
          icon={<EyeIcon className='size-4' aria-hidden='true' />}
        />
      </div>

      <Tabs defaultValue='overview' className='gap-5'>
        <TabsList variant='line'>
          <TabsTrigger value='overview'>
            {t('examples.dashboard.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value='analytics'>
            {t('examples.dashboard.tabs.analytics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid gap-4 lg:grid-cols-3'>
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle>
                  {t('examples.dashboard.revenueChart.title')}
                </CardTitle>
                <CardDescription>
                  {t('examples.dashboard.revenueChart.description', {
                    months,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={revenueConfig}
                  className='aspect-auto h-64 w-full'
                >
                  <AreaChart
                    accessibilityLayer
                    data={revenueSeries}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey='month'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(value: number) =>
                        compactCurrency.format(value)
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator='line' />}
                    />
                    <defs>
                      <linearGradient
                        id='dashboardRevenue'
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop
                          offset='5%'
                          stopColor='var(--color-revenue)'
                          stopOpacity={0.8}
                        />
                        <stop
                          offset='95%'
                          stopColor='var(--color-revenue)'
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey='revenue'
                      type='natural'
                      fill='url(#dashboardRevenue)'
                      fillOpacity={0.4}
                      stroke='var(--color-revenue)'
                      strokeWidth={2}
                    />
                    <Line
                      dataKey='target'
                      type='monotone'
                      stroke='var(--color-target)'
                      strokeDasharray='4 4'
                      strokeWidth={2}
                      dot={false}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('examples.dashboard.channelChart.title')}
                </CardTitle>
                <CardDescription>
                  {t('examples.dashboard.channelChart.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={channelConfig}
                  className='mx-auto aspect-square h-56'
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent hideLabel nameKey='channel' />
                      }
                    />
                    <Pie
                      data={channelSeries}
                      dataKey='amount'
                      nameKey='channel'
                      innerRadius={52}
                      strokeWidth={4}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor='middle'
                                dominantBaseline='middle'
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className='fill-foreground text-xl font-bold'
                                >
                                  {compactCurrency.format(channelTotal)}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy ?? 0) + 20}
                                  className='fill-muted-foreground text-xs'
                                >
                                  {t('reference.total')}
                                </tspan>
                              </text>
                            );
                          }
                          return null;
                        }}
                      />
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey='channel' />}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 lg:grid-cols-3'>
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle>
                  {t('examples.dashboard.recentOrders.title')}
                </CardTitle>
                <CardDescription>
                  {t('examples.dashboard.recentOrders.description')}
                </CardDescription>
                <CardAction>
                  <Button variant='ghost' size='sm'>
                    {t('reference.viewAll')}
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className='overflow-hidden rounded-lg border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('reference.customer')}</TableHead>
                        <TableHead>
                          {t('examples.dashboard.recentOrders.number')}
                        </TableHead>
                        <TableHead>{t('reference.status')}</TableHead>
                        <TableHead className='text-right'>
                          {t('reference.total')}
                        </TableHead>
                        <TableHead className='text-right'>
                          {t('reference.date')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {RECENT_ORDERS.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className='flex items-center gap-2.5'>
                              <Avatar size='sm'>
                                <AvatarFallback>
                                  {order.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className='font-medium'>
                                {order.customer}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='font-mono text-xs'>
                            {order.number}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGE[order.status]}>
                              {t(`examples.dashboard.status.${order.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {currency.format(order.total)}
                          </TableCell>
                          <TableCell className='text-right text-muted-foreground'>
                            {format(new Date(order.placedAt), 'PP')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('examples.dashboard.activity.title')}</CardTitle>
                <CardDescription>
                  {t('examples.dashboard.activity.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ItemGroup>
                  {TEAM_ACTIVITY.map((entry) => {
                    const Icon = ACTIVITY_ICON[entry.kind];
                    return (
                      <Item key={entry.id} size='sm' className='px-0'>
                        <ItemMedia>
                          <Avatar size='sm'>
                            <AvatarFallback>{entry.initials}</AvatarFallback>
                          </Avatar>
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle className='gap-1.5'>
                            <span>{entry.actor}</span>
                            <span className='font-normal text-muted-foreground'>
                              {t(
                                `examples.dashboard.activity.kind.${entry.kind}`,
                              )}
                            </span>
                          </ItemTitle>
                          <ItemDescription>{entry.subject}</ItemDescription>
                        </ItemContent>
                        <ItemMedia
                          variant='icon'
                          className='self-start text-muted-foreground'
                        >
                          <Icon />
                        </ItemMedia>
                        <span className='self-start text-xs text-muted-foreground tabular-nums'>
                          {relativeLabel(entry.minutesAgo, t)}
                        </span>
                      </Item>
                    );
                  })}
                </ItemGroup>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('examples.dashboard.targets.title')}</CardTitle>
              <CardDescription>
                {t('examples.dashboard.targets.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6 sm:grid-cols-2'>
              {QUARTER_TARGETS.map((target) => {
                const percent = Math.min(
                  Math.round((target.current / target.target) * 100),
                  100,
                );
                const render = (value: number): string => {
                  if (target.unit === 'currency') return currency.format(value);
                  if (target.unit === 'percent') return `${value}%`;
                  return number.format(value);
                };
                return (
                  <Progress key={target.key} value={percent}>
                    <ProgressLabel>
                      {t(`examples.dashboard.targets.${target.key}`)}
                    </ProgressLabel>
                    <span className='ml-auto text-sm text-muted-foreground tabular-nums'>
                      {t('examples.dashboard.targets.progress', {
                        current: render(target.current),
                        target: render(target.target),
                      })}
                    </span>
                  </Progress>
                );
              })}
            </CardContent>
            <CardFooter className='text-sm text-muted-foreground'>
              {t('examples.dashboard.targets.footer')}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-6'>
          <div className='grid gap-4 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('examples.dashboard.customerChart.title')}
                </CardTitle>
                <CardDescription>
                  {t('examples.dashboard.customerChart.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={customerConfig}
                  className='aspect-auto h-64 w-full'
                >
                  <LineChart
                    accessibilityLayer
                    data={customerSeries}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey='month'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      dataKey='newCustomers'
                      type='monotone'
                      stroke='var(--color-newCustomers)'
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey='returningCustomers'
                      type='monotone'
                      stroke='var(--color-returningCustomers)'
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('examples.dashboard.visitorChart.title')}
                </CardTitle>
                <CardDescription>
                  {t('examples.dashboard.visitorChart.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={visitorConfig}
                  className='aspect-auto h-64 w-full'
                >
                  <BarChart accessibilityLayer data={visitorSeries}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey='month'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator='dashed' />}
                    />
                    <Bar
                      dataKey='visitors'
                      fill='var(--color-visitors)'
                      radius={4}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('examples.dashboard.deviceChart.title')}</CardTitle>
              <CardDescription>
                {t('examples.dashboard.deviceChart.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={deviceConfig}
                className='mx-auto aspect-square h-64'
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey='device' />}
                  />
                  <Pie
                    data={deviceSeries}
                    dataKey='sessions'
                    nameKey='device'
                    innerRadius={60}
                    strokeWidth={4}
                  />
                  <ChartLegend
                    content={<ChartLegendContent nameKey='device' />}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ExamplePage>
  );
}
