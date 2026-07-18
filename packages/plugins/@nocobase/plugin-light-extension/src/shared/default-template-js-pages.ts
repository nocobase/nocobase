/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionTreeEntryInput } from './types';

export const DEFAULT_JS_PAGE_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  {
    path: 'src/client/js-pages/hello-page/index.tsx',
    content: `import type { JSPageContext, RunJSContext } from '@nocobase/light-extension-sdk/client';
import type { Settings } from 'light-extension:settings/client/js-page/hello-page';
import { DashboardPage } from './DashboardPage';
import { loadDashboardData } from './data';

const pageContext: RunJSContext & JSPageContext<Settings> = ctx;
const { Alert } = ctx.libs.antd;

ctx.render(<Alert type="info" showIcon message={ctx.t('Loading dashboard')} />);

try {
  const dashboardData = await loadDashboardData(pageContext.settings);
  ctx.render(<DashboardPage data={dashboardData} settings={pageContext.settings} />);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  ctx.render(
    <Alert
      type="error"
      showIcon
      message={ctx.t('Failed to load dashboard')}
      description={message}
    />,
  );
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-pages/hello-page/data.ts',
    content: `import {
  getCollectionFields,
  getPrimaryKeys,
  isRecord,
  toNonEmptyString,
  toPositiveInteger,
} from '../../../shared/collection-block/collection-utils';
import type {
  CollectionLike,
  FieldMeta,
  JsonRecord,
  MultiRecordResourceLike,
} from '../../../shared/collection-block/types';

export type DashboardSettings = {
  title?: unknown;
  description?: unknown;
  dataSourceKey?: unknown;
  collectionName?: unknown;
  displayField?: unknown;
  categoryField?: unknown;
  dateField?: unknown;
  sampleSize?: unknown;
  periodDays?: unknown;
  maxGroups?: unknown;
  chartHeight?: unknown;
  accentColor?: unknown;
  showDistribution?: unknown;
  showRecent?: unknown;
  recentLimit?: unknown;
};

export type TrendPoint = {
  key: string;
  label: string;
  fullLabel: string;
  value: number;
};

export type DistributionPoint = {
  label: string;
  value: number;
};

export type DashboardRow = {
  key: string;
  display: string;
  category: string;
  createdAt: string;
};

export type DashboardData = {
  collectionName: string;
  collectionTitle: string;
  displayTitle: string;
  categoryTitle: string;
  dateTitle: string;
  total: number;
  loaded: number;
  recent: number;
  coverage: number;
  periodDays: number;
  trend: TrendPoint[];
  distribution: DistributionPoint[];
  rows: DashboardRow[];
  updatedAt: string;
};

type RuntimeContext = {
  dataSourceManager?: {
    getCollection?: (dataSourceKey: string, collectionName: string) => CollectionLike | undefined;
  };
};

const hasValue = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '') return false;
  return !Array.isArray(value) || value.length > 0;
};

const getDate = (value: unknown) => {
  const input =
    typeof value === 'string' || typeof value === 'number' || value instanceof Date ? value : undefined;
  if (input === undefined) return undefined;
  const date = ctx.libs.dayjs(input);
  return date.isValid() ? date : undefined;
};

const getFieldValueLabel = (value: unknown, field?: FieldMeta): string => {
  if (!hasValue(value)) return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => getFieldValueLabel(item, field))
      .filter(Boolean)
      .join(', ');
  }
  if (isRecord(value)) {
    const preferredKeys = [
      field?.targetTitleField,
      'title',
      'name',
      'nickname',
      'username',
      'id',
    ].filter((key): key is string => Boolean(key));
    for (const key of preferredKeys) {
      if (hasValue(value[key])) return String(value[key]);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return ctx.t('Record');
    }
  }
  return String(value);
};

const resolveFieldName = (
  configuredValue: unknown,
  fieldMap: Map<string, FieldMeta>,
  fallbackNames: Array<string | undefined>,
): string | undefined => {
  const configuredName = toNonEmptyString(configuredValue);
  if (configuredName && fieldMap.has(configuredName)) return configuredName;
  return fallbackNames.find((name): name is string => Boolean(name) && fieldMap.has(name));
};

const getCollectionTitle = (collection: CollectionLike, collectionName: string): string => {
  const options = isRecord(collection.options) ? collection.options : {};
  return String(collection.title ?? options.title ?? collectionName);
};

const getRecordKey = (record: JsonRecord, primaryKeys: string[], index: number): string => {
  const values = primaryKeys.flatMap((key) => (hasValue(record[key]) ? [String(record[key])] : []));
  return values.length ? values.join('|') : String(index + 1);
};

const getTrend = (records: JsonRecord[], dateField: string | undefined, periodDays: number): TrendPoint[] => {
  if (!dateField) return [];
  const dayjs = ctx.libs.dayjs;
  const unit = periodDays > 60 ? 'month' : 'day';
  const bucketCount = unit === 'month' ? Math.min(12, Math.max(1, Math.ceil(periodDays / 30))) : Math.min(31, periodDays);
  const start = dayjs().subtract(bucketCount - 1, unit).startOf(unit);
  const keyFormat = unit === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
  const labelFormat = unit === 'month' ? 'YYYY/MM' : 'MM/DD';
  const counts = new Map<string, number>();

  for (const record of records) {
    const point = getDate(record[dateField]);
    if (!point || point.isBefore(start)) continue;
    const key = point.startOf(unit).format(keyFormat);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from({ length: bucketCount }, (_item, index) => {
    const point = start.add(index, unit);
    const key = point.format(keyFormat);
    return {
      key,
      label: point.format(labelFormat),
      fullLabel: key,
      value: counts.get(key) || 0,
    };
  });
};

const getDistribution = (
  records: JsonRecord[],
  categoryField: string | undefined,
  categoryMeta: FieldMeta | undefined,
  maxGroups: number,
): DistributionPoint[] => {
  if (!categoryField) return [];
  const counts = new Map<string, number>();
  for (const record of records) {
    const rawValue = record[categoryField];
    const labels = (Array.isArray(rawValue) ? rawValue : [rawValue])
      .map((value) => getFieldValueLabel(value, categoryMeta))
      .filter(Boolean);
    for (const label of labels.length ? labels : [ctx.t('Unspecified')]) {
      counts.set(label, (counts.get(label) || 0) + 1);
    }
  }
  const sorted = Array.from(counts, ([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value);
  if (sorted.length <= maxGroups) return sorted;

  const visible = sorted.slice(0, maxGroups);
  const otherValue = sorted.slice(maxGroups).reduce((total, item) => total + item.value, 0);
  return [...visible, { label: ctx.t('Others'), value: otherValue }];
};

const getTotal = (result: unknown, fallback: number): number => {
  if (!isRecord(result) || !isRecord(result.meta)) return fallback;
  const count = Number(result.meta.count);
  return Number.isFinite(count) ? Math.max(0, Math.round(count)) : fallback;
};

export async function loadDashboardData(settings: DashboardSettings): Promise<DashboardData> {
  const dataSourceKey = toNonEmptyString(settings.dataSourceKey) || 'main';
  const collectionName = toNonEmptyString(settings.collectionName) || 'users';
  const sampleSize = toPositiveInteger(settings.sampleSize, 100, 10, 500);
  const periodDays = toPositiveInteger(settings.periodDays, 30, 7, 365);
  const maxGroups = toPositiveInteger(settings.maxGroups, 6, 3, 10);
  const runtimeContext = ctx as unknown as RuntimeContext;
  const collection = runtimeContext.dataSourceManager?.getCollection?.(dataSourceKey, collectionName);

  if (!collection) throw new Error(ctx.t('Collection not found') + ': ' + collectionName);

  const fields = getCollectionFields(collection, (text) => ctx.t(text));
  if (!fields.length) throw new Error(ctx.t('No fields are available for this collection'));

  const fieldMap = new Map(fields.map((field) => [field.name, field]));
  const titleField = toNonEmptyString(collection.titleField);
  const displayField = resolveFieldName(settings.displayField, fieldMap, [
    titleField,
    'nickname',
    'name',
    'username',
    fields[0]?.name,
  ]);
  const categoryField = resolveFieldName(settings.categoryField, fieldMap, ['roles', 'username', displayField]);
  const dateField = resolveFieldName(settings.dateField, fieldMap, [
    'createdAt',
    fields.find((field) => field.formatter === 'date')?.name,
  ]);
  const primaryKeys = getPrimaryKeys(collection);
  const selectedFields = [displayField, categoryField, dateField]
    .map((name) => (name ? fieldMap.get(name) : undefined))
    .filter((field): field is FieldMeta => Boolean(field));
  const requestFields = Array.from(
    new Set([...primaryKeys, ...selectedFields.filter((field) => !field.association).map((field) => field.name)]),
  );
  const appends = Array.from(
    new Set(selectedFields.filter((field) => field.association).map((field) => field.name)),
  );
  const params: JsonRecord = {
    page: 1,
    pageSize: sampleSize,
    fields: requestFields,
  };
  if (appends.length) params.appends = appends;
  if (dateField) params.sort = ['-' + dateField];

  ctx.initResource('MultiRecordResource');
  const resource = ctx.resource as unknown as MultiRecordResourceLike;
  if (!resource.setResourceName || !resource.runAction) {
    throw new Error(ctx.t('Unable to initialize resource'));
  }
  resource.setDataSourceKey?.(dataSourceKey);
  resource.setResourceName(collectionName);
  const result = await resource.runAction('list', { method: 'get', params });
  const resultData = isRecord(result) ? result.data : undefined;
  const records = Array.isArray(resultData) ? resultData.filter(isRecord) : [];
  const displayMeta = displayField ? fieldMap.get(displayField) : undefined;
  const categoryMeta = categoryField ? fieldMap.get(categoryField) : undefined;
  const dateMeta = dateField ? fieldMap.get(dateField) : undefined;
  const dayjs = ctx.libs.dayjs;
  const cutoff = dayjs().subtract(periodDays, 'day').startOf('day');
  const recent = dateField
    ? records.filter((record) => {
        const value = getDate(record[dateField]);
        return Boolean(value && !value.isBefore(cutoff));
      }).length
    : 0;
  const covered = displayField ? records.filter((record) => hasValue(record[displayField])).length : 0;

  return {
    collectionName,
    collectionTitle: getCollectionTitle(collection, collectionName),
    displayTitle: displayMeta?.title || displayField || ctx.t('Record'),
    categoryTitle: categoryMeta?.title || categoryField || ctx.t('Category'),
    dateTitle: dateMeta?.title || dateField || ctx.t('Created at'),
    total: getTotal(result, records.length),
    loaded: records.length,
    recent,
    coverage: records.length ? Math.round((covered / records.length) * 100) : 0,
    periodDays,
    trend: getTrend(records, dateField, periodDays),
    distribution: getDistribution(records, categoryField, categoryMeta, maxGroups),
    rows: records.map((record, index) => {
      const createdAt = dateField ? getDate(record[dateField]) : undefined;
      return {
        key: getRecordKey(record, primaryKeys, index),
        display:
          getFieldValueLabel(displayField ? record[displayField] : undefined, displayMeta) || ctx.t('Unspecified'),
        category:
          getFieldValueLabel(categoryField ? record[categoryField] : undefined, categoryMeta) || ctx.t('Unspecified'),
        createdAt: createdAt ? createdAt.format('YYYY-MM-DD HH:mm') : '-',
      };
    }),
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
  };
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-pages/hello-page/DashboardCharts.tsx',
    content: `import type { DistributionPoint, TrendPoint } from './data';

const chartColors = ['#52c41a', '#13c2c2', '#722ed1', '#fa8c16', '#eb2f96', '#8c8c8c'];

export const AreaTrendChart = ({
  accentColor,
  ariaLabel,
  data,
  emptyText,
  height,
}: {
  accentColor: string;
  ariaLabel: string;
  data: TrendPoint[];
  emptyText: string;
  height: number;
}) => {
  const { Empty, theme } = ctx.libs.antd;
  const { token } = theme.useToken();
  const maxValue = Math.max(0, ...data.map((point) => point.value));
  if (!data.length || maxValue === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  }

  const width = 640;
  const top = 16;
  const bottom = height - 34;
  const plotHeight = Math.max(80, bottom - top);
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((point, index) => ({
    ...point,
    x: data.length > 1 ? index * step : width / 2,
    y: bottom - (point.value / maxValue) * plotHeight,
  }));
  const linePath = points.map((point, index) => (index ? 'L ' : 'M ') + point.x + ' ' + point.y).join(' ');
  const lastPoint = points[points.length - 1];
  const areaPath = linePath + ' L ' + lastPoint.x + ' ' + bottom + ' L ' + points[0].x + ' ' + bottom + ' Z';
  const labelIndexes = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={'0 0 ' + width + ' ' + height}
      width="100%"
      height={height}
      preserveAspectRatio="none"
    >
      <title>{ariaLabel}</title>
      {[0, 1, 2, 3].map((line) => {
        const y = top + (plotHeight / 3) * line;
        return (
          <line
            key={line}
            x1={0}
            x2={width}
            y1={y}
            y2={y}
            stroke={token.colorBorderSecondary}
            strokeDasharray="4 6"
          />
        );
      })}
      <path d={areaPath} fill={accentColor} opacity={0.12} />
      <path d={linePath} fill="none" stroke={accentColor} strokeWidth={3} strokeLinejoin="round" />
      {points.map((point) => (
        <circle key={point.key} cx={point.x} cy={point.y} r={4} fill={token.colorBgContainer} stroke={accentColor} strokeWidth={2}>
          <title>{point.fullLabel + ': ' + point.value}</title>
        </circle>
      ))}
      {points.map((point, index) =>
        labelIndexes.has(index) ? (
          <text
            key={point.key + '-label'}
            x={point.x}
            y={height - 8}
            fill={token.colorTextSecondary}
            fontSize={12}
            textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
          >
            {point.label}
          </text>
        ) : null,
      )}
    </svg>
  );
};

export const DoughnutChart = ({
  accentColor,
  ariaLabel,
  data,
  emptyText,
  totalLabel,
}: {
  accentColor: string;
  ariaLabel: string;
  data: DistributionPoint[];
  emptyText: string;
  totalLabel: string;
}) => {
  const { Empty, Space, theme, Typography } = ctx.libs.antd;
  const { token } = theme.useToken();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!data.length || total === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  }

  const radius = 64;
  const circumference = Math.PI * 2 * radius;
  let offset = 0;
  const segments = data.map((item, index) => {
    const length = (item.value / total) * circumference;
    const segment = {
      ...item,
      color: index === 0 ? accentColor : chartColors[(index - 1) % chartColors.length],
      length,
      offset,
    };
    offset += length;
    return segment;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: token.marginLG, minHeight: 220 }}>
      <svg role="img" aria-label={ariaLabel} viewBox="0 0 200 200" width={190} height={190}>
        <title>{ariaLabel}</title>
        <circle cx={100} cy={100} r={radius} fill="none" stroke={token.colorFillSecondary} strokeWidth={24} />
        {segments.map((segment) => (
          <circle
            key={segment.label}
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={24}
            strokeDasharray={segment.length + ' ' + circumference}
            strokeDashoffset={-segment.offset}
            strokeLinecap="butt"
            transform="rotate(-90 100 100)"
          >
            <title>{segment.label + ': ' + segment.value}</title>
          </circle>
        ))}
        <text x={100} y={94} textAnchor="middle" fill={token.colorText} fontSize={28} fontWeight={600}>
          {total}
        </text>
        <text x={100} y={118} textAnchor="middle" fill={token.colorTextSecondary} fontSize={12}>
          {totalLabel}
        </text>
      </svg>
      <Space direction="vertical" size={8} style={{ minWidth: 0, flex: 1 }}>
        {segments.map((segment) => (
          <div key={segment.label} style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
            <span
              aria-hidden="true"
              style={{ width: 10, height: 10, borderRadius: '50%', flex: '0 0 auto', background: segment.color }}
            />
            <Typography.Text ellipsis style={{ flex: 1 }}>
              {segment.label}
            </Typography.Text>
            <Typography.Text type="secondary">
              {segment.value + ' · ' + Math.round((segment.value / total) * 100) + '%'}
            </Typography.Text>
          </div>
        ))}
      </Space>
    </div>
  );
};
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-pages/hello-page/DashboardPage.tsx',
    content: `import { toNonEmptyString, toPositiveInteger } from '../../../shared/collection-block/collection-utils';
import { AreaTrendChart, DoughnutChart } from './DashboardCharts';
import type { DashboardData, DashboardRow, DashboardSettings } from './data';

export const DashboardPage = ({
  data,
  settings,
}: {
  data: DashboardData;
  settings: DashboardSettings;
}) => {
  const {
    Button,
    Card,
    Col,
    Empty,
    Row,
    Space,
    Statistic,
    Table,
    Tag,
    theme,
    Typography,
  } = ctx.libs.antd;
  const { ReloadOutlined } = ctx.libs.antdIcons;
  const { token } = theme.useToken();
  const title = ctx.t(toNonEmptyString(settings.title) || 'System activity dashboard');
  const description = ctx.t(
    toNonEmptyString(settings.description) || 'Live overview of records from your NocoBase application.',
  );
  const accentColor = toNonEmptyString(settings.accentColor) || '#1677ff';
  const chartHeight = toPositiveInteger(settings.chartHeight, 240, 180, 400);
  const recentLimit = toPositiveInteger(settings.recentLimit, 8, 3, 20);
  const showDistribution = settings.showDistribution !== false;
  const showRecent = settings.showRecent !== false;
  const cardStyle = { height: '100%', boxShadow: token.boxShadowTertiary };

  const refreshPage = async () => {
    await ctx.page.refresh();
  };

  const columns = [
    {
      title: data.displayTitle,
      dataIndex: 'display',
      key: 'display',
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: data.categoryTitle,
      dataIndex: 'category',
      key: 'category',
      render: (value: string) => <Tag color={accentColor}>{value}</Tag>,
    },
    {
      title: data.dateTitle,
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  const metrics = [
    { key: 'total', title: ctx.t('Total records'), value: data.total, color: accentColor },
    { key: 'loaded', title: ctx.t('Loaded records'), value: data.loaded, color: '#13c2c2' },
    { key: 'recent', title: ctx.t('Recent records'), value: data.recent, color: '#52c41a' },
    { key: 'coverage', title: ctx.t('Field coverage'), value: data.coverage, suffix: '%', color: '#722ed1' },
  ];

  return (
    <div style={{ padding: token.paddingLG, background: token.colorBgLayout, minHeight: '100%' }}>
      <Space direction="vertical" size={token.marginLG} style={{ display: 'flex' }}>
        <Card
          style={{
            borderTop: '4px solid ' + accentColor,
            background: 'linear-gradient(135deg, ' + token.colorPrimaryBg + ', ' + token.colorBgContainer + ')',
          }}
        >
          <Row align="middle" justify="space-between" gutter={[token.marginLG, token.marginMD]}>
            <Col flex="auto">
              <Space direction="vertical" size={4}>
                <Space wrap>
                  <Typography.Title level={2} style={{ margin: 0 }}>
                    {title}
                  </Typography.Title>
                  <Tag color={accentColor}>{ctx.t('Live data')}</Tag>
                </Space>
                <Typography.Text type="secondary">{description}</Typography.Text>
                <Typography.Text type="secondary">
                  {data.collectionTitle + ' · ' + ctx.t('Updated') + ' ' + data.updatedAt}
                </Typography.Text>
              </Space>
            </Col>
            <Col>
              <Button type="primary" icon={<ReloadOutlined />} onClick={refreshPage}>
                {ctx.t('Refresh')}
              </Button>
            </Col>
          </Row>
        </Card>

        <Row gutter={[token.marginMD, token.marginMD]}>
          {metrics.map((metric) => (
            <Col key={metric.key} xs={24} sm={12} xl={6}>
              <Card style={{ ...cardStyle, borderTop: '3px solid ' + metric.color }}>
                <Statistic
                  title={metric.title}
                  value={metric.value}
                  suffix={metric.suffix}
                  valueStyle={{ color: metric.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[token.marginMD, token.marginMD]}>
          <Col xs={24} xl={showDistribution ? 16 : 24}>
            <Card
              style={cardStyle}
              title={ctx.t('Activity trend')}
              extra={<Tag>{data.periodDays + ' ' + ctx.t('days')}</Tag>}
            >
              <AreaTrendChart
                accentColor={accentColor}
                ariaLabel={ctx.t('Activity trend')}
                data={data.trend}
                emptyText={ctx.t('No dated records')}
                height={chartHeight}
              />
            </Card>
          </Col>
          {showDistribution ? (
            <Col xs={24} xl={8}>
              <Card style={cardStyle} title={ctx.t('Distribution')}>
                <DoughnutChart
                  accentColor={accentColor}
                  ariaLabel={ctx.t('Distribution')}
                  data={data.distribution}
                  emptyText={ctx.t('No grouped records')}
                  totalLabel={ctx.t('Loaded records')}
                />
              </Card>
            </Col>
          ) : null}
        </Row>

        {showRecent ? (
          <Card style={cardStyle} title={ctx.t('Latest records')} extra={<Tag>{data.collectionName}</Tag>}>
            {data.rows.length ? (
              <Table<DashboardRow>
                rowKey="key"
                columns={columns}
                dataSource={data.rows.slice(0, recentLimit)}
                pagination={false}
                scroll={{ x: 640 }}
              />
            ) : (
              <Empty description={ctx.t('No data')} />
            )}
          </Card>
        ) : null}
      </Space>
    </div>
  );
};
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-pages/hello-page/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "hello-page",
  "title": "System activity dashboard",
  "description": "A configurable Ant Design dashboard with live collection metrics, charts, and recent records.",
  "category": "js-page",
  "tags": ["JS Page", "Dashboard", "Collection", "Chart", "Ant Design"],
  "sort": 10,
  "settings": {
    "title": {
      "type": "string",
      "title": "Page title",
      "default": "System activity dashboard",
      "required": true,
      "x-component": "Input"
    },
    "description": {
      "type": "string",
      "title": "Description",
      "default": "Live overview of records from your NocoBase application.",
      "x-component": "Input.TextArea"
    },
    "dataSourceKey": {
      "type": "string",
      "title": "Data source",
      "default": "main",
      "required": true,
      "x-component": "DataSourceSelect"
    },
    "collectionName": {
      "type": "string",
      "title": "Collection",
      "default": "users",
      "required": true,
      "x-component": "CollectionSelect",
      "x-component-props": { "dataSourceField": "dataSourceKey" }
    },
    "displayField": {
      "type": "string",
      "title": "Display field",
      "default": "nickname",
      "required": true,
      "x-component": "CollectionFieldSelect",
      "x-component-props": { "dataSourceField": "dataSourceKey", "collectionField": "collectionName" }
    },
    "categoryField": {
      "type": "string",
      "title": "Category field",
      "default": "roles",
      "x-component": "CollectionFieldSelect",
      "x-component-props": { "dataSourceField": "dataSourceKey", "collectionField": "collectionName" }
    },
    "dateField": {
      "type": "string",
      "title": "Date field",
      "default": "createdAt",
      "x-component": "CollectionFieldSelect",
      "x-component-props": { "dataSourceField": "dataSourceKey", "collectionField": "collectionName" }
    },
    "sampleSize": {
      "type": "integer",
      "title": "Sample size",
      "default": 100,
      "minimum": 10,
      "maximum": 500,
      "x-component": "InputNumber"
    },
    "periodDays": {
      "type": "integer",
      "title": "Trend period (days)",
      "default": 30,
      "minimum": 7,
      "maximum": 365,
      "x-component": "InputNumber"
    },
    "maxGroups": {
      "type": "integer",
      "title": "Maximum groups",
      "default": 6,
      "minimum": 3,
      "maximum": 10,
      "x-component": "InputNumber"
    },
    "chartHeight": {
      "type": "integer",
      "title": "Chart height",
      "default": 240,
      "minimum": 180,
      "maximum": 400,
      "x-component": "InputNumber"
    },
    "accentColor": {
      "type": "string",
      "title": "Accent color",
      "default": "#1677ff",
      "x-component": "ColorPicker"
    },
    "showDistribution": {
      "type": "boolean",
      "title": "Show distribution chart",
      "default": true,
      "x-component": "Switch"
    },
    "showRecent": {
      "type": "boolean",
      "title": "Show latest records",
      "default": true,
      "x-component": "Switch"
    },
    "recentLimit": {
      "type": "integer",
      "title": "Latest record limit",
      "default": 8,
      "minimum": 3,
      "maximum": 20,
      "x-component": "InputNumber",
      "x-visible-when": { "path": "showRecent", "operator": "$eq", "value": true }
    }
  }
}
`,
    language: 'json',
  },
];
