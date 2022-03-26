// 表格操作配置
export const TableActionInitializers = {
  title: "{{t('Configure actions')}}",
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
        },
        {
          type: 'item',
          title: "{{t('Add new')}}",
          component: 'AddNewActionInitializer',
        },
        {
          type: 'item',
          title: "{{t('Delete')}}",
          component: 'BulkDestroyActionInitializer',
        },
      ],
    },
  ],
};
