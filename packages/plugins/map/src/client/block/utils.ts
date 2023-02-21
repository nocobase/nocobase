import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export const createMapBlockSchema = (options) => {
  const { collection, resource, fieldNames, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resource || collection}:list`,
    'x-decorator': 'MapBlockProvider',
    'x-decorator-props': {
      collection: collection,
      resource: resource || collection,
      action: 'list',
      fieldNames,
      params: {
        paginate: false,
      },
      ...others,
    },
    'x-designer': 'MapBlockDesigner',
    'x-component': 'CardItem',
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'MapActionInitializers',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 16,
          },
        },
        properties: {},
      },
      [uid()]: {
        type: 'void',
        'x-component': 'MapBlock',
        'x-component-props': {
          useProps: '{{ useMapBlockProps }}',
        },
      },
    },
  };
  console.log(JSON.stringify(schema, null, 2));
  return schema;
};
