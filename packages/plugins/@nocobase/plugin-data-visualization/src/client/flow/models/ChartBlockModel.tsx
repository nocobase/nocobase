/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataBlockModel, SubPageModel } from '@nocobase/client';
import { SQLResource, useFlowContext } from '@nocobase/flow-engine';
import React from 'react';
import { convertDatasetFormats } from '../utils';
import { Chart, ChartOptions } from './Chart';
import { ConfigPanel } from './ConfigPanel';
import { Button } from 'antd';
import { useT } from '../../locale';
import { useForm } from '@formily/react';

type ChartBlockModelStructure = {
  subModels: {
    page: SubPageModel;
  };
};

type ChartProps = {
  query: {
    sql: string;
  };
  chart: ChartOptions & {
    optionRaw?: string; // 持久化存储原始脚本，供数据刷新时重新生成 option
  };
};

export class ChartBlockModel extends DataBlockModel<ChartBlockModelStructure> {
  declare props: ChartProps;

  get resource() {
    return this.context.resource;
  }

  onInit() {
    this.context.defineProperty('resource', {
      get: () => {
        const resource = this.context.createResource(SQLResource);
        resource.setSQLType('selectRows');
        resource.setFilterByTk(this.uid);

        // refresh listener
        resource.on('refresh', async () => {
          this.invalidateAutoFlowCache();
          await this.regenerateChartOption(); // regenerate option，refresh ECharts
        });
        return resource;
      },
    });

    this.context.defineProperty('data', {
      get: () => convertDatasetFormats(this.resource.getData()),
      cache: false,
    });
  }

  renderComponent() {
    return <Chart {...this.props.chart} dataSource={this.resource.getData()} ref={this.context.ref as any} />;
  }

  // regenerate option，refresh ECharts
  async regenerateChartOption() {
    const rawOption = (this.props.chart as any)?.optionRaw ?? (this.props.chart as any)?.option?.raw;
    if (rawOption) {
      const { value: option } = await this.context.runjs(rawOption as string, {
        ctx: {
          ...this.context,
          data: convertDatasetFormats(this.resource.getData()),
        },
      });

      this.setProps({
        ...this.props,
        chart: {
          ...this.props.chart,
          option,
        },
      });
    }
  }

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

  async setParamsAndPreview(params) {
    this.setStepParams('chartSettings', 'configure', params);
    // this.render();
    await this.applyFlow('chartSettings');
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
        return {
          chart: {},
        };
      },
      async handler(ctx, params) {
        if (params.query?.sql) {
          try {
            await ctx.model.resource.refresh();
          } catch (err) {
            console.log(err);
          }
        } else {
          ctx.model.resource.setData(null);
        }
        const rawOption = params.chart.option?.raw;
        const rawEvents = params.chart.events?.raw;
        const { value: option } = await ctx.runjs(rawOption);
        ctx.model.setProps({
          ...params,
          chart: {
            ...params.chart,
            optionRaw: rawOption, // keep raw option for refresh
            option,
          },
        });
        if (rawEvents) {
          ctx.onRefReady(ctx.ref, () => {
            ctx.runjs(rawEvents, { chart: ctx.ref.current });
          });
        }
      },
    },
  },
});
