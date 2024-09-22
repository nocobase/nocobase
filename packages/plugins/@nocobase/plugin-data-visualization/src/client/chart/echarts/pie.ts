/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lang } from '../../locale';
import { ChartType, RenderProps } from '../chart';
import { EChart } from './echart';
import deepmerge from 'deepmerge';

export class Pie extends EChart {
  constructor() {
    super({
      name: 'pie',
      title: 'Pie Chart',
      series: { type: 'pie' },
    });
    this.config = [
      {
        settingType: 'field',
        name: 'angleField',
        title: 'angleField',
        required: true,
      },
      {
        settingType: 'field',
        name: 'colorField',
        title: 'colorField',
        required: true,
      },
      'size',
      'lightTheme',
      'darkTheme',
      'showLegend',
      {
        settingType: 'select',
        name: 'labelType',
        title: 'Label type',
        defaultValue: 1,
        options: [
          { label: 'Category name', value: 1 },
          { label: 'Value', value: 2 },
          { label: 'Percentage', value: 3 },
          { label: 'Category name + Value', value: 4 },
          { label: 'Category name + Percentage', value: 5 },
          { label: 'Value + Percentage', value: 6 },
          { label: 'Category name + Value + Percentage', value: 7 },
          { label: 'Hidden', value: 0 },
        ],
      },
      {
        settingType: 'boolean',
        name: 'showLabelLine',
        title: 'Show label line',
        defaultValue: true,
      },
      {
        settingType: 'select',
        name: 'labelPosition',
        title: 'Label position',
        defaultValue: 'outside',
        options: [
          { label: 'Outside', value: 'outside' },
          { label: 'Inside', value: 'inside' },
          { label: 'Inner', value: 'inner' },
          { label: 'Center', value: 'center' },
        ],
      },
      {
        innerRadius: {
          title: lang('Inner radis'),
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': 'Slider',
          'x-component-props': {
            min: 0,
            max: 100,
          },
        },
      },
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
      size,
      lightTheme,
      darkTheme,
      showLegend,
      labelType,
      labelPosition,
      showLabelLine,
      innerRadius,
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
        formatter = `{b} {@${angleField}} {d}%`;
        break;
    }
    return deepmerge(
      {
        legend: {
          show: showLegend,
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
            show: showLabel,
            formatter,
            position: labelPosition,
          },
          labelLine: {
            show: showLabelLine,
          },
          radius: [Math.round(innerRadius * 0.75) + '%', '75%'],
          ...this.series,
        },
        animation: false,
        size,
        lightTheme,
        darkTheme,
      },
      advanced,
    );
  }
}
