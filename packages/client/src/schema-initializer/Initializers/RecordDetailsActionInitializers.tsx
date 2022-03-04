// 普通表单的操作配置
export const RecordDetailsActionInitializers = {
  style: {
    marginLeft: 8,
  },
  title: '{{t("Configure actions")}}',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Edit")}}',
          component: 'ActionInitializer',
          schema: {
            title: '{{t("Edit")}}',
            type: 'void',
            'x-action': 'update',
            'x-designer': 'Action.Designer',
            'x-component': 'Action',
            'x-component-props': {
              type: 'primary',
            },
            properties: {
              drawer: {
                type: 'void',
                'x-decorator': 'Form',
                'x-decorator-props': {
                  useValues: '{{ cm.useValuesFromRA }}',
                },
                'x-component': 'Action.Drawer',
                title: '{{ t("Edit record") }}',
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'GridFormItemInitializers',
                    properties: {},
                  },
                  footer: {
                    type: 'void',
                    'x-component': 'Action.Drawer.Footer',
                    properties: {
                      actions: {
                        type: 'void',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          layout: 'one-column',
                        },
                        properties: {
                          cancel: {
                            title: '{{ t("Cancel") }}',
                            'x-action': 'cancel',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ cm.useCancelAction }}',
                            },
                          },
                          submit: {
                            title: '{{ t("Submit") }}',
                            'x-action': 'submit',
                            'x-component': 'Action',
                            'x-component-props': {
                              type: 'primary',
                              useAction: '{{ cm.useUpdateAction }}',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  ],
};
