/**
 * title: 勾选
 */
import React from 'react';
import { SchemaComponentProvider, SchemaComponent, RecordPicker, Action } from '@nocobase/client';
import { FormItem } from '@formily/antd';
import { ISchema } from '@formily/react';

const schema: ISchema = {
  type: 'object',
  properties: {
    input: {
      type: 'array',
      title: `编辑模式`,
      default: [
        { id: 1, name: 'tag1' },
        { id: 2, name: 'tag2' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'RecordPicker',
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
      properties: {
        rowSelection: {
          'x-component': 'RecordPicker.RowSelection',
        },
      },
    },
    read: {
      type: 'array',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'RecordPicker',
      properties: {
        item: {
          'x-component': 'RecordPicker.SelectedItem',
          properties: {
            drawer1: {
              'x-component': 'Action.Drawer',
              type: 'void',
              title: 'Drawer Title',
              properties: {
                hello1: {
                  'x-content': 'Hello',
                  title: 'T1',
                },
                footer1: {
                  'x-component': 'Action.Drawer.Footer',
                  type: 'void',
                  properties: {
                    close1: {
                      type: 'void',
                      title: 'Close',
                      'x-component': 'Action',
                      'x-component-props': {
                        // useAction: '{{ useCloseAction }}',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ RecordPicker, FormItem, Action }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
