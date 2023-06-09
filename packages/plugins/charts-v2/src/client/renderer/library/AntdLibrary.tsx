import { Charts, usePropsFunc } from '../ChartLibrary';
import { Statistic } from 'antd';

export const AntdLibrary: Charts = {
  statistic: {
    name: 'Statistic',
    component: Statistic,
    schema: {
      type: 'object',
      properties: {
        title: {
          title: 'Title',
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
  },
};

export const useAntdProps: usePropsFunc = ({ data, meta, general, advanced }) => {
  let formatter: (val: any) => any;
  const fieldMeta = Object.values(meta)[0];
  if (fieldMeta && fieldMeta.formatter) {
    formatter = fieldMeta.formatter;
  }
  const value = Object.values(data[0] || {})[0];
  return {
    value,
    formatter,
    ...general,
    ...advanced,
  };
};
