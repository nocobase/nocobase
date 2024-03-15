import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCollection_deprecated } from '../../../../collection-manager';

/**
 * @deprecated
 */
export const gridCardItemActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'GridCardItemActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      name: 'enable-actions',
      children: [
        {
          name: 'view',
          title: '{{t("View")}}',
          Component: 'ViewActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'view',
            'x-decorator': 'ACLActionProvider',
            'x-align': 'left',
          },
        },
        {
          name: 'edit',
          title: '{{t("Edit")}}',
          Component: 'UpdateActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'update',
            'x-decorator': 'ACLActionProvider',
            'x-align': 'left',
          },
          useVisible() {
            const collection = useCollection_deprecated();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          name: 'delete',
          title: '{{t("Delete")}}',
          Component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'destroy',
            'x-decorator': 'ACLActionProvider',
            'x-align': 'left',
          },
          useVisible() {
            const collection = useCollection_deprecated();
            return collection.template !== 'sql';
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
          Component: 'PopupActionInitializer',
          useComponentProps() {
            return {
              'x-component': 'Action.Link',
            };
          },
        },
        {
          name: 'update-record',
          title: '{{t("Update record")}}',
          Component: 'UpdateRecordActionInitializer',
          useVisible() {
            const collection = useCollection_deprecated();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
          schema: {
            'x-action': 'customize:table:request',
          },
          useVisible() {
            const collection = useCollection_deprecated();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
      ],
    },
  ],
});

export const gridCardItemActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'gridCard:configureItemActions',
    title: '{{t("Configure actions")}}',
    icon: 'SettingOutlined',
    items: [
      {
        type: 'itemGroup',
        title: '{{t("Enable actions")}}',
        name: 'enable-actions',
        children: [
          {
            name: 'view',
            title: '{{t("View")}}',
            Component: 'ViewActionInitializer',
            schema: {
              'x-component': 'Action.Link',
              'x-action': 'view',
              'x-decorator': 'ACLActionProvider',
              'x-align': 'left',
            },
          },
          {
            name: 'edit',
            title: '{{t("Edit")}}',
            Component: 'UpdateActionInitializer',
            schema: {
              'x-component': 'Action.Link',
              'x-action': 'update',
              'x-decorator': 'ACLActionProvider',
              'x-align': 'left',
            },
            useVisible() {
              const collection = useCollection_deprecated();
              return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
            },
          },
          {
            name: 'delete',
            title: '{{t("Delete")}}',
            Component: 'DestroyActionInitializer',
            schema: {
              'x-component': 'Action.Link',
              'x-action': 'destroy',
              'x-decorator': 'ACLActionProvider',
              'x-align': 'left',
            },
            useVisible() {
              const collection = useCollection_deprecated();
              return collection.template !== 'sql';
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
            Component: 'PopupActionInitializer',
            useComponentProps() {
              return {
                'x-component': 'Action.Link',
              };
            },
          },
          {
            name: 'update-record',
            title: '{{t("Update record")}}',
            Component: 'UpdateRecordActionInitializer',
            useVisible() {
              const collection = useCollection_deprecated();
              return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
            },
          },
          {
            name: 'customRequest',
            title: '{{t("Custom request")}}',
            Component: 'CustomRequestInitializer',
            schema: {
              'x-action': 'customize:table:request',
            },
            useVisible() {
              const collection = useCollection_deprecated();
              return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
            },
          },
        ],
      },
    ],
  },
  gridCardItemActionInitializers_deprecated,
);
