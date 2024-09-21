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
        property: 'yField',
        title: 'xField',
      },
      {
        property: 'xField',
        title: 'yField',
      },
      'seriesField',
      'size',
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
