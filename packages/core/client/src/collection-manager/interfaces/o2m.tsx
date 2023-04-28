import { ISchema } from '@formily/react';
import { cloneDeep } from 'lodash';
import { uid } from '@formily/shared';
import {
  constraintsProps,
  recordPickerSelector,
  recordPickerViewer,
  relationshipType,
  reverseFieldProperties,
} from './properties';
import { IField } from './types';

export const o2m: IField = {
  name: 'o2m',
  type: 'object',
  group: 'relation',
  order: 4,
  title: '{{t("One to many")}}',
  description: '{{t("One to many description")}}',
  isAssociation: true,
  default: {
    type: 'hasMany',
    // name,
    uiSchema: {
      // title,
      'x-component': 'Select',
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
      interface: 'm2o',
      type: 'belongsTo',
      // name,
      uiSchema: {
        // title,
        'x-component': 'Select',
        'x-component-props': {
          // mode: 'tags',
          multiple: false,
          fieldNames: {
            label: 'id',
            value: 'id',
          },
        },
      },
    },
  },
  availableTypes: ['hasMany'],
  schemaInitialize(schema: ISchema, { field, block, readPretty, targetCollection, action }) {
    if (targetCollection?.titleField && schema['x-component-props']) {
      schema['x-component-props'].fieldNames = schema['x-component-props'].fieldNames || { value: 'id' };
      schema['x-component-props'].fieldNames.label = targetCollection.titleField;
    }

    if (block === 'Form') {
      if (schema['x-component'] === 'TableField') {
        const association = `${field.collectionName}.${field.name}`;
        schema['type'] = 'void';
        schema['properties'] = {
          block: {
            type: 'void',
            'x-decorator': 'TableFieldProvider',
            'x-acl-action': `${association}:list`,
            'x-decorator-props': {
              collection: field.target,
              association: association,
              resource: association,
              action: 'list',
              params: {
                paginate: false,
              },
              showIndex: true,
              dragSort: false,
              fieldName: field.name,
            },
            properties: {
              actions: {
                type: 'void',
                'x-initializer': 'SubTableActionInitializers',
                'x-component': 'TableField.ActionBar',
                'x-component-props': {},
              },
              [field.name]: {
                type: 'array',
                'x-initializer': 'TableColumnInitializers',
                'x-component': 'TableV2',
                'x-component-props': {
                  rowSelection: {
                    type: 'checkbox',
                  },
                  useProps: '{{ useTableFieldProps }}',
                },
              },
            },
          },
        };
      } else if (schema['x-component'] === 'SubForm') {
        const association = `${field.collectionName}.${field.name}`;
        schema.type = 'void';
        schema.properties = {
          array: {
            type: 'array',
            'x-component': 'ArrayCards',
            'x-component-props': {
              headStyle: { display: 'none' },
            },
            default: [{}],
            items: {
              type: 'object',
              properties: {
                block: {
                  type: 'void',
                  'x-decorator': 'SubFormProvider',
                  'x-decorator-props': {
                    collection: field.target,
                    association: association,
                    resource: association,
                    action: action,
                    fieldName: field.name,
                    readPretty,
                  },
                  'x-component': 'div',
                  'x-component-props': {
                    bordered: true,
                  },
                  properties: {
                    [uid()]: {
                      type: 'object',
                      'x-component': 'FormV2',
                      'x-component-props': {
                        useProps: '{{ useSubFormProps }}',
                      },
                      properties: {
                        __form_grid: {
                          type: 'object',
                          'x-component': 'Grid',
                          'x-initializer': 'FormItemInitializers',
                          properties: {},
                        },
                      },
                    },
                  },
                },
              },
            },
            properties: {
              addition: {
                type: 'void',
                title: 'Add new',
                'x-component': 'ArrayCards.Addition',
              },
            },
          },
        };
      } else if (schema['x-component'] === 'AssociationSelect') {
        Object.assign(schema, {
          type: 'string',
          'x-designer': 'AssociationSelect.Designer',
        });
      } else {
        schema.type = 'string';
        schema['properties'] = {
          viewer: cloneDeep(recordPickerViewer),
          selector: cloneDeep(recordPickerSelector),
        };
      }
      return schema;
    }

    if (readPretty) {
      schema['properties'] = {
        viewer: cloneDeep(recordPickerViewer),
      };
    } else {
      schema['properties'] = {
        selector: cloneDeep(recordPickerSelector),
      };
    }

    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;

      // 预览文件时需要的参数
      schema['x-component-props']['size'] = 'small';
    }
  },
  properties: {
    'uiSchema.title': {
      type: 'string',
      title: '{{t("Field display name")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Field name")}}',
      required: true,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
    },
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
                  type: 'void',
                  title: '{{t("Source collection")}}',
                  'x-decorator': 'FormItem',
                  'x-component': 'SourceCollection',
                },
              },
            },
            col12: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                target: {
                  type: 'string',
                  title: '{{t("Target collection")}}',
                  required: true,
                  'x-reactions': ['{{useAsyncDataSource(loadCollections, ["file"])}}'],
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
                  default: 'id',
                  enum: [{ label: 'ID', value: 'id' }],
                  'x-decorator': 'FormItem',
                  'x-component': 'SourceKey',
                },
              },
            },
            col22: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                foreignKey: {
                  type: 'string',
                  title: '{{t("Foreign key")}}',
                  required: true,
                  default: '{{ useNewId("f_") }}',
                  description:
                    "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-validator': 'uid',
                  'x-disabled': '{{ !createOnly }}',
                },
              },
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
    ...constraintsProps,
    ...reverseFieldProperties,
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
