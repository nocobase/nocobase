import { ISchema } from '@formily/react';
import { FormItem, Input, SchemaComponent, SchemaComponentProvider, Table } from '@nocobase/client';
import React from 'react';
import { uid } from '@formily/shared';

interface DataSetPreviewProps {
  dataSet: null | object[];
}

export default ({ dataSet }: DataSetPreviewProps) => {
  const columns = {};
  if (dataSet) {
    const dataKeys = Object.keys(dataSet[0]);
  /*  dataSet.map((dataItem)=>{
      dataItem["data_set_preview_cus_id"]=uid()
    })*/
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
  return (
    <SchemaComponentProvider scope={{ dataSet }} components={{ Table, Input ,FormItem}}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
