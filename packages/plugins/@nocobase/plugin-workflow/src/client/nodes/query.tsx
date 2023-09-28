import { ArrayItems } from '@formily/antd-v5';

import {
  SchemaComponentContext,
  SchemaInitializerItemOptions,
  useCollectionDataSource,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';

import { appends, collection, filter, pagination, sort } from '../schemas/collection';
import { NAMESPACE } from '../locale';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { getCollectionFieldOptions, useWorkflowVariableOptions } from '../variable';
import { useForm } from '@formily/react';

export default {
  title: `{{t("Query record", { ns: "${NAMESPACE}" })}}`,
  type: 'query',
  group: 'collection',
  description: `{{t("Query records from a collection. You can use variables from upstream nodes as query conditions.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    collection,
    multiple: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-content': `{{t("Allow multiple records as result", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("If checked, when there are multiple records in the query result, an array will be returned as the result, which can be operated on one by one using a loop node. Otherwise, only one record will be returned.", { ns: "${NAMESPACE}" })}}`,
    },
    params: {
      type: 'object',
      'x-component': 'fieldset',
      properties: {
        filter,
        sort,
        pagination,
        appends,
      },
      'x-reactions': [
        {
          dependencies: ['collection'],
          fulfill: {
            state: {
              visible: '{{$deps[0] != null}}',
            },
          },
        },
      ],
    },
    failOnEmpty: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-content': `{{t("Exit when query result is null", { ns: "${NAMESPACE}" })}}`,
    },
  },
  view: {},
  scope: {
    useCollectionDataSource,
    useWorkflowVariableOptions,
    useSortableFields() {
      const compile = useCompile();
      const { getCollectionFields, getInterface } = useCollectionManager();
      const { values } = useForm();
      const fields = getCollectionFields(values.collection);
      return fields
        .filter((field: any) => {
          if (!field.interface) {
            return false;
          }
          const fieldInterface = getInterface(field.interface);
          if (fieldInterface?.sortable) {
            return true;
          }
          return false;
        })
        .map((field: any) => {
          return {
            value: field.name,
            label: field?.uiSchema?.title ? compile(field?.uiSchema?.title) : field.name,
          };
        });
    },
  },
  components: {
    ArrayItems,
    FilterDynamicComponent,
    SchemaComponentContext,
  },
  useVariables({ id, title, config }, options) {
    const compile = useCompile();
    const { getCollectionFields } = useCollectionManager();
    // const depth = config?.params?.appends?.length
    //   ? config?.params?.appends.reduce((max, item) => Math.max(max, item.split('.').length), 1)
    //   : 0;
    const name = `${id}`;
    const [result] = getCollectionFieldOptions({
      // collection: config.collection,
      // depth: options?.depth ?? depth,
      appends: [name, ...(config.params?.appends?.map((item) => `${name}.${item}`) || [])],
      ...options,
      fields: [
        {
          collectionName: config.collection,
          name,
          type: 'hasOne',
          target: config.collection,
          uiSchema: {
            title,
          },
        },
      ],
      compile,
      getCollectionFields,
    });

    return result;
  },
  useInitializers(node): SchemaInitializerItemOptions | null {
    if (!node.config.collection || node.config.multiple) {
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
  initializers: {},
};
