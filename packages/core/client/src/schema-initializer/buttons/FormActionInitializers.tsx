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
              skipValidator: false,
              overwriteValues: {},
              onSuccess: {
                successMessage: '{{t("Submitted successfully")}}',
              },
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
              skipValidator: false,
              overwriteValues: {},
              onSuccess: {
                successMessage: '{{t("Submitted successfully")}}',
              },
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
              skipValidator: false,
              overwriteValues: {},
              onSuccess: {},
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
              skipValidator: false,
              overwriteValues: {},
              onSuccess: {},
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
              skipValidator: false,
              overwriteValues: {},
              onSuccess: {},
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
              skipValidator: false,
              overwriteValues: {},
              onSuccess: {},
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
