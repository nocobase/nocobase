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
import { Button } from 'antd';
import React, { createRef } from 'react';
import { useT } from '../../locale';
import { convertDatasetFormats } from '../utils';
import { Chart, ChartOptions } from './Chart';
import { ConfigPanel } from './ConfigPanel';
import { ChartResource } from '../resources/ChartResource';
import _ from 'lodash';
import { genRawByBuilder } from './ChartOptionsBuilder.service';

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

  // 预览
  async setParamsAndPreview(params) {
    console.log('----setParamsAndPreview', params);
    // 暂存预览前的 stepParams，用于取消预览时回滚
    if (!this._previousStepParams) {
      this._previousStepParams = _.cloneDeep(this.stepParams);
    }
    this.setStepParams('chartSettings', 'configure', params);
    console.log('---latest setParams', this.getStepParams('chartSettings', 'configure'));
    this.rerender();
  }

  // 取消预览，回滚stepParams
  async cancelPreview() {
    console.log('----cancelPreview', this._previousStepParams);
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
    <Button
      type="default"
      style={style}
      onClick={async () => {
        await form.submit();
        const formValues = ctx.getStepFormValues('chartSettings', 'configure');
        ctx.model.setParamsAndPreview(formValues || {});
      }}
    >
      {t('Preview')}
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
          footer: (originNode) => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <PreviewButton style={{ marginRight: 4 }} />
              {originNode}
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
        console.log('----setting flow handler params', query, chart);

        if (!query || !chart) {
          return;
        }
        try {
          // 数据部分
          if (query.mode === 'sql') {
            if (!(ctx.model.resource instanceof SQLResource)) {
              ctx.model.initResource('sql');
            }
            (ctx.model.resource as SQLResource).setSQL(query.sql);
            await ctx.model.resource.refresh();
          } else {
            if (!(ctx.model.resource instanceof ChartResource)) {
              ctx.model.initResource('builder');
            }
            (ctx.model.resource as ChartResource).setQueryParams(query);
            await ctx.model.resource.refresh();
          }

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
