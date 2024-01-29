import { SchemaInitializer } from '@nocobase/client';
export const BulkEditFormActionInitializers = new SchemaInitializer({
  name: 'BulkEditFormActionInitializers',
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
          Component: 'BulkEditSubmitActionInitializer',
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
            },
            'x-component-props': {
              useProps: '{{ useUpdateActionProps }}',
            },
          },
        },
        {
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
        },
      ],
    },
  ],
});
