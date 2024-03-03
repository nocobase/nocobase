import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export const createMapBlockSchema = (options) => {
  const { collection, resource, fieldNames, settings, ...others } = options;
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
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': settings,
    'x-component': 'CardItem',
    // 保存当前筛选区块所能过滤的数据区块
    'x-filter-targets': [],
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
                        'x-initializer': 'RecordBlockInitializers',
                        properties: {},
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
  return schema;
};

export const findNestedOption = (value: string[] | string, options = []) => {
  if (typeof value === 'string') {
    value = [value];
  }
  return value?.reduce((cur, v, index) => {
    const matched = cur?.find((item) => item.value === v);
    return index === value.length - 1 ? matched : matched?.children;
  }, options);
};
