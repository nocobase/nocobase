import React from 'react';
import { Select } from 'antd';
import { onFieldValueChange } from '@formily/core';
import { observer, useForm, useFormEffects } from '@formily/react';

import {
  SchemaInitializerItemOptions,
  useCollectionDataSource,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';

import { collection, filter } from '../schemas/collection';
import { useCollectionFieldOptions } from '../components/CollectionFieldSelect';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { CollectionFieldInitializers } from '../components/CollectionFieldInitializers';
import { NAMESPACE, useWorkflowTranslation } from '../locale';

const FieldsSelect = observer((props) => {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { values, clearFormGraph, setValuesIn } = useForm();
  const fields = getCollectionFields(values?.config?.collection);
  useFormEffects(() => {
    onFieldValueChange('config.collection', (field) => {
      clearFormGraph('config.changed');
      setValuesIn('config.condition', null);
    });
  });

  return (
    <Select {...props}>
      {fields
        .filter(field => (
          !field.hidden
          && (field.uiSchema ? !field.uiSchema['x-read-pretty'] : true)
          && !['linkTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)
        ))
        .map(field => (
          <Select.Option key={field.name} value={field.name}>{compile(field.uiSchema?.title)}</Select.Option>
        ))}
    </Select>
  );
});

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

export default {
  title: `{{t("Collection event", { ns: "${NAMESPACE}" })}}`,
  type: 'collection',
  fieldset: {
    'config.collection': {
      ...collection,
      ['x-reactions']: [
        ...collection['x-reactions'],
        {
          target: 'config.mode',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        },
        {
          target: 'config.changed',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        },
        {
          target: 'config.condition',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        }
      ]
    },
    'config.mode': {
      type: 'number',
      title: `{{t("Trigger on", { ns: "${NAMESPACE}" })}}`,
      name: 'config.mode',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: collectionModeOptions,
        placeholder: `{{t("Trigger on", { ns: "${NAMESPACE}" })}}`
      },
      required: true,
      'x-reactions': [
        {
          target: 'config.changed',
          fulfill: {
            state: {
              disabled: `{{!($self.value & ${COLLECTION_TRIGGER_MODE.UPDATED})}}`,
            },
          }
        },
      ]
    },
    'config.changed': {
      type: 'array',
      name: 'changed',
      title: `{{t("Changed fields", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Triggered only if one of the selected fields changes. If unselected, it means that it will be triggered when any field changes. When record is added or deleted, any field is considered to have been changed.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'FieldsSelect',
      'x-component-props': {
        mode: 'multiple',
        placeholder: '{{t("Select Field")}}'
      }
    },
    'config.condition': {
      ...filter,
      name: 'config.condition',
      title: `{{t("Only triggers when match conditions", { ns: "${NAMESPACE}" })}}`
    }
  },
  scope: {
    useCollectionDataSource
  },
  components: {
    FieldsSelect
  },
  getOptions(config, types) {
    const { t } = useWorkflowTranslation();
    const fieldOptions = useCollectionFieldOptions({ collection: config.collection, types });
    const options: any[] = [
      ...(fieldOptions?.length ? [{ label: t('Trigger data'), key: 'data', value: 'data', children: fieldOptions }] : []),
    ];
    return options;
  },
  useInitializers(config): SchemaInitializerItemOptions | null {
    if (!config.collection) {
      return null;
    }

    return {
      type: 'item',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      component: CollectionBlockInitializer,
      collection: config.collection,
      dataSource: '{{$context.data}}'
    };
  },
  initializers: {
    CollectionFieldInitializers
  }
};
