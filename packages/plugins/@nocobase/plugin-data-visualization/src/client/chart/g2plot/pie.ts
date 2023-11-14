import { G2PlotChart } from './g2plot';
import { Pie as G2Pie } from '@ant-design/plots';
import { ChartType } from '../chart';

export class Pie extends G2PlotChart {
  constructor() {
    super({ name: 'pie', title: 'Pie Chart', component: G2Pie });
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
}
