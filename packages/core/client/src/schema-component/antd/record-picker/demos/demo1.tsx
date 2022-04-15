/**
 * title: 勾选
 */
import { FormItem } from '@formily/antd';
import { ISchema } from '@formily/react';
import { Action, Input, RecordPicker, SchemaComponent, SchemaComponentProvider, Table } from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    input: {
      type: 'array',
      title: `编辑模式`,
      default: [
        { id: 1, name: 'name1' },
        { id: 2, name: 'name2' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'RecordPicker',
      'x-component-props': {
        mode: 'tags',
        fieldNames: {
          label: 'name',
          value: 'id',
        },
      },
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
      properties: {
        options: {
          'x-component': 'RecordPicker.Options',
          type: 'void',
          title: 'Drawer Title',
          properties: {
            input: {
              type: 'array',
              title: `编辑模式`,
              'x-component': 'Table.RowSelection',
              'x-component-props': {
                rowKey: 'id',
                objectValue: true,
                rowSelection: {
                  type: 'checkbox',
                },
                dataSource: [
                  { id: 1, name: 'Name1' },
                  { id: 2, name: 'Name2' },
                  { id: 3, name: 'Name3' },
                ],
              },
              properties: {
                column1: {
                  type: 'void',
                  title: 'Name',
                  'x-component': 'Table.Column',
                  properties: {
                    name: {
                      type: 'string',
                      'x-component': 'Input',
                      'x-read-pretty': true,
                    },
                  },
                },
              },
            },
          },
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
    <SchemaComponentProvider components={{ Table, Input, RecordPicker, FormItem, Action }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
