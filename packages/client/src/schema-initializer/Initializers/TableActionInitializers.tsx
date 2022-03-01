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
          schema: {
            title: '{{ t("Filter") }}',
            'x-action': 'filter',
            'x-align': 'left',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
          },
        },
        {
          type: 'item',
          title: "{{t('Add new')}}",
          component: 'AddNewActionInitializer',
        },
        {
          type: 'item',
          title: "{{t('Delete')}}",
          component: 'ActionInitializer',
          schema: {
            title: '{{ t("Delete") }}',
            'x-action': 'destroy',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-component-props': {
              confirm: {
                title: "{{t('Delete record')}}",
                content: "{{t('Are you sure you want to delete it?')}}",
              },
              useAction: '{{ cm.useBulkDestroyAction }}',
            },
          },
        },
      ],
    },
  ],
};
