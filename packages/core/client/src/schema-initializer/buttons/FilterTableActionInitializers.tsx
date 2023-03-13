// 筛选表格操作配置
export const FilterTableActionInitializers = {
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
          title: "{{t('Refresh')}}",
          component: 'RefreshActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
      ],
    },
  ],
};
