/**
 * title: 勾选
 */
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  AntdSchemaComponentProvider,
  APIClientProvider,
  CollectionField,
  CollectionProvider,
  SchemaComponent,
  SchemaComponentProvider,
  useCollection
} from '@nocobase/client';
import React, { useEffect } from 'react';
import { useDesignable } from '../../..';
import { apiClient } from './apiClient';

const schema: ISchema = {
  type: 'object',
  properties: {
    block1: {
      type: 'void',
      'x-decorator': 'CollectionBlock',
      properties: {
        table1: {
          type: 'void',
          'x-uid': 'input',
          'x-component': 'VoidTable',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
            pagination: {
              current: 2,
              pageSize: 2,
            },
            request: {
              resource: 'posts',
              action: 'list',
              params: {
                filter: {},
                // pageSize: 5,
              },
            },
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
          },
        },
      },
    },
  },
};

const useColumnSchema = () => {
  const { getField } = useCollection();
  const columnSchema = useFieldSchema();
  const fieldSchema = columnSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'CollectionField') {
      return s;
    }
    return buf;
  }, null);
  if (!fieldSchema) {
    return;
  }
  const collectionField = getField(fieldSchema.name);
  return { columnSchema, fieldSchema, collectionField };
};

const TableColumnDecorator = (props) => {
  const field = useField();
  const { columnSchema, fieldSchema, collectionField } = useColumnSchema();
  const { refresh } = useDesignable();
  useEffect(() => {
    if (field.title) {
      return;
    }
    if (!fieldSchema) {
      return;
    }
    if (collectionField?.uiSchema?.title) {
      field.title = collectionField?.uiSchema?.title;
    }
  }, []);
  return (
    <>
      {props.children}
      <div
        onClick={() => {
          field.title = uid();
          columnSchema.title = field.title = field.title;
          refresh();
          field.query(`.*.${fieldSchema.name}`).take((f) => {
            f.componentProps.dateFormat = 'YYYY-MM-DD';
          });
        }}
      >
        Edit
      </div>
    </>
  );
};

const CollectionBlock = (props) => {
  return (
    <CollectionProvider
      collection={{
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
        ],
      }}
    >
      {props.children}
    </CollectionProvider>
  );
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider components={{ TableColumnDecorator, CollectionBlock, CollectionField }}>
        <AntdSchemaComponentProvider>
          <SchemaComponent schema={schema} />
        </AntdSchemaComponentProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
