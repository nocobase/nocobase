/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RenderProps } from '../chart';
import { EChart } from './echart';

export class Bar extends EChart {
  constructor() {
    super({
      name: 'bar',
      title: 'Bar Chart',
      series: { type: 'bar' },
    });
    this.config = [
      {
        settingType: 'field',
        name: 'yField',
        title: 'xField',
        required: true,
      },
      {
        settingType: 'field',
        name: 'xField',
        title: 'yField',
        required: true,
      },
      'seriesField',
      'size',
      'lightTheme',
      'darkTheme',
      'showLegend',
      'labelType',
      {
        settingType: 'select',
        name: 'labelPosition',
        title: 'Label position',
        defaultValue: 'right',
        options: [
          { label: 'Right', value: 'right' },
          { label: 'Inside', value: 'inside' },
          { label: 'Inside right', value: 'insideRight' },
        ],
      },
      'isStack',
    ];
  }

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const props = super.getProps({ data, general, advanced, fieldProps });
    const xLabel = fieldProps[general.xField]?.label;
    const yLabel = fieldProps[general.yField]?.label;
    props.xAxis = {
      ...props.xAxis,
      type: 'value',
      name: yLabel,
    };
    props.yAxis = {
      ...props.yAxis,
      type: 'category',
      name: xLabel,
    };
    return props;
  }
}
