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
import './transform';
import { Chart, ChartProps, ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
import { registerTheme } from 'echarts';
import configs from './configs';
import { lang } from '../locale';

export class EChart extends Chart {
  static lightThemes: string[] = ['default', 'light'];
  static darkThemes: string[] = ['dark'];
  series?: any;

  constructor({
    name,
    title,
    series,
    config,
  }: {
    name: string;
    title: string;
    series?: any;
    config?: ChartProps['config'];
  }) {
    super({
      name,
      title,
      Component: C,
      config: [
        'xField',
        'seriesField',
        'size',
        'lightTheme',
        'darkTheme',
        'showLegend',
        'legendOrient',
        'legendPosition',
        'labelType',
        ...(config || []),
        {
          configType: 'axisTitle',
          name: 'xAxisTitle',
          title: lang('X-Axis title'),
          defaultValue: 'end',
        },
        {
          configType: 'axisTitle',
          name: 'yAxisTitle',
          title: lang('Y-Axis title'),
          defaultValue: 'end',
        },
        {
          configType: 'axisLabelRotate',
          name: 'xAxisLabelRotate',
          title: lang('X-Axis label rotate'),
        },
        'padding',
        'splitLine',
        'markLine',
      ],
    });
    this.series = series;
    this.addConfigTypes({
      lightTheme: {
        configType: 'select',
        name: 'lightTheme',
        title: lang('Light mode theme'),
        defaultValue: 'walden',
        options: EChart.lightThemes.map((theme) => ({ label: theme, value: theme })),
      },
      darkTheme: {
        configType: 'select',
        name: 'darkTheme',
        title: lang('Dark mode theme'),
        defaultValue: 'defaultDark',
        options: EChart.darkThemes.map((theme) => ({ label: theme, value: theme })),
      },
      ...configs,
    });
  }

  static registerTheme(name: string, theme: any, mode = 'light') {
    registerTheme(name, theme);
    this[`${mode}Themes`].push(name);
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField, seriesField, yFields } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: xField?.value,
        yField: yField?.value,
        yFields: yFields?.map((field) => field?.value) || [],
        seriesField: seriesField?.value,
      },
    };
  };

  getBasicOptions({ general }) {
    const { size, lightTheme, darkTheme, padding } = general;
    const { left, right, bottom, top } = padding || {};
    const grid: any = {
      containLabel: true,
    };
    grid.left = left || 10;
    if (right) {
      grid.right = right;
    }
    grid.bottom = bottom || 10;
    if (top) {
      grid.top = top;
    }
    return {
      grid,
      animation: false,
      size,
      lightTheme,
      darkTheme,
    };
  }

  getLegendOptions(config: {
    showLegend: boolean;
    legendOrient: 'horizontal' | 'vertical';
    legendPosition: {
      left: string;
      bottom: string;
      right: string;
      top: string;
    };
  }) {
    const { showLegend, legendOrient = 'horizontal', legendPosition } = config;
    const { left, bottom, right, top } = legendPosition || {};
    const opts: any = {
      show: showLegend,
      type: 'scroll',
      orient: legendOrient,
    };
    if (left) {
      opts.left = left;
    }
    if (bottom) {
      opts.bottom = bottom;
    }
    if (right) {
      opts.right = right;
    } else if (legendOrient === 'vertical') {
      opts.right = 10;
    }
    if (top) {
      opts.top = top;
    }
    return opts;
  }

  getLabelOptions(config: { labelType: string; series: string; [key: string]: any }) {
    const { labelType, series } = config;
    let formatter: string;
    let showLabel = true;
    switch (Number(labelType)) {
      case 0:
        showLabel = false;
        break;
      case 1:
        formatter = `{@${series}}`;
        break;
      case 2:
        formatter = '{b}';
        break;
      case 3:
        formatter = `{b} {@${series}}`;
        break;
    }
    return { formatter, show: showLabel };
  }

  getProps({ data, general, advanced, fieldProps }: RenderProps): EChartsReactProps['option'] {
    const {
      xField,
      yField,
      seriesField,
      showLegend,
      legendOrient = 'horizontal',
      isStack,
      smooth,
      labelType,
      labelPosition = 'top',
      splitLine,
      markLine,
      xAxisTitle = 'end',
      yAxisTitle = 'end',
      xAxisLabelRotate = 0,
      ...others
    } = general;
    let { yFields = [yField] } = general;
    const xLabel = fieldProps[xField]?.label;
    const yLabel = fieldProps[yField]?.label;
    let seriesName = yFields.map((field: string) => fieldProps[field]?.label || field);
    if (seriesField) {
      seriesName = Array.from(new Set(data.map((row: any) => row[seriesField]))).map((value) => value || 'null');
      yFields = seriesName;
    }
    return {
      legend: {
        data: seriesName,
        ...this.getLegendOptions(general),
      },
      tooltip: {
        data: seriesName,
        trigger: 'axis',
      },
      dataset: [
        {
          dimensions: [xField, ...yFields],
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
      series: seriesName.map((name: string, index: number) => ({
        name,
        datasetIndex: 1,
        smooth,
        label: {
          // 关键改动：无 seriesField 时使用真实维度 key，确保 {@series} 命中
          ...this.getLabelOptions({ labelType, series: seriesField ? name : yFields[index] }),
          position: labelPosition,
        },
        markLine: {
          data: markLine
            ?.filter(({ value }) => value)
            .map(({ name, value, color }) => ({
              name,
              yAxis: value,
              lineStyle: {
                color,
              },
            })),
        },
        ...(isStack ? { stack: 'stack' } : {}),
        ...this.series,
        ...others,
      })),
      xAxis: {
        name: xAxisTitle !== 'none' ? xLabel : '',
        nameLocation: xAxisTitle,
        nameGap: xAxisTitle === 'end' ? 15 : 30,
        type: 'category',
        splitLine: {
          show: splitLine?.type === 'x' || splitLine?.type === 'xy',
          lineStyle: {
            type: splitLine?.style,
          },
        },
        axisLabel: {
          rotate: xAxisLabelRotate,
        },
      },
      yAxis: {
        name: yAxisTitle !== 'none' && (yFields.length === 1 || seriesField) ? yLabel : '',
        nameLocation: yAxisTitle,
        nameGap: yAxisTitle === 'middle' ? 50 : 15,
        splitLine: {
          show: splitLine?.type === 'y' || splitLine?.type === 'xy',
          lineStyle: {
            type: splitLine?.style,
          },
        },
      },
      ...this.getBasicOptions({ general }),
    };
  }

  getReference() {
    return {
      title: 'ECharts',
      link: 'https://echarts.apache.org/en/option.html',
    };
  }
}
