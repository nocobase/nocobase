import { Chart, RenderProps } from '../chart';
import { FieldOption } from '../../hooks';
import { QueryProps } from '../../renderer';
import { ISchema } from '@formily/react';

export class G2PlotChart extends Chart {
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
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-reactions': '{{ useChartFields }}',
        required: true,
      },
      seriesField: {
        title: '{{t("seriesField")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-reactions': '{{ useChartFields }}',
      },
    },
  };

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
          obj[key] = value.map((v) => (v.includes('.') ? replace(v) : v));
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
      link: `https://g2plot.antv.antgroup.com/api/plots/${this.name}`,
    };
  }
}
