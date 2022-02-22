import { TableOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { useCollectionManager } from '../../../collection-manager';

const createSchema = (collectionName) => {
  const schema: ISchema = {
    type: 'void',
    'x-collection': 'collections',
    'x-decorator': 'ResourceActionProvider',
    'x-decorator-props': {
      collection: collectionName,
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
    'x-designer': 'VoidTable.Designer',
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
        'x-component': 'VoidTable',
        'x-component-props': {
          rowKey: 'id',
          rowSelection: {
            type: 'checkbox',
          },
          useDataSource: '{{ cm.useDataSourceFromRAC }}',
        },
        'x-initializer': 'TableColumnInitializers',
        properties: {
          actions: {
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-decorator': 'TableColumnActionBar',
            'x-component': 'VoidTable.Column',
            'x-designer': 'TableRecordActionDesigner',
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
  const { collections } = useCollectionManager();
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={({ item }) => {
        insert(createSchema(item.name));
      }}
      items={[
        {
          type: 'itemGroup',
          title: t('Select data source'),
          children: collections?.map((item) => {
            return {
              type: 'item',
              name: item.name,
              title: item.title,
            };
          }),
        },
      ]}
    />
  );
};
