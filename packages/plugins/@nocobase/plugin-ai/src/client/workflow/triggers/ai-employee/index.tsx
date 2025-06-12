/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Trigger } from '@nocobase/plugin-workflow/client';
import { tval } from '@nocobase/utils/client';
import { ArrayItems } from '@formily/antd-v5';
import { ParameterAddition, Parameter, EditParameter, ParameterDesc } from './Parameters';
// @ts-ignore
import pkg from '../../../../../package.json';

export class AIEmployeeTrigger extends Trigger {
  sync = true;
  title = tval('AI employee event', { ns: pkg.name });
  description = tval('Triggered by AI employees through tool calling.', { ns: pkg.name });
  components = {
    ArrayItems,
    Parameter,
    ParameterAddition,
    EditParameter,
    ParameterDesc,
  };
  fieldset = {
    // name: {
    //   type: 'string',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Input',
    //   title: tval('Name', { ns: pkg.name }),
    //   description: tval('The unique identifier for the tool, used by the LLM to call it.', { ns: pkg.name }),
    //   required: true,
    // },
    // description: {
    //   type: 'string',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Input.TextArea',
    //   title: tval('Description', { ns: pkg.name }),
    //   description: tval('A short explanation of what the tool does, helping the LLM decide when to use it.', {
    //     ns: pkg.name,
    //   }),
    // },
    parameters: {
      type: 'array',
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      title: tval('Parameters', { ns: pkg.name }),
      description: tval('The parameters required by the tool', { ns: pkg.name }),
      required: true,
      items: {
        type: 'object',
        'x-decorator': 'ArrayItems.Item',
        properties: {
          left: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              sort: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.SortHandle',
              },
              parameters: {
                type: 'void',
                'x-component': 'Parameter',
                'x-component-props': {
                  style: {
                    width: '90%',
                  },
                },
              },
            },
          },
          right: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              desc: {
                type: 'void',
                'x-component': 'ParameterDesc',
              },
              edit: {
                type: 'void',
                'x-component': 'EditParameter',
              },
              remove: {
                type: 'void',
                'x-component': 'ArrayItems.Remove',
                'x-component-props': {
                  style: {
                    padding: '0',
                  },
                },
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          'x-component': 'ParameterAddition',
        },
      },
    },
  };
  useVariables(config, options) {
    return (
      config.parameters?.map((item: { name: string; displayName: string }) => {
        return {
          key: item.name,
          label: item.name,
          value: item.name,
        };
      }) || []
    );
  }
}
