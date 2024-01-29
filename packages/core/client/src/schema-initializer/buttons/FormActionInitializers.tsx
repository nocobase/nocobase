import { SchemaInitializerItemType } from '../../application';
import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';

// TODO(refactor): should be moved to workflow plugin
const formTriggerWorkflowActionInitializerV2: SchemaInitializerItemType = {
  name: 'submitToWorkflow',
  title: '{{t("Submit to workflow", { ns: "workflow" })}}',
  Component: 'CustomizeActionInitializer',
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
export const formActionInitializers = new SchemaInitializer({
  name: 'FormActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      name: 'enableActions',
      title: '{{t("Enable actions")}}',
      children: [
        {
          name: 'submit',
          title: '{{t("Submit")}}',
          Component: 'CreateSubmitActionInitializer',
          schema: {
            'x-action-settings': {},
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'custom',
      type: 'subMenu',
      title: '{{t("Customize")}}',
      children: [
        {
          name: 'saveRecord',
          title: '{{t("Save record")}}',
          Component: 'CustomizeActionInitializer',
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
        formTriggerWorkflowActionInitializerV2,
        {
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
        },
      ],
    },
  ],
});

export const createFormActionInitializers = new SchemaInitializer({
  name: 'CreateFormActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      name: 'enableActions',
      children: [
        {
          name: 'submit',
          title: '{{t("Submit")}}',
          Component: 'CreateSubmitActionInitializer',
          schema: {
            'x-action-settings': {},
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      name: 'customize',
      children: [
        {
          name: 'saveRecord',
          title: '{{t("Save record")}}',
          Component: 'CustomizeActionInitializer',
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
        formTriggerWorkflowActionInitializerV2,
        {
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
        },
      ],
    },
  ],
});

export const updateFormActionInitializers = new SchemaInitializer({
  name: 'UpdateFormActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      name: 'enableActions',
      children: [
        {
          name: 'submit',
          title: '{{t("Submit")}}',
          Component: 'UpdateSubmitActionInitializer',
          schema: {
            'x-action-settings': {},
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      name: 'customize',
      children: [
        {
          name: 'popup',
          title: '{{t("Popup")}}',
          Component: 'CustomizeActionInitializer',
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
          name: 'saveRecord',
          title: '{{t("Save record")}}',
          Component: 'CustomizeActionInitializer',
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
        formTriggerWorkflowActionInitializerV2,
        {
          type: 'item',
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
        },
      ],
    },
  ],
});
