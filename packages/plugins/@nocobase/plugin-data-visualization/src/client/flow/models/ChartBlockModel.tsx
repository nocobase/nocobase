/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { ChildPageModel, DataBlockModel } from '@nocobase/client';
import { createCollectionContextMeta, SQLResource, useFlowContext } from '@nocobase/flow-engine';
import React, { createRef } from 'react';
import _ from 'lodash';
import { Button } from 'antd';
import { useT, tStr } from '../../locale';
import { convertDatasetFormats, sleep, debugLog } from '../utils';
import { Chart, ChartOptions } from './Chart';
import { ConfigPanel } from './ConfigPanel';
import { ChartResource } from '../resources/ChartResource';
import { genRawByBuilder } from './ChartOptionsBuilder.service';
import { configStore } from './config-store';

type ChartBlockModelStructure = {
  subModels: {
    page: ChildPageModel;
  };
};

type ChartProps = {
  chart: ChartOptions & {
    optionRaw?: string;
  };
};

export class ChartBlockModel extends DataBlockModel<ChartBlockModelStructure> {
  declare props: ChartProps;

  _previousStepParams: any; // 上一次持久化的 stepParams，用于 preview 时回滚

  get resource(): ChartResource<any> | SQLResource<any> {
    return this.context.resource as ChartResource<any> | SQLResource<any>;
  }

  // 统一管理 refresh 监听引用，便于 off 解绑
  private __onResourceRefresh = () => this.renderChart();

  // 初始化注册 ChartResource | SQLResource
  initResource(mode = 'builder') {
    // 1) 先拿旧实例并解绑，防止旧实例残留监听
    const oldResource = this.resource;
    if (oldResource instanceof ChartResource || oldResource instanceof SQLResource) {
      oldResource.off('refresh', this.__onResourceRefresh);
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
      newResource.off('refresh', this.__onResourceRefresh);
      newResource.on('refresh', this.__onResourceRefresh);
    }
  }

  getResourceSettingsInitParams() {
    return this.getStepParams('chartSettings', 'configure');
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
        // 初始化场景：禁用 debug，使 SQLResource.refresh() 走 runById
        this.applyQuery(initQuery, { debug: false });
        // 依赖 refresh 事件驱动渲染
        await this.resource.refresh();
      }
    } catch (e) {
      // 初始阶段不打断页面加载，错误信息写入预览 store 以便排查
      const message =
        (e as any)?.response?.data?.errors?.map?.((err: any) => err.message).join('\n') || (e as any)?.message;
      configStore.setError(this.uid, message);
    }
  }

  renderComponent() {
    // TODO onRefReady 的逻辑理清，内部的 onRefReady props是否已经没必要？
    return <Chart {...this.props.chart} dataSource={this.resource.getData()} ref={this.context.chartRef as any} />;
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
  applyQuery(query: any, options?: { debug?: boolean }) {
    this.checkResource(query);
    if (query?.mode === 'sql') {
      // 默认开启 debug（预览、交互）；初始化时传入 { debug: false } 使用 runById
      (this.resource as SQLResource).setDebug(options?.debug ?? true);
      (this.resource as SQLResource).setSQL(query.sql);
    } else {
      debugLog('---applyQuery', query);
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
  async applyChartOptions(payload: { mode: 'basic' | 'custom'; builder?: any; raw?: string }) {
    const optionRaw = payload.mode === 'basic' ? genRawByBuilder(payload.builder) : payload.raw;
    const { success, value, error, timeout } = await this.context.runjs(optionRaw);
    if (!success && error) {
      console.error('applyChartOptions runjs error:', error);
      return;
    }
    this.setProps({
      chart: {
        ...this.props.chart,
        optionRaw, // js文本
        option: value, // js对象
      },
    });
  }

  // 应用事件配置（仅设置，不负责渲染）
  async applyEvents(raw?: string) {
    if (!raw) return;

    this.context.onRefReady(this.context.chartRef, async () => {
      const { success, value, error, timeout } = await this.context.runjs(raw, {
        chart: (this.context.chartRef as any).current,
      });
      if (!success && error) {
        console.error('applyEvents runjs error:', error);
        return;
      }
    });
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
    if (!this._previousStepParams) {
      this._previousStepParams = _.cloneDeep(this.getResourceSettingsInitParams());
    }
    // 应用最新 stepParams，随后触发 flow handler
    this.setStepParams('chartSettings', 'configure', values);

    if (needQueryData) {
      // 等待确保 stepParams 已更新
      await sleep(200);
      // 刷新请求数据
      await this.resource.refresh();
      this.setDataResult(); // 写入结果，用于展示数据，并联动更新 column 配置
    }
  }

  // 取消预览，回滚stepParams，并刷新图表
  async cancelPreview() {
    if (this._previousStepParams) {
      this.setStepParams('chartSettings', 'configure', this._previousStepParams);
      this._previousStepParams = null;
      // 等待确保 stepParams 已更新
      await sleep(100);
      // 重新请求数据，并刷新图表
      await this.resource.refresh();
    }
  }
}

const PreviewButton = ({ style }) => {
  const t = useT();
  const ctx = useFlowContext();
  return (
    <Button
      color="primary"
      variant="outlined"
      style={style}
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

const CancelButton = ({ style }) => {
  const t = useT();
  const ctx = useFlowContext();
  return (
    <Button
      type="default"
      style={style}
      onClick={() => {
        // 回滚 未保存的 stepParams 并刷新图表
        ctx.model.cancelPreview();
        ctx.view.close();
      }}
    >
      {t('Cancel')}
    </Button>
  );
};

ChartBlockModel.define({
  label: 'Charts',
});

ChartBlockModel.registerFlow({
  key: 'chartSettings',
  title: tStr('Chart settings'),
  steps: {
    configure: {
      title: tStr('Configure chart'),
      uiMode: {
        type: 'embed',
        props: {
          minWidth: '400px',
          footer: (originNode, { OkBtn }) => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <CancelButton style={{ marginRight: 6 }} />
              <PreviewButton style={{ marginRight: 6 }} />
              <OkBtn />
            </div>
          ),
        },
      },
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
          });
        }
      },
      defaultParams(ctx) {
        // 数据查询默认 builder 模式；图表配置默认 basic 模式
        return {
          query: {
            mode: 'builder',
          },
          chartConfig: {
            mode: 'basic',
          },
        };
      },
      useRawParams: true, // 不默认解析配置里的变量
      async handler(ctx, params) {
        debugLog('---setting flow handler', params);
        let { query } = params;
        const { chartConfig, events } = params;

        try {
          // 数据部分
          if (query) {
            if (query.mode !== 'sql') {
              // builder 模式下变量解析；sql 模式下交给 sqlResource 处理解析
              query = await ctx.resolveJsonTemplate(query);
            }
            ctx.model.applyQuery(query);
          }

          // 图表部分
          if (chartConfig) {
            await ctx.model.applyChartOptions({
              mode: chartConfig?.mode || 'basic',
              builder: chartConfig?.builder,
              raw: chartConfig?.raw,
            });
          }

          // 事件部分
          if (events?.raw) {
            await ctx.model.applyEvents(events.raw);
          }
        } catch (error) {
          console.error('ChartBlockModel chartSettings configure flow handler() error:', error);
        }
      },
    },
  },
});
