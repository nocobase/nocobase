/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSceneEnum, CollectionBlockModel, usePlugin } from '@nocobase/client-v2';
import { Empty, Spin, Typography } from 'antd';
import React from 'react';

import PluginDataVisualizationClient from '../plugin';
import { tExpr } from '../locale';
import { ChartResource } from '../resources/ChartResource';

const NUMBER_TYPES = new Set(['integer', 'bigInt', 'float', 'double', 'decimal', 'number']);
const NUMBER_INTERFACES = new Set(['integer', 'number', 'percent']);
const DIMENSION_INTERFACES = new Set([
  'input',
  'textarea',
  'select',
  'radioGroup',
  'date',
  'datetime',
  'createdAt',
  'updatedAt',
]);

const getFields = (collection: any) => collection?.getFields?.() || [];

const getFieldLabel = (field: any) => field?.title || field?.uiSchema?.title || field?.name;

const getMeasureFields = (collection: any) => {
  const fields = getFields(collection);
  const numericFields = fields.filter(
    (field: any) => NUMBER_TYPES.has(field.type) || NUMBER_INTERFACES.has(field.interface),
  );
  return numericFields.length ? numericFields : fields;
};

const getDimensionFields = (collection: any) => {
  return getFields(collection).filter((field: any) => {
    return DIMENSION_INTERFACES.has(field.interface) || ['string', 'date', 'datetime'].includes(field.type);
  });
};

const getSelectOptions = (fields: any[]) => {
  return fields.map((field) => ({
    label: getFieldLabel(field),
    value: field.name,
  }));
};

const getDefaultDimension = (collection: any) => {
  return getDimensionFields(collection)[0]?.name;
};

const getDefaultMeasure = (collection: any) => {
  return getMeasureFields(collection)[0]?.name || collection?.filterTargetKey;
};

const getAggregation = (collection: any, measure?: string, aggregation?: string) => {
  if (aggregation) {
    return aggregation;
  }
  const field = getFields(collection).find((item: any) => item.name === measure);
  return NUMBER_TYPES.has(field?.type) || NUMBER_INTERFACES.has(field?.interface) ? 'sum' : 'count';
};

const getFieldProps = (collection: any, names: string[]) => {
  return names.reduce(
    (props, name) => {
      const field = getFields(collection).find((item: any) => item.name === name);
      props[name] = {
        label: getFieldLabel(field) || name,
        interface: field?.interface,
      };
      return props;
    },
    {} as Record<string, any>,
  );
};

const ChartBlockContent = ({ model }: { model: ChartBlockModel }) => {
  const plugin = usePlugin(PluginDataVisualizationClient);
  const chartType = model.props.chartType || plugin.charts.getDefaultChartType();
  const chart = plugin.charts.getChart(chartType);
  const data = model.resource.getData() || [];
  const error = model.resource.getError?.();
  const dimensionField = model.props.dimensionField || getDefaultDimension(model.collection);
  const measureField = model.props.measureField || getDefaultMeasure(model.collection);
  const fieldProps = getFieldProps(model.collection, [dimensionField, measureField].filter(Boolean));

  if (error) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={String(error.message || error)} />;
  }

  if (!measureField) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={model.translate('Please configure chart')} />;
  }

  if (!chart) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={model.translate('Please select chart type')} />;
  }

  const ChartComponent = chart.Component;
  const chartProps = chart.getProps?.({
    data,
    xField: dimensionField,
    yField: measureField,
    title: model.title,
    fieldProps,
    themeToken: model.context.themeToken,
  }) || {
    data,
  };

  return (
    <Spin spinning={model.resource.loading}>
      <div style={{ minHeight: 120 }}>
        {!data.length && !model.resource.loading ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={model.translate('No data')} />
        ) : (
          <>
            {model.title && (
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                {model.title}
              </Typography.Title>
            )}
            <ChartComponent {...chartProps} />
          </>
        )}
      </div>
    </Spin>
  );
};

export class ChartBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  get resource() {
    return super.resource as ChartResource;
  }

  onInit(options: any) {
    super.onInit(options);
    this.syncQueryToResource();
    this.resource.on('refresh', () => this.rerender());
    this.resource.on('loading', () => this.rerender());
  }

  createResource(ctx: any) {
    return ctx.createResource(ChartResource);
  }

  getChartQuery() {
    const params = this.getResourceSettingsInitParams();
    const measure = this.props.measureField || getDefaultMeasure(this.collection);
    if (!params?.dataSourceKey || !params.collectionName || !measure) {
      return;
    }
    return {
      uid: this.uid,
      dataSource: params.dataSourceKey,
      collection: params.collectionName,
      dimension: this.props.dimensionField || getDefaultDimension(this.collection),
      measure,
      aggregation: getAggregation(this.collection, measure, this.props.aggregation),
      limit: this.props.limit || 200,
    };
  }

  syncQueryToResource() {
    this.resource.setQueryParams(this.getChartQuery());
  }

  refresh() {
    this.syncQueryToResource();
    return this.resource.refresh();
  }

  renderComponent() {
    this.syncQueryToResource();
    return <ChartBlockContent model={this} />;
  }
}

ChartBlockModel.registerFlow({
  key: 'chartSettings',
  title: tExpr('Chart settings'),
  steps: {
    configure: {
      title: tExpr('Configure chart'),
      uiSchema(ctx) {
        const model = ctx.model as ChartBlockModel;
        const plugin = ctx.app.pm.get(PluginDataVisualizationClient) as PluginDataVisualizationClient;
        const chartTypes = plugin?.charts.getChartTypes?.() || [];
        const dimensionFields = getDimensionFields(model.collection);
        const measureFields = getMeasureFields(model.collection);

        return {
          chartType: {
            title: ctx.t('Chart type'),
            'x-component': 'Cascader',
            'x-decorator': 'FormItem',
            enum: chartTypes,
            required: true,
          },
          dimensionField: {
            title: ctx.t('Dimension field'),
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: getSelectOptions(dimensionFields),
          },
          measureField: {
            title: ctx.t('Measure field'),
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: getSelectOptions(measureFields),
            required: true,
          },
          aggregation: {
            title: ctx.t('Aggregation'),
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: [
              { label: 'Count', value: 'count' },
              { label: 'Sum', value: 'sum' },
              { label: 'Average', value: 'avg' },
              { label: 'Min', value: 'min' },
              { label: 'Max', value: 'max' },
            ],
          },
          limit: {
            title: ctx.t('Limit'),
            'x-component': 'InputNumber',
            'x-decorator': 'FormItem',
            'x-component-props': {
              min: 1,
              max: 1000,
            },
          },
        };
      },
      defaultParams(ctx) {
        const model = ctx.model as ChartBlockModel;
        const plugin = ctx.app.pm.get(PluginDataVisualizationClient) as PluginDataVisualizationClient;
        const measure = model.props.measureField || getDefaultMeasure(model.collection);

        return {
          chartType: model.props.chartType || plugin?.charts.getDefaultChartType?.(),
          dimensionField: model.props.dimensionField || getDefaultDimension(model.collection),
          measureField: measure,
          aggregation: getAggregation(model.collection, measure, model.props.aggregation),
          limit: model.props.limit || 200,
        };
      },
      async handler(ctx, params) {
        ctx.model.setProps({
          chartType: Array.isArray(params.chartType) ? params.chartType[params.chartType.length - 1] : params.chartType,
          dimensionField: params.dimensionField,
          measureField: params.measureField,
          aggregation: params.aggregation,
          limit: params.limit,
        });
        await ctx.model.refresh();
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
    blockHeight: {
      use: 'blockHeight',
    },
  },
});

ChartBlockModel.define({
  label: tExpr('Charts'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'ChartBlockModel',
  },
  sort: 700,
});
