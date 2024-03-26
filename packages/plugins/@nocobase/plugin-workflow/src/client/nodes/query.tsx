import { ArrayItems } from '@formily/antd-v5';

import {
  SchemaComponentContext,
  SchemaInitializerItemType,
  useCollectionDataSource,
  useCollectionManager_deprecated,
  useCompile,
} from '@nocobase/client';

import { useForm } from '@formily/react';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { NAMESPACE } from '../locale';
import { appends, collection, filter, pagination, sort } from '../schemas/collection';
import { WorkflowVariableInput, getCollectionFieldOptions } from '../variable';
import { Instruction } from '.';

export default class extends Instruction {
  title = `{{t("Query record", { ns: "${NAMESPACE}" })}}`;
  type = 'query';
  group = 'collection';
  description = `{{t("Query records from a collection. You can use variables from upstream nodes as query conditions.", { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    collection: {
      ...collection,
      'x-reactions': [
        ...collection['x-reactions'],
        {
          target: 'params',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
              value: '{{Object.create({})}}',
            },
          },
        },
      ],
    },
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
  };
  scope = {
    useCollectionDataSource,
    useSortableFields() {
      const compile = useCompile();
      const { getCollectionFields, getInterface } = useCollectionManager_deprecated();
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
  };
  components = {
    ArrayItems,
    FilterDynamicComponent,
    SchemaComponentContext,
    WorkflowVariableInput,
  };
  useVariables({ key: name, title, config }, options) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const compile = useCompile();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getCollectionFields } = useCollectionManager_deprecated();
    // const depth = config?.params?.appends?.length
    //   ? config?.params?.appends.reduce((max, item) => Math.max(max, item.split('.').length), 1)
    //   : 0;
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
  }
  useInitializers(node): SchemaInitializerItemType | null {
    if (!node.config.collection || node.config.multiple) {
      return null;
    }

    return {
      name: node.title ?? `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: CollectionBlockInitializer,
      collection: node.config.collection,
      dataPath: `$jobsMapByNodeKey.${node.key}`,
    };
  }
}
