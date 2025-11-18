/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Space } from 'antd';
import { SwapRightOutlined } from '@ant-design/icons';
import { Instruction, WorkflowVariableInput, Fieldset } from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../locale';
import { useClearItemsAction, useParseJsonAction } from './parseActions';

export default class extends Instruction {
  title = `{{t("JSON variable mapping", { ns: "${NAMESPACE}" })}}`;
  type = 'json-variable-mapping';
  group = 'control';
  description = `{{t("Used for mapping any JSON data to structured variables for usage in subsequent nodes.", { ns: "${NAMESPACE}" })}}`;
  icon = (<SwapRightOutlined />);
  fieldset = {
    dataSource: {
      type: 'string',
      title: `{{t("JSON data source", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        nullable: false,
        changeOnSelect: true,
      },
    },
    example: {
      type: 'string',
      title: `{{t("Input example", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        layout: 'vertical',
      },
      'x-component': 'Input.JSON',
      'x-component-props': {
        placeholder: `{{t('Please input JSON example like { "key1": "item1", "key2": "item2" }', { ns: "${NAMESPACE}" })}}`,
        autoSize: { minRows: 5, maxRows: 10 },
      },
    },
    parseArray: {
      type: 'boolean',
      description: `{{t('If the JSON object contains array items, parse them. eg: { "arrayKey": [ "item1", "item2" ] will be parsed as "arrayKey", "arrayKey.0", "arrayKey.1", if set to false, only "arrayKey" will be parsed.', { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-content': `{{t('Include array index in path', { ns: "${NAMESPACE}" })}}`,
      default: false,
    },
    parseActions: {
      type: 'void',
      description: `{{t('Please update other node references to the key after clicking the parse button.', { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Space',
      properties: {
        parseJsonAction: {
          type: 'void',
          title: `{{t('Parse', { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Action',
          'x-component-props': {
            useAction: '{{ useParseJsonAction }}',
            size: 'small',
          },
        },
        clearItems: {
          type: 'void',
          title: `{{t('Clear below items', { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Action',
          'x-component-props': {
            useAction: '{{ useClearItemsAction }}',
            size: 'small',
            confirm: {
              title: "{{t('Delete items')}}",
              content: "{{t('Are you sure to clear below items?')}}",
            },
          },
          'x-reactions': [
            {
              dependencies: ['.variables'],
              fulfill: {
                state: {
                  disabled: `{{ $deps[0].length === 0 }}`,
                },
              },
            },
          ],
        },
      },
    },
    variables: {
      type: 'array',
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        layout: 'vertical',
      },
      'x-component': 'ArrayItems',
      'x-component-props': {
        style: {
          marginTop: 20,
        },
      },
      default: [],
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              path: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Key path", { ns: "${NAMESPACE}" })}}`,
                },
                'x-disabled': true,
              },
              alias: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Alias", { ns: "${NAMESPACE}" })}}`,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
    },
  };
  scope = {
    useParseJsonAction,
    useClearItemsAction,
  };
  components = {
    Space,
    WorkflowVariableInput,
    Fieldset,
  };
  useVariables({ key, title, config }, options) {
    const variables = (config.variables ?? []).map((item) => {
      const { key, alias, path } = item;

      return {
        isLeaf: true,
        label: alias ? alias : path,
        value: key,
        key: key,
      };
    });
    return {
      value: key,
      label: title,
      children: variables,
    };
  }
}
