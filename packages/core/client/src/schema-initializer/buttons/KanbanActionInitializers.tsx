import { useCollection } from '../../';

export const KanbanActionInitializers = {
  'data-testid': 'configure-actions-button-of-kanban-block',
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
          title: "{{t('Add new')}}",
          component: 'CreateActionInitializer',
          schema: {
            'x-align': 'right',
            'x-decorator': 'ACLActionProvider',
            'x-acl-action-props': {
              skipScopeCheck: true,
            },
          },
          visible: function useVisible() {
            const collection = useCollection();
            return (collection as any).template !== 'view' || collection?.writableView;
          },
        },
      ],
    },
  ],
};
