import { observer, useFieldSchema } from '@formily/react';
import React from 'react';
import { SchemaInitializer } from '../../../schema-initializer';

const useTableColumnInitializerFields = () => {
  const fieldSchema = useFieldSchema();
  const fields = [
    {
      key: 'field1',
      title: 'Field1',
      component: fieldSchema['x-column-initializer'],
    },
    {
      key: 'field2',
      title: 'Field2',
      component: fieldSchema['x-column-initializer'],
    },
  ].filter((field) => field.component);
  return fields;
};

export const TableColumnInitializeButton = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={(schema) => schema}
      insertPosition={'beforeEnd'}
      items={[
        {
          title: 'Display fields',
          children: useTableColumnInitializerFields(),
        },
      ]}
    >
      Configure columns
    </SchemaInitializer.Button>
  );
});

export const ArrayTableColumnInitializer = (props) => {
  const { title, insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={(info) => {
        insert({
          type: 'void',
          title: 'Name',
          'x-component': 'ArrayTable.Column',
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
        });
      }}
    >
      {title}
    </SchemaInitializer.Item>
  );
};
