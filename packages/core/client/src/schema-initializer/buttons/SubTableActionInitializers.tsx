import { useCollection } from '../../';

// 表格操作配置
export const SubTableActionInitializers = {
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
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
          visible: () => {
            const collection = useCollection();
            return collection.template !== 'view' && collection.template !== 'file';
          },
        },
        // {
        //   type: 'item',
        //   title: "{{t('Select')}}",
        //   component: 'SelectActionInitializer',
        //   schema: {
        //     'x-align': 'right',
        //     'x-decorator': 'ACLActionProvider',
        //     'x-acl-action-props': {
        //       skipScopeCheck: true,
        //     },
        //   },
        //   visible: () => {
        //     const collection = useCollection();
        //     return collection.template !== 'view' && collection.template !== 'file';
        //   },
        // },
      ],
    },
  ],
};
