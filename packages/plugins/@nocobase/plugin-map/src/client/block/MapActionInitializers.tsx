import { SchemaInitializerV2, useCollection } from '@nocobase/client';

// 表格操作配置
export const MapActionInitializers = {
  'data-testid': 'configure-actions-button-of-map-block',
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
            return collection.template !== 'sql';
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
      ],
    },
    {
      type: 'divider',
      visible: function useVisible() {
        const collection = useCollection();
        return collection.template !== 'sql';
      },
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Bulk update")}}',
          component: 'CustomizeActionInitializer',
          schema: {
            type: 'void',
            title: '{{ t("Bulk update") }}',
            'x-component': 'Action',
            'x-align': 'right',
            'x-acl-action': 'update',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
            'x-action': 'customize:bulkUpdate',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              assignedValues: {},
              updateMode: 'selected',
              onSuccess: {
                manualClose: true,
                redirecting: false,
                successMessage: '{{t("Updated successfully")}}',
              },
            },
            'x-component-props': {
              icon: 'EditOutlined',
              useProps: '{{ useCustomizeBulkUpdateActionProps }}',
            },
          },
        },
        {
          type: 'item',
          title: '{{t("Bulk edit")}}',
          component: 'CustomizeBulkEditActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action': 'update',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
        },
      ],
      visible: function useVisible() {
        const collection = useCollection();
        return collection.template !== 'sql';
      },
    },
  ],
};

export const mapActionInitializers = new SchemaInitializerV2({
  name: 'MapActionInitializers',
  'data-testid': 'configure-actions-button-of-map-block',
  title: "{{t('Configure actions')}}",
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: "{{t('Enable actions')}}",
      name: 'enable-actions',
      children: [
        {
          name: 'filter',
          title: "{{t('Filter')}}",
          Component: 'FilterActionInitializer',
          schema: {
            'x-align': 'left',
          },
        },
        {
          name: 'add-new',
          title: "{{t('Add new')}}",
          Component: 'CreateActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
          useVisible() {
            const collection = useCollection();
            return collection.template !== 'sql';
          },
        },
        {
          name: 'refresh',
          title: "{{t('Refresh')}}",
          Component: 'RefreshActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
      ],
    },
    {
      type: 'divider',
      useVisible() {
        const collection = useCollection();
        return collection.template !== 'sql';
      },
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      name: 'customize',
      children: [
        {
          name: 'bulk-update',
          title: '{{t("Bulk update")}}',
          Component: 'CustomizeActionInitializer',
          schema: {
            type: 'void',
            title: '{{ t("Bulk update") }}',
            'x-component': 'Action',
            'x-align': 'right',
            'x-acl-action': 'update',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
            'x-action': 'customize:bulkUpdate',
            'x-designer': 'Action.Designer',
            'x-action-settings': {
              assignedValues: {},
              updateMode: 'selected',
              onSuccess: {
                manualClose: true,
                redirecting: false,
                successMessage: '{{t("Updated successfully")}}',
              },
            },
            'x-component-props': {
              icon: 'EditOutlined',
              useProps: '{{ useCustomizeBulkUpdateActionProps }}',
            },
          },
        },
        {
          name: 'bulk-edit',
          title: '{{t("Bulk edit")}}',
          Component: 'CustomizeBulkEditActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action': 'update',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
        },
      ],
      useVisible() {
        const collection = useCollection();
        return collection.template !== 'sql';
      },
    },
  ],
});
