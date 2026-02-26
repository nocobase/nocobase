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

export class Pie extends EChart {
  constructor() {
    super({
      name: 'pie',
      title: 'Pie',
      series: { type: 'pie' },
    });
    this.config = [
      {
        configType: 'field',
        name: 'angleField',
        title: 'angleField',
        required: true,
      },
      {
        configType: 'field',
        name: 'colorField',
        title: 'colorField',
        required: true,
      },
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
        configType: 'boolean',
        name: 'showLabelLine',
        title: lang('Show label line'),
        defaultValue: true,
      },
      {
        configType: 'select',
        name: 'labelPosition',
        title: lang('Label position'),
        defaultValue: 'outside',
        options: [
          { label: lang('Outside'), value: 'outside' },
          { label: lang('Inside'), value: 'inside' },
          { label: lang('Center'), value: 'center' },
        ],
      },
      {
        outterRadius: {
          title: lang('Outter radius'),
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': 'Slider',
          default: 100,
          'x-component-props': {
            min: 0,
            max: 100,
          },
        },
      },
      {
        innerRadius: {
          title: lang('Inner radius'),
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': 'Slider',
          'x-component-props': {
            min: 0,
            max: 100,
          },
        },
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
      'colors',
    ];
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        colorField: xField?.value,
        angleField: yField?.value,
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const {
      colorField,
      angleField,
      labelType,
      labelPosition,
      showLabelLine,
      innerRadius = 0,
      outterRadius = 100,
      colors,
      center,
    } = general;
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
        formatter = `{@${angleField}}`;
        break;
      case 3:
        formatter = '{d}%';
        break;
      case 4:
        formatter = `{b} {@${angleField}}`;
        break;
      case 5:
        formatter = '{b} {d}%';
        break;
      case 6:
        formatter = `{@${angleField}} {d}%`;
        break;
      case 7:
        formatter = `{b}\n{@${angleField}} {d}%`;
        break;
    }
    const { horizontal, vertical } = center || {};
    const options: any = {
      legend: {
        ...this.getLegendOptions(general),
      },
      tooltip: {},
      dataset: [
        {
          dimensions: [colorField, angleField],
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
        name: fieldProps[angleField]?.label,
        datasetIndex: 1,
        label: {
          show: labelPosition === 'center' ? false : showLabel,
          formatter,
          position: labelPosition,
        },
        emphasis: {
          label: {
            show: true,
          },
        },
        labelLine: {
          show: showLabelLine,
        },
        radius: [Math.round(innerRadius * 0.75) + '%', Math.round(outterRadius * 0.75) + '%'],
        center: [horizontal || '50%', vertical || '50%'],
        ...this.series,
      },
      ...this.getBasicOptions({ general }),
    };
    const color = colors?.filter((color: string) => color) || [];
    if (color.length) {
      options.color = color;
    }
    return options;
  }
}
