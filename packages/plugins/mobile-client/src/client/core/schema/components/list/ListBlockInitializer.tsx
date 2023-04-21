import React from 'react';
import { TableOutlined } from '@ant-design/icons';
import { DataBlockInitializer, useCollectionManager } from '@nocobase/client';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { css } from '@emotion/css';

export const createListBlockSchema = (options) => {
  const {
    formItemInitializers = 'ReadPrettyFormItemInitializers',
    actionInitializers = 'MListActionInitializers',
    collection,
    association,
    resource,
    template,
    ...others
  } = options;
  const resourceName = resource || association || collection;
  const schema: ISchema = {
    type: 'array',
    'x-acl-action': `${resourceName}:view`,
    'x-decorator': 'MList.Decorator',
    'x-decorator-props': {
      resource: resourceName,
      collection,
      association,
      readPretty: true,
      action: 'list',
      params: {
        pageSize: 10,
      },
      requestOptions: {
        manual: true,
      },
      // useParams: '{{ useParamsFromRecord }}',
      ...others,
    },
    'x-designer': 'MList.Designer',
    'x-component': 'MList',
    'x-component-props': {
      useProps: '{{ useListBlockProps }}',
    },
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'CardItem',
        properties: {
          [uid()]: {
            type: 'object',
            'x-component': 'MList.Item',
            'x-read-pretty': true,
            'x-component-props': {
              useProps: '{{ useListItemBlockProps }}',
            },
            properties: {
              grid: template || {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': formItemInitializers,
                properties: {},
              },
              actionBar: {
                type: 'void',
                'x-initializer': actionInitializers,
                'x-component': 'ActionBar',
                'x-component-props': {
                  useProps: '{{ useListItemActionProps }}',
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
export const MListBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'List'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createListBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
          actionInitializers: collection.template !== 'view' && 'DetailsActionInitializers',
        });
        insert(schema);
      }}
    />
  );
};
