/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    'x-pattern': 'readPretty',
    properties: {
      test1: {
        type: 'number',
        title: 'Test1',
        default: 1234567.89,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {},
      },
      test2: {
        type: 'number',
        title: 'Test2',
        default: 1234567.89,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          separator: '0,0.00',
        },
      },
      test3: {
        type: 'number',
        title: 'Test3',
        default: 1234567.89,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          separator: '0.0,00',
        },
      },
      test4: {
        type: 'number',
        title: 'Test4',
        default: 1234567.89,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          separator: '0 0,00',
        },
      },
    },
  },
});

export default App;
