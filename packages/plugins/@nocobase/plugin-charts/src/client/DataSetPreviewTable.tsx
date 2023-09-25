import { ISchema } from '@formily/react';
import { FormItem, Input, SchemaComponent, SchemaComponentProvider, TableV2 } from '@nocobase/client';
import { Empty, Spin } from 'antd';
import React from 'react';
import { useGetDataSet } from './ChartBlockEngine';

export default ({ queryId, fields }: { queryId: number; fields }) => {
  const { dataSet, loading, error } = useGetDataSet(queryId);
  const columns = {};
  if (fields) {
    for (const field of fields) {
      columns[field.name] = {
        type: 'void',
        title: field.name,
        'x-component': 'TableV2.Column',
        'x-component-props': {
          // width: 200,
        },
        properties: {
          [field.name]: {
            type: 'string',
            'x-component': 'Input',
            'x-read-pretty': true,
          },
        },
      };
    }
  }
  const schema: ISchema = {
    type: 'void',
    properties: {
      input: {
        type: 'array',
        'x-component': 'TableV2',
        'x-component-props': {
          scroll: { y: 300 },
        },
        default: dataSet,
        properties: columns,
      },
    },
  };

  if (error) {
    return (
      <>
        <Empty description={<span>May be this chart block's query data has been deleted,please check!</span>} />
      </>
    );
  }

  if (loading)
    return (
      <>
        <Spin />
      </>
    );
  //对dataset中引用类型数据类型进行序列化处理
  dataSet.forEach((item) => {
    for (const key in item) {
      if (item[key] && item[key] instanceof Object) {
        item[key] = JSON.stringify(item[key]);
      }
    }
  });
  return (
    <SchemaComponentProvider scope={{ dataSet }} components={{ TableV2, Input, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
