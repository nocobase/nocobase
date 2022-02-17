import { FormOutlined } from '@ant-design/icons';
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
        action: 'get',
        params: {},
      },
    },
    'x-component': 'CardItem',
    properties: {
      form: {
        type: 'void',
        'x-decorator': 'Form',
        'x-decorator-props': {},
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-item-initializer': 'FormItemInitializer',
            properties: {},
          },
          actions: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-action-initializer': 'FormActionInitializer',
            properties: {},
          },
        },
      },
    },
  };
  return schema;
};

const itemWrap = SchemaInitializer.itemWrap;

export const FormBlock = itemWrap((props) => {
  const { insert } = props;
  const { collections } = useCollectionManager();
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<FormOutlined />}
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
