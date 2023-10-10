import { G2PlotChart } from './g2plot';
import { ChartType, RenderProps } from '../chart';
import React from 'react';
import { DualAxes as G2DualAxes } from '@ant-design/plots';

export class DualAxes extends G2PlotChart {
  constructor() {
    super({ name: 'dualAxes', title: 'Dual Axes Chart', component: G2DualAxes });
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
    ];
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yFields } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: xField?.value,
        yField: yFields?.map((f) => f.value).slice(0, 2) || [],
      },
    };
  };

  render({ data, general, advanced, fieldProps }: RenderProps) {
    const props = this.getProps({ data, general, advanced, fieldProps });
    const { data: _data } = props;
    return () =>
      React.createElement(this.component, {
        ...props,
        data: [_data, _data],
      });
  }
}
