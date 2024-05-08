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
    'x-component': 'ShowFormData',
    'x-decorator': 'FormV2',
    'x-read-pretty': true,
    properties: {
      test: {
        type: 'string',
        default: 'users',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'CollectionSelect',
      },
    },
  },
});

export default App;
