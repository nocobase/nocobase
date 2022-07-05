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
            'x-action-settings': {},
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
          title: '{{t("Popup")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            type: 'void',
            title: '{{ t("Popup") }}',
            'x-action': 'customize:popup',
            'x-designer': 'Action.Designer',
            'x-component': 'Action',
            'x-component-props': {
              openMode: 'drawer',
            },
            properties: {
              drawer: {
                type: 'void',
                title: '{{ t("Popup") }}',
                'x-component': 'Action.Container',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '{{t("Details")}}',
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'RecordBlockInitializers',
                            properties: {},
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
        {
          type: 'item',
          title: '{{t("Save record")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Save record") }}',
            'x-action': 'customize:save',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-designer-props': {
              modalTip:
                '{{ t("When the button is clicked, the following fields will be assigned and saved together with the fields in the form. If there are overlapping fields, the value here will overwrite the value in the form.") }}',
            },
            'x-action-settings': {
              assignedValues: {},
              skipValidator: false,
              onSuccess: {
                manualClose: true,
                redirecting: false,
                successMessage: '{{t("Saved successfully")}}',
              },
            },
            'x-component-props': {
              useProps: '{{ useCreateActionProps }}',
            },
          },
        },
        {
          type: 'item',
          title: '{{t("Custom request")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Custom request") }}',
            'x-component': 'Action',
            'x-action': 'customize:form:request',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              requestSettings: {},
              skipValidator: false,
              onSuccess: {
                manualClose: false,
                redirecting: false,
                successMessage: '{{t("Request success")}}',
              },
            },
            'x-component-props': {
              useProps: '{{ useCustomizeRequestActionProps }}',
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
            'x-action-settings': {},
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
          title: '{{t("Popup")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            type: 'void',
            title: '{{ t("Popup") }}',
            'x-action': 'customize:popup',
            'x-designer': 'Action.Designer',
            'x-component': 'Action',
            'x-component-props': {
              openMode: 'drawer',
            },
            properties: {
              drawer: {
                type: 'void',
                title: '{{ t("Popup") }}',
                'x-component': 'Action.Container',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '{{t("Details")}}',
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'RecordBlockInitializers',
                            properties: {},
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
        {
          type: 'item',
          title: '{{t("Save record")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Save record") }}',
            'x-action': 'customize:save',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-designer-props': {
              modalTip:
                '{{ t("When the button is clicked, the following fields will be assigned and saved together with the fields in the form. If there are overlapping fields, the value here will overwrite the value in the form.") }}',
            },
            'x-action-settings': {
              assignedValues: {},
              skipValidator: false,
              onSuccess: {
                manualClose: true,
                redirecting: false,
                successMessage: '{{t("Saved successfully")}}',
              },
            },
            'x-component-props': {
              useProps: '{{ useCreateActionProps }}',
            },
          },
        },
        {
          type: 'item',
          title: '{{t("Custom request")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Custom request") }}',
            'x-component': 'Action',
            'x-action': 'customize:form:request',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              requestSettings: {},
              skipValidator: false,
              onSuccess: {
                manualClose: false,
                redirecting: false,
                successMessage: '{{t("Request success")}}',
              },
            },
            'x-component-props': {
              useProps: '{{ useCustomizeRequestActionProps }}',
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
            'x-action-settings': {},
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
          title: '{{t("Popup")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            type: 'void',
            title: '{{ t("Popup") }}',
            'x-action': 'customize:popup',
            'x-designer': 'Action.Designer',
            'x-component': 'Action',
            'x-component-props': {
              openMode: 'drawer',
            },
            properties: {
              drawer: {
                type: 'void',
                title: '{{ t("Popup") }}',
                'x-component': 'Action.Container',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '{{t("Details")}}',
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'RecordBlockInitializers',
                            properties: {},
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
        {
          type: 'item',
          title: '{{t("Save record")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Save") }}',
            'x-component': 'Action',
            'x-action': 'customize:save',
            'x-designer': 'Action.Designer',
            'x-designer-props': {
              modalTip:
                '{{ t("When the button is clicked, the following fields will be assigned and saved together with the fields in the form. If there are overlapping fields, the value here will overwrite the value in the form.") }}',
            },
            'x-action-settings': {
              assignedValues: {},
              skipValidator: false,
              onSuccess: {
                manualClose: true,
                redirecting: false,
                successMessage: '{{t("Saved successfully")}}',
              },
            },
            'x-component-props': {
              useProps: '{{ useUpdateActionProps }}',
            },
          },
        },
        {
          type: 'item',
          title: '{{t("Custom request")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Custom request") }}',
            'x-component': 'Action',
            'x-action': 'customize:form:request',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              requestSettings: {},
              skipValidator: false,
              onSuccess: {
                manualClose: false,
                redirecting: false,
                successMessage: '{{t("Request success")}}',
              },
            },
            'x-component-props': {
              useProps: '{{ useCustomizeRequestActionProps }}',
            },
          },
        },
      ],
    },
  ],
};
