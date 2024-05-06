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
    properties: {
      test1: {
        type: 'string',
        title: 'Test',
        default: '2024-01-01 10:10:10',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker',
        'x-component-props': {
          utc: true,
          gmt: true,
        },
      },
      test2: {
        type: 'string',
        title: 'Test',
        default: '2024-01-01 10:10:10',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker',
        'x-component-props': {
          showTime: true,
          utc: true,
          gmt: true,
        },
      },
    },
  },
});

export default App;
