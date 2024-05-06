/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSchemaComponentPlugin } from '@nocobase/client';
import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  designable: true,
  enableUserListDataBlock: true,
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormBlockProvider',
    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
    'x-decorator-props': {
      collection: 'users',
    },
    'x-component': 'FormV2',
    'x-use-component-props': 'useCreateFormBlockProps',
    properties: {
      nickname: {
        default: 'aaa',
        'x-collection-field': 'roles.long-text',
        'x-component': 'CollectionField',
        'x-component-props': {
          ellipsis: true,
        },
        'x-decorator': 'QuickEdit',
        'x-decorator-props': {
          labelStyle: {
            display: 'none',
          },
        },
      },
    },
  },
  appOptions: {
    plugins: [BlockSchemaComponentPlugin],
  },
});

export default App;
