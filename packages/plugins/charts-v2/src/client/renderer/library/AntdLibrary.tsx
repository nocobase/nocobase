import { Statistic, Table } from 'antd';
import { lang } from '../../locale';
import { Charts } from '../ChartLibrary';

export const AntdLibrary: Charts = {
  statistic: {
    name: lang('Statistic'),
    component: Statistic,
    schema: {
      type: 'object',
      properties: {
        title: {
          title: lang('Title'),
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
    useProps: ({ data, fieldProps, general, advanced }) => {
      const props = Object.values(fieldProps)[0];
      const value = Object.values(data[0] || {})[0];
      return {
        value,
        formatter: props.transformer,
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
