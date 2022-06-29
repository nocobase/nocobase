import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { cloneDeep } from 'lodash';
import { defaultProps, recordPickerSelector, recordPickerViewer, relationshipType } from './properties';
import { IField } from './types';

export const m2m: IField = {
  name: 'm2m',
  type: 'object',
  group: 'relation',
  order: 6,
  title: '{{t("Many to many")}}',
  description: '{{t("Many to many description")}}',
  isAssociation: true,
  default: {
    type: 'belongsToMany',
    // name,
    uiSchema: {
      // title,
      'x-component': 'RecordPicker',
      'x-component-props': {
        // mode: 'tags',
        multiple: true,
        fieldNames: {
          label: 'id',
          value: 'id',
        },
      },
    },
    reverseField: {
      interface: 'm2m',
      type: 'belongsToMany',
      // name,
      uiSchema: {
        // title,
        'x-component': 'RecordPicker',
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
  },
  schemaInitialize(schema: ISchema, { readPretty, block }) {
    if (block === 'Form') {
      schema['properties'] = {
        viewer: cloneDeep(recordPickerViewer),
        selector: cloneDeep(recordPickerSelector),
      };
    } else {
      if (readPretty) {
        schema['properties'] = {
          viewer: cloneDeep(recordPickerViewer),
        };
      } else {
        schema['properties'] = {
          selector: cloneDeep(recordPickerSelector),
        }
      }
    }
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
  },
  initialize: (values: any) => {
    if (values.type === 'belongsToMany') {
      if (!values.through) {
        values.through = `t_${uid()}`;
      }
      if (!values.foreignKey) {
        values.foreignKey = `f_${uid()}`;
      }
      if (!values.otherKey) {
        values.otherKey = `f_${uid()}`;
      }
      if (!values.sourceKey) {
        values.sourceKey = 'id';
      }
      if (!values.targetKey) {
        values.targetKey = 'id';
      }
    }
  },
  properties: {
    ...defaultProps,
    type: relationshipType,
    grid: {
      type: 'void',
      'x-component': 'Grid',
      properties: {
        row1: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col11: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                source: {
                  type: 'string',
                  title: '{{t("Source collection")}}',
                  'x-decorator': 'FormItem',
                  'x-component': 'SourceCollection',
                  'x-disabled': true,
                },
              },
            },
            col12: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                through: {
                  type: 'string',
                  title: '{{t("Through collection")}}',
                  description: '{{ t("Generated automatically if left blank") }}',
                  'x-decorator': 'FormItem',
                  'x-disabled': '{{ !createOnly }}',
                  'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
                  'x-component': 'Select',
                  'x-component-props': {
                    allowClear: true,
                  },
                },
              },
            },
            col13: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                target: {
                  type: 'string',
                  title: '{{t("Target collection")}}',
                  required: true,
                  'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
                  'x-decorator': 'FormItem',
                  'x-component': 'Select',
                  'x-disabled': '{{ !createOnly }}',
                },
              },
            },
          },
        },
        row2: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col21: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                sourceKey: {
                  type: 'void',
                  title: '{{t("Source key")}}',
                  'x-decorator': 'FormItem',
                  'x-component': 'SourceKey',
                  'x-disabled': '{{ !createOnly }}',
                },
              },
            },
            col22: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                foreignKey: {
                  type: 'string',
                  title: '{{t("Foreign key 1")}}',
                  required: true,
                  default: '{{ useNewId("f_") }}',
                  description:
                    "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-disabled': '{{ !createOnly }}',
                },
              },
            },
            col23: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {},
            },
          },
        },
        row3: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col21: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {},
            },
            col22: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                otherKey: {
                  type: 'string',
                  title: '{{t("Foreign key 2")}}',
                  required: true,
                  default: '{{ useNewId("f_") }}',
                  description:
                    "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-disabled': '{{ !createOnly }}',
                },
              },
            },
            col23: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                targetKey: {
                  type: 'void',
                  title: '{{t("Target key")}}',
                  'x-decorator': 'FormItem',
                  'x-component': 'TargetKey',
                  'x-disabled': '{{ !createOnly }}',
                },
              },
            },
          },
        },
      },
    },
  },
  filterable: {
    nested: true,
    children: [
      // {
      //   name: 'id',
      //   title: '{{t("Exists")}}',
      //   operators: [
      //     { label: '{{t("exists")}}', value: '$exists', noValue: true },
      //     { label: '{{t("not exists")}}', value: '$notExists', noValue: true },
      //   ],
      //   schema: {
      //     title: '{{t("Exists")}}',
      //     type: 'string',
      //     'x-component': 'Input',
      //   },
      // },
    ],
  },
};
