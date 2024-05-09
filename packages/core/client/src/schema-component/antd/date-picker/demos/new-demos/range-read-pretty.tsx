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
        type: 'string',
        default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
        title: 'Test1',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker.RangePicker',
      },
      test2: {
        type: 'string',
        default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
        title: 'Test(format)',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker.RangePicker',
        'x-component-props': {
          format: 'YYYY/MM/DD',
        },
      },
      test3: {
        type: 'string',
        default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
        title: 'Test(dateFormat)',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker.RangePicker',
        'x-component-props': {
          dateFormat: 'YYYY/MM/DD',
        },
      },
      test4: {
        type: 'string',
        default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
        title: 'Test(showTime)',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker.RangePicker',
        'x-component-props': {
          showTime: true,
        },
      },
      test5: {
        type: 'string',
        default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
        title: 'Test(GMT)',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker.RangePicker',
        'x-component-props': {
          showTime: true,
          gmt: true,
        },
      },
      test6: {
        type: 'string',
        default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
        title: 'Test(UTC)',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker.RangePicker',
        'x-component-props': {
          showTime: true,
          utc: true,
        },
      },
    },
  },
});

export default App;
