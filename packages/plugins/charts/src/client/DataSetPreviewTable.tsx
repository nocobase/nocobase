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
import { useFieldsById } from './hooks';

export default ({ queryId, fields }: { queryId: number, fields }) => {
  const { dataSet, loading, error } = useGetDataSet(queryId);
  const columns = {};
  if (fields) {
    for (const field of fields) {
      columns[field.name] = {
        type: 'void',
        title: field.name,
        'x-component': 'Table.Column',
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
  return (
    <SchemaComponentProvider scope={{ dataSet }} components={{ Table, Input, FormItem }}>
      <BlockSchemaComponentProvider>
        <SchemaComponent schema={schema} />
      </BlockSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
