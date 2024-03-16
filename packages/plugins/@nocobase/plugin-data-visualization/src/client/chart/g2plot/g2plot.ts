import { transform } from 'lodash';
import { Chart, ChartProps, ChartType, RenderProps } from '../chart';
import configs from './configs';

export class G2PlotChart extends Chart {
  constructor({ name, title, component, config }: ChartProps) {
    super({
      name,
      title,
      component,
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
    const meta = {};
    // Some charts render wrong when the field name contains a dot in G2Plot
    const replace = (key: string) => key.replace(/\./g, '_');
    general = Object.entries(general).reduce((obj, [key, value]) => {
      obj[key] = value;
      if (key.includes('Field')) {
        if (Array.isArray(value)) {
          obj[key] = value.map((v) => (v?.includes('.') ? replace(v) : v));
        } else if (typeof value === 'string' && value.includes('.')) {
          obj[key] = replace(value);
        }
      }
      return obj;
    }, {});
    const config = {
      legend: {
        color: {
          itemLabelText: (datnum) => {
            const props = fieldProps[datnum.label];
            const transformer = props?.transformer;
            return props?.label || (transformer ? transformer(datnum.label) : datnum.label);
          },
        },
      },
      tooltip: (d, index, data, column) => {
        const field = column.y.field;
        const props = fieldProps[field];
        const name = props?.label || field;
        const transformer = props?.transformer;
        const value = column.y.value[index];
        return { name, value: transformer ? transformer(value) : value };
      },
      axis: {
        x: {
          labelFormatter: (datnum) => {
            const props = fieldProps[general.xField];
            const transformer = props?.transformer;
            return transformer ? transformer(datnum) : datnum;
          },
        },
        y: {
          labelFormatter: (datnum) => {
            const props = fieldProps[general.yField];
            const transformer = props?.transformer;
            return transformer ? transformer(datnum) : datnum;
          },
        },
      },
      data: data.map((item) => {
        const obj = {};
        Object.entries(item).forEach(([key, value]) => {
          if (key.includes('.')) {
            key = replace(key);
          }
          obj[key] = value;
        });
        return obj;
      }),
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
      link: `https://g2plot.antv.antgroup.com/api/plots/${this.name}`,
    };
  }
}
