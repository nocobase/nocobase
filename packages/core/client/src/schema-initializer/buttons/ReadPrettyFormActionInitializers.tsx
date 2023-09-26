import { useCollection } from '../..';

const useVisibleCollection = () => {
  const collection = useCollection();
  return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
};
// 表单的操作配置
export const ReadPrettyFormActionInitializers = {
  'data-testid': 'configure-actions-button-of-read-pretty-form',
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
          visible: useVisibleCollection,
        },
        {
          type: 'item',
          title: '{{t("Delete")}}',
          component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
          },
          visible: useVisibleCollection,
        },
        {
          type: 'item',
          title: '{{t("Duplicate")}}',
          component: 'DuplicateActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-action': 'duplicate',
            'x-decorator': 'ACLActionProvider',
            'x-component-props': {
              type: 'primary',
            },
          },
          visible: useVisibleCollection,
        },
        {
          type: 'item',
          title: '{{t("Print")}}',
          component: 'PrintActionInitializer',
          schema: {
            'x-component': 'Action',
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
          title: '{{t("Update record")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Update record") }}',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-action': 'customize:update',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action': 'update',
            'x-action-settings': {
              assignedValues: {},
              onSuccess: {
                manualClose: true,
                redirecting: false,
                successMessage: '{{t("Updated successfully")}}',
              },
            },
            'x-component-props': {
              useProps: '{{ useCustomizeUpdateActionProps }}',
            },
          },
          visible: useVisibleCollection,
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
          visible: useVisibleCollection,
        },
      ],
    },
  ],
};
