import { TableOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { clone } from '@formily/shared';
import React from 'react';
import { SchemaInitializer } from '../..';
import { CollectionOptions, useCollectionManager } from '../../../collection-manager';

const collection: CollectionOptions = {
  name: 'collections',
  filterTargetKey: 'name',
  targetKey: 'name',
  fields: [
    {
      type: 'integer',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '数据表名称',
        type: 'number',
        required: true,
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '数据表标识',
        type: 'string',
        description: '使用英文',
        'x-component': 'Input',
      },
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fields',
      collectionName: 'collections',
      sourceKey: 'name',
      targetKey: 'name',
      uiSchema: {},
    },
  ],
};

export const collectionSchema: ISchema = {
  type: 'void',
  'x-collection': 'collections',
  'x-component': 'CardItem',
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    collection,
    request: {
      resource: 'collections',
      action: 'list',
      params: {
        pageSize: 5,
        filter: {},
        sort: ['sort'],
        appends: [],
      },
    },
  },
  properties: {
    actions: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-action-initializer': 'TableActionInitializer',
      properties: {},
    },
    table1: {
      type: 'void',
      'x-component': 'VoidTable',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        useDataSource: '{{ useDataSourceFromRAC }}',
      },
      'x-column-initializer': 'TableColumnInitializer',
      properties: {
        actions: {
          type: 'void',
          title: 'Actions',
          'x-decorator': 'TableColumnActionBar',
          'x-component': 'VoidTable.Column',
          'x-action-initializer': 'TableColumnActionInitializer',
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

const itemWrap = SchemaInitializer.itemWrap;

export const TableBlockInitializerItem = itemWrap((props) => {
  const { insert } = props;
  const { collections } = useCollectionManager();

  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      onClick={() => {
        insert(clone(collectionSchema));
      }}
      items={[
        {
          type: 'itemGroup',
          title: 'select a data source',
          children: collections?.map((item) => {
            return {
              type: 'item',
              name: item.name,
              title: item.title,
            };
          }),
        },
      ]}
    >
      Table
    </SchemaInitializer.Item>
  );
});
