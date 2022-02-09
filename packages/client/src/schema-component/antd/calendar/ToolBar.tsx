import { observer, useFieldSchema } from '@formily/react';
import { useCollection } from '@nocobase/client';
import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../../../schema-initializer';
import { SchemaComponent } from '../../core';
import { useDesignable } from '../../hooks';
import { Action, ActionBar } from '../action';

export const ToolBar = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  debugger;
  return (
    <SchemaComponent
      components={{ ActionBar, Action, AddActionButton }}
      schema={{
        type: 'void',
        name: 'actionBar',
        'x-component': 'ActionBar',
        'x-action-initializer': 'AddActionButton',
        properties: { ...fieldSchema.properties },
      }}
    />
  );
});

const AddActionButton = observer((props: any) => {
  const { name: collectName } = useCollection();
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      style={{ marginLeft: 8 }}
      items={[
        {
          type: 'itemGroup',
          title: '启用操作',
          children: [
            {
              type: 'item',
              title: '今天',
              component: InitializeAction,
              schema: {
                title: '今天',
                'x-component': 'Calendar.Today',
                'x-action': `calendar:today`,
                'x-align': 'left',
              },
            },
            {
              type: 'item',
              title: '翻页',
              component: InitializeAction,
              schema: {
                title: '翻页',
                'x-component': 'Calendar.Nav',
                'x-action': `calendar:nav`,
                'x-align': 'left',
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

const useCurrentActionSchema = (action: string) => {
  const fieldSchema = useFieldSchema();
  const { remove } = useDesignable();
  const schema: any = fieldSchema.reduceProperties((buf, s) => {
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
  debugger;
  const { exists, remove } = useCurrentActionSchema(item.schema['x-action']);
  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          type: 'void',
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
