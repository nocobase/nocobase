import { action } from '@formily/reactive';
import { useCollectionManager } from '../../collection-manager';

export const properties = {
  collection: {
    type: 'string',
    title: '数据表',
    name: 'collection',
    required: true,
    'x-reactions': ['{{useAsyncDataSource()}}'],
    'x-decorator': 'FormItem',
    'x-component': 'Select',
  }
};

export const scope = {
  useAsyncDataSource() {
    return (field: any) => {
      const { collections = [] } = useCollectionManager();
      action.bound((data: any) => {
        field.dataSource = data.map(item => ({
          label: item.title,
          value: item.name
        }));
      })(collections);
    }
  }
};
