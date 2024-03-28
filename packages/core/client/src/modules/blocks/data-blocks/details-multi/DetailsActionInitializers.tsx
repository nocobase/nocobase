import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';

/**
 * @deprecated
 * 表单的操作配置
 */
export const detailsActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'DetailsActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      name: 'enableActions',
      children: [
        {
          name: 'edit',
          title: '{{t("Edit")}}',
          Component: 'UpdateActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
            'x-component-props': {
              type: 'primary',
            },
          },
        },
        {
          name: 'delete',
          title: '{{t("Delete")}}',
          Component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      type: 'subMenu',
      name: 'customize',
      title: '{{t("Customize")}}',
      children: [],
    },
  ],
});

/**
 * @deprecated
 * 已弃用，请使用 readPrettyFormActionInitializers 代替
 */
export const detailsActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'detailsWithPaging:configureActions',
    title: '{{t("Configure actions")}}',
    icon: 'SettingOutlined',
    style: {
      marginLeft: 8,
    },
    items: [
      {
        type: 'itemGroup',
        title: '{{t("Enable actions")}}',
        name: 'enableActions',
        children: [
          {
            name: 'edit',
            title: '{{t("Edit")}}',
            Component: 'UpdateActionInitializer',
            schema: {
              'x-component': 'Action',
              'x-decorator': 'ACLActionProvider',
              'x-component-props': {
                type: 'primary',
              },
            },
          },
          {
            name: 'delete',
            title: '{{t("Delete")}}',
            Component: 'DestroyActionInitializer',
            schema: {
              'x-component': 'Action',
              'x-decorator': 'ACLActionProvider',
            },
          },
        ],
      },
    ],
  },
  detailsActionInitializers_deprecated,
);
