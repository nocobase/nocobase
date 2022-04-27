import { useCollectionDataSource } from '../..';
import { CollectionFieldset, VariableComponent } from '../calculators';
import { collection, filter, values } from '../schemas/collection';

export default {
  title: '更新数据',
  type: 'update',
  group: 'model',
  fieldset: {
    'config.collection': collection,
    'config.params': {
      type: 'object',
      name: 'config.params',
      title: '',
      'x-decorator': 'FormItem',
      properties: {
        filter,
        values
      }
    }
  },
  view: {

  },
  scope: {
    useCollectionDataSource
  },
  components: {
    VariableComponent,
    CollectionFieldset
  }
};
