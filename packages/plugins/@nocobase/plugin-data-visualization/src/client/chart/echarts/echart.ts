/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EChart as C } from './ReactEChart';
import { EChartsReactProps } from 'echarts-for-react';
import deepmerge from 'deepmerge';
import './transform';
import { Chart, ChartProps, ChartType, RenderProps } from '../chart';

export class EChart extends Chart {
  series: any;

  constructor({
    name,
    title,
    series,
    config,
  }: {
    name: string;
    title: string;
    series: any;
    config?: ChartProps['config'];
  }) {
    super({
      name,
      title,
      Component: C,
      config: ['xField', 'yField', 'seriesField', 'size', ...(config || [])],
    });
    this.series = series;
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField, seriesField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: xField?.value,
        yField: yField?.value,
        seriesField: seriesField?.value,
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps): EChartsReactProps['option'] {
    const { xField, yField, seriesField, size, ...others } = general;
    const xLabel = fieldProps[xField]?.label;
    const yLabel = fieldProps[yField]?.label;
    let seriesName = [yLabel];
    if (seriesField) {
      seriesName = Array.from(new Set(data.map((row: any) => row[seriesField]))).map((value) => value || 'null');
    }
    return deepmerge(
      {
        legend: {
          data: seriesName,
        },
        tooltip: {
          data: seriesName,
        },
        dataset: [
          {
            dimensions: [xField, ...(seriesField ? seriesName : [yField])],
            source: data,
          },
          {
            transform: [
              {
                type: 'data-visualization:transform',
                config: { fieldProps },
              },
              {
                type: 'data-visualization:toSeries',
                config: { xField, yField, seriesField },
              },
            ],
          },
        ],
        series: seriesName.map((name) => ({
          name,
          datasetIndex: 1,
          ...this.series,
          ...others,
        })),
        xAxis: {
          name: xLabel,
          type: 'category',
        },
        yAxis: {
          name: yLabel,
        },
        grid: {
          containLabel: true,
        },
        animation: false,
        size,
      },
      advanced,
    );
  }

  getReference() {
    return {
      title: 'ECharts',
      link: 'https://echarts.apache.org/en/option.html',
    };
  }
}
