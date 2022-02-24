// 普通表单的操作配置
export const FormActionInitializers = {
  title: '{{t("Configure actions")}}',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Submit")}}',
          component: 'ActionInitializer',
          schema: {
            title: '{{t("Submit")}}',
            'x-action': 'submit',
            'x-align': 'left',
            'x-component': 'Action',
            'x-component-props': {
              type: 'primary',
              useAction: '{{ cm.useCreateActionWithoutRefresh }}',
            },
          },
        },
      ],
    },
  ],
};
