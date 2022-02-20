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
        'x-action-initializer': 'TableActionInitializer',
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
        'x-column-initializer': 'TableColumnInitializer',
        properties: {
          actions: {
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-decorator': 'TableColumnActionBar',
            'x-component': 'VoidTable.Column',
            'x-designer': 'TableRecordActionDesigner',
            'x-action-initializer': 'TableRecordActionInitializer',
            properties: {
              actions: {
                type: 'void',
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

const itemWrap = SchemaInitializer.itemWrap;

export const TableBlock = itemWrap((props) => {
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
});
