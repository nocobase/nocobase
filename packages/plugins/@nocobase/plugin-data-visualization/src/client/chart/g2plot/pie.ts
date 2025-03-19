/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { G2PlotChart } from './g2plot';
// import { Pie as G2Pie } from '@ant-design/plots';
import { ChartType, RenderProps } from '../chart';

import { lazy } from '@nocobase/client';
const { Pie: G2Pie } = lazy(() => import('@ant-design/plots'), 'Pie');

export class Pie extends G2PlotChart {
  constructor() {
    super({ name: 'pie', title: 'Pie', Component: G2Pie });
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
    const angleField = general.angleField;
    const angleFieldProps: any = fieldProps[angleField] || {};
    const hasMinus = data.some((item: any) => item[angleField] < 0);
    if (hasMinus) {
      const min = Math.min(...data.map((item: any) => item[angleField]));
      data = data.map((item: any) => ({
        ...item,
        [angleField]: item[angleField] - min,
      }));
      const transformer = angleFieldProps.transformer;
      angleFieldProps.transformer = (value: number) => {
        const v = value + min;
        return transformer ? transformer(v) : v;
      };
    }
    const props = super.getProps({ data, general, advanced, fieldProps });
    const defaultTooltip = {
      items: [
        (data: any) => {
          const { [general.colorField]: color, [angleField]: angle } = data;
          const name = color || angleFieldProps?.label || angleField;
          const transformer = angleFieldProps?.transformer;
          return { name, value: transformer ? transformer(angle) : angle };
        },
      ],
    };
    return {
      ...props,
      tooltip: advanced.tooltip || defaultTooltip,
    };
  }
}
