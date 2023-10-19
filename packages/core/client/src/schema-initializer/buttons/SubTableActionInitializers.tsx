import { SchemaInitializerV2 } from '../../application';

// 表格操作配置
export const SubTableActionInitializers = {
  'data-testid': 'configure-actions-button-of-sub-table',
  title: "{{t('Configure actions')}}",
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  // size: 'small',
  items: [
    {
      type: 'itemGroup',
      title: "{{t('Enable actions')}}",
      children: [
        {
          type: 'item',
          title: "{{t('Add new')}}",
          component: 'CreateActionInitializer',
          schema: {
            'x-align': 'right',
            // 'x-component-props': {
            //   size: 'small',
            // },
          },
        },
        {
          type: 'item',
          title: "{{t('Delete')}}",
          component: 'BulkDestroyActionInitializer',
          schema: {
            'x-align': 'right',
            // 'x-component-props': {
            //   size: 'small',
            // },
          },
        },
      ],
    },
  ],
};

export const subTableActionInitializers = new SchemaInitializerV2({
  name: 'SubTableActionInitializers',
  'data-testid': 'configure-actions-button-of-sub-table',
  title: "{{t('Configure actions')}}",
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: "{{t('Enable actions')}}",
      name: 'enable-actions',
      children: [
        {
          name: 'add-new',
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
