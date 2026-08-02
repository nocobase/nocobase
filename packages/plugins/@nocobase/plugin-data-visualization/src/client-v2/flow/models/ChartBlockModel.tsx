/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageModel, DataBlockModel, DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client-v2';
import {
  collectContextParamsForTemplate,
  createCollectionContextMeta,
  SQLResource,
  useFlowContext,
} from '@nocobase/flow-engine';
import React, { createRef } from 'react';
import type { EChartsType } from 'echarts';
import _ from 'lodash';
import { Button, Space } from 'antd';
import dayjs from 'dayjs';
import { tExpr, useT } from '../../locale';
import { convertDatasetFormats, debugLog, normalizeEChartsOption, sleep } from '../utils';
import { Chart, ChartOptions } from './Chart';
import { ConfigPanel } from './ConfigPanel';
import { ChartResource } from '../resources/ChartResource';
import { genRawByBuilder } from './ChartOptionsBuilder.service';
import { configStore } from './config-store';
import PluginDataVisualizationClient from '../../plugin';
import { DaraButton } from '../components/DaraButton';
import { useChatBoxStore, useChatMessagesStore } from '@nocobase/plugin-ai/client-v2';
import {
  getChartDirtyRefreshSnapshot,
  shouldRefreshChartOnActive,
  type ChartDirtyRefreshSnapshot,
} from './chartDirtyTracking';

const NO_PREVIEW_SNAPSHOT = Symbol('NO_PREVIEW_SNAPSHOT');

type ChartBlockModelStructure = {
  subModels: {
    page: ChildPageModel;
  };
};

type ChartProps = {
  chart: ChartOptions & {
    optionRaw?: string;
    Component?: React.FC<any>;
  };
};

const toFieldPath = (field: string | string[] | undefined) => {
  if (!field) return '';
  return Array.isArray(field) ? field.filter(Boolean).join('.') : field;
};

const toFieldSegments = (field: string | string[] | undefined) => {
  if (!field) return [];
  return Array.isArray(field) ? field.filter(Boolean) : field.split('.').filter(Boolean);
};

const getCollectionFieldLabel = (field?: any) => {
  return field?.uiSchema?.title ?? field?.options?.uiSchema?.title ?? field?.title ?? field?.name;
};

const createDateFormatTransformer = (format?: string) => {
  if (!format) return;
  return (value: any) => {
    if (value === null || value === undefined || value === '') {
      return value;
    }
    const date = dayjs(value);
    return date.isValid() ? date.format(format) : value;
  };
};

const composeTransformers = (...transformers: (((value: any) => any) | undefined)[]) => {
  const validTransformers = transformers.filter(Boolean) as ((value: any) => any)[];
  if (!validTransformers.length) return;
  return (value: any) => validTransformers.reduce((result, transformer) => transformer(result), value);
};

export class ChartBlockModel extends DataBlockModel<ChartBlockModelStructure> {
  declare props: ChartProps;

  _previousStepParams: any = NO_PREVIEW_SNAPSHOT; // 上一次持久化的 stepParams，用于 preview 时回滚

  get resource(): ChartResource<any> | SQLResource<any> {
    return this.context.resource as ChartResource<any> | SQLResource<any>;
  }

  // 统一管理 refresh 监听引用，便于 off 解绑
  private __onResourceRefresh = () => this.renderChart();
  private __eventsBoundChart?: EChartsType;
  private __eventsBoundRaw?: string;
  private lastRefreshSnapshot: ChartDirtyRefreshSnapshot | null = null;
  private dirtyRefreshing = false;

  private __onChartRefReady = (chart: EChartsType) => {
    try {
      this.props.chart?.onRefReady?.(chart);
    } catch (error) {
      console.error('Chart onRefReady error:', error);
    }

    const raw = this.getConfiguredEventsRaw();
    if (raw) {
      this.applyEvents(raw, chart).catch((error) => {
        console.error('Chart applyEvents error:', error);
      });
    }
  };

  private getCurrentRefreshSnapshot(): ChartDirtyRefreshSnapshot | null {
    return getChartDirtyRefreshSnapshot({
      engine: this.context.engine,
      dataSourceManager: this.context.dataSourceManager,
      query: this.getResourceSettingsInitParams()?.query,
    });
  }

  private rememberRefreshSnapshot() {
    this.lastRefreshSnapshot = this.getCurrentRefreshSnapshot();
  }

  private async refreshAndRememberSnapshot(): Promise<void> {
    if (this.dirtyRefreshing) return;
    this.dirtyRefreshing = true;
    try {
      await this.resource.refresh();
      this.rememberRefreshSnapshot();
    } catch {
      // Keep lastRefreshSnapshot unchanged so the next activate can retry.
    } finally {
      this.dirtyRefreshing = false;
    }
  }

  async onActive(forceRefresh = false) {
    if (this.hidden) return;

    const currentSnapshot = this.getCurrentRefreshSnapshot();
    if (!shouldRefreshChartOnActive({ forceRefresh, currentSnapshot, lastSnapshot: this.lastRefreshSnapshot })) {
      return;
    }

    await this.refreshAndRememberSnapshot();
  }

  async refresh() {
    await this.resource.refresh();
    this.rememberRefreshSnapshot();
  }

  // 初始化注册 ChartResource | SQLResource
  initResource(mode = 'builder') {
    // 1) 先拿旧实例并解绑，防止旧实例残留监听
    const oldResource = this.resource;
    if (oldResource instanceof ChartResource || oldResource instanceof SQLResource) {
      oldResource.off('refresh', this.__onResourceRefresh);
      oldResource.off('loading', this.__onResourceRefresh);
    }

    // 2) 重定义 resource，创建并缓存新实例
    if (mode === 'sql') {
      this.context.defineProperty('resource', {
        get: () => {
          const resource = this.context.createResource(SQLResource);
          resource.setSQLType('selectRows');
          resource.setFilterByTk(this.uid);
          return resource;
        },
      });
    } else {
      this.context.defineProperty('resource', {
        get: () => {
          const resource = this.context.createResource(ChartResource);
          return resource;
        },
      });
    }

    // 3) 绑定新实例监听，确保仅绑定一次
    const newResource = this.resource;
    if (newResource instanceof ChartResource || newResource instanceof SQLResource) {
      newResource.on('refresh', this.__onResourceRefresh);
      newResource.on('loading', this.__onResourceRefresh);
    }
  }

  getResourceSettingsInitParams() {
    return this.getStepParams('chartSettings', 'configure');
  }

  private getConfiguredEventsRaw() {
    return this.getResourceSettingsInitParams()?.chart?.events?.raw;
  }

  private shouldSkipApplyEvents(raw: string, chart: EChartsType) {
    return this.__eventsBoundChart === chart && this.__eventsBoundRaw === raw;
  }

  private markEventsBound(raw: string, chart: EChartsType) {
    this.__eventsBoundChart = chart;
    this.__eventsBoundRaw = raw;
  }

  private clearEventsBound(raw: string, chart: EChartsType) {
    if (this.__eventsBoundChart === chart && this.__eventsBoundRaw === raw) {
      this.__eventsBoundChart = undefined;
      this.__eventsBoundRaw = undefined;
    }
  }

  async buildQueryRequest(query: any) {
    if (!query || query?.mode === 'sql') {
      return query;
    }
    const contextParams = await collectContextParamsForTemplate(this.context, query);
    if (!contextParams) {
      return query;
    }
    return {
      ...query,
      contextParams,
    };
  }

  async onInit(options) {
    super.onInit(options);
    this.context.defineProperty('chartRef', {
      get: () => createRef(),
    });

    // // 初始化注册 ChartResource | SQLResource
    this.initResource();

    this.context.defineProperty('data', {
      get: () => convertDatasetFormats(this.resource.getData()),
      cache: false,
    });

    this.context.defineProperty('collection', {
      get: () => {
        const stepParams = this.getResourceSettingsInitParams();
        const [dataSourceKey, collectionName] = stepParams?.query?.collectionPath || [];
        return this.context.dataSourceManager.getCollection(dataSourceKey, collectionName);
      },
      meta: createCollectionContextMeta(() => {
        const stepParams = this.getResourceSettingsInitParams();
        const [dataSourceKey, collectionName] = stepParams?.query?.collectionPath || [];
        return this.context.dataSourceManager.getCollection(dataSourceKey, collectionName);
      }, this.context.t('Current collection')),
    });

    // 初始加载：根据持久化的 stepParams 应用查询并触发一次数据刷新
    try {
      const initParams = this.getResourceSettingsInitParams();
      const initQuery = initParams?.query;
      if (initQuery) {
        this.applyQuery(await this.buildQueryRequest(initQuery));
        await this.refresh();
      }
    } catch (e) {
      const message = (e as any)?.message || String(e);
      console.error('ChartBlockModel init error:', message, e);
    }
  }

  renderComponent() {
    return (
      <Chart
        {...this.props.chart}
        dataSource={this.resource.getData()}
        loading={this.resource.loading}
        heightMode={this.decoratorProps?.heightMode}
        onRefReady={this.__onChartRefReady}
        ref={this.context.chartRef}
      />
    );
  }

  // 给外部筛选表单调用，获取图表可筛选字段
  async getFilterFields(): Promise<
    {
      name: string;
      title: string;
      type: string;
      interface: string;
      target?: string;
      filterable?: {
        operators: {
          label: string;
          value: string;
        }[];
      };
    }[]
  > {
    const stepParams = this.getResourceSettingsInitParams();
    const query = stepParams?.query;
    if (!query) {
      return [];
    }
    if (query?.mode === 'sql') {
      // sql 模式：从查询数据结果解析 fields
      const data = this.resource.getData();
      if (!data) {
        return [];
      }
      const fields = Object.keys(data[0] || {}).map((field) => {
        const fieldType = typeof data[0][field] === 'number' ? 'number' : 'string';
        return {
          name: field,
          title: field,
          type: fieldType,
          interface: fieldType === 'number' ? 'number' : 'input',
        };
      });
      return fields;
    } else {
      // builder 模式：从 collection 表解析 fields
      const fields = this.context.collection?.getFields().filter((field) => field.filterable) || [];
      return fields;
    }
  }

  // 检查当前资源与查询模式是否匹配，不匹配则重新初始化
  checkResource(query: any): void {
    const mode = query?.mode || 'builder';
    if (mode === 'sql') {
      if (!(this.resource instanceof SQLResource)) {
        this.initResource('sql');
      }
    } else {
      if (!(this.resource instanceof ChartResource)) {
        this.initResource('builder');
      }
    }
  }

  // 应用数据查询配置（仅设置，不负责渲染）
  applyQuery(query: any) {
    this.checkResource(query);
    if (query?.mode === 'sql') {
      // SQL 模式下设置数据源 key（默认 main）
      const dsKey = query?.sqlDatasource || DEFAULT_DATA_SOURCE_KEY;
      (this.resource as SQLResource).setDataSourceKey(dsKey);
      (this.resource as SQLResource).setSQL(query.sql);
    } else {
      (this.resource as ChartResource).setQueryParams(query);
    }
  }

  // 写入结果，用于展示数据，并联动更新 column 配置
  setDataResult() {
    const uid = this.uid;
    try {
      const data = this.resource.getData();
      configStore.setResult(uid, data);
    } catch (error: any) {
      const message = error?.response?.data?.errors?.map?.((e: any) => e.message).join('\n') || error?.message;
      configStore.setError(uid, message);
    }
  }

  // 应用图表配置（仅设置，不负责渲染）
  async applyChartOptions(payload: { mode: 'basic' | 'custom'; builder?: any; raw?: string; query?: any }) {
    if (payload.mode === 'basic') {
      const chart = this.getRegisteredChart(payload.builder?.type);
      if (chart) {
        const rawData = convertDatasetFormats(this.resource.getData())?.objects || [];
        const fieldProps = this.getRegisteredChartFieldProps(payload.query, rawData);
        const data = this.formatRegisteredChartData(rawData, fieldProps);
        const option = chart.getProps({
          data,
          general: this.getRegisteredChartGeneral(payload.builder),
          advanced: payload.builder?.advanced || {},
          fieldProps: this.getRegisteredChartDisplayFieldProps(fieldProps),
        });

        normalizeEChartsOption(option);

        this.setProps({
          chart: {
            ...this.props.chart,
            Component: chart.Component,
            option,
          },
        });
        return;
      }
    }

    const optionRaw = payload.mode === 'basic' ? genRawByBuilder(payload.builder) : payload.raw;
    const { success, value, error, timeout } = await this.context.runjs(optionRaw);
    if (!success && error) {
      console.error('applyChartOptions runjs error:', error);
      return;
    }

    normalizeEChartsOption(value);

    this.setProps({
      chart: {
        ...this.props.chart,
        Component: undefined,
        optionRaw, // js文本
        option: value, // js对象
      },
    });
  }

  getRegisteredChart(type?: string) {
    if (!type) return;
    return this.getV2DataVisualizationPlugin()?.charts?.getChart?.(type);
  }

  getV2DataVisualizationPlugin() {
    const pm = this.context.app?.pm;
    return pm?.get(PluginDataVisualizationClient) as PluginDataVisualizationClient;
  }

  getDataVisualizationPlugin() {
    const pm = this.context.app?.pm;
    return (pm?.get(PluginDataVisualizationClient) ||
      pm?.get('@nocobase/plugin-data-visualization') ||
      pm?.get('data-visualization')) as PluginDataVisualizationClient;
  }

  getRegisteredChartGeneral(builder: any = {}) {
    const { type, advanced, ...general } = builder || {};
    return general;
  }

  getRegisteredChartFieldProps(query: any, data: Record<string, any>[] = []) {
    const fieldProps: Record<string, any> = {};
    const addField = (name: string, label?: string, field?: any, item?: any) => {
      if (!name || fieldProps[name]) return;
      fieldProps[name] = {
        label: label || getCollectionFieldLabel(field) || name,
        interface: field?.interface,
        transformer: this.getRegisteredChartFieldTransformer(field, item),
      };
    };

    (query?.dimensions || []).forEach((item) => {
      const name = item?.alias || toFieldPath(item?.field);
      const collectionField = this.getCollectionFieldByPath(query, item?.field);
      addField(name, item?.alias || getCollectionFieldLabel(collectionField), collectionField, item);
    });

    (query?.measures || []).forEach((item) => {
      const name = item?.alias || toFieldPath(item?.field);
      const collectionField = this.getCollectionFieldByPath(query, item?.field);
      addField(name, item?.alias || getCollectionFieldLabel(collectionField), collectionField, item);
    });

    Object.keys(data[0] || {}).forEach((name) => addField(name));

    return fieldProps;
  }

  formatRegisteredChartData(data: Record<string, any>[] = [], fieldProps: Record<string, any> = {}) {
    return data.map((row) => {
      const next = { ...row };
      Object.entries(fieldProps).forEach(([key, props]) => {
        if (props?.transformer && Object.prototype.hasOwnProperty.call(next, key)) {
          next[key] = props.transformer(next[key]);
        }
      });
      return next;
    });
  }

  getRegisteredChartDisplayFieldProps(fieldProps: Record<string, any> = {}) {
    return Object.entries(fieldProps).reduce((result, [key, props]) => {
      const { transformer, ...displayProps } = props || {};
      result[key] = displayProps;
      return result;
    }, {});
  }

  getRegisteredChartFieldTransformer(field?: any, item?: any) {
    if (!field) return createDateFormatTransformer(item?.format);
    const plugin = this.getDataVisualizationPlugin();
    const formatter = item?.aggregation ? undefined : plugin?.fieldInterfaceConfigs?.[field.interface]?.valueFormatter;
    return composeTransformers(
      formatter ? (value: any) => formatter(field, value, this.context) : undefined,
      createDateFormatTransformer(item?.format),
    );
  }

  getCollectionFieldByPath(query: any, field: string | string[] | undefined) {
    const fieldSegments = toFieldSegments(field);
    if (!fieldSegments.length) return;

    const [dataSourceKey = DEFAULT_DATA_SOURCE_KEY, collectionName] = query?.collectionPath || [];
    let collection = collectionName
      ? this.context.dataSourceManager?.getCollection?.(dataSourceKey, collectionName)
      : this.context.collection;

    let collectionField: any;
    for (const [index, fieldName] of fieldSegments.entries()) {
      collectionField = collection?.getField?.(fieldName);
      if (!collectionField) return;
      if (index < fieldSegments.length - 1) {
        collection = collectionField.targetCollection;
      }
    }
    return collectionField;
  }

  // 应用事件配置（仅设置，不负责渲染）
  async applyEvents(raw?: string, chartInstance?: EChartsType) {
    if (!raw) return;

    if (chartInstance) {
      await this.runChartEvents(raw, chartInstance);
      return;
    }

    const chart = (this.context.chartRef as any).current as EChartsType | null;
    if (chart) {
      await this.runChartEvents(raw, chart);
      return;
    }

    this.context.onRefReady(this.context.chartRef, async () => {
      const currentChart = (this.context.chartRef as any).current as EChartsType | null;
      if (currentChart) {
        await this.runChartEvents(raw, currentChart);
      }
    });
  }

  private async runChartEvents(raw: string, chart: EChartsType) {
    if (this.shouldSkipApplyEvents(raw, chart)) {
      return;
    }

    this.markEventsBound(raw, chart);

    try {
      const { success, error, timeout } = await this.context.runjs(raw, {
        chart,
      });
      if (success) {
        return;
      }

      this.clearEventsBound(raw, chart);
      if (error || timeout) {
        console.error('applyEvents runjs error:', error || 'timeout');
      }
    } catch (error) {
      this.clearEventsBound(raw, chart);
      throw error;
    }
  }

  // 显式渲染（必要时可直接调用）
  renderChart() {
    this.rerender(); // 会继续触发 handler
  }

  // 预览，暂存预览前的 stepParams，并刷新图表
  async onPreview(params: { query: any; chart: any }, needQueryData?: boolean) {
    debugLog('---onPreview', params.query);
    const values = _.cloneDeep(params);
    if (!values) return;

    // 仅在首次预览时记录，以便 cancelPreview 回滚
    if (this._previousStepParams === NO_PREVIEW_SNAPSHOT) {
      this._previousStepParams = _.cloneDeep(this.getResourceSettingsInitParams());
    }
    // 应用最新 stepParams，随后触发 flow handler
    this.setStepParams('chartSettings', 'configure', values);

    if (needQueryData) {
      const isSQL = values?.query?.mode === 'sql';
      this.applyQuery(await this.buildQueryRequest(values.query));
      // 预览场景：SQL 模式开启 debug（调用 run）
      if (isSQL) {
        (this.resource as SQLResource).setDebug(true);
      }
      try {
        // 等待确保 stepParams 已更新
        await sleep(200);
        await this.refresh();
        this.setDataResult();
      } finally {
        if (isSQL) {
          // 预览完成后，确保 debug 关闭（后续调用 runById）
          (this.resource as SQLResource).setDebug(false);
        }
      }
    }
  }

  // 取消预览，回滚stepParams，并刷新图表
  async cancelPreview() {
    if (this._previousStepParams !== NO_PREVIEW_SNAPSHOT) {
      const previous = this._previousStepParams;
      this.setStepParams('chartSettings', { configure: previous });
      this._previousStepParams = NO_PREVIEW_SNAPSHOT;

      // 等待确保 stepParams 已更新
      await sleep(100);
      // 重新请求数据，并刷新图表
      await this.refresh();
    }
  }
}

const PreviewButton = () => {
  const t = useT();
  const ctx = useFlowContext();
  return (
    <Button
      color="primary"
      variant="outlined"
      onClick={async () => {
        // 这里通过普通的 form.values 拿不到数据
        const formValues = ctx.getStepFormValues('chartSettings', 'configure');
        // 写入配置参数，统一走 onPreview 方便回滚
        await ctx.model.onPreview(formValues, true);
      }}
    >
      {t('Preview')}
    </Button>
  );
};

const CancelButton = () => {
  const t = useT();
  const ctx = useFlowContext();
  return (
    <Button
      type="default"
      onClick={() => {
        // 回滚 未保存的 stepParams 并刷新图表
        ctx.model.cancelPreview();

        closeAssociatedAIChatBox(ctx);
        ctx.view.close();
      }}
    >
      {t('Cancel')}
    </Button>
  );
};

const closeAssociatedAIChatBox = (ctx: any) => {
  const aiOpen = useChatBoxStore.getState().open;
  const associatedUid = useChatMessagesStore.getState().currentEditorRefUid;
  if (aiOpen && associatedUid === ctx.model.uid) {
    useChatBoxStore.getState().setOpen(false);
  }
};

ChartBlockModel.define({
  label: tExpr('Charts'),
});

ChartBlockModel.registerFlow({
  key: 'chartSettings',
  title: tExpr('Chart settings'),
  steps: {
    configure: {
      title: tExpr('Configure chart'),
      uiMode: (ctx) => ({
        type: 'embed',
        props: {
          onClose: () => {
            closeAssociatedAIChatBox(ctx);
          },
          header: { extra: <DaraButton ctx={ctx} /> },
          footer: (originNode, { OkBtn }) => (
            <Space>
              <CancelButton />
              <PreviewButton />
              <OkBtn />
            </Space>
          ),
        },
      }),
      uiSchema: {
        configuration: {
          type: 'void',
          'x-component': ConfigPanel,
        },
      },
      async beforeParamsSave(ctx, params) {
        const mode = params.query?.mode || 'builder';
        if (mode === 'sql') {
          return ctx.sql.save({
            uid: ctx.model.uid,
            sql: params.query.sql,
            dataSourceKey: params.query.sqlDatasource,
          });
        }
      },
      async afterParamsSave(ctx, params) {
        ctx.model._previousStepParams = NO_PREVIEW_SNAPSHOT;
      },
      defaultParams(ctx) {
        // 数据查询默认 builder 模式；图表配置默认 basic 模式
        return {
          query: {
            mode: 'builder',
          },
          chart: {
            option: {
              mode: 'basic',
            },
          },
        };
      },
      useRawParams: true, // 不默认解析配置里的变量
      async handler(ctx, params) {
        debugLog('---setting flow handler', params);
        const { query } = params;
        const { chart } = params;
        if (!query || !chart) {
          return;
        }

        try {
          // 数据部分
          ctx.model.applyQuery(await ctx.model.buildQueryRequest(query));

          // 图表部分
          await ctx.model.applyChartOptions({
            mode: chart.option?.mode || 'basic',
            builder: chart.option?.builder,
            raw: chart.option?.raw,
            query,
          });

          // 事件部分
          if (chart.events?.raw) {
            await ctx.model.applyEvents(chart.events?.raw);
          }
        } catch (error) {
          console.error('ChartBlockModel chartSettings configure flow handler() error:', error);
        }
      },
    },
  },
});
