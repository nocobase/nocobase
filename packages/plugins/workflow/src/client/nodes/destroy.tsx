import { useCollectionDataSource } from '@nocobase/client';

import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { collection, filter } from '../schemas/collection';

export default {
  title: '{{t("Delete record")}}',
  type: 'destroy',
  group: 'collection',
  fieldset: {
    collection,
    params: {
      type: 'object',
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
    FilterDynamicComponent
  }
};
