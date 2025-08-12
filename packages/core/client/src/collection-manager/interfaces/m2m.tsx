/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { getUniqueKeyFromCollection } from './utils';
import { defaultProps, relationshipType, reverseFieldProperties } from './properties';

export class M2MFieldInterface extends CollectionFieldInterface {
  name = 'm2m';
  type = 'object';
  group = 'relation';
  order = 6;
  title = '{{t("Many to many")}}';
  description = '{{t("Many to many description")}}';
  isAssociation = true;
  default = {
    type: 'belongsToMany',
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
      interface: 'm2m',
      type: 'belongsToMany',
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
    },
  };
  availableTypes = ['belongsToMany'];
  validationType = 'object';
  schemaInitialize(schema: ISchema, { field, readPretty, block, targetCollection }) {
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
  initialize(values: any) {
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
  }
  properties = {
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
                  'x-component': 'ThroughCollection',
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
                  type: 'string',
                  title: '{{t("Source key")}}',
                  description: "{{t('Field values must be unique.')}}",
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
                  'x-component': 'ForeignKey',
                  'x-validator': 'uid',
                  'x-disabled': '{{ !createOnly||override }}',
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
                  'x-component': 'ForeignKey',
                  'x-validator': 'uid',
                  'x-disabled': '{{ !createOnly||override }}',
                },
              },
            },
            col23: {
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
