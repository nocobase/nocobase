// 表单的操作配置
export const DetailsActionInitializers = {
  'data-testid': 'configure-actions-button-of-details-block',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Edit")}}',
          component: 'UpdateActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
            'x-component-props': {
              type: 'primary',
            },
          },
        },
        {
          type: 'item',
          title: '{{t("Delete")}}',
          component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
          },
        },
        {
          type: 'item',
          title: '{{t("Duplicate")}}',
          component: 'DuplicateActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-action': 'duplicate',
            'x-decorator': 'ACLActionProvider',
            'x-component-props': {
              type: 'primary',
            },
          },
        },
      ],
    },
  ],
};
