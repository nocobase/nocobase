import { ISchema } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  ExtendCollectionsProvider,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    block1: {
      type: 'void',
      'x-decorator': 'CollectionProvider_deprecated',
      'x-decorator-props': {
        name: 'posts',
      },
      properties: {
        createdBy: {
          'x-component': 'CollectionField',
          'x-read-pretty': true,
          properties: {
            rowSelection: {
              'x-component': 'RowSelection',
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
                  'x-component': 'RowSelection.Column',
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
    },
  },
};

const collections = [
  {
    name: 'posts',
    fields: [
      {
        type: 'integer',
        name: 'id',
        interface: 'input',
        uiSchema: {
          title: 'ID1',
          type: 'number',
          'x-component': 'InputNumber',
          required: true,
          description: 'description1',
        } as ISchema,
      },
      {
        type: 'string',
        name: 'name',
        interface: 'input',
        uiSchema: {
          title: 'Name1',
          type: 'string',
          'x-component': 'Input',
          required: true,
          description: 'description1',
        } as ISchema,
      },
      {
        type: 'string',
        name: 'date',
        interface: 'datetime',
        uiSchema: {
          type: 'boolean',
          title: `Date1`,
          'x-read-pretty': true,
          'x-decorator': 'FormItem',
          'x-component': 'DatePicker',
          'x-component-props': {
            dateFormat: 'YYYY/MM/DD',
            // showTime: true,
          },
        },
      },
      {
        type: 'belongsToMany',
        name: 'createdBy',
        target: 'users',
        foreignKey: 'createdById',
        uiSchema: {
          type: 'array',
          title: `创建人`,
          default: [
            { id: 1, name: 'name1' },
            { id: 2, name: 'name2' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'RecordPicker',
        },
      },
    ],
  },
];

export default () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <ExtendCollectionsProvider collections={collections}>
          <SchemaComponent schema={schema} />
        </ExtendCollectionsProvider>
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
