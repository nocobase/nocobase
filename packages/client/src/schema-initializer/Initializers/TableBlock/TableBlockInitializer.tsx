import { TableOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import React from 'react';
import { SchemaInitializer } from '../..';
import { useSchemaTemplateManager } from '../../../schema-templates';
import { useCollectionDataSourceItems } from '../utils';

export const createTableBlockSchema = (collectionName) => {
  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'TableBlockProvider',
    'x-decorator-props': {
      collection: collectionName,
      resource: collectionName,
      action: 'list',
      params: {
        pageSize: 20,
      },
      rowKey: 'id',
      showIndex: true,
      dragSort: false,
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
      table: {
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
            'x-decorator': 'TableV2.Column.ActionBar',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.RowActionDesigner',
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
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(createTableBlockSchema(item.name));
        }
      }}
      items={useCollectionDataSourceItems('Table')}
    />
  );
};
