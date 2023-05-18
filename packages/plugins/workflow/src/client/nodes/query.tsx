import { SchemaInitializerItemOptions, useCollectionDataSource } from '@nocobase/client';

import { appends, collection, filter } from '../schemas/collection';
import { NAMESPACE } from '../locale';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { CollectionFieldInitializers } from '../components/CollectionFieldInitializers';
import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { useCollectionFieldOptions } from '../variable';
import { FieldsSelect } from '../components/FieldsSelect';

export default {
  title: `{{t("Query record", { ns: "${NAMESPACE}" })}}`,
  type: 'query',
  group: 'collection',
  description: `{{t("Query records of a collection. Could use variables in workflow context as filter.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    collection,
    multiple: {
      type: 'boolean',
      title: `{{t("Multiple records", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      description: `{{t("Result will be an array of records, could be manipulated in loop.", { ns: "${NAMESPACE}" })}}`,
    },
    params: {
      type: 'object',
      properties: {
        filter,
        appends,
      },
    },
    failOnEmpty: {
      type: 'boolean',
      title: `{{t("Fail on no data", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
  view: {},
  scope: {
    useCollectionDataSource,
  },
  components: {
    FilterDynamicComponent,
    FieldsSelect,
  },
  useVariables({ config }, options) {
    const result = useCollectionFieldOptions({
      collection: config?.collection,
      ...options,
      depth: options?.depth ?? config?.params?.appends?.length ? 1 : 0,
    });

    return result?.length ? result : null;
  },
  useInitializers(node): SchemaInitializerItemOptions | null {
    if (!node.config.collection) {
      return null;
    }

    return {
      type: 'item',
      title: node.title ?? `#${node.id}`,
      component: CollectionBlockInitializer,
      collection: node.config.collection,
      dataSource: `{{$jobsMapByNodeId.${node.id}}}`,
    };
  },
  initializers: {
    CollectionFieldInitializers,
  },
};
