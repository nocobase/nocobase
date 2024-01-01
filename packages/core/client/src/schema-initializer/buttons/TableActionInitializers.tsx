import { useFieldSchema } from '@formily/react';
import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';
import { useCollectionV2 } from '../../application';

// 表格操作配置
export const tableActionInitializers = new SchemaInitializer({
  name: 'TableActionInitializers',
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
            const collection = useCollectionV2();
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
            const collection = useCollectionV2();
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
            const collection = useCollectionV2();
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
        const collection = useCollectionV2();
        return !['view', 'sql'].includes(collection.template) || collection?.writableView;
      },
    },
    {
      type: 'subMenu',
      name: 'customize',
      title: '{{t("Customize")}}',
      children: [
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
        const collection = useCollectionV2();
        return !['view', 'sql'].includes(collection.template) || collection?.writableView;
      },
    },
  ],
});
