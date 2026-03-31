/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lang } from '../locale';
import { ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
import { EChart } from './echart';

export class Radar extends EChart {
  constructor() {
    super({
      name: 'radar',
      title: lang('Radar'),
      series: { type: 'radar' },
    });
    this.config = [
      {
        configType: 'radio',
        name: 'variableType',
        defaultValue: 'dimension',
        options: [
          {
            label: lang('Use dimensions as variables'),
            value: 'dimension',
          },
          {
            label: lang('Use measures as variables'),
            value: 'measure',
          },
        ],
      },
      'size',
      'lightTheme',
      'darkTheme',
      'showLegend',
      'legendOrient',
      'legendPosition',
      {
        configType: 'select',
        name: 'shape',
        title: lang('Shape'),
        defaultValue: 'polygon',
        options: [
          { label: lang('Polygon'), value: 'polygon' },
          { label: lang('Circle'), value: 'circle' },
        ],
      },
      {
        range: {
          title: lang('Range'),
          type: 'object',
          'x-decorator': 'FormItem',
          'x-component': 'Space',
          properties: {
            min: {
              'x-component': 'Input',
              'x-component-props': {
                allowClear: false,
                placeholder: lang('Min'),
              },
            },
            max: {
              'x-component': 'Input',
              'x-component-props': {
                placeholder: lang('Max'),
                allowClear: false,
              },
            },
          },
        },
      },
      {
        configType: 'input',
        name: 'radius',
        title: lang('Radius'),
      },
      {
        center: {
          title: lang('Center coordinates'),
          type: 'object',
          'x-decorator': 'FormItem',
          'x-component': 'Space',
          properties: {
            horizontal: {
              'x-component': 'Input',
              'x-component-props': {
                placeholder: lang('Abscissa'),
                allowClear: false,
              },
            },
            vertical: {
              'x-component': 'Input',
              'x-component-props': {
                allowClear: false,
                placeholder: lang('Ordinate'),
              },
            },
          },
        },
      },
    ];
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yFields, yField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        yField: yField?.value,
        yFields: yFields.map((field) => field?.value),
        xField: xField?.value,
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const { size, lightTheme, darkTheme, showLegend, variableType, xField, yFields, shape, radius, center, range } =
      general;
    let variables: string[] = [];
    if (variableType === 'dimension') {
      variables = Array.from(new Set(data.map((row: any) => row[xField]))).map((value) => value || 'null');
      data = yFields.map((field: string) => ({
        name: fieldProps[field]?.label,
        value: data.map((row: any) => row[field]),
      }));
    } else {
      variables = yFields.map((field: string) => fieldProps[field]?.label);
      data = data.map((row: any) => ({
        name: row[xField] || 'null',
        value: yFields.map((field: string) => row[field]),
      }));
    }
    const { horizontal, vertical } = center || {};
    const { max, min } = range || {};
    const options = {
      legend: {
        ...this.getLegendOptions(general),
      },
      tooltip: {},
      radar: {
        shape,
        indicator: variables.map((variable, index) => {
          const opts: any = {
            name: variable,
            axisLabel: {
              show: index === 0,
            },
          };
          if (max) {
            opts.max = max;
          }
          if (min) {
            opts.min = min;
          }
          return opts;
        }),
        radius: radius || '90%',
        center: [horizontal || '50%', vertical || (showLegend ? '65%' : '50%')],
      },
      series: {
        data,
        ...this.series,
      },
      animation: false,
      size,
      lightTheme,
      darkTheme,
    };
    return options;
  }
}
