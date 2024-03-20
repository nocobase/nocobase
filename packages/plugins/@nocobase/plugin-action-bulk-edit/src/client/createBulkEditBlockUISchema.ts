import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

/**
 * 创建批量编辑表单的 UI Schema
 * @returns
 */
export function createBulkEditBlockUISchema(options: {
  collectionName: string;
  dataSource: string;
  association?: string;
}): ISchema {
  const { collectionName, association, dataSource } = options;
  const resourceName = association || collectionName;

  if (!collectionName || !dataSource) {
    throw new Error('collectionName and dataSource are required');
  }

  const schema: ISchema = {
    type: 'void',
    'x-acl-action-props': {
      skipScopeCheck: true,
    },
    'x-acl-action': `${resourceName}:create`,
    'x-decorator': 'FormBlockProvider',
    'x-decorator-props': {
      dataSource,
      collection: collectionName,
      association,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:createForm',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-component-props': {
          useProps: '{{ useCreateFormBlockProps }}',
        },
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'bulkEditForm:configureFields',
            properties: {},
          },
          [uid()]: {
            type: 'void',
            'x-initializer': 'bulkEditForm:configureActions',
            'x-component': 'ActionBar',
            'x-component-props': {
              layout: 'one-column',
              style: {
                marginTop: 24,
              },
            },
          },
        },
      },
    },
  };
  return schema;
}
