/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BlockModel, FlowPage, SubPageModel } from '@nocobase/client';
import { SQLResource, escapeT } from '@nocobase/flow-engine';
import { ConfigPanel } from './ConfigPanel';
import { Chart, ChartOptions } from './Chart';
import { EChartsType } from 'echarts';
import { convertDatasetFormats } from '../utils';

type ChartBlockModelStructure = {
  subModels: {
    page: SubPageModel;
  };
};

type ChartProps = {
  query: {
    sql: string;
  };
  chart: ChartOptions;
};

export class ChartBlockModel extends BlockModel<ChartBlockModelStructure> {
  declare props: ChartProps;

  get resource() {
    return this.context.resource;
  }

  onInit() {
    this.context.defineProperty('resource', {
      get: () => {
        const resource = new SQLResource();
        resource.setAPIClient(this.context.api);
        resource.setSQLType('selectRows');
        resource.setFilterByTk(this.uid);
        return resource;
      },
    });

    this.context.defineProperty('data', {
      get: () => convertDatasetFormats(this.resource.getData()),
      cache: false,
    });

    this.context.defineMethod('openView', async (params) => {
      const { mode, size } = params || {};
      this.dispatchEvent('openView', {
        mode: mode || 'dialog',
        size: size || 'large',
      });
    });
  }

  renderComponent() {
    return <Chart {...this.props.chart} dataSource={this.resource.getData()} ref={this.context.ref as any} />;
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
      };
    });
    return fields;
  }
}

ChartBlockModel.define({
  title: escapeT('Charts'),
});

ChartBlockModel.registerFlow({
  key: 'chartSettings',
  title: escapeT('Chart settings'),
  steps: {
    configure: {
      title: escapeT('Configure chart'),
      uiMode: {
        type: 'dialog',
        props: {
          width: '95%',
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

ChartBlockModel.registerFlow({
  key: 'popupSettings',
  on: {
    eventName: 'openView',
  },
  steps: {
    openView: {
      use: 'openView',
      hideInSettings: true,
      defaultParams(ctx) {
        return {};
      },
    },
  },
});
