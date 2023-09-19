import { FieldOption } from '../../hooks';
import { QueryProps } from '../../renderer';
import { Bar as G2PlotBar } from '@ant-design/plots';
import { G2PlotChart } from './g2plot';

export class Bar extends G2PlotChart {
  constructor() {
    super({ name: 'bar', title: 'Bar Chart', component: G2PlotBar, config: ['isGroup', 'isStack', 'isPercent'] });
  }

  init(
    fields: FieldOption[],
    {
      measures,
      dimensions,
    }: {
      measures?: QueryProps['measures'];
      dimensions?: QueryProps['dimensions'];
    },
  ) {
    const { xField, yField, seriesField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: yField?.value,
        yField: xField?.value,
        seriesField: seriesField?.value,
      },
    };
  }
}
