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
      test: {
        type: 'string',
        title: 'Test',
        default:
          'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      test2: {
        type: 'string',
        title: 'Test(ellipsis)',
        default:
          'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          ellipsis: true,
          style: {
            width: 100,
          },
        },
      },
    },
  },
});

export default App;
