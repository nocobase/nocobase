// 表单的操作配置
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
          component: 'SubmitActionInitializer',
        },
      ],
    },
  ],
};
