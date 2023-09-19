import { Chart, ChartProps, RenderProps } from '../chart';
import { FieldOption } from '../../hooks';
import { QueryProps } from '../../renderer';
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

  init(
    fields: FieldOption[],
    {
      measures,
      dimensions,
    }: {
      measures?: QueryProps['measures'];
      dimensions?: QueryProps['dimensions'];
    },
  ): {
    general?: any;
    advanced?: any;
  } {
    const { xField, yField, seriesField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: xField?.value,
        yField: yField?.value,
        seriesField: seriesField?.value,
      },
    };
  }

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const meta = {};
    // Some charts render wrong when the field name contains a dot in G2Plot
    const replace = (key: string) => key.replace(/\./g, '_');
    Object.entries(fieldProps).forEach(([key, props]) => {
      if (key.includes('.')) {
        key = replace(key);
      }
      meta[key] = {
        formatter: props.transformer,
        alias: props.label,
      };
    });
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
    return {
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
      meta,
      animation: false,
      ...general,
      ...advanced,
    };
  }

  getReference() {
    return {
      title: this.title,
      link: `https://charts.ant.design/api/plots/${this.name}`,
    };
  }
}
