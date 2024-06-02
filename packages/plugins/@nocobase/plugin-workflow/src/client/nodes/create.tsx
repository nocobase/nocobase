/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import {
  SchemaInitializerItemType,
  useCollectionDataSource,
  useCollectionManager_deprecated,
  parseCollectionName,
  useCompile,
} from '@nocobase/client';

import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import CollectionFieldset from '../components/CollectionFieldset';
import { NAMESPACE } from '../locale';
import { appends, collection, values } from '../schemas/collection';
import { getCollectionFieldOptions } from '../variable';
import { Instruction } from '.';
import { AssignedFieldsForm } from '../components/AssignedFieldsForm';

export default class extends Instruction {
  title = `{{t("Create record", { ns: "${NAMESPACE}" })}}`;
  type = 'create';
  group = 'collection';
  description = `{{t("Add new record to a collection. You can use variables from upstream nodes to assign values to fields.", { ns: "${NAMESPACE}" })}}`;
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
              value: '{{Object.create({})}}',
            },
          },
        },
      ],
    },
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
    assignForm: {
      type: 'string',
      title: '{{t("Fields values")}}',
      'x-decorator': 'FormItem',
      'x-component': 'AssignedFieldsForm',
      'x-reactions': [
        {
          dependencies: ['collection'],
          fulfill: {
            state: {
              display: '{{($deps[0] && $self.value) ? "visible" : "hidden"}}',
            },
          },
        },
      ],
    },
    params: {
      type: 'object',
      properties: {
        values: {
          ...values,
          'x-reactions': [
            {
              dependencies: ['collection', 'assignForm'],
              fulfill: {
                state: {
                  display: '{{($deps[0] && !$deps[1]) ? "visible" : "hidden"}}',
                },
              },
            },
          ],
        },
        appends,
      },
    },
  };
  createDefaultConfig() {
    return {
      assignForm: uid(),
    };
  }
  scope = {
    useCollectionDataSource,
  };
  components = {
    CollectionFieldset,
    AssignedFieldsForm,
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
    if (!node.config.collection) {
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
