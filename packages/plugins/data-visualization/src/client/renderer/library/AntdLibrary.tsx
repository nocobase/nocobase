import { Statistic, Table } from 'antd';
import { lang } from '../../locale';
import { Charts, infer } from '../ChartLibrary';

export const AntdLibrary: Charts = {
  statistic: {
    name: lang('Statistic'),
    component: Statistic,
    schema: {
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
    },
    init: (fields, { measures, dimensions }) => {
      const { yField } = infer(fields, { measures, dimensions });
      return {
        general: {
          field: yField?.value,
          title: yField?.label,
        },
      };
    },
    useProps: ({ data, fieldProps, general, advanced }) => {
      const record = data[0] || {};
      const field = general?.field;
      const props = fieldProps[field];
      return {
        value: record[field],
        formatter: props?.transformer,
        ...general,
        ...advanced,
      };
    },
    reference: {
      title: lang('Statistic'),
      link: 'https://ant.design/components/statistic/',
    },
  },
  table: {
    name: lang('Table'),
    component: Table,
    useProps: ({ data, fieldProps, general, advanced }) => {
      const columns = data.length
        ? Object.keys(data[0]).map((item) => ({
            title: fieldProps[item]?.label || item,
            dataIndex: item,
            key: item,
          }))
        : [];
      const dataSource = data.map((item: any) => {
        Object.keys(item).map((key: string) => {
          const props = fieldProps[key];
          if (props?.transformer) {
            item[key] = props.transformer(item[key]);
          }
        });
        return item;
      });
      return {
        dataSource,
        columns,
        ...general,
        ...advanced,
      };
    },
    reference: {
      title: lang('Table'),
      link: 'https://ant.design/components/table/',
    },
  },
};
