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
    properties: {
      test: {
        'x-component': 'Action',
        'x-component-props': {
          type: 'primary',
          popover: true,
        },
        type: 'void',
        title: 'Open',
        properties: {
          popover: {
            type: 'void',
            'x-component': 'Action.Popover',
            properties: {
              hello: {
                type: 'void',
                'x-content': 'Hello',
              },
            },
          },
        },
      },
    },
  },
});

export default App;
