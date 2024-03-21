import type { Field } from '@formily/core';
import { ISchema, useForm } from '@formily/react';
import {
  CollectionFieldInterface,
  interfacesProperties,
  useCollectionManager_deprecated,
  useRecord,
} from '@nocobase/client';
import lodash from 'lodash';
import { NAMESPACE } from './locale';

const { defaultProps } = interfacesProperties;

const APPENDS = 'appends';
const TARGET_FIELD = 'targetField';

export const useTopRecord = () => {
  let record = useRecord();

  while (record?.__parent && Object.keys(record.__parent).length > 0) {
    record = record.__parent;
  }
  return record;
};

function useRecordCollection() {
  const { getCollectionField } = useCollectionManager_deprecated();
  const record = useTopRecord();
  const formValues = useForm().values;
  return getCollectionField(`${record.name}.${formValues.targetField}`)?.target;
}

const onTargetFieldChange = (field: Field) => {
  field.value; // for watch
  const targetField = field.query(`.${APPENDS}`).take() as Field | undefined;
  console.log(field.path);
  if (!targetField) return;
  !targetField.getState().disabled && targetField.setValue([]);
};

function MakeFieldsPathOptions(fields, appends = []) {
  const { getCollection } = useCollectionManager_deprecated();
  const options = [];
  fields.forEach((field) => {
    if (['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)) {
      const currentAppends = appends.filter((key) => `${key}.`.startsWith(`${field.name}.`));
      if (currentAppends.length) {
        const nextCollection = getCollection(field.target);
        const nextAppends = currentAppends
          .filter((key) => key !== field.name)
          .map((key) => key.replace(`${field.name}.`, ''))
          .filter((key) => key);
        options.push({
          label: field.uiSchema?.title ?? field.name,
          value: field.name,
          children: MakeFieldsPathOptions(nextCollection.fields, nextAppends),
        });
      }
    } else {
      options.push({
        label: field.uiSchema?.title ?? field.name,
        value: field.name,
      });
    }
  });
  return options;
}

const recordPickerViewer = {
  type: 'void',
  title: `{{t('View record')}}`,
  'x-component': 'RecordPicker.Viewer',
  'x-component-props': {
    className: 'nb-action-popup',
  },
  properties: {
    tabs: {
      type: 'void',
      'x-component': 'Tabs',
      'x-component-props': {},
      // 'x-initializer': 'TabPaneInitializers',
      properties: {
        tab1: {
          type: 'void',
          title: `{{t('Detail')}}`,
          'x-component': 'Tabs.TabPane',
          'x-designer': 'Tabs.Designer',
          'x-component-props': {},
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'popup:snapshot:addBlock',
              properties: {},
            },
          },
        },
      },
    },
  },
};

export class SnapshotFieldInterface extends CollectionFieldInterface {
  name = 'snapshot';
  type = 'object';
  group = 'advanced';
  title = `{{t('Snapshot', {ns: '${NAMESPACE}'})}}`;
  description = `{{t('When adding a new record, create a snapshot for its relational record and save in the current record. The snapshot is not updated when the record is subsequently updated.', {ns: '${NAMESPACE}'})}}`;
  default = {
    type: 'snapshot',
    // name,
    uiSchema: {
      // title,
      'x-component': 'SnapshotRecordPicker',
      'x-component-props': {
        multiple: true,
        fieldNames: {
          label: 'id',
          value: 'id',
        },
      },
    },
  };
  schemaInitialize(schema: ISchema, { field, readPretty, action, block }) {
    schema['properties'] = {
      viewer: lodash.cloneDeep(recordPickerViewer),
    };
  }
  initialize(values: any) {}
  usePathOptions(field) {
    const { appends = [], targetCollection } = field;
    // eslint-disable-next-line
    const { getCollection } = useCollectionManager_deprecated();
    const { fields } = getCollection(targetCollection);

    const result = MakeFieldsPathOptions(fields, appends);

    return [
      {
        label: `{{t('Snapshot data', { ns: '${NAMESPACE}' })}}`,
        value: 'data',
        children: result,
      },
    ];
  }
  properties = {
    ...defaultProps,
    [TARGET_FIELD]: {
      type: 'string',
      title: `{{t('The association field to snapshot', {ns: '${NAMESPACE}'})}}`,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'SnapshotOwnerCollectionFieldsSelect',
      'x-disabled': '{{ !createOnly || isOverride }}',
      'x-reactions': [
        {
          target: APPENDS,
          when: '{{$self.value != undefined}}',
          fulfill: {
            state: {
              visible: true,
            },
          },
          otherwise: {
            state: {
              visible: false,
            },
          },
        },
      ],
    },
    [APPENDS]: {
      type: 'string',
      title: `{{t("Snapshot the snapshot's association fields", {ns: "${NAMESPACE}"})}}`,
      'x-decorator': 'FormItem',
      'x-component': 'AppendsTreeSelect',
      'x-component-props': {
        multiple: true,
        useCollection: useRecordCollection,
      },
      'x-reactions': [
        {
          dependencies: [TARGET_FIELD],
          when: '{{$deps[0]}}',
          fulfill: {
            run: '{{$self.setValue($self.value)}}',
          },
        },
      ],
    },
  };
}
