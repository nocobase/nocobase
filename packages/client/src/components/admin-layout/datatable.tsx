import { SchemaRenderer } from '../../';
import React from 'react';
import { FormItem } from '@formily/antd';
import { useCollectionContext } from '../../schemas';
import { action } from '@formily/reactive';

const useAsyncDataSource = (service: any) => (field: any) => {
  field.loading = true;
  service(field).then(
    action((data: any) => {
      field.dataSource = data;
      field.loading = false;
    }),
  );
};

export default () => {
  const { data, loading } = useCollectionContext();

  const loadCollections = async (field: any) => {
    return data.map((item: any) => ({
      label: item.title,
      value: item.name,
    }));
  };

  const schema = {
    type: 'array',
    name: 'collections',
    'x-component': 'DatabaseCollection',
    'x-component-props': {},
    default: [],
    properties: {
      title: {
        type: 'string',
        title: '数据表名称',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      name: {
        type: 'string',
        title: '数据表标识',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
      fields: {
        type: 'array',
        title: '数据表字段',
        'x-decorator': 'FormItem',
        'x-component': 'DatabaseField',
        default: [],
      },
    },
  };
  return (
    <SchemaRenderer
      scope={{ loadCollections, useAsyncDataSource }}
      components={{ FormItem }}
      schema={schema}
    />
  );
};
