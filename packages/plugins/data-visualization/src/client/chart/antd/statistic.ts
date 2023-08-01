import { ISchema } from '@formily/react';
import { AntdChart } from './antd';
import { Statistic as AntdStatistic } from 'antd';
import { lang } from '../../locale';
import { FieldOption } from '../../hooks';
import { QueryProps } from '../../renderer';
import { RenderProps } from '../chart';

export class Statistic extends AntdChart {
  schema: ISchema = {
    type: 'object',
    properties: {
      field: {
        title: lang('Field'),
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-reactions': '{{ useChartFields }}',
        required: true,
      },
      title: {
        title: lang('Title'),
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
    },
  };

  constructor() {
    super('statistic', 'Statistic', AntdStatistic);
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
    const { yField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        field: yField?.value,
        title: yField?.label,
      },
    };
  }

  getProps({ data, fieldProps, general, advanced }: RenderProps) {
    const record = data[0] || {};
    const field = general?.field;
    const props = fieldProps[field];
    return {
      value: record[field],
      formatter: props?.transformer,
      ...general,
      ...advanced,
    };
  }
}
