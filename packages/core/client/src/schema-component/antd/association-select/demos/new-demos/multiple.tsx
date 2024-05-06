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
      test: {
        type: 'array', // 数组类型
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'AssociationSelect',
        'x-component-props': {
          multiple: true, // 多选
          service: {
            resource: 'roles',
            action: 'list',
          },
          fieldNames: {
            label: 'title',
            value: 'name',
          },
        },
      },
    },
  },
  delayResponse: 500,
});

export default App;
