import { TableOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import React from 'react';
import { SchemaInitializer } from '../..';
import { useSchemaTemplateManager } from '../../../schema-templates';
import { useCollectionDataSourceItems } from '../utils';

export const createTableBlockSchema = (collectionName) => {
  const schema: ISchema = {
    type: 'void',
    'x-collection': 'collections',
    'x-decorator': 'ResourceActionProvider',
    'x-decorator-props': {
      collection: collectionName,
      dragSort: false,
      request: {
        resource: collectionName,
        action: 'list',
        params: {
          pageSize: 20,
          filter: {},
          // sort: ['sort'],
          appends: [],
        },
      },
    },
    'x-designer': 'Table.Void.Designer',
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
      table: {
        type: 'void',
        'x-component': 'Table.Void',
        'x-component-props': {
          rowKey: 'id',
          rowSelection: {
            type: 'checkbox',
          },
          useAction: '{{cm.useMoveAction}}',
          useDataSource: '{{cm.useDataSourceFromRAC}}',
        },
        'x-initializer': 'TableColumnInitializers',
        properties: {
          actions: {
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-decorator': 'Table.Column.ActionBar',
            'x-component': 'Table.Column',
            'x-designer': 'Table.RowActionDesigner',
            'x-initializer': 'TableRecordActionInitializers',
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
  return schema;
};

export const TableBlockInitializer = (props) => {
  const { insert } = props;
  const { copyTemplateSchema } = useSchemaTemplateManager();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={async ({ item }) => {
        if (item.template) {
          if (item.mode === 'copy') {
            const schema = await copyTemplateSchema(item.template);
            insert(schema);
          } else if (item.mode === 'reference') {
            insert({
              type: 'void',
              'x-component': 'BlockTemplate',
              'x-component-props': {
                templateId: item.template.key,
              },
            });
          }
        } else {
          insert(createTableBlockSchema(item.name));
        }
      }}
      items={useCollectionDataSourceItems()}
    />
  );
};
