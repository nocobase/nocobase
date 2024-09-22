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
import { registerTheme } from 'echarts';

export class EChart extends Chart {
  static lightThemes: string[] = ['default', 'light'];
  static darkThemes: string[] = ['dark'];
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
      config: [
        'xField',
        'yField',
        'seriesField',
        'size',
        'lightTheme',
        'darkTheme',
        'showLegend',
        'showLabel',
        ...(config || []),
      ],
    });
    this.series = series;
    this.addConfigs({
      lightTheme: {
        settingType: 'select',
        name: 'lightTheme',
        title: 'Light mode theme',
        defaultValue: 'default',
        options: EChart.lightThemes.map((theme) => ({ label: theme, value: theme })),
      },
      darkTheme: {
        settingType: 'select',
        name: 'darkTheme',
        title: 'Dark mode theme',
        defaultValue: 'dark',
        options: EChart.darkThemes.map((theme) => ({ label: theme, value: theme })),
      },
    });
  }

  static registerTheme(name: string, theme: any, mode = 'light') {
    registerTheme(name, theme);
    this[`${mode}Themes`].push(name);
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
    const {
      xField,
      yField,
      seriesField,
      size,
      showLegend,
      isStack,
      smooth,
      showLabel,
      lightTheme,
      darkTheme,
      ...others
    } = general;
    const xLabel = fieldProps[xField]?.label;
    const yLabel = fieldProps[yField]?.label;
    let seriesName = [yLabel];
    if (seriesField) {
      seriesName = Array.from(new Set(data.map((row: any) => row[seriesField]))).map((value) => value || 'null');
    }
    return deepmerge(
      {
        legend: {
          show: showLegend,
          data: seriesName,
        },
        tooltip: {
          data: seriesName,
        },
        label: {
          show: showLabel,
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
          smooth,
          ...(isStack ? { stack: 'stack' } : {}),
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
        lightTheme,
        darkTheme,
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
