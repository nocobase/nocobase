import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export const createMapBlockUISchema = (options: {
  collectionName: string;
  dataSource: string;
  fieldNames: object;
}): ISchema => {
  const { collectionName, fieldNames, dataSource } = options;

  return {
    type: 'void',
    'x-acl-action': `${collectionName}:list`,
    'x-decorator': 'MapBlockProvider',
    'x-decorator-props': {
      collection: collectionName,
      dataSource,
      action: 'list',
      fieldNames,
      params: {
        paginate: false,
      },
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:map',
    'x-component': 'CardItem',
    // 保存当前筛选区块所能过滤的数据区块
    'x-filter-targets': [],
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'map:configureActions',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 16,
          },
        },
      },
      [uid()]: {
        type: 'void',
        'x-component': 'MapBlock',
        'x-use-component-props': 'useMapBlockProps',
        properties: {
          drawer: {
            type: 'void',
            'x-component': 'Action.Drawer',
            'x-component-props': {
              className: 'nb-action-popup',
            },
            title: '{{ t("View record") }}',
            properties: {
              tabs: {
                type: 'void',
                'x-component': 'Tabs',
                'x-component-props': {},
                'x-initializer': 'TabPaneInitializers',
                properties: {
                  tab1: {
                    type: 'void',
                    title: '{{t("Details")}}',
                    'x-component': 'Tabs.TabPane',
                    'x-designer': 'Tabs.Designer',
                    'x-component-props': {},
                    properties: {
                      grid: {
                        type: 'void',
                        'x-component': 'Grid',
                        'x-initializer': 'popup:common:addBlock',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};
