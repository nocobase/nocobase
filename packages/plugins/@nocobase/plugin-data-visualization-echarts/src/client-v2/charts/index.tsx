/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client-v2';

import { EChartRenderer } from './renderer';

const numericValue = (value: any) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getCategoryName = (row: Record<string, any>, xField?: string) => {
  if (!xField) {
    return '';
  }
  const value = row[xField];
  return value === null || value === undefined ? '' : String(value);
};

const createCartesianChart = (name: string, title: string, type: 'line' | 'bar', transpose = false): ChartType => ({
  name,
  title,
  Component: EChartRenderer,
  getProps({ data, xField, yField, fieldProps, themeToken }: RenderProps) {
    const categories = data.map((row) => getCategoryName(row, xField));
    const values = data.map((row) => numericValue(row[yField]));
    const categoryAxis = {
      type: 'category',
      data: categories,
      name: fieldProps[xField]?.label,
      axisLabel: {
        color: themeToken?.colorTextSecondary,
      },
    };
    const valueAxis = {
      type: 'value',
      name: fieldProps[yField]?.label,
      axisLabel: {
        color: themeToken?.colorTextSecondary,
      },
      splitLine: {
        lineStyle: {
          color: themeToken?.colorSplit,
        },
      },
    };

    return {
      option: {
        tooltip: { trigger: 'axis' },
        grid: { left: 48, right: 24, top: 32, bottom: 48 },
        xAxis: transpose ? valueAxis : categoryAxis,
        yAxis: transpose ? categoryAxis : valueAxis,
        series: [
          {
            type,
            data: values,
            smooth: type === 'line',
            itemStyle: {
              color: themeToken?.colorPrimary,
            },
          },
        ],
      },
    };
  },
});

const pieChart: ChartType = {
  name: 'pie',
  title: 'Pie',
  Component: EChartRenderer,
  getProps({ data, xField, yField, fieldProps, themeToken }: RenderProps) {
    return {
      option: {
        tooltip: { trigger: 'item' },
        legend: {
          type: 'scroll',
          bottom: 0,
          textStyle: {
            color: themeToken?.colorText,
          },
        },
        series: [
          {
            type: 'pie',
            radius: ['36%', '68%'],
            name: fieldProps[yField]?.label,
            data: data.map((row) => ({
              name: getCategoryName(row, xField),
              value: numericValue(row[yField]),
            })),
          },
        ],
      },
    };
  },
};

const charts: ChartType[] = [
  createCartesianChart('line', 'Line', 'line'),
  createCartesianChart('column', 'Column', 'bar'),
  createCartesianChart('bar', 'Bar', 'bar', true),
  pieChart,
];

export default charts;
