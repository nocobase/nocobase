// 弹窗表单的操作配置
export const PopupFormActionInitializers = {
  title: "{{t('Configure actions')}}",
  items: [
    {
      type: 'itemGroup',
      title: "{{t('Enable actions')}}",
      children: [
        {
          type: 'item',
          title: "{{t('Submit')}}",
          component: 'ActionInitializer',
          schema: {
            title: '{{ t("Submit") }}',
            'x-action': 'submit',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-component-props': {
              type: 'primary',
              useAction: '{{ cm.useCreateAction }}',
            },
          },
        },
        {
          type: 'item',
          title: "{{t('Cancel')}}",
          component: 'ActionInitializer',
          schema: {
            title: '{{ t("Cancel") }}',
            'x-action': 'cancel',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-component-props': {
              useAction: '{{ cm.useCancelAction }}',
            },
          },
        },
      ],
    },
  ],
};
