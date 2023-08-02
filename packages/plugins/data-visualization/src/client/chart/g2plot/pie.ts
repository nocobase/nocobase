import { ISchema } from '@formily/react';
import { G2PlotChart } from './g2plot';
import { Pie as G2Pie } from '@ant-design/plots';
import { FieldOption } from '../../hooks';
import { QueryProps } from '../../renderer';

export class Pie extends G2PlotChart {
  schema: ISchema = {
    type: 'object',
    properties: {
      angleField: {
        title: '{{t("angleField")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-reactions': '{{ useChartFields }}',
        required: true,
      },
      colorField: {
        title: '{{t("colorField")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-reactions': '{{ useChartFields }}',
        required: true,
      },
    },
  };

  constructor() {
    super('pie', 'Pie Chart', G2Pie);
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
    const { xField, yField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        colorField: xField?.value,
        angleField: yField?.value,
      },
    };
  }
}
