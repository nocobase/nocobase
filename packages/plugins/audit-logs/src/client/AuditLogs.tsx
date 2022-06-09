import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { AuditLogsDesigner } from './AuditLogsDesigner';

const schema: ISchema = {
  type: 'void',
  'x-content': 'Audit logs',
};

export const createTableBlockSchema = (options) => {
  const { collection, resource, rowKey, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'TableBlockProvider',
    // 'x-acl-action': `${resource || collection}:list`,
    'x-decorator-props': {
      collection,
      resource: resource || collection,
      action: 'list',
      params: {
        pageSize: 20,
      },
      rowKey,
      showIndex: true,
      dragSort: false,
      ...others,
    },
    'x-designer': 'TableBlockDesigner',
    'x-component': 'CardItem',
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'TableActionInitializers',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 16,
          },
        },
        properties: {},
      },
      [uid()]: {
        type: 'array',
        'x-initializer': 'TableColumnInitializers',
        'x-component': 'TableV2',
        'x-component-props': {
          rowKey: 'id',
          rowSelection: {
            type: 'checkbox',
          },
          useProps: '{{ useTableBlockProps }}',
        },
        properties: {
          actions: {
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-action-column': 'actions',
            'x-decorator': 'TableV2.Column.ActionBar',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.ActionColumnDesigner',
            'x-initializer': 'TableActionColumnInitializers',
            properties: {
              actions: {
                type: 'void',
                'x-decorator': 'DndContext',
                'x-component': 'Space',
                'x-component-props': {
                  split: '|',
                },
                properties: {},
              },
            },
          },
        },
      },
    },
  };
  console.log(JSON.stringify(schema, null, 2));
  return schema;
};

export const AuditLogs: any = () => {
  return <div>Audit logs</div>
  return <SchemaComponent schema={schema} />;
};

AuditLogs.Designer = AuditLogsDesigner;
