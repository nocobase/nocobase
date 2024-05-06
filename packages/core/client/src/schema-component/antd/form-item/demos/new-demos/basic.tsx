/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';
import { SchemaSettings } from '@nocobase/client';

const simpleSettings = new SchemaSettings({
  name: 'simpleSettings',
  items: [
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

const App = getAppComponent({
  designable: true,
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'DndContext',
    'x-component': 'FormV2',
    properties: {
      username: {
        type: 'string',
        title: 'Username',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-settings': 'simpleSettings',
        required: true,
      },
      nickname: {
        type: 'string',
        title: 'Nickname',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-settings': 'simpleSettings',
      },
    },
  },
  appOptions: {
    schemaSettings: [simpleSettings],
  },
});

export default App;
