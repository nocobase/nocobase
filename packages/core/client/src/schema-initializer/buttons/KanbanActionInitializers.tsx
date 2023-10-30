import { useCollection } from '../../';
import { SchemaInitializer } from '../../application';

export const kanbanActionInitializers = new SchemaInitializer({
  name: 'KanbanActionInitializers',
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
          name: 'filter',
          title: "{{t('Filter')}}",
          Component: 'FilterActionInitializer',
          schema: {
            'x-align': 'left',
          },
        },
        {
          name: 'add-new',
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
            const collection = useCollection();
            return (collection as any).template !== 'view' || collection?.writableView;
          },
        },
      ],
    },
  ],
});
