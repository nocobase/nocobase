import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export function createDetailsBlockWithoutPagingUISchema(options: {
  collectionName: string;
  dataSource: string;
  association?: string;
  templateSchema?: ISchema;
}): ISchema {
  const { collectionName, dataSource, association, templateSchema } = options;
  const resourceName = association || collectionName;

  if (!collectionName || !dataSource) {
    throw new Error('collectionName and dataSource are required');
  }

  return {
    type: 'void',
    'x-acl-action': `${resourceName}:get`,
    'x-decorator': 'DetailsBlockProvider',
    'x-use-decorator-props': 'useDetailsBlockWithoutPagingDecoratorProps',
    'x-decorator-props': {
      dataSource,
      collection: collectionName,
      association,
      readPretty: true,
      action: 'get',
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:singleDataDetails',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Details',
        'x-read-pretty': true,
        'x-component-props': {
          useProps: '{{ useDetailsBlockWithoutPagingProps }}',
        },
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
