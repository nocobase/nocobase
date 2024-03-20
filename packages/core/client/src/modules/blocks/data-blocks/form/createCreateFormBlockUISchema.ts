import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

/**
 * 创建新增表单的 UI Schema
 * @returns
 */
export function createCreateFormBlockUISchema(options: {
  collectionName: string;
  dataSource: string;
  association?: string;
  templateSchema?: ISchema;
  isCusomeizeCreate?: boolean;
}): ISchema {
  const { collectionName, association, dataSource, templateSchema, isCusomeizeCreate } = options;
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
    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
    'x-decorator-props': {
      dataSource,
      collection: collectionName,
      association,
      isCusomeizeCreate,
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
          grid: templateSchema || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'form:configureFields',
            properties: {},
          },
          [uid()]: {
            type: 'void',
            'x-initializer': 'createForm:configureActions',
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
