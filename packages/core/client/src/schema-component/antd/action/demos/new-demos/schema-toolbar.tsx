/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings } from '@nocobase/client';
import { getAppComponent } from '@nocobase/test/web';
import React from 'react';

const myActionSettings = new SchemaSettings({
  name: 'myActionSettings',
  items: [
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

const MyToolbar = (props) => <span>{props.title}</span>;

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'ActionBar',
        'x-component-props': {
          layout: 'two-columns',
        },
        properties: {
          a1: {
            title: 'Action 1',
            'x-component': 'Action',
            'x-action': 'a1',
            'x-align': 'right',
            'x-settings': 'myActionSettings',
          },
          a2: {
            title: 'Action 2',
            'x-component': 'Action',
            'x-action': 'a2',
            'x-align': 'right',
            'x-settings': 'myActionSettings',
          },
          a3: {
            title: 'Action 3',
            'x-component': 'Action',
            'x-action': 'a1',
            'x-align': 'left',
            'x-settings': 'myActionSettings',
          },
          a4: {
            title: 'Action 4',
            'x-component': 'Action',
            'x-action': 'a2',
            'x-align': 'left',
            'x-settings': 'myActionSettings',
          },
          a5: {
            title: '',
            'x-component': 'Action',
            'x-action': 'a5',
            'x-align': 'left',
            'x-toolbar': 'MyToolbar',
            'x-toolbar-props': {
              title: 'MyTitle',
            },
          },
        },
      },
    },
  },
  appOptions: {
    schemaSettings: [myActionSettings],
    components: { MyToolbar },
  },
  designable: true,
});

export default App;
