import { useFieldSchema } from '@formily/react';
import { SchemaInitializer, useCollection } from '@nocobase/client';

export const GanttActionInitializers: SchemaInitializer = new SchemaInitializer({
  name: 'GanttActionInitializers',
  title: "{{t('Configure actions')}}",
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      name: 'enableActions',
      title: "{{t('Enable actions')}}",
      children: [
        {
          type: 'item',
          name: 'filter',
          title: "{{t('Filter')}}",
          Component: 'FilterActionInitializer',
          schema: {
            'x-align': 'left',
          },
        },
        {
          type: 'item',
          title: "{{t('Add new')}}",
          name: 'addNew',
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
            return !['view', 'file', 'sql'].includes(collection.template) || collection?.writableView;
          },
        },
        {
          type: 'item',
          title: "{{t('Delete')}}",
          name: 'delete',
          Component: 'BulkDestroyActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
          },
          useVisible() {
            const collection = useCollection();
            return !['view', 'sql'].includes(collection.template) || collection?.writableView;
          },
        },
        {
          type: 'item',
          title: "{{t('Refresh')}}",
          name: 'refresh',
          Component: 'RefreshActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
        {
          name: 'toggle',
          title: "{{t('Expand/Collapse')}}",
          Component: 'ExpandActionInitializer',
          schema: {
            'x-align': 'right',
          },
          useVisible() {
            const schema = useFieldSchema();
            const collection = useCollection();
            const { treeTable } = schema?.parent?.['x-decorator-props'] || {};
            return collection.tree && treeTable !== false;
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
      useVisible() {
        const collection = useCollection();
        return !['view', 'sql'].includes(collection.template) || collection?.writableView;
      },
    },
    {
      type: 'subMenu',
      name: 'customize',
      title: '{{t("Customize")}}',
      children: [
        // {
        //   type: 'item',
        //   title: '{{t("Bulk update")}}',
        //   Component: 'CustomizeActionInitializer',
        //   name: 'bulkUpdate',
        //   schema: {
        //     type: 'void',
        //     title: '{{ t("Bulk update") }}',
        //     'x-component': 'Action',
        //     'x-align': 'right',
        //     'x-acl-action': 'update',
        //     'x-decorator': 'ACLActionProvider',
        //     'x-acl-action-props': {
        //       skipScopeCheck: true,
        //     },
        //     'x-action': 'customize:bulkUpdate',
        //     'x-designer': 'Action.Designer',
        //     'x-action-settings': {
        //       assignedValues: {},
        //       updateMode: 'selected',
        //       onSuccess: {
        //         manualClose: true,
        //         redirecting: false,
        //         successMessage: '{{t("Updated successfully")}}',
        //       },
        //     },
        //     'x-component-props': {
        //       icon: 'EditOutlined',
        //       useProps: '{{ useCustomizeBulkUpdateActionProps }}',
        //     },
        //   },
        // },
        {
          type: 'item',
          title: '{{t("Add record")}}',
          name: 'addRecord',
          Component: 'CustomizeAddRecordActionInitializer',
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
      useVisible() {
        const collection = useCollection();
        return !['view', 'sql'].includes(collection.template) || collection?.writableView;
      },
    },
  ],
});
