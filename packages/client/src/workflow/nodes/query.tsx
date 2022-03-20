import { action } from '@formily/reactive';
import { t } from 'i18next';
import { useCollectionManager } from '../../collection-manager';

export default {
  title: '数据查询',
  type: 'query',
  fieldset: {
    collection: {
      type: 'string',
      title: '数据表',
      name: 'collection',
      required: true,
      'x-reactions': ['{{useCollectionDataSource()}}'],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
    },
    multiple: {
      type: 'boolean',
      title: '多条数据',
      name: 'multiple',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox'
    }
  },
  view: {

  },
  scope: {
    useCollectionDataSource() {
      return (field: any) => {
        const { collections = [] } = useCollectionManager();
        action.bound((data: any) => {
          field.dataSource = data.map(item => ({
            label: t(item.title),
            value: item.name
          }));
        })(collections);
      }
    }
  }
};
