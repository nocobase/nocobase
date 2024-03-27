import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export function createDetailsUISchema(options: {
  dataSource: string;
  collectionName?: string;
  association?: string;
  templateSchema?: ISchema;
}): ISchema {
  const { collectionName, dataSource, association, templateSchema } = options;
  const resourceName = association || collectionName;

  if (!dataSource) {
    throw new Error('dataSource are required');
  }

  return {
    type: 'void',
    'x-acl-action': `${resourceName}:get`,
    'x-decorator': 'DetailsBlockProvider',
    'x-use-decorator-props': 'useDetailsDecoratorProps',
    'x-decorator-props': {
      dataSource,
      collection: collectionName,
      association,
      readPretty: true,
      action: 'get',
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:details',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Details',
        'x-read-pretty': true,
        'x-use-component-props': 'useDetailsProps',
        properties: {
          [uid()]: {
            type: 'void',
            'x-initializer': 'details:configureActions',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            properties: {},
          },
          grid: templateSchema || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'details:configureFields',
            properties: {},
          },
        },
      },
    },
  };
}
