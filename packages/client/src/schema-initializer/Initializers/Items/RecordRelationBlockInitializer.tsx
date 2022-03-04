import { FormOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { useCollectionManager } from '../../../collection-manager';
import { useRecord } from '../../../record-provider';

const createSchema = (field, record) => {
  const resourceOf = record[field.sourceKey || 'id'];
  const schema: ISchema = {
    type: 'void',
    'x-collection': 'collections',
    'x-decorator': 'ResourceActionProvider',
    'x-decorator-props': {
      collection: field.target,
      association: {
        name: field.name,
        targetKey: field.targetKey,
        sourceKey: field.sourceKey,
      },
      request: {
        resource: `${field.collectionName}.${field.name}`,
        // resourceOf,
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
          useDataSource: '{{ cm.useDataSourceFromRAC }}',
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

export const RecordRelationBlockInitializer = (props) => {
  const { insert } = props;
  const { collections } = useCollectionManager();
  const { t } = useTranslation();
  const record = useRecord();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<FormOutlined />}
      onClick={({ item }) => {
        insert(createSchema(item.field, record));
      }}
    />
  );
};
