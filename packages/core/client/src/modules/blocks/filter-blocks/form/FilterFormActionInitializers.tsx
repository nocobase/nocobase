import { CompatibleSchemaInitializer } from '../../../../application';
import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';

/**
 * @deprecated
 * 表单的操作配置
 */
export const filterFormActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'FilterFormActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      name: 'enableActions',
      children: [
        {
          name: 'filter',
          title: '{{t("Filter")}}',
          Component: 'CreateFilterActionInitializer',
          schema: {
            'x-action-settings': {},
          },
        },
        {
          name: 'reset',
          title: '{{t("Reset")}}',
          Component: 'CreateResetActionInitializer',
          schema: {
            'x-action-settings': {},
          },
        },
      ],
    },
  ],
});

export const filterFormActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'actionInitializers:filterForm',
    title: '{{t("Configure actions")}}',
    icon: 'SettingOutlined',
    items: [
      {
        type: 'itemGroup',
        title: '{{t("Enable actions")}}',
        name: 'enableActions',
        children: [
          {
            name: 'filter',
            title: '{{t("Filter")}}',
            Component: 'CreateFilterActionInitializer',
            schema: {
              'x-action-settings': {},
            },
          },
          {
            name: 'reset',
            title: '{{t("Reset")}}',
            Component: 'CreateResetActionInitializer',
            schema: {
              'x-action-settings': {},
            },
          },
        ],
      },
    ],
  },
  filterFormActionInitializers_deprecated,
);
