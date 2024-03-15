import { CompatibleSchemaInitializer } from '@nocobase/client';

/**
 * @deprecated
 * 操作记录表格操作配置
 */
export const auditLogsTableActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'AuditLogsTableActionInitializers',
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
          name: 'refresh',
          title: "{{t('Refresh')}}",
          Component: 'RefreshActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
      ],
    },
  ],
});

export const auditLogsTableActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'auditLogsTable:configureActions',
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
            name: 'refresh',
            title: "{{t('Refresh')}}",
            Component: 'RefreshActionInitializer',
            schema: {
              'x-align': 'right',
            },
          },
        ],
      },
    ],
  },
  auditLogsTableActionInitializers_deprecated,
);
