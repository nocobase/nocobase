import { G2PlotChart } from './g2plot';
import { Pie as G2Pie } from '@ant-design/plots';
import { ChartType, RenderProps } from '../chart';

export class Pie extends G2PlotChart {
  constructor() {
    super({ name: 'pie', title: 'Pie Chart', Component: G2Pie });
    this.config = [
      {
        property: 'field',
        name: 'angleField',
        title: 'angleField',
        required: true,
      },
      {
        property: 'field',
        name: 'colorField',
        title: 'colorField',
        required: true,
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
    const angleFieldProps = fieldProps[general.angleField];
    const props = super.getProps({ data, general, advanced, fieldProps });
    return {
      ...props,
      tooltip: {
        items: [
          (data: any) => {
            const { [general.colorField]: color, [general.angleField]: angle } = data;
            const name = color || angleFieldProps?.label || general.angleField;
            const transformer = angleFieldProps?.transformer;
            return { name, value: transformer ? transformer(angle) : angle };
          },
        ],
      },
    };
  }
}
