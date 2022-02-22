// 详情的操作配置
export const DetailsActionInitializers = {
  title: 'Configure actions',
  items: [
    {
      type: 'itemGroup',
      title: 'Enable actions',
      children: [
        {
          type: 'item',
          title: 'Edit',
          component: 'ActionInitializer',
          schema: {
            title: 'Edit',
            'x-action': 'update',
          },
        },
        {
          type: 'item',
          title: 'Delete',
          component: 'ActionInitializer',
          schema: {
            title: 'Delete',
            'x-action': 'delete',
          },
        },
      ],
    },
  ],
};
