// TODO(refactor): should be moved to workflow plugin
const FormTriggerWorkflowActionInitializer = {
  type: 'item',
  title: '{{t("Submit to workflow", { ns: "workflow" })}}',
  component: 'CustomizeActionInitializer',
  schema: {
    title: '{{t("Submit to workflow", { ns: "workflow" })}}',
    'x-component': 'Action',
    'x-component-props': {
      useProps: '{{ useTriggerWorkflowsActionProps }}',
    },
    'x-designer': 'Action.Designer',
    'x-action-settings': {
      assignedValues: {},
      skipValidator: false,
      onSuccess: {
        manualClose: true,
        redirecting: false,
        successMessage: '{{t("Submitted successfully")}}',
      },
      triggerWorkflows: [],
    },
    'x-action': 'customize:triggerWorkflows',
  },
};

// 表单的操作配置
export const FormActionInitializers = {
  'data-testid': 'configure-actions-button-of-form-block',
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
        // 表单区块内暂时屏蔽【打开弹窗】按钮
        // {
        //   type: 'item',
        //   title: '{{t("Popup")}}',
        //   component: 'CustomizeActionInitializer',
        //   schema: {
        //     type: 'void',
        //     title: '{{ t("Popup") }}',
        //     'x-action': 'customize:popup',
        //     'x-designer': 'Action.Designer',
        //     'x-component': 'Action',
        //     'x-component-props': {
        //       openMode: 'drawer',
        //     },
        //     properties: {
        //       drawer: {
        //         type: 'void',
        //         title: '{{ t("Popup") }}',
        //         'x-component': 'Action.Container',
        //         'x-component-props': {
        //           className: 'nb-action-popup',
        //         },
        //         properties: {
        //           tabs: {
        //             type: 'void',
        //             'x-component': 'Tabs',
        //             'x-component-props': {},
        //             'x-initializer': 'TabPaneInitializers',
        //             properties: {
        //               tab1: {
        //                 type: 'void',
        //                 title: '{{t("Details")}}',
        //                 'x-component': 'Tabs.TabPane',
        //                 'x-designer': 'Tabs.Designer',
        //                 'x-component-props': {},
        //                 properties: {
        //                   grid: {
        //                     type: 'void',
        //                     'x-component': 'Grid',
        //                     'x-initializer': 'RecordBlockInitializers',
        //                     properties: {},
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     },
        //   },
        // },
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
                successMessage: '{{t("Submitted successfully")}}',
              },
              triggerWorkflows: [],
            },
            'x-component-props': {
              useProps: '{{ useCreateActionProps }}',
            },
          },
        },
        FormTriggerWorkflowActionInitializer,
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
  'data-testid': 'configure-actions-button-of-create-form',
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
        // 添加弹窗内暂时屏蔽【打开弹窗】按钮
        // {
        //   type: 'item',
        //   title: '{{t("Popup")}}',
        //   component: 'CustomizeActionInitializer',
        //   schema: {
        //     type: 'void',
        //     title: '{{ t("Popup") }}',
        //     'x-action': 'customize:popup',
        //     'x-designer': 'Action.Designer',
        //     'x-component': 'Action',
        //     'x-component-props': {
        //       openMode: 'drawer',
        //     },
        //     properties: {
        //       drawer: {
        //         type: 'void',
        //         title: '{{ t("Popup") }}',
        //         'x-component': 'Action.Container',
        //         'x-component-props': {
        //           className: 'nb-action-popup',
        //         },
        //         properties: {
        //           tabs: {
        //             type: 'void',
        //             'x-component': 'Tabs',
        //             'x-component-props': {},
        //             'x-initializer': 'TabPaneInitializers',
        //             properties: {
        //               tab1: {
        //                 type: 'void',
        //                 title: '{{t("Details")}}',
        //                 'x-component': 'Tabs.TabPane',
        //                 'x-designer': 'Tabs.Designer',
        //                 'x-component-props': {},
        //                 properties: {
        //                   grid: {
        //                     type: 'void',
        //                     'x-component': 'Grid',
        //                     'x-initializer': 'RecordBlockInitializers',
        //                     properties: {},
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     },
        //   },
        // },
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
                successMessage: '{{t("Submitted successfully")}}',
              },
              triggerWorkflows: [],
            },
            'x-component-props': {
              useProps: '{{ useCreateActionProps }}',
            },
          },
        },
        FormTriggerWorkflowActionInitializer,
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
  'data-testid': 'configure-actions-button-of-update-form',
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
                successMessage: '{{t("Submitted successfully")}}',
              },
              triggerWorkflows: [],
            },
            'x-component-props': {
              useProps: '{{ useUpdateActionProps }}',
            },
          },
        },
        FormTriggerWorkflowActionInitializer,
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
                successMessage: '{{t("Submitted successfully")}}',
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

export const BulkEditFormActionInitializers = {
  'data-testid': 'configure-actions-button-of-bulk-edit-form',
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
          component: 'BulkEditSubmitActionInitializer',
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
                successMessage: '{{t("Submitted successfully")}}',
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
