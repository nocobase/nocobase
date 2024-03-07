import { CompatibleSchemaInitializer, useCollection_deprecated } from '@nocobase/client';

/**
 * @deprecated
 * 表格操作配置
 */
export const mapActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'MapActionInitializers',
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
      name: 'divider',
      type: 'divider',
      useVisible() {
        const collection = useCollection_deprecated();
        return collection.template !== 'sql';
      },
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      name: 'customize',
      children: [],
      useVisible() {
        const collection = useCollection_deprecated();
        return collection.template !== 'sql';
      },
    },
  ],
});

export const mapActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'map:configureActions',
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
        name: 'divider',
        type: 'divider',
        useVisible() {
          const collection = useCollection_deprecated();
          return collection.template !== 'sql';
        },
      },
      {
        type: 'subMenu',
        title: '{{t("Customize")}}',
        name: 'customize',
        children: [],
        useVisible() {
          const collection = useCollection_deprecated();
          return collection.template !== 'sql';
        },
      },
    ],
  },
  mapActionInitializers_deprecated,
);
