import { useCollection } from '../../collection-manager';

// 表单的操作配置
export const ListActionInitializers = {
  'data-testid': 'configure-actions-button-of-list-block',
  title: "{{t('Configure actions')}}",
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: "{{t('Enable actions')}}",
      children: [
        {
          type: 'item',
          title: "{{t('Filter')}}",
          component: 'FilterActionInitializer',
          schema: {
            'x-align': 'left',
          },
        },
        {
          type: 'item',
          title: "{{t('Add new')}}",
          component: 'CreateActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
          visible: function useVisible() {
            const collection = useCollection();
            return (
              (collection.template !== 'view' || collection?.writableView) &&
              collection.template !== 'file' &&
              collection.template !== 'sql'
            );
          },
        },
        {
          type: 'item',
          title: "{{t('Refresh')}}",
          component: 'RefreshActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
        {
          type: 'item',
          title: "{{t('Import')}}",
          component: 'ImportActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
          visible: function useVisible() {
            const collection = useCollection();
            return collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: "{{t('Export')}}",
          component: 'ExportActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
        },
      ],
    },
    // {
    //   type: 'divider',
    //   visible: () => {
    //     const collection = useCollection();
    //     return (collection as any).template !== 'view';
    //   },
    // },
    // {
    //   type: 'subMenu',
    //   title: '{{t("Customize")}}',
    //   children: [
    //     {
    //       type: 'item',
    //       title: '{{t("Bulk update")}}',
    //       component: 'CustomizeActionInitializer',
    //       schema: {
    //         type: 'void',
    //         title: '{{ t("Bulk update") }}',
    //         'x-component': 'Action',
    //         'x-align': 'right',
    //         'x-acl-action': 'update',
    //         'x-decorator': 'ACLActionProvider',
    //         'x-acl-action-props': {
    //           skipScopeCheck: true,
    //         },
    //         'x-action': 'customize:bulkUpdate',
    //         'x-designer': 'Action.Designer',
    //         'x-action-settings': {
    //           assignedValues: {},
    //           updateMode: 'selected',
    //           onSuccess: {
    //             manualClose: true,
    //             redirecting: false,
    //             successMessage: '{{t("Updated successfully")}}',
    //           },
    //         },
    //         'x-component-props': {
    //           icon: 'EditOutlined',
    //           useProps: '{{ useCustomizeBulkUpdateActionProps }}',
    //         },
    //       },
    //     },
    //     {
    //       type: 'item',
    //       title: '{{t("Bulk edit")}}',
    //       component: 'CustomizeBulkEditActionInitializer',
    //       schema: {
    //         'x-align': 'right',
    //         'x-decorator': 'ACLActionProvider',
    //         'x-acl-action': 'update',
    //         'x-acl-action-props': {
    //           skipScopeCheck: true,
    //         },
    //       },
    //     },
    //   ],
    //   visible: () => {
    //     const collection = useCollection();
    //     return (collection as any).template !== 'view';
    //   },
    // },
  ],
};

export const ListItemActionInitializers = {
  'data-testid': 'configure-actions-button-of-list-item',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("View")}}',
          component: 'ViewActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'view',
            'x-decorator': 'ACLActionProvider',
            'x-align': 'left',
          },
        },
        {
          type: 'item',
          title: '{{t("Edit")}}',
          component: 'UpdateActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'update',
            'x-decorator': 'ACLActionProvider',
            'x-align': 'left',
          },
          visible: function useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: '{{t("Delete")}}',
          component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'destroy',
            'x-decorator': 'ACLActionProvider',
            'x-align': 'left',
          },
          visible: function useVisible() {
            const collection = useCollection();
            return collection.template !== 'sql';
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
            'x-component': 'Action.Link',
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
            'x-component': 'Action.Link',
            'x-action': 'customize:update',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action': 'update',
            'x-designer': 'Action.Designer',
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
          visible: function useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: '{{t("Custom request")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            title: '{{ t("Custom request") }}',
            'x-component': 'Action.Link',
            'x-action': 'customize:table:request',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              requestSettings: {},
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
          visible: function useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
      ],
    },
  ],
};
