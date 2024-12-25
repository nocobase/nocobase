/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FileAddOutlined } from '@ant-design/icons';

import { SchemaInitializerItemType, parseCollectionName, useCollectionDataSource, useCompile } from '@nocobase/client';

import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import CollectionFieldset from '../components/CollectionFieldset';
import { AssignedFieldsFormSchemaConfig } from '../components/AssignedFieldsFormSchemaConfig';
import { NAMESPACE } from '../locale';
import { appends, collection, values } from '../schemas/collection';
import { getCollectionFieldOptions, useGetCollectionFields } from '../variable';
import { Instruction, useNodeSavedConfig } from '.';

function useVariables({ key: name, title, config }, options) {
  const [dataSourceName, collection] = parseCollectionName(config.collection);
  const compile = useCompile();
  const getCollectionFields = useGetCollectionFields(dataSourceName);
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
        collectionName: collection,
        name,
        type: 'hasOne',
        target: collection,
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

export default class extends Instruction {
  title = `{{t("Create record", { ns: "${NAMESPACE}" })}}`;
  type = 'create';
  group = 'collection';
  description = `{{t("Add new record to a collection. You can use variables from upstream nodes to assign values to fields.", { ns: "${NAMESPACE}" })}}`;
  icon = (<FileAddOutlined style={{}} />);
  fieldset = {
    collection: {
      ...collection,
      'x-disabled': '{{ useNodeSavedConfig(["collection"]) }}',
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
    usingAssignFormSchema: {
      type: 'boolean',
    },
    assignFormSchema: {
      type: 'object',
      title: '{{t("Fields values")}}',
      'x-decorator': 'FormItem',
      'x-component': 'AssignedFieldsFormSchemaConfig',
      'x-reactions': [
        {
          dependencies: ['collection', 'usingAssignFormSchema'],
          fulfill: {
            state: {
              display: '{{($deps[0] && $deps[1]) ? "visible" : "hidden"}}',
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
              dependencies: ['collection', 'usingAssignFormSchema'],
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
      usingAssignFormSchema: true,
      assignFormSchema: {},
    };
  }
  scope = {
    useCollectionDataSource,
    useNodeSavedConfig,
  };
  components = {
    CollectionFieldset,
    AssignedFieldsFormSchemaConfig,
  };
  useVariables = useVariables;
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
