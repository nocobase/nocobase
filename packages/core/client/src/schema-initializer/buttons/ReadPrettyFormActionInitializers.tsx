// 表单的操作配置
export const ReadPrettyFormActionInitializers = {
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
          title: '{{t("Popup window")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            type: 'void',
            title: '{{ t("Popup window") }}',
            'x-action': 'view',
            'x-designer': 'Action.Designer',
            'x-component': 'Action',
            'x-component-props': {
              openMode: 'drawer',
            },
            properties: {
              drawer: {
                type: 'void',
                title: '{{ t("Popup window") }}',
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
          title: '{{t("Update record")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Update record") }}',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              assignedValues: {},
              onSuccess: {
                title: '{{ t("After successful update") }}',
                manualClose: true,
                redirecting: false,
                successMessage: '{{t("Submitted successfully")}}',
              },
            },
            'x-component-props': {
              useProps: '{{ useCustomizeUpdateActionProps }}',
            },
          },
        },
      ],
    },
  ],
};
