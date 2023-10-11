import { RenderProps } from '@nocobase/plugin-data-visualization/client';
import { ECharts } from './echarts';

export class Bar extends ECharts {
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
