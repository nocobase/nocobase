import { SchemaInitializerItemOptions, useCollectionDataSource } from '@nocobase/client';

import { VariableComponent } from '../calculators';
import { collection, filter } from '../schemas/collection';
import { NAMESPACE } from '../locale';
import { NodeCollectionFieldValueGetter } from '../components/NodeCollectionFieldValueGetter';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { CollectionFieldInitializers } from '../components/CollectionFieldInitializers';



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
    VariableComponent
  },
  useFields() {
    return [];
  },
  useValueGetter(node) {
    return NodeCollectionFieldValueGetter;
  },
  useInitializers(node): SchemaInitializerItemOptions | null {
    if (!node.config.collection) {
      return null;
    }

    return {
      type: 'item',
      title: node.title ?? `#${node.id}`,
      component: CollectionBlockInitializer,
      collectionName: node.config.collection,
      context: {
        type: '$jobsMapByNodeId',
        options: {
          nodeId: node.id
        }
      }
    };
  },
  initializers: {
    CollectionFieldInitializers
  }
};
