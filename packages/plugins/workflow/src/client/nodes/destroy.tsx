import { useCollectionDataSource } from '@nocobase/client';

import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { collection, filter } from '../schemas/collection';
import { isValidFilter } from '../utils';
import { NAMESPACE } from '../locale';

export default {
  title: '{{t("Delete record")}}',
  type: 'destroy',
  group: 'collection',
  description: `{{t("Delete records of a collection. Could use variables in workflow context as filter. All records match the filter will be deleted.", { ns: "${NAMESPACE}" })}}`,
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
        },
      },
    },
  },
  view: {},
  scope: {
    useCollectionDataSource,
  },
  components: {
    FilterDynamicComponent,
  },
};
