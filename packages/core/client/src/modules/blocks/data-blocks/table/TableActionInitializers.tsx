import { useFieldSchema } from '@formily/react';
import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCollection_deprecated } from '../../../../collection-manager/hooks/useCollection_deprecated';

/**
 * @deprecated
 * 表格操作配置
 */
export const tableActionInitializers_deprecated = new CompatibleSchemaInitializer({
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
            const collection = useCollection_deprecated();
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
            const collection = useCollection_deprecated();
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
          Component: 'ExpandableActionInitializer',
          schema: {
            'x-align': 'right',
          },
          useVisible() {
            const schema = useFieldSchema();
            const collection = useCollection_deprecated();
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
        const collection = useCollection_deprecated();
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
        const collection = useCollection_deprecated();
        return !['view', 'sql'].includes(collection.template) || collection?.writableView;
      },
    },
  ],
});

export const tableActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'table:configureActions',
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
              const collection = useCollection_deprecated();
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
              const collection = useCollection_deprecated();
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
            Component: 'ExpandableActionInitializer',
            schema: {
              'x-align': 'right',
            },
            useVisible() {
              const schema = useFieldSchema();
              const collection = useCollection_deprecated();
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
          const collection = useCollection_deprecated();
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
          const collection = useCollection_deprecated();
          return !['view', 'sql'].includes(collection.template) || collection?.writableView;
        },
      },
    ],
  },
  tableActionInitializers_deprecated,
);
