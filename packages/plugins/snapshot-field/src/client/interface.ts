import { ISchema } from '@formily/react';
import { IField, interfacesProperties, useCollectionManager, useCompile, useRecord } from '@nocobase/client';
import { cloneDeep } from 'lodash';
import { useMemo } from 'react';
import { useSnapshotTranslation } from './locale';

const { defaultProps } = interfacesProperties;

const APPENDS = 'appends';

export const useTopRecord = () => {
  let record = useRecord();

  while (record && Object.keys(record.__parent).length > 0) {
    record = record.__parent;
  }
  return record;
};

export const useSnapshotOwnerCollectionFields = () => {
  const record = useTopRecord();
  const { getCollection } = useCollectionManager();
  const collection = getCollection(record.name);
  const compile = useCompile();
  return (field: any, options?: any) => {
    field.loading = true;
    field.dataSource = collection.fields
      .filter((i) => !!i.target && !!i.interface)
      .map((i) => ({ ...i, label: compile(i.uiSchema?.title), value: i.name }));
    field.loading = false;
  };
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
          // mode: 'tags',
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
      targetField: {
        type: 'string',
        title: t('Target association field'),
        required: true,
        'x-reactions': [
          '{{useSnapshotOwnerCollectionFields()}}',
          {
            target: APPENDS,
            when: '{{$self.value == undefined}}',
            fulfill: {
              state: {
                visible: false,
              },
            },
            otherwise: {
              state: {
                visible: true,
              },
            },
          },
        ],
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-disabled': '{{ !createOnly }}',
      },
      [APPENDS]: {
        type: 'string',
        title: t('Association field appends'),
        'x-decorator': 'FormItem',
        'x-component': 'AppendsTreeSelect',
        'x-disabled': '{{ !createOnly }}',
      },
      'uiSchema.x-component-props.multiple': {
        type: 'boolean',
        'x-content': t('Allow linking to multiple records'),
        'x-decorator': 'FormItem',
        'x-component': 'Checkbox',
      },
    },
  };

  return useMemo<IField>(() => snapshot, [t]);
};
