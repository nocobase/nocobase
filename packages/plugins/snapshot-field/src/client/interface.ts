import { ISchema } from '@formily/react';
import { IField } from '@nocobase/client';
import { cloneDeep } from 'lodash';
import { interfacesProperties } from '@nocobase/client';
import { useSnapshotTranslation } from './locale';
import { useMemo } from 'react';

const { defaultProps, recordPickerSelector } = interfacesProperties;

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
      if (readPretty || action === 'update') {
        schema['properties'] = {
          viewer: cloneDeep(recordPickerViewer),
        };
      } else {
        schema['properties'] = {
          selector: cloneDeep(recordPickerSelector),
        };
      }
    },
    initialize: (values: any) => {},
    properties: {
      ...defaultProps,
      target: {
        type: 'string',
        title: t('Related collection'),
        required: true,
        'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
        'x-decorator': 'FormItem',
        'x-component': 'Select',
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
