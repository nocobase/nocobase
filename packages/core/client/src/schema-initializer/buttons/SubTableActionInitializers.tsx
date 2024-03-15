import { CompatibleSchemaInitializer } from '../../application/schema-initializer/CompatibleSchemaInitializer';

/**
 * @deprecated
 * 表格操作配置
 */
export const subTableActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'SubTableActionInitializers',
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
          name: 'addNew',
          title: "{{t('Add new')}}",
          Component: 'CreateActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
        {
          name: 'delete',
          title: "{{t('Delete')}}",
          Component: 'BulkDestroyActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
      ],
    },
  ],
});

export const subTableActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'subTable:configureActions',
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
            name: 'addNew',
            title: "{{t('Add new')}}",
            Component: 'CreateActionInitializer',
            schema: {
              'x-align': 'right',
            },
          },
          {
            name: 'delete',
            title: "{{t('Delete')}}",
            Component: 'BulkDestroyActionInitializer',
            schema: {
              'x-align': 'right',
            },
          },
        ],
      },
    ],
  },
  subTableActionInitializers_deprecated,
);
