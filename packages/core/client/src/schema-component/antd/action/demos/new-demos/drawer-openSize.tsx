/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';
import { Space } from 'antd';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-component': Space,
    properties: {
      test: {
        type: 'void',
        'x-component': 'Action',
        title: 'Open Drawer',
        'x-component-props': {
          openSize: 'large', // open drawer size
        },
        properties: {
          drawer: {
            type: 'void',
            title: 'Drawer Title',
            'x-component': 'Action.Drawer',
            properties: {
              // Drawer content
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
