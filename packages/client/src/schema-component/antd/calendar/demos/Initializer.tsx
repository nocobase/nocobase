import { observer, useFieldSchema } from '@formily/react';
import { SchemaInitializer, useCollection, useDesignable } from '@nocobase/client';
import { Switch } from 'antd';
import React from 'react';

export const AddActionButton = observer((props: any) => {
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
            {
              type: 'item',
              title: '标题',
              component: InitializeAction,
              schema: {
                title: '标题',
                'x-component': 'Calendar.Title',
                'x-action': `calendar:title`,
                'x-align': 'left',
              },
            },
            {
              type: 'item',
              title: '切换视图',
              component: InitializeAction,
              schema: {
                title: '切换视图',
                'x-component': 'Calendar.ViewSelect',
                'x-action': `calendar:viewSelect`,
                'x-align': 'left',
              },
            },
            {
              type: 'item',
              title: '添加',
              component: InitializeAction,
              schema: {
                title: '添加',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                },
                'x-action': `action`,
                'x-align': 'right',
                properties: {
                  modal: {
                    'x-component': 'Action.Drawer',
                    type: 'void',
                    title: 'Drawer Title',
                    properties: {
                      form: {
                        type: 'object',
                        'x-component': 'Form',
                        properties: {
                          id: {
                            'x-component': 'Input',
                            'x-decorator': 'FormItem',
                            title: 'ID',
                          },
                          title: {
                            'x-component': 'Input',
                            'x-decorator': 'FormItem',
                            title: 'Title',
                          },
                          start: {
                            'x-component': 'DatePicker',
                            'x-decorator': 'FormItem',
                            title: 'Start',
                          },
                          end: {
                            'x-component': 'DatePicker',
                            'x-decorator': 'FormItem',
                            title: 'End',
                          },
                        },
                      },
                      footer: {
                        'x-component': 'Action.Drawer.Footer',
                        type: 'void',
                        properties: {
                          ok: {
                            title: 'submit',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ useOkAction }}',
                              type: 'primary',
                            },
                          },
                          close: {
                            title: 'Close',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ useCloseAction }}',
                            },
                          },
                        },
                      },
                    },
                  },
                },
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
