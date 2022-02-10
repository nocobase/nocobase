import { observer } from '@formily/react';
import React from 'react';
import { SchemaInitializer } from '../../../schema-initializer';

const useTableColumnInitializerFields = () => {
  const fields = [
    {
      title: 'Field1',
      name: 'field1',
      component: ArrayTableColumnInitializer,
    },
    {
      title: 'Field2',
      name: 'field2',
      component: ArrayTableColumnInitializer,
    },
  ].filter((field) => field.component);
  return fields;
};

export const TableColumnInitializeButton = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      items={[
        {
          type: 'item',
          title: 'Display fields',
          children: useTableColumnInitializerFields(),
        },
      ]}
    >
      Configure columns
    </SchemaInitializer.Button>
  );
});

export const ArrayTableColumnInitializer = SchemaInitializer.itemWrap((props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={() => {
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
    />
  );
});
