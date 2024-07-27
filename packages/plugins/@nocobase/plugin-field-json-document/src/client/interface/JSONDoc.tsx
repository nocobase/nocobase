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

export class JSONDocObjectInterface extends CollectionFieldInterface {
  name = 'JSONDocObject';
  type = 'object';
  group = 'advanced';
  order = 4;
  title = '{{t("JSON Document (Object)")}}';
  description = '{{t("One to one description")}}';
  isAssociation = true;
  default = {
    type: 'JSONDocument',
    // name,
    uiSchema: {
      // title,
      'x-component': 'AssociationField',
      'x-component-props': {
        multiple: false,
        fieldNames: {
          label: '{{t("Index")}}',
          value: '__index',
        },
      },
    },
  };
  availableTypes = ['JSONDocument'];
  schemaInitialize(schema: ISchema, { field, block, readPretty, action, targetCollection }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;

      // 预览文件时需要的参数
      schema['x-component-props']['size'] = 'small';
    }
    schema['x-component-props'] = schema['x-component-props'] || {};
    schema['x-component-props'].fieldNames = schema['x-component-props'].fieldNames || {
      value: getUniqueKeyFromCollection(targetCollection),
    };
    schema['x-component-props'].fieldNames.label =
      targetCollection?.titleField || getUniqueKeyFromCollection(targetCollection);
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
    jsonb: {
      type: 'boolean',
      'x-content': 'JSONB',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-hidden': `{{ !isDialect('postgres') }}`,
      'x-disabled': `{{ disabledJSONB }}`,
    },
    fields: {
      type: 'array',
      title: '{{t("Fields")}}',
      'x-decorator': 'FormItem',
      'x-component': 'JSONDocFields',
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

export class JSONDocArrayInterface extends CollectionFieldInterface {
  name = 'JSONDocArray';
  type = 'object';
  group = 'advanced';
  order = 5;
  title = '{{t("JSON Document (Array)")}}';
  description = '{{t("One to one description")}}';
  isAssociation = true;
  default = {
    type: 'JSONDocument',
    array: true,
    // name,
    uiSchema: {
      // title,
      'x-component': 'AssociationField',
      'x-component-props': {
        multiple: false,
        // fieldNames: {
        //   label: 'id',
        //   value: 'id',
        // },
      },
    },
  };
  availableTypes = ['JSONDocument'];
  schemaInitialize(schema: ISchema, { field, block, readPretty, action, targetCollection }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;

      // 预览文件时需要的参数
      schema['x-component-props']['size'] = 'small';
    }
    schema['x-component-props'] = schema['x-component-props'] || {};
    schema['x-component-props'].fieldNames = schema['x-component-props'].fieldNames || {
      value: getUniqueKeyFromCollection(targetCollection),
    };
    schema['x-component-props'].fieldNames.label =
      targetCollection?.titleField || getUniqueKeyFromCollection(targetCollection);
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
    jsonb: {
      type: 'boolean',
      'x-content': 'JSONB',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-hidden': `{{ !isDialect('postgres') }}`,
      'x-disabled': `{{ disabledJSONB }}`,
    },
    fields: {
      type: 'array',
      title: '{{t("Fields")}}',
      'x-decorator': 'FormItem',
      'x-component': 'JSONDocFields',
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
