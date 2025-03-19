/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemType, parseCollectionName, useCollectionDataSource, useCompile } from '@nocobase/client';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { FieldsSelect } from '../components/FieldsSelect';
import { NAMESPACE, lang } from '../locale';
import { appends, collection, filter } from '../schemas/collection';
import { getCollectionFieldOptions, useGetCollectionFields } from '../variable';
import { useWorkflowAnyExecuted } from '../hooks';
import { Trigger } from '.';
import { TriggerCollectionRecordSelect } from '../components/TriggerCollectionRecordSelect';

const COLLECTION_TRIGGER_MODE = {
  CREATED: 1,
  UPDATED: 2,
  SAVED: 3,
  DELETED: 4,
};

const collectionModeOptions = [
  { label: `{{t("After record added", { ns: "${NAMESPACE}" })}}`, value: COLLECTION_TRIGGER_MODE.CREATED },
  { label: `{{t("After record updated", { ns: "${NAMESPACE}" })}}`, value: COLLECTION_TRIGGER_MODE.UPDATED },
  { label: `{{t("After record added or updated", { ns: "${NAMESPACE}" })}}`, value: COLLECTION_TRIGGER_MODE.SAVED },
  { label: `{{t("After record deleted", { ns: "${NAMESPACE}" })}}`, value: COLLECTION_TRIGGER_MODE.DELETED },
];

function useVariables(config, options) {
  const [dataSourceName, collection] = parseCollectionName(config.collection);
  const compile = useCompile();
  const getCollectionFields = useGetCollectionFields(dataSourceName);

  const rootFields = [
    {
      collectionName: collection,
      name: 'data',
      type: 'hasOne',
      target: collection,
      uiSchema: {
        title: lang('Trigger data'),
      },
    },
  ];
  // const depth = config.appends?.length
  //   ? config.appends.reduce((max, item) => Math.max(max, item.split('.').length), 1) + 1
  //   : 1;
  const result = getCollectionFieldOptions({
    // depth,
    appends: ['data', ...(config.appends?.map((item) => `data.${item}`) || [])],
    ...options,
    fields: rootFields,
    compile,
    getCollectionFields,
  });
  return result;
}

export default class extends Trigger {
  title = `{{t("Collection event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('Triggered when data changes in the collection, such as after adding, updating, or deleting a record. Unlike "Post-action event", Collection event listens for data changes rather than HTTP requests. Unless you understand the exact meaning, it is recommended to use "Post-action event".', { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    collection: {
      ...collection,
      'x-disabled': '{{ useWorkflowAnyExecuted() }}',
      'x-component-props': {
        dataSourceFilter(item) {
          return item.options.key === 'main' || item.options.isDBInstance;
        },
      },
      ['x-reactions']: [
        ...collection['x-reactions'],
        {
          target: 'changed',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: [],
            },
          },
        },
        {
          target: 'condition',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: null,
            },
          },
        },
        {
          target: 'appends',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: [],
            },
          },
        },
      ],
    },
    mode: {
      type: 'number',
      title: `{{t("Trigger on", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        popupMatchSelectWidth: false,
        placeholder: `{{t("Trigger on", { ns: "${NAMESPACE}" })}}`,
        className: 'auto-width',
      },
      enum: collectionModeOptions,
      required: true,
      'x-reactions': [
        {
          dependencies: ['collection'],
          fulfill: {
            state: {
              visible: '{{!!$deps[0]}}',
            },
          },
        },
      ],
    },
    changed: {
      type: 'array',
      title: `{{t("Changed fields", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Triggered only if one of the selected fields changes. If unselected, it means that it will be triggered when any field changes. When record is added or deleted, any field is considered to have been changed.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'FieldsSelect',
      'x-component-props': {
        mode: 'multiple',
        placeholder: '{{t("Select field")}}',
        filter(field) {
          return (
            !field.hidden &&
            (field.uiSchema ? !field.uiSchema['x-read-pretty'] : true) &&
            !['linkTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)
          );
        },
      },
      'x-reactions': [
        {
          dependencies: ['collection', 'mode'],
          fulfill: {
            state: {
              visible: `{{!!$deps[0] && ($deps[1] & ${COLLECTION_TRIGGER_MODE.UPDATED})}}`,
            },
          },
        },
      ],
    },
    condition: {
      ...filter,
      title: `{{t("Only triggers when match conditions", { ns: "${NAMESPACE}" })}}`,
      'x-component-props': {},
      'x-reactions': [
        {
          dependencies: ['collection', 'mode'],
          fulfill: {
            state: {
              visible: `{{!!$deps[0] && !($deps[1] & ${COLLECTION_TRIGGER_MODE.DELETED})}}`,
            },
          },
        },
      ],
    },
    appends: {
      ...appends,
      'x-reactions': [
        ...appends['x-reactions'],
        {
          dependencies: ['mode'],
          fulfill: {
            state: {
              visible: `{{!($deps[0] & ${COLLECTION_TRIGGER_MODE.DELETED})}}`,
            },
          },
        },
      ],
    },
  };
  scope = {
    useCollectionDataSource,
    useWorkflowAnyExecuted,
  };
  components = {
    FieldsSelect,
    TriggerCollectionRecordSelect,
  };
  triggerFieldset = {
    data: {
      type: 'object',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Choose a record or primary key of a record in the collection to trigger.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'TriggerCollectionRecordSelect',
      default: null,
      required: true,
    },
  };
  validate(values) {
    return values.collection && values.mode;
  }
  useVariables = useVariables;
  useInitializers(config): SchemaInitializerItemType | null {
    if (!config.collection) {
      return null;
    }

    return {
      name: 'triggerData',
      type: 'item',
      key: 'triggerData',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      Component: CollectionBlockInitializer,
      collection: config.collection,
      dataPath: '$context.data',
    };
  }
}
