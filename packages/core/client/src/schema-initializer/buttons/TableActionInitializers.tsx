import { useFieldSchema } from '@formily/react';
import { useCollection } from '../../';

// 表格操作配置
export const TableActionInitializers = {
  'data-testid': 'configure-actions-button-of-table-block',
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
            return !['view', 'file', 'sql'].includes(collection.template) || collection?.writableView;
          },
        },
        {
          type: 'item',
          title: "{{t('Delete')}}",
          component: 'BulkDestroyActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
          },
          visible: function useVisible() {
            const collection = useCollection();
            return !['view', 'sql'].includes(collection.template) || collection?.writableView;
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
          title: "{{t('Expand/Collapse')}}",
          component: 'ExpandActionInitializer',
          schema: {
            'x-align': 'right',
          },
          visible: function useVisible() {
            const schema = useFieldSchema();
            const collection = useCollection();
            const { treeTable } = schema?.parent?.['x-decorator-props'] || {};
            return collection.tree && treeTable !== false;
          },
        },
      ],
    },
    {
      type: 'divider',
      visible: function useVisible() {
        const collection = useCollection();
        return !['view', 'sql'].includes(collection.template) || collection?.writableView;
      },
    },
    // {
    //   type: 'item',
    //   title: "{{t('Association fields filter')}}",
    //   component: 'ActionBarAssociationFilterAction',
    //   schema: {
    //     'x-align': 'left',
    //   },
    //   find: (schema: Schema) => {
    //     const resultSchema = Object.entries(schema.parent.properties).find(
    //       ([, value]) => value['x-component'] === 'AssociationFilter',
    //     )?.[1];
    //     return resultSchema;
    //   },
    //   visible: () => {
    //     const collection = useCollection();
    //     const schema = useFieldSchema();
    //     return (collection as any).template !== 'view' && schema['x-initializer'] !== 'GanttActionInitializers';
    //   },
    // },
    // {
    //   type: 'divider',
    //   visible: () => {
    //     const collection = useCollection();
    //     const schema = useFieldSchema();
    //     return (collection as any).template !== 'view' && schema['x-initializer'] !== 'GanttActionInitializers';
    //   },
    // },
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
        {
          type: 'item',
          title: '{{t("Add record")}}',
          component: 'CustomizeAddRecordActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action': 'create',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
        },
      ],
      visible: function useVisible() {
        const collection = useCollection();
        return !['view', 'sql'].includes(collection.template) || collection?.writableView;
      },
    },
  ],
};
