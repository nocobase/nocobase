import { ISchema, observer, useField, useFieldSchema } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  APIClientProvider,
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentProvider
} from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';
import { apiClient } from './apiClient';

const schema: ISchema = {
  type: 'object',
  properties: {
    block1: {
      type: 'void',
      'x-decorator': 'CollectionProvider',
      'x-decorator-props': {
        name: 'posts',
      },
      'x-component': 'ResourceActionProvider',
      'x-component-props': {
        request: {
          resource: 'posts',
          action: 'list',
          params: {
            pageSize: 5,
            filter: {},
            sort: [],
            appends: [],
          },
        },
      },
      properties: {
        settings: {
          'x-component': 'SimpleSettingsForm',
        },
        table1: {
          type: 'void',
          'x-uid': 'input',
          'x-component': 'VoidTable',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
            useDataSource: '{{ useDataSourceFromRAC }}',
          },
          properties: {
            column1: {
              type: 'void',
              // title: 'ID',
              'x-decorator': 'TableColumnDecorator',
              'x-component': 'VoidTable.Column',
              properties: {
                id: {
                  type: 'number',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              // title: 'Name',
              'x-decorator': 'TableColumnDecorator',
              'x-component': 'VoidTable.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column3: {
              type: 'void',
              // title: 'Name',
              'x-decorator': 'TableColumnDecorator',
              'x-component': 'VoidTable.Column',
              properties: {
                date: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column4: {
              type: 'void',
              // title: 'Name',
              'x-decorator': 'TableColumnDecorator',
              'x-component': 'VoidTable.Column',
              properties: {
                createdBy: {
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
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
          // default: [
          //   { id: 1, name: 'name1' },
          //   { id: 2, name: 'name2' },
          // ],
          'x-decorator': 'FormItem',
          'x-component': 'RecordPicker',
        },
      },
    ],
  },
];

const SimpleSettingsForm = observer(() => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  return (
    <div>
      <Button
        onClick={() => {
          fieldSchema.parent['x-component-props']['request']['params']['pageSize'] = 20;
          field.query('.').take((f) => {
            f.componentProps.request.params.pageSize = 20;
          });
        }}
      >
        Edit
      </Button>
      <br />
      <br />
    </div>
  );
});

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider>
        <AntdSchemaComponentProvider>
          <CollectionManagerProvider collections={collections}>
            <SchemaComponent schema={schema} components={{ SimpleSettingsForm }} />
          </CollectionManagerProvider>
        </AntdSchemaComponentProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
