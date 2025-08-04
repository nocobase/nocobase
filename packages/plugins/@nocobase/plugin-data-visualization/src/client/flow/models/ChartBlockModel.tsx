/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BlockModel } from '@nocobase/client';
import { SQLResource, escapeT } from '@nocobase/flow-engine';
import { ConfigPanel } from './ConfigPanel';
import { Chart, ChartOptions } from './Chart';

type ChartProps = {
  query: {
    sql: string;
  };
  chart: ChartOptions;
};

export class ChartBlockModel extends BlockModel {
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
  }

  renderComponent() {
    return <Chart {...this.props.chart} dataSource={this.resource.getData()} />;
  }
}

ChartBlockModel.define({
  title: escapeT('Charts'),
});

ChartBlockModel.registerFlow({
  key: 'refreshSettings',
  sort: 10000,
  steps: {
    refresh: {
      async handler(ctx) {
        await ctx.model.resource.refresh();
      },
    },
  },
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
          chart: {
            option: {
              raw: '{}',
            },
          },
        };
      },
      async handler(ctx, params) {
        const rawOption = params.chart.option.raw;
        const { value: option } = await ctx.runjs(`return ${rawOption}`);
        ctx.model.setProps({
          ...params,
          chart: {
            ...params.chart,
            option,
          },
        });
      },
    },
  },
});
