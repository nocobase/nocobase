import { useCollectionDataSource } from '../..';

import { VariableComponent } from '../calculators';
import { collection, filter } from '../schemas/collection';

export default {
  title: '删除数据',
  type: 'destroy',
  group: 'model',
  fieldset: {
    'config.collection': collection,
    'config.params': {
      type: 'object',
      name: 'config.params',
      title: '',
      'x-decorator': 'FormItem',
      properties: {
        filter
      }
    }
  },
  view: {

  },
  scope: {
    useCollectionDataSource
  },
  components: {
    VariableComponent
  }
};
