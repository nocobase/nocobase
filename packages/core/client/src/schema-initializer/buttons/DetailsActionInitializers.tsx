import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';

// 表单的操作配置
export const detailsActionInitializers = new SchemaInitializer({
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
  ],
});
