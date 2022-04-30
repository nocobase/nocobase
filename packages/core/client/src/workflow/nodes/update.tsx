import { useCollectionDataSource } from '../..';
import { CollectionFieldset, VariableComponent } from '../calculators';
import { collection, filter, values } from '../schemas/collection';

export default {
  title: '{{t("Update record")}}',
  type: 'update',
  group: 'collection',
  fieldset: {
    'config.collection': collection,
    'config.params': {
      type: 'object',
      name: 'config.params',
      title: '',
      'x-decorator': 'FormItem',
      properties: {
        filter: {
          ...filter,
          title: '{{t("Only update records matching conditions")}}',
        },
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
