// 表单的操作配置
export const FormActionInitializers = {
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Submit")}}',
          component: 'CreateSubmitActionInitializer',
          schema: {
            'x-action-settings': {
              initialValues: {},
            },
          },
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Save action")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Save") }}',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              initialValues: {},
            },
            'x-component-props': {
              useProps: '{{ useCreateActionProps }}',
            },
          },
        },
      ],
    },
  ],
};

export const CreateFormActionInitializers = {
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Submit")}}',
          component: 'CreateSubmitActionInitializer',
          schema: {
            'x-action-settings': {
              overwriteValues: {},
            },
          },
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Save action")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Save") }}',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              overwriteValues: {},
            },
            'x-component-props': {
              useProps: '{{ useCreateActionProps }}',
            },
          },
        },
      ],
    },
  ],
};

export const UpdateFormActionInitializers = {
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Submit")}}',
          component: 'UpdateSubmitActionInitializer',
          schema: {
            'x-action-settings': {
              overwriteValues: {},
            },
          },
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Save action")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Save") }}',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              overwriteValues: {},
            },
            'x-component-props': {
              useProps: '{{ useUpdateActionProps }}',
            },
          },
        },
      ],
    },
  ],
};
