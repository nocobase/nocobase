/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import config, { FieldConfigProps } from '../configs';
const { booleanField } = config;
import { lang } from '../../locale';

export default {
  isStack: (props: FieldConfigProps) => booleanField({ name: 'isStack', title: 'isStack', ...props }),
  smooth: (props: FieldConfigProps) => booleanField({ name: 'smooth', title: 'smooth', ...props }),
  isPercent: (props: FieldConfigProps) => booleanField({ name: 'isPercent', title: 'isPercent', ...props }),
  isGroup: (props: FieldConfigProps) => booleanField({ name: 'isGroup', title: 'isGroup', ...props }),
  size: () => ({
    size: {
      title: lang('Size'),
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': 'Space',
      properties: {
        type: {
          'x-component': 'Select',
          'x-component-props': {
            allowClear: false,
          },
          default: 'ratio',
          enum: [
            {
              label: lang('Fixed height'),
              value: 'fixed',
            },
            {
              label: lang('Aspect ratio'),
              value: 'ratio',
            },
          ],
        },
        fixed: {
          type: 'number',
          'x-component': 'InputNumber',
          'x-component-props': {
            min: 0,
            addonAfter: 'px',
          },
          'x-reactions': [
            {
              dependencies: ['.type'],
              fulfill: {
                state: {
                  visible: "{{$deps[0] === 'fixed'}}",
                },
              },
            },
          ],
        },
        ratio: {
          type: 'object',
          'x-component': 'Space',
          'x-reactions': [
            {
              dependencies: ['.type'],
              fulfill: {
                state: {
                  visible: "{{$deps[0] === 'ratio'}}",
                },
              },
            },
          ],
          properties: {
            width: {
              type: 'number',
              'x-component': 'InputNumber',
              'x-component-props': {
                placeholder: lang('Width'),
                min: 1,
              },
            },
            colon: {
              type: 'void',
              'x-component': 'Text',
              'x-component-props': {
                children: ':',
              },
            },
            height: {
              type: 'number',
              'x-component': 'InputNumber',
              'x-component-props': {
                placeholder: lang('Height'),
                min: 1,
              },
            },
          },
        },
      },
    },
  }),
};
