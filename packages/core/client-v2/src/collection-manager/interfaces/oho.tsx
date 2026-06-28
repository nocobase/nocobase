/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';
import { constraintsProps, relationshipType, reverseFieldProperties } from './properties';

export class OHOFieldInterface extends CollectionFieldInterface {
  name = 'oho';
  type = 'object';
  group = 'relation';
  order = 3;
  title = '{{t("One to one (has one)")}}';
  description = '{{t("One to one description")}}';
  isAssociation = true;
  validationType = 'object';
  default = {
    type: 'hasOne',
    uiSchema: {
      'x-component': 'AssociationField',
      'x-component-props': {
        multiple: false,
      },
    },
    reverseField: {
      interface: 'obo',
      type: 'belongsTo',
      uiSchema: {
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: false,
        },
      },
    },
  };
  availableTypes = ['hasOne'];
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
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with a letter.')}}",
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
                  'x-disabled': true,
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
                  title: '{{t("Foreign key")}}',
                  required: true,
                  default: '{{ useNewId("f_") }}',
                  description:
                    "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with a letter.')}}",
                  'x-decorator': 'FormItem',
                  'x-component': 'ForeignKey',
                  'x-validator': 'uid',
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
  };
  filterable = {
    nested: true,
    children: [],
  };
}
