// 表单的操作配置
export const FilterFormActionInitializers = {
  'data-testid': 'configure-actions-button-of-filter-form',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Filter")}}',
          component: 'CreateFilterActionInitializer',
          schema: {
            'x-action-settings': {},
          },
        },
        {
          type: 'item',
          title: '{{t("Reset")}}',
          component: 'CreateResetActionInitializer',
          schema: {
            'x-action-settings': {},
          },
        },
      ],
    },
  ],
};
