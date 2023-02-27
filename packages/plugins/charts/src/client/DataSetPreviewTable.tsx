import { ISchema } from '@formily/react';
import {
  BlockSchemaComponentProvider,
  FormItem,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  Table,
} from '@nocobase/client';
import React from 'react';
import { uid } from '@formily/shared';
import { useGetDataSet } from './ChartBlockEngine';
import { Empty, Spin } from 'antd';

export default ({ queryId }: { queryId: number }) => {
  const { dataSet, loading, error } = useGetDataSet(queryId);
  const columns = {};
  console.log(dataSet);
  if (dataSet) {
    const dataKeys = Object.keys(dataSet[0]);
    for (const dataKey of dataKeys) {
      columns[dataKey] = {
        type: 'void',
        title: dataKey,
        'x-component': 'Table.Column',
        properties: {
          [dataKey]: {
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
        type: 'void',
        'x-component': 'Table.Void',
        'x-component-props': {
          rowKey: 'id',
          dataSource: '{{dataSet}}',
          scroll: { y: 300 },
        },
        properties: columns,
      },
    },
  };

  if (error) {
    return (
      <>
        <Empty description={<span>May be this query has been deleted,please check!</span>} />
      </>
    );
  }

  if (loading)
    return (
      <>
        <Spin />
      </>
    );
  return (
    <SchemaComponentProvider scope={{ dataSet }} components={{ Table, Input, FormItem }}>
      <BlockSchemaComponentProvider>
        <SchemaComponent schema={schema} />
      </BlockSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
