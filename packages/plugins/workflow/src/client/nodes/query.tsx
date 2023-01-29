import { SchemaInitializerItemOptions, useCollectionDataSource } from '@nocobase/client';

import { collection, filter } from '../schemas/collection';
import { NAMESPACE } from '../locale';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { CollectionFieldInitializers } from '../components/CollectionFieldInitializers';
import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { useCollectionFieldOptions } from '../components/CollectionFieldSelect';



export default {
  title: `{{t("Query record", { ns: "${NAMESPACE}" })}}`,
  type: 'query',
  group: 'collection',
  fieldset: {
    'config.collection': collection,
    // 'config.multiple': {
    //   type: 'boolean',
    //   title: `{{t("Multiple records", { ns: "${NAMESPACE}" })}}`,
    //   name: 'config.multiple',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Checkbox',
    //   'x-component-props': {
    //     disabled: true
    //   }
    // },
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
    FilterDynamicComponent
  },
  getOptions(config, types) {
    return useCollectionFieldOptions({ collection: config.collection, types });
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
      dataSrouce: `{{$jobsMapByNodeId.${node.id}}}`
    };
  },
  initializers: {
    CollectionFieldInitializers
  }
};
