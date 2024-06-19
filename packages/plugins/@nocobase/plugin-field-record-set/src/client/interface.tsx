/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { Collection, CollectionFieldInterface } from '@nocobase/client';

function getUniqueKeyFromCollection(collection: Collection) {
  return collection?.filterTargetKey || collection?.getPrimaryKey() || 'id';
}

export class RecordSetFieldInterface extends CollectionFieldInterface {
  name = 'recordSet';
  type = 'object';
  group = 'relation';
  order = 6;
  title = '{{t("Record set")}}';
  description = '{{t("Record set description")}}';
  isAssociation = true;
  default = {
    type: 'recordSet',
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
  };
  availableTypes = ['recordSet'];
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
