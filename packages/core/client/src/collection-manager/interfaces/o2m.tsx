import { ISchema } from '@formily/react';
import { Collection } from '../../data-source';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { constraintsProps, relationshipType, reverseFieldProperties } from './properties';

export class O2MFieldInterface extends CollectionFieldInterface {
  name = 'o2m';
  type = 'object';
  group = 'relation';
  order = 4;
  title = '{{t("One to many")}}';
  description = '{{t("One to many description")}}';
  isAssociation = true;
  default = {
    type: 'hasMany',
    // name,
    uiSchema: {
      // title,
      'x-component': 'AssociationField',
      'x-component-props': {
        // mode: 'tags',
        multiple: true,
        // fieldNames: {
        //   label: 'id',
        //   value: 'id',
        // },
      },
    },
    reverseField: {
      interface: 'm2o',
      type: 'belongsTo',
      // name,
      uiSchema: {
        // title,
        'x-component': 'AssociationField',
        'x-component-props': {
          // mode: 'tags',
          multiple: false,
          // fieldNames: {
          //   label: 'id',
          //   value: 'id',
          // },
        },
      },
    },
  };
  availableTypes = ['hasMany'];
  schemaInitialize(schema: ISchema, { field, block, readPretty, targetCollection }) {
    // schema['type'] = 'array';
    schema['x-component-props'] = schema['x-component-props'] || {};
    schema['x-component-props'].fieldNames = schema['x-component-props'].fieldNames || {
      value: getUniqueKeyFromCollection(targetCollection),
    };
    schema['x-component-props'].fieldNames.label =
      schema['x-component-props'].fieldNames?.label ||
      targetCollection?.titleField ||
      getUniqueKeyFromCollection(targetCollection);
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
      // 预览文件时需要的参数
      schema['x-component-props']['size'] = 'small';
    }
  }
  properties = {
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
                  type: 'string',
                  title: '{{t("Source key")}}',
                  description: "{{t('Field values must be unique.')}}",
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
                  'x-component': 'ForeignKey',
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
                  type: 'string',
                  title: '{{t("Target key")}}',
                  'x-decorator': 'FormItem',
                  'x-component': 'TargetKey',
                  'x-disabled': '{{ !createOnly }}',
                  description: "{{t('Field values must be unique.')}}",
                },
              },
            },
          },
        },
      },
    },
    ...constraintsProps,
    ...reverseFieldProperties,
  };
  filterable = {
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
  };
}

export function getUniqueKeyFromCollection(collection: Collection) {
  return collection?.filterTargetKey || collection?.getPrimaryKey() || 'id';
}
