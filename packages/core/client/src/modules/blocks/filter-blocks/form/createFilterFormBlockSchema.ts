import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export const createFilterFormBlockSchema = (options: {
  collectionName: string;
  dataSource: string;
  templateSchema?: ISchema;
}) => {
  const { collectionName, dataSource, templateSchema } = options;

  if (!collectionName || !dataSource) {
    throw new Error('collectionName and dataSource are required');
  }

  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'FilterFormBlockProvider',
    'x-use-decorator-props': 'useFilterFormBlockDecoratorProps',
    'x-decorator-props': {
      dataSource,
      collection: collectionName,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:filterForm',
    'x-component': 'CardItem',
    // 保存当前筛选区块所能过滤的数据区块
    'x-filter-targets': [],
    // 用于存储用户设置的每个字段的运算符，目前仅筛选表单区块支持自定义
    'x-filter-operators': {},
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-use-component-props': 'useFilterFormBlockProps',
        properties: {
          grid: templateSchema || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'filterForm:configureFields',
          },
          [uid()]: {
            type: 'void',
            'x-initializer': 'filterForm:configureActions',
            'x-component': 'ActionBar',
            'x-component-props': {
              layout: 'one-column',
              style: {
                float: 'right',
              },
            },
          },
        },
      },
    },
  };
  return schema;
};
