import { useTranslation } from '@nocobase/i18n/client';
import { TrendingUpIcon } from 'lucide-react';
import type { ReactElement } from 'react';
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
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
} from 'recharts';

import {
  Card,
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

import { ExamplePage, ExampleSection } from '../shared';

const revenueByChannel = [
  { month: 'January', online: 186, retail: 80 },
  { month: 'February', online: 305, retail: 200 },
  { month: 'March', online: 237, retail: 120 },
  { month: 'April', online: 73, retail: 190 },
  { month: 'May', online: 209, retail: 130 },
  { month: 'June', online: 214, retail: 140 },
];

const signupsByPlan = [
  { month: 'January', free: 320, pro: 120 },
  { month: 'February', free: 410, pro: 160 },
  { month: 'March', free: 380, pro: 210 },
  { month: 'April', free: 450, pro: 240 },
  { month: 'May', free: 520, pro: 290 },
  { month: 'June', free: 610, pro: 340 },
];

const ordersAndReturns = [
  { month: 'January', orders: 1120, returns: 64 },
  { month: 'February', orders: 1280, returns: 71 },
  { month: 'March', orders: 1190, returns: 58 },
  { month: 'April', orders: 1420, returns: 92 },
  { month: 'May', orders: 1510, returns: 88 },
  { month: 'June', orders: 1640, returns: 95 },
];

const revenueByCategory = [
  { category: 'hardware', revenue: 275, fill: 'var(--color-hardware)' },
  { category: 'software', revenue: 200, fill: 'var(--color-software)' },
  { category: 'services', revenue: 187, fill: 'var(--color-services)' },
  { category: 'support', revenue: 173, fill: 'var(--color-support)' },
  { category: 'training', revenue: 90, fill: 'var(--color-training)' },
];

const totalRevenue = revenueByCategory.reduce(
  (sum, item) => sum + item.revenue,
  0,
);

const quotaAttainment = 72;
const quota = [
  {
    name: 'attainment',
    value: quotaAttainment,
    fill: 'var(--color-attainment)',
  },
];

export default function ChartExamplePage(): ReactElement {
  const { t } = useTranslation();

  // Labels live in the config so tooltips and legends read them; series
  // colors come from the theme's chart tokens so both color schemes work.
  const channelConfig = {
    online: { label: t('components.chart.online'), color: 'var(--chart-1)' },
    retail: { label: t('components.chart.retail'), color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  const planConfig = {
    free: { label: t('components.chart.planFree'), color: 'var(--chart-1)' },
    pro: { label: t('components.chart.planPro'), color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  const ordersConfig = {
    orders: { label: t('components.chart.orders'), color: 'var(--chart-1)' },
    returns: {
      label: t('components.chart.returns'),
      color: 'var(--chart-5)',
    },
  } satisfies ChartConfig;

  const categoryConfig = {
    revenue: { label: t('components.chart.revenue') },
    hardware: {
      label: t('components.chart.hardware'),
      color: 'var(--chart-1)',
    },
    software: {
      label: t('components.chart.software'),
      color: 'var(--chart-2)',
    },
    services: {
      label: t('components.chart.services'),
      color: 'var(--chart-3)',
    },
    support: {
      label: t('components.chart.support'),
      color: 'var(--chart-4)',
    },
    training: {
      label: t('components.chart.training'),
      color: 'var(--chart-5)',
    },
  } satisfies ChartConfig;

  const quotaConfig = {
    attainment: {
      label: t('components.chart.quotaAttainment'),
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  return (
    <ExamplePage
      title={t('components.chart.title')}
      description={t('components.chart.description')}
      docs='https://ui.shadcn.com/docs/components/chart'
    >
      <ExampleSection
        title={t('components.chart.bar')}
        description={t('components.chart.barDescription')}
        contentClassName='block'
      >
        <ChartContainer
          config={channelConfig}
          className='aspect-auto h-64 w-full'
        >
          <BarChart accessibilityLayer data={revenueByChannel}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dashed' />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey='online' fill='var(--color-online)' radius={4} />
            <Bar dataKey='retail' fill='var(--color-retail)' radius={4} />
          </BarChart>
        </ChartContainer>
      </ExampleSection>

      <ExampleSection
        title={t('components.chart.area')}
        description={t('components.chart.areaDescription')}
        contentClassName='block'
      >
        <Card className='w-full max-w-xl'>
          <CardHeader>
            <CardTitle>{t('components.chart.signupsTitle')}</CardTitle>
            <CardDescription>
              {t('components.chart.signupsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={planConfig}
              className='aspect-auto h-56 w-full'
            >
              <AreaChart
                accessibilityLayer
                data={signupsByPlan}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey='month'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: string) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <defs>
                  <linearGradient id='fillFree' x1='0' y1='0' x2='0' y2='1'>
                    <stop
                      offset='5%'
                      stopColor='var(--color-free)'
                      stopOpacity={0.8}
                    />
                    <stop
                      offset='95%'
                      stopColor='var(--color-free)'
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id='fillPro' x1='0' y1='0' x2='0' y2='1'>
                    <stop
                      offset='5%'
                      stopColor='var(--color-pro)'
                      stopOpacity={0.8}
                    />
                    <stop
                      offset='95%'
                      stopColor='var(--color-pro)'
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey='pro'
                  type='natural'
                  fill='url(#fillPro)'
                  fillOpacity={0.4}
                  stroke='var(--color-pro)'
                  stackId='a'
                />
                <Area
                  dataKey='free'
                  type='natural'
                  fill='url(#fillFree)'
                  fillOpacity={0.4}
                  stroke='var(--color-free)'
                  stackId='a'
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className='gap-2 text-sm'>
            <span className='font-medium'>
              {t('components.chart.trendingUp', { percent: '12.4%' })}
            </span>
            <TrendingUpIcon className='size-4' aria-hidden='true' />
          </CardFooter>
        </Card>
      </ExampleSection>

      <ExampleSection
        title={t('components.chart.line')}
        description={t('components.chart.lineDescription')}
        contentClassName='block'
      >
        <ChartContainer
          config={ordersConfig}
          className='aspect-auto h-64 w-full'
        >
          <LineChart
            accessibilityLayer
            data={ordersAndReturns}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey='orders'
              type='monotone'
              stroke='var(--color-orders)'
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey='returns'
              type='monotone'
              stroke='var(--color-returns)'
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </ExampleSection>

      <ExampleSection
        title={t('components.chart.pie')}
        description={t('components.chart.pieDescription')}
        contentClassName='block'
      >
        {/* innerRadius is pixels, so the box holds a pixel height rather than
            a spacing-scaled one, and the hole is wide enough for the caption
            centred inside it. */}
        <ChartContainer
          config={categoryConfig}
          className='mx-auto aspect-square h-[18rem]'
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey='category' />}
            />
            <Pie
              data={revenueByCategory}
              dataKey='revenue'
              nameKey='category'
              innerRadius={70}
              strokeWidth={5}
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
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalRevenue.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 22}
                          className='fill-muted-foreground text-xs'
                        >
                          {t('components.chart.revenueTotal')}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey='category' />} />
          </PieChart>
        </ChartContainer>
      </ExampleSection>

      <ExampleSection
        title={t('components.chart.radial')}
        description={t('components.chart.radialDescription')}
        contentClassName='block'
      >
        {/* innerRadius, outerRadius and polarRadius below are pixels, so the
            box holds a pixel height rather than a spacing-scaled one: at
            compact h-64 is 205px and the 110px outer radius was clipped. */}
        <ChartContainer
          config={quotaConfig}
          className='mx-auto aspect-square h-[16rem]'
        >
          <RadialBarChart
            data={quota}
            startAngle={90}
            endAngle={90 - (360 * quotaAttainment) / 100}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType='circle'
              radialLines={false}
              stroke='none'
              className='first:fill-muted last:fill-background'
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey='value' background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
                          className='fill-foreground text-4xl font-bold'
                        >
                          {quotaAttainment}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 24}
                          className='fill-muted-foreground'
                        >
                          {t('components.chart.quotaAttainment')}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </ExampleSection>
    </ExamplePage>
  );
}
