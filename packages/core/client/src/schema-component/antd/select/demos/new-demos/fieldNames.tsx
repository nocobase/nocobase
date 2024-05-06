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
    name: '福建',
    id: 'FuJian',
    children: [
      { name: '{{t("福州")}}', id: 'FZ' },
      { name: '莆田', id: 'PT' },
    ],
  },
  { name: '江苏', id: 'XZ' },
  { name: '浙江', id: 'ZX' },
];

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'string',
        title: 'Test',
        enum: options,
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-component-props': {
          fieldNames: {
            label: 'name',
            value: 'id',
            children: 'children',
          },
        },
      },
    },
  },
});

export default App;
