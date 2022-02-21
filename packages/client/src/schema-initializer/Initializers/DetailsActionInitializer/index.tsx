import { observer, useFieldSchema } from '@formily/react';
import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../..';
import { useDesignable } from '../../../schema-component';

const useCurrentActionSchema = (action: string) => {
  const fieldSchema = useFieldSchema();
  const { remove } = useDesignable();
  const schema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-action'] === action) {
      return s;
    }
    return buf;
  });
  return {
    schema,
    exists: !!schema,
    remove() {
      schema && remove(schema);
    },
  };
};

const InitializeAction = SchemaInitializer.itemWrap((props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentActionSchema(item.schema['x-action']);
  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          type: 'void',
          'x-designer': 'TestDesigner',
          'x-component': 'Action',
          ...item.schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
});

export const DetailsActionInitializer = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      style={{ marginLeft: 8 }}
      items={[
        {
          type: 'itemGroup',
          title: 'Enable actions',
          children: [
            {
              type: 'item',
              title: 'Edit',
              component: InitializeAction,
              schema: {
                title: 'Edit',
                'x-action': 'update',
              },
            },
            {
              type: 'item',
              title: 'Delete',
              component: InitializeAction,
              schema: {
                title: 'Delete',
                'x-action': 'delete',
              },
            },
          ],
        },
      ]}
    >
      Configure actions
    </SchemaInitializer.Button>
  );
});
