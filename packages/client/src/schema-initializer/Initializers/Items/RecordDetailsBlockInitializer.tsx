import { FormOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { useCollection } from '../../../collection-manager';

const createSchema = (collectionName) => {
  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'ResourceActionProvider',
    'x-decorator-props': {
      collection: collectionName,
      request: {
        resource: collectionName,
        action: 'get',
        params: {},
      },
    },
    'x-designer': 'Form.Designer',
    'x-component': 'CardItem',
    properties: {
      form: {
        type: 'void',
        'x-decorator': 'Form',
        'x-decorator-props': {
          useValues: '{{ cm.useValuesFromRA }}',
        },
        properties: {
          actions: {
            type: 'void',
            'x-initializer': 'RecordDetailsActionInitializers',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            properties: {},
          },
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-read-pretty': true,
            'x-initializer': 'GridFormItemInitializers',
            properties: {},
          },
        },
      },
    },
  };
  return schema;
};

export const RecordDetailsBlockInitializer = (props) => {
  const { insert } = props;
  const { name } = useCollection();
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<FormOutlined />}
      onClick={({ item }) => {
        insert(createSchema(name));
      }}
    />
  );
};
