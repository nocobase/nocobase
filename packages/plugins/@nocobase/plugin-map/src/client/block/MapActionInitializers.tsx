import { useCollection } from '@nocobase/client';

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
