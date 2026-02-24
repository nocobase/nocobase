/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
import { EChart } from './echart';
import { lang } from '../locale';

export class Funnel extends EChart {
  constructor() {
    super({
      name: 'funnel',
      title: lang('Funnel'),
      series: { type: 'funnel' },
    });
    this.config = [
      // {
      //   configType: 'field',
      //   name: 'seriesField',
      //   title: 'seriesField',
      //   required: true,
      // },
      // {
      //   configType: 'field',
      //   name: 'valueField',
      //   title: 'valueField',
      //   required: true,
      // },
      'size',
      'lightTheme',
      'darkTheme',
      'showLegend',
      'legendOrient',
      'legendPosition',
      {
        configType: 'select',
        name: 'labelType',
        title: lang('Label type'),
        defaultValue: 1,
        options: [
          { label: lang('Category name'), value: 1 },
          { label: lang('Value'), value: 2 },
          { label: lang('Percentage'), value: 3 },
          { label: `${lang('Category name')} + ${lang('Value')}`, value: 4 },
          { label: `${lang('Category name')} + ${lang('Percentage')}`, value: 5 },
          { label: `${lang('Value')} + ${lang('Percentage')}`, value: 6 },
          { label: `${lang('Category name')} + ${lang('Value')} + ${lang('Percentage')}`, value: 7 },
          { label: lang('Hidden'), value: 0 },
        ],
      },
      {
        configType: 'select',
        name: 'labelPosition',
        title: lang('Label position'),
        defaultValue: 'inside',
        options: [
          { label: lang('Outside'), value: 'outside' },
          { label: lang('Inside'), value: 'inside' },
        ],
      },
      {
        configType: 'boolean',
        name: 'showLabelLine',
        title: lang('Show label line'),
        defaultValue: false,
      },
      {
        funnelSize: {
          title: lang('Funnel size (min, max)'),
          type: 'object',
          'x-decorator': 'FormItem',
          'x-component': 'Space',
          properties: {
            min: {
              'x-component': 'Input',
              'x-component-props': {
                placeholder: lang('Min'),
                allowClear: false,
              },
              default: '0%',
            },
            max: {
              'x-component': 'Input',
              'x-component-props': {
                placeholder: lang('Max'),
                allowClear: false,
              },
              default: '100%',
            },
          },
        },
      },
      'padding',
    ];
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        valueField: yField?.value,
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const { valueField, labelType, showLabelLine, labelPosition, funnelSize } = general;
    let formatter: string;
    let showLabel = true;
    switch (Number(labelType)) {
      case 0:
        showLabel = false;
        break;
      case 1:
        formatter = '{b}';
        break;
      case 2:
        formatter = `{@${valueField}}`;
        break;
      case 3:
        formatter = '{d}%';
        break;
      case 4:
        formatter = `{b} {@${valueField}}`;
        break;
      case 5:
        formatter = '{b} {d}%';
        break;
      case 6:
        formatter = `{@${valueField}} {d}%`;
        break;
      case 7:
        formatter = `{b}\n{@${valueField}} {d}%`;
        break;
    }
    const { min, max } = funnelSize || {};
    const options = {
      legend: {
        ...this.getLegendOptions(general),
      },
      tooltip: {},
      dataset: [
        {
          source: data,
        },
        {
          transform: {
            type: 'data-visualization:transform',
            config: { fieldProps },
          },
        },
      ],
      series: {
        name: fieldProps[valueField]?.label,
        datasetIndex: 1,
        label: {
          position: labelPosition,
          show: showLabel,
          formatter,
        },
        labelLine: {
          show: showLabelLine,
        },
        minSize: min || '0%',
        maxSize: max || '100%',
        ...this.series,
      },
      ...this.getBasicOptions({ general }),
    };
    return options;
  }
}
