import { useCollectionDataSource } from '@nocobase/client';

import { VariableComponent } from '../calculators';
import CollectionFieldset from '../components/CollectionFieldset';
import { collection, filter, values } from '../schemas/collection';



export default {
  title: '{{t("Update record")}}',
  type: 'update',
  group: 'collection',
  fieldset: {
    'config.collection': collection,
    'config.params.filter': {
      ...filter,
      title: '{{t("Only update records matching conditions")}}',
    },
    'config.params.values': values
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
