// 表单的操作配置
export const ReadPrettyFormActionInitializers = {
  title: '{{t("Configure actions")}}',
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
          },
        },
        {
          type: 'item',
          title: '{{t("Delete")}}',
          component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action',
          },
        },
      ],
    },
  ],
};
