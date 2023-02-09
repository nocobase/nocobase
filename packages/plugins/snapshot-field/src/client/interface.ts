import { ISchema } from '@formily/react';
import type { Field } from '@formily/core';
import { IField, interfacesProperties, useCollectionManager, useCompile, useRecord } from '@nocobase/client';
import { cloneDeep } from 'lodash';
import { useMemo } from 'react';
import { useSnapshotTranslation } from './locale';

const { defaultProps } = interfacesProperties;

const APPENDS = 'appends';
const TARGET_FIELD = 'targetField';

export const useTopRecord = () => {
  let record = useRecord();

  while (record && Object.keys(record.__parent).length > 0) {
    record = record.__parent;
  }
  return record;
};

const onTargetFieldChange = (field: Field) => {
  field.value; // for watch
  const targetField = field.query(`.${APPENDS}`).take() as Field | undefined;
  console.log(field.path);
  if (!targetField) return;
  !targetField.getState().disabled && targetField.setValue([]);
};

export const useSnapshotInterface = () => {
  const { t } = useSnapshotTranslation();

  const recordPickerViewer = {
    type: 'void',
    title: t('View record'),
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
            title: t('Detail'),
            'x-component': 'Tabs.TabPane',
            'x-designer': 'Tabs.Designer',
            'x-component-props': {},
            properties: {
              grid: {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': 'SnapshotBlockInitializers',
                properties: {},
              },
            },
          },
        },
      },
    },
  };

  const snapshot: IField = {
    name: 'snapshot',
    type: 'object',
    group: 'advanced',
    title: t('Snapshot'),
    description: t('Snapshot to description'),
    default: {
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
    },
    schemaInitialize(schema: ISchema, { field, readPretty, action, block }) {
      schema['properties'] = {
        viewer: cloneDeep(recordPickerViewer),
      };
    },
    initialize: (values: any) => {},
    properties: {
      ...defaultProps,
      [TARGET_FIELD]: {
        type: 'string',
        title: t('Association field'),
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'SnapshotOwnerCollectionFieldsSelect',
        'x-disabled': '{{ !createOnly }}',
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
        title: t('Deep copy fields'),
        description: t('When a record is created, relational data is backed up in a snapshot'),
        'x-decorator': 'FormItem',
        'x-component': 'AppendsTreeSelect',
        'x-disabled': '{{ !createOnly }}',
        'x-reactions': [
          {
            dependencies: [TARGET_FIELD],
            when: '{{$deps[0]}}',
            fulfill: {
              run: '{{$self.setValue($self.disabled ? $self.value : [])}}',
            },
          },
        ],
      },
    },
  };

  return useMemo<IField>(() => snapshot, [t]);
};
