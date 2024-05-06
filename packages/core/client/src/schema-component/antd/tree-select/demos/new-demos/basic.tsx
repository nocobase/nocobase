/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';

const dataSource = [
  {
    label: '选项1',
    value: 1,
    children: [
      {
        label: 'Child Node1',
        value: '0-0-0',
      },
      {
        label: 'Child Node2',
        value: '0-0-1',
      },
      {
        label: 'Child Node3',
        value: '0-0-2',
      },
    ],
  },
  {
    label: '选项2',
    value: 2,
    children: [
      {
        label: 'Child Node1',
        value: '0-1-0',
      },
      {
        label: 'Child Node2',
        value: '0-1-1',
      },
      {
        label: 'Child Node3',
        value: '0-1-2',
      },
    ],
  },
];

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'boolean',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'TreeSelect',
        'x-component-props': {
          treeData: dataSource,
        },
      },
    },
  },
});

export default App;
