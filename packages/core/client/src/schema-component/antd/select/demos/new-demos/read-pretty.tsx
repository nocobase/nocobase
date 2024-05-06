/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';

const options = [
  {
    label: '福建',
    value: 'FuJian',
    children: [
      { label: '{{t("福州")}}', value: 'FZ' },
      { label: '莆田', value: 'PT' },
    ],
  },
  { label: '江苏', value: 'XZ' },
  { label: '浙江', value: 'ZX' },
];

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    'x-pattern': 'readPretty',
    properties: {
      test1: {
        type: 'string',
        title: 'Test',
        enum: options,
        default: 'XZ',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
      },
      test4: {
        type: 'string',
        title: 'Test(fieldNames)',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        default: 'XZ',
        enum: [
          {
            name: '福建',
            id: 'FuJian',
            children: [
              { name: '{{t("福州")}}', id: 'FZ' },
              { name: '莆田', id: 'PT' },
            ],
          },
          { name: '江苏', id: 'XZ' },
          { name: '浙江', id: 'ZX' },
        ],
        'x-component-props': {
          fieldNames: {
            label: 'name',
            value: 'id',
            children: 'children',
          },
        },
      },
      test2: {
        type: 'string',
        title: 'Test(multiple)',
        default: ['XZ', 'ZX'],
        enum: options,
        'x-decorator': 'FormItem',
        'x-component': 'Select',
      },
      test3: {
        type: 'string',
        title: 'Test(ellipsis)',
        default: ['XZ', 'ZX', 'FuJian', 'FZ'],
        enum: options,
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-decorator-props': {
          style: {
            width: 130,
          },
        },
        'x-component-props': {
          ellipsis: true,
        },
      },
    },
  },
});

export default App;
