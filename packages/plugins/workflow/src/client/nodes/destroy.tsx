import { useCollectionDataSource } from '@nocobase/client';

import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { collection, filter } from '../schemas/collection';
import { isValidFilter } from '../utils';
import { NAMESPACE } from '../locale';

export default {
  title: '{{t("Delete record")}}',
  type: 'destroy',
  group: 'collection',
  fieldset: {
    collection,
    params: {
      type: 'object',
      properties: {
        filter: {
          ...filter,
          ['x-validator'](value) {
            return isValidFilter(value) ? '' : `{{t("Please add at least one condition", { ns: "${NAMESPACE}" })}}`;
          },
        }
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
