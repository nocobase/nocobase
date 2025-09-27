/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { DataBlockModel, SubPageModel } from '@nocobase/client';
import { SQLResource, useFlowContext } from '@nocobase/flow-engine';
import { Button, Badge } from 'antd';
import React, { createRef } from 'react';
import { useT } from '../../locale';
import { EyeOutlined } from '@ant-design/icons';
import { convertDatasetFormats } from '../utils';
import { Chart, ChartOptions } from './Chart';
import { ConfigPanel } from './ConfigPanel';
import { ChartResource } from '../resources/ChartResource';
import _ from 'lodash';
import { genRawByBuilder } from './ChartOptionsBuilder.service';
import { configStore } from './config-store';

type ChartBlockModelStructure = {
  subModels: {
    page: SubPageModel;
  };
};

type ChartProps = {
  query: {
    mode: 'builder' | 'sql';
    measure?: any;
    dimension?: any;
    filter?: any;
    order?: any;
    limit?: any;
    offset?: any;
    sql?: string; // only sql mode
  };
  chart: ChartOptions & {
    optionRaw?: string; // 持久化存储原始脚本，供数据刷新时重新生成 option
    mode: 'basic' | 'custom';
    builder?: any;
    raw?: string; // only custom mode
  };
};

export class ChartBlockModel extends DataBlockModel<ChartBlockModelStructure> {
  declare props: ChartProps;

  _previousStepParams: any; // 上一次的 stepParams，用于 preview 时回滚

  get resource(): ChartResource<any> | SQLResource<any> {
    return this.context.resource as ChartResource<any> | SQLResource<any>;
  }

  // 初始化注册 ChartResource | SQLResource
  initResource(mode = 'builder') {
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
          // resource.setFilterByTk(this.uid); // TDOO 是否必要？ 和 ctx.model.uid 区别？
          return resource;
        },
      });
    }
  }

  onInit(options) {
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
  }

  renderComponent() {
    // TODO onRefReady 的逻辑理清，内部的 onRefReady props是否已经没必要？
    return <Chart {...this.props.chart} dataSource={this.resource.getData()} ref={this.context.chartRef as any} />;
  }

  // TODO 暴露给外部筛选表单调用筛选项，需要重构
  async getFilterFields(): Promise<{ name: string; title: string; target?: string }[]> {
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
        getFirstSubclassNameOf() {
          return fieldType === 'number' ? 'NumberFilterFieldModel' : 'InputFilterFieldModel';
        },
      };
    });
    return fields;
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

  // 公共方法：运行数据查询 + 刷新资源 + 更新结果面板
  async runQueryAndUpdateResult(query: any) {
    const uid = this.uid;
    try {
      if (!query?.mode) {
        throw new Error('Query mode is required');
      }
      if (query.mode === 'sql') {
        if (!(this.resource instanceof SQLResource)) {
          this.initResource('sql');
        }
        (this.resource as SQLResource).setSQL(query.sql);
      } else {
        if (!(this.resource instanceof ChartResource)) {
          this.initResource('builder');
        }
        (this.resource as ChartResource).setQueryParams(query);
      }
      await this.resource.refresh();
      const data = this.resource.getData();
      configStore.setResult(uid, data);
    } catch (error: any) {
      const message = error?.response?.data?.errors?.map?.((e: any) => e.message).join('\n') || error.message;
      configStore.setError(uid, message);
    }
  }

  // 预览，暂存预览前的 stepParams，并刷新图表
  async setParamsAndRerender(params) {
    if (!this._previousStepParams) {
      this._previousStepParams = _.cloneDeep(this.stepParams.chartSettings?.configure);
    }
    this.setStepParams('chartSettings', 'configure', params);
    this.rerender();
    // 调用链：rerender -> applyAutoFlows -> handler（处理数据、属性、事件） -> runQueryAndUpdateResult（查数据）
  }

  // 取消预览，回滚stepParams，并刷新图表
  async cancelAndRerender() {
    if (this._previousStepParams) {
      this.setStepParams('chartSettings', 'configure', this._previousStepParams);
      this._previousStepParams = null;
      this.rerender();
    }
  }
}

const PreviewButton = ({ style }) => {
  const t = useT();
  const ctx = useFlowContext();
  const form = useForm();
  return (
    <Badge dot offset={[-8, 2]}>
      <Button
        type="default"
        style={style}
        icon={<EyeOutlined />}
        onClick={async () => {
          // 这里通过普通的 form.values 拿不到数据
          const formValues = ctx.getStepFormValues('chartSettings', 'configure');
          const query = formValues?.query || {};

          if (query.mode === 'builder') {
            await form.submit();
          }

          ctx.model.checkResource(query); // 保证 resource 正确
          if (query?.mode === 'sql') {
            (ctx.model.resource as SQLResource).setDebug(true); // 开启 debug 模式，sql 查询不要走 runById
          }
          ctx.model.setParamsAndRerender(formValues || {});
        }}
      >
        {t('Preview')}
      </Button>
    </Badge>
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
        ctx.model.cancelAndRerender();
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
  title: 'Chart settings',
  steps: {
    configure: {
      title: 'Configure chart',
      uiMode: {
        type: 'embed',
        props: {
          minWidth: '510px', // 最小宽度 支持 measures field 完整展示 6 个字不换行
          footer: (originNode, { OkBtn }) => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <PreviewButton style={{ marginRight: 6 }} />
              <CancelButton style={{ marginRight: 6 }} />
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
        return ctx.sql.save({
          uid: ctx.model.uid,
          sql: params.query.sql,
        });
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
      async handler(ctx, params) {
        const { query, chart } = params;
        if (!query || !chart) {
          return;
        }
        try {
          // 数据部分
          await ctx.model.runQueryAndUpdateResult(query);

          // 图表部分
          const optionRaw = chart.option?.mode === 'basic' ? genRawByBuilder(chart.option?.builder) : chart.option?.raw;
          const { value: option } = await ctx.runjs(optionRaw);
          ctx.model.setProps({
            ...params,
            chart: {
              ...params.chart,
              optionRaw, // TODO 是否持久化？
              option, // TODO 是否换个变量，并传给<Chart> 不要覆盖已有结构？
            },
          });

          // 事件部分
          if (chart.events?.raw) {
            ctx.onRefReady(ctx.chartRef, () => {
              ctx.runjs(chart.events?.raw, { chart: ctx.chartRef.current });
            });
          }
        } catch (error) {
          console.error('ChartBlockModel chartSettings configure flow handler() error:', error);
        }
      },
    },
  },
});
