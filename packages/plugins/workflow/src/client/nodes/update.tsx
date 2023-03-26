import { useCollectionDataSource } from '@nocobase/client';

import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import CollectionFieldset from '../components/CollectionFieldset';

import { isValidFilter } from '../utils';
import { NAMESPACE } from '../locale';
import { collection, filter, values } from '../schemas/collection';



export default {
  title: `{{t("Update record", { ns: "${NAMESPACE}" })}}`,
  type: 'update',
  group: 'collection',
  fieldset: {
    collection,
    params: {
      type: 'object',
      properties: {
        filter: {
          ...filter,
          title: `{{t("Only update records matching conditions", { ns: "${NAMESPACE}" })}}`,
          ['x-validator'](value) {
            return isValidFilter(value) ? '' : `{{t("Please add at least one condition", { ns: "${NAMESPACE}" })}}`;
          },
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
    FilterDynamicComponent,
    CollectionFieldset
  }
};
