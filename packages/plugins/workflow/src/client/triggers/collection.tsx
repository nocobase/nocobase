import { SchemaInitializerItemOptions, useCollectionDataSource } from '@nocobase/client';

import { appends, collection, filter } from '../schemas/collection';
import { useCollectionFieldOptions } from '../variable';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { CollectionFieldInitializers } from '../components/CollectionFieldInitializers';
import { NAMESPACE, useWorkflowTranslation } from '../locale';
import { FieldsSelect } from '../components/FieldsSelect';

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
    collection: {
      ...collection,
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
      ],
    },
    mode: {
      type: 'number',
      title: `{{t("Trigger on", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        dropdownMatchSelectWidth: false,
        options: collectionModeOptions,
        placeholder: `{{t("Trigger on", { ns: "${NAMESPACE}" })}}`,
      },
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
        placeholder: '{{t("Select Field")}}',
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
  },
  scope: {
    useCollectionDataSource,
  },
  components: {
    FieldsSelect,
  },
  useVariables(config, options) {
    const { t } = useWorkflowTranslation();
    const rootFields = [
      {
        collectionName: config.collection,
        name: 'data',
        type: 'hasOne',
        target: config.collection,
        uiSchema: {
          title: t('Trigger data'),
        },
      },
    ];
    const result = useCollectionFieldOptions({
      ...options,
      fields: rootFields,
      depth: options?.depth ?? (config.appends?.length ? 2 : 1),
    });
    return result;
  },
  useInitializers(config): SchemaInitializerItemOptions | null {
    if (!config.collection) {
      return null;
    }

    return {
      type: 'item',
      key: 'triggerData',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      component: CollectionBlockInitializer,
      collection: config.collection,
      dataSource: '{{$context.data}}',
    };
  },
  initializers: {
    CollectionFieldInitializers,
  },
};
