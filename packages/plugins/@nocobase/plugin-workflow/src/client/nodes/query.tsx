/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FileSearchOutlined } from '@ant-design/icons';
import { ArrayItems } from '@formily/antd-v5';

import {
  SchemaComponentContext,
  SchemaInitializerItemType,
  parseCollectionName,
  useApp,
  useCollectionDataSource,
  useCompile,
} from '@nocobase/client';

import { useForm } from '@formily/react';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { NAMESPACE } from '../locale';
import { appends, collection, filter, pagination, sort } from '../schemas/collection';
import { WorkflowVariableInput, getCollectionFieldOptions, useGetDataSourceCollectionManager } from '../variable';
import { Instruction, useNodeSavedConfig } from '.';
import { RadioWithTooltip } from '../components';

function useVariables({ key: name, title, config }, options) {
  const [dataSourceName, collection] = parseCollectionName(config.collection);
  const compile = useCompile();
  const collectionManager = useGetDataSourceCollectionManager(dataSourceName);
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
    collectionManager,
  });

  return result;
}

export default class extends Instruction {
  title = `{{t("Query record", { ns: "${NAMESPACE}" })}}`;
  type = 'query';
  group = 'collection';
  description = `{{t("Query records from a collection. You can use variables from upstream nodes as query conditions.", { ns: "${NAMESPACE}" })}}`;
  icon = (<FileSearchOutlined style={{}} />);
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
              visible: '{{!!$self.value}}',
              value: '{{Object.create({})}}',
            },
          },
        },
      ],
    },
    multiple: {
      type: 'boolean',
      title: `{{t("Result type", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: [
          {
            label: `{{t("Single record", { ns: "${NAMESPACE}" })}}`,
            value: false,
            tooltip: `{{t("The result will be an object of the first matching record only, or null if no matched record.", { ns: "${NAMESPACE}" })}}`,
          },
          {
            label: `{{t("Multiple records", { ns: "${NAMESPACE}" })}}`,
            value: true,
            tooltip: `{{t("The result will be an array containing matched records, or an empty one if no matching records. This can be used to be processed in a loop node.", { ns: "${NAMESPACE}" })}}`,
          },
        ],
      },
      required: true,
      default: false,
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
    useNodeSavedConfig,
    useCollectionDataSource,
    useSortableFields() {
      const compile = useCompile();
      const { values } = useForm();
      const [dataSourceName, collection] = parseCollectionName(values.collection);
      const app = useApp();
      const { collectionManager } = app.dataSourceManager.getDataSource(dataSourceName);
      const fields = collectionManager.getCollectionFields(collection);
      return fields
        .filter((field: any) => {
          if (!field.interface) {
            return false;
          }
          const fieldInterface = app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
            field.interface,
          );
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
    RadioWithTooltip,
  };
  useVariables = useVariables;
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
