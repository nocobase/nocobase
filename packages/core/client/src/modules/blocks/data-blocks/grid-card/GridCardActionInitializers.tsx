import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCollection_deprecated } from '../../../../collection-manager';

/**
 * @deprecated
 */
export const gridCardActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'GridCardActionInitializers',
  title: "{{t('Configure actions')}}",
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: "{{t('Enable actions')}}",
      name: 'enableActions',
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
          name: 'addNew',
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
            const collection = useCollection_deprecated();
            return !['view', 'file', 'sql'].includes(collection.template) || collection?.writableView;
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
        {
          name: 'import',
          title: "{{t('Import')}}",
          Component: 'ImportActionInitializer',
          schema: {
            'x-align': 'right',
            'x-acl-action': 'importXlsx',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
          useVisible() {
            const collection = useCollection_deprecated();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          name: 'export',
          title: "{{t('Export')}}",
          Component: 'ExportActionInitializer',
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
  ],
});

export const gridCardActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'gridCard:configureActions',
    title: "{{t('Configure actions')}}",
    icon: 'SettingOutlined',
    style: {
      marginLeft: 8,
    },
    items: [
      {
        type: 'itemGroup',
        title: "{{t('Enable actions')}}",
        name: 'enableActions',
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
            name: 'addNew',
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
              const collection = useCollection_deprecated();
              return !['view', 'file', 'sql'].includes(collection.template) || collection?.writableView;
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
          {
            name: 'import',
            title: "{{t('Import')}}",
            Component: 'ImportActionInitializer',
            schema: {
              'x-align': 'right',
              'x-acl-action': 'importXlsx',
              'x-decorator': 'ACLActionProvider',
              'x-acl-action-props': {
                skipScopeCheck: true,
              },
            },
            useVisible() {
              const collection = useCollection_deprecated();
              return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
            },
          },
          {
            name: 'export',
            title: "{{t('Export')}}",
            Component: 'ExportActionInitializer',
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
    ],
  },
  gridCardActionInitializers_deprecated,
);
