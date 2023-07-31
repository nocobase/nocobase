import { ISchema } from '@formily/react';
import { G2PlotChart } from './g2plot';
import { RenderProps } from '../chart';
import React from 'react';
import { DualAxes as G2DualAxes } from '@ant-design/plots';

export class DualAxes extends G2PlotChart {
  schema: ISchema = {
    type: 'object',
    properties: {
      xField: {
        title: '{{t("xField")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-reactions': '{{ useChartFields }}',
        required: true,
      },
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
  };

  constructor() {
    super('dualAxes', 'Dual Axes Chart', G2DualAxes);
  }

  render({ data, general, advanced, fieldProps }: RenderProps) {
    const props = this.getProps({ data, general, advanced, fieldProps });
    const { data: _data } = props;
    return () =>
      React.createElement(this.component, {
        ...this.getProps({ data, general, advanced, fieldProps }),
        data: [_data, _data],
      });
  }
}
