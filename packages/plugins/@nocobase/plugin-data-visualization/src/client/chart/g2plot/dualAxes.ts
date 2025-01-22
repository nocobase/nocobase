/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { G2PlotChart } from './g2plot';
import { ChartType, RenderProps } from '../chart';
import { DualAxes as G2DualAxes } from '@ant-design/plots';
import lodash from 'lodash';

export class DualAxes extends G2PlotChart {
  constructor() {
    super({ name: 'dualAxes', title: 'Dual axes', Component: G2DualAxes });
    this.config = [
      'xField',
      {
        yField: {
          title: '{{t("yField")}}',
          type: 'array',
          'x-decorator': 'FormItem',
          'x-component': 'ArrayItems',
          items: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              sort: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.SortHandle',
              },
              input: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                'x-reactions': '{{ useChartFields }}',
                'x-component-props': {
                  style: {
                    minWidth: '200px',
                  },
                },
                required: true,
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
          properties: {
            add: {
              type: 'void',
              title: '{{t("Add")}}',
              'x-component': 'ArrayItems.Addition',
            },
          },
        },
      },
      'size',
    ];
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yFields } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: xField?.value,
        yField: yFields?.map((f) => f.value) || [],
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const props = super.getProps({ data, general, advanced, fieldProps });
    return {
      ...lodash.omit(props, ['legend', 'tooltip', 'yField']),
      children:
        props.yField?.map((yField: string, index: number) => {
          return {
            type: 'line',
            yField,
            tooltip: {
              items: [
                (data: any) => {
                  const { [yField]: y } = data;
                  const yFieldProps = fieldProps[yField];
                  const name = yFieldProps?.label || yField;
                  const value = yFieldProps?.transformer ? yFieldProps.transformer(y) : y;
                  return {
                    name,
                    value,
                  };
                },
              ],
            },
            colorField: () => {
              const props = fieldProps[yField];
              return props?.label || yField;
            },
            axis: {
              y: {
                title: fieldProps[yField]?.label || yField,
                position: index === 0 ? 'left' : 'right',
                labelFormatter: (datnum) => {
                  const props = fieldProps[yField];
                  const transformer = props?.transformer;
                  return transformer ? transformer(datnum) : datnum;
                },
              },
            },
          };
        }) || [],
    };
  }
}
