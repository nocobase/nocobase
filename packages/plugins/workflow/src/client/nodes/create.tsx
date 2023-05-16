import { SchemaInitializerItemOptions, useCollectionDataSource } from '@nocobase/client';

import { appends, collection, values } from '../schemas/collection';
import CollectionFieldset from '../components/CollectionFieldset';
import { NAMESPACE } from '../locale';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { CollectionFieldInitializers } from '../components/CollectionFieldInitializers';
import { useCollectionFieldOptions } from '../variable';
import { FieldsSelect } from '../components/FieldsSelect';

export default {
  title: `{{t("Create record", { ns: "${NAMESPACE}" })}}`,
  type: 'create',
  group: 'collection',
  fieldset: {
    collection,
    // multiple: {
    //   type: 'boolean',
    //   title: '多条数据',
    //   name: 'multiple',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Checkbox',
    //   'x-component-props': {
    //     disabled: true
    //   }
    // },
    params: {
      type: 'object',
      properties: {
        values,
        appends,
      },
    },
  },
  view: {},
  scope: {
    useCollectionDataSource,
  },
  components: {
    CollectionFieldset,
    FieldsSelect,
  },
  useVariables({ config }, types) {
    return useCollectionFieldOptions({
      collection: config.collection,
      types,
      depth: config.params?.appends?.length ? 1 : 0,
    });
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
