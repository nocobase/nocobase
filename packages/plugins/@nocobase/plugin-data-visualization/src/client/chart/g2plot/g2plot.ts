import { Chart, ChartProps, ChartType, RenderProps } from '../chart';
import configs from './configs';
import { getAntChart } from './AntChart';

export class G2PlotChart extends Chart {
  constructor({ name, title, Component, config }: ChartProps) {
    super({
      name,
      title,
      Component: getAntChart(Component),
      config: ['xField', 'yField', 'seriesField', ...(config || [])],
    });
    this.addConfigs(configs);
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField, seriesField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: xField?.value,
        yField: yField?.value,
        seriesField: seriesField?.value,
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const config = {
      legend: {
        color: {
          itemLabelText: (datnum: { label: string }) => {
            const props = fieldProps[general.seriesField];
            const transformer = props?.transformer;
            return transformer ? transformer(datnum.label) : datnum.label;
          },
        },
      },
      tooltip: (d, index: number, data, column: any) => {
        const field = column.y?.field;
        const props = fieldProps[field];
        const name = props?.label || field;
        const transformer = props?.transformer;
        const value = column.y?.value[index];
        return { name, value: transformer ? transformer(value) : value };
      },
      axis: {
        x: {
          labelFormatter: (datnum: any) => {
            const props = fieldProps[general.xField];
            const transformer = props?.transformer;
            return transformer ? transformer(datnum) : datnum;
          },
        },
        y: {
          labelFormatter: (datnum: any) => {
            const props = fieldProps[general.yField];
            const transformer = props?.transformer;
            return transformer ? transformer(datnum) : datnum;
          },
        },
      },
      data,
      theme: 'classic',
      animate: {
        enter: {
          type: false,
        },
        update: {
          type: false,
        },
        exit: {
          type: false,
        },
      },
      colorField: general.seriesField,
      stack: general.isStack,
      percent: general.isPercent ? true : undefined,
      ...(general.smooth ? { shapeField: 'smooth' } : {}),
      ...general,
      seriesField: general.isGroup ? general.seriesField : undefined,
      ...advanced,
    };
    return config;
  }

  getReference() {
    return {
      title: this.title,
      link: `https://ant-design-charts-next.antgroup.com/examples#statistics-${this.name}`,
    };
  }
}
