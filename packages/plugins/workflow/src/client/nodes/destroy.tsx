import { useCollectionDataSource } from '@nocobase/client';

import { VariableComponent } from '../calculators';
import { collection, filter } from '../schemas/collection';

export default {
  title: '{{t("Delete record")}}',
  type: 'destroy',
  group: 'collection',
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
