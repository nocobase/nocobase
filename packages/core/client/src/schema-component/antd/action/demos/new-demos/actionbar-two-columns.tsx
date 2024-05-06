/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionInitializer, SchemaInitializer } from '@nocobase/client';
import { getAppComponent } from '@nocobase/test/web';

const addActionButton = new SchemaInitializer({
  name: 'addActionButton',
  designable: true,
  title: 'Configure actions',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: 'Enable actions',
      name: 'enableActions',
      children: [
        {
          name: 'action1',
          title: '{{t("Action 1")}}',
          Component: 'ActionInitializer',
          schema: {
            title: 'Action 1',
            'x-component': 'Action',
            'x-action': 'a1',
            'x-align': 'left',
          },
        },
        {
          name: 'action2',
          title: '{{t("Action 2")}}',
          Component: 'ActionInitializer',
          schema: {
            title: 'Action 2',
            'x-component': 'Action',
            'x-action': 'a2',
            'x-align': 'right',
          },
        },
      ],
    },
  ],
});

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'ActionBar',
        'x-initializer': 'addActionButton',
        'x-component-props': {
          layout: 'two-columns',
        },
        properties: {
          a1: {
            title: 'Action 1',
            'x-component': 'Action',
            'x-action': 'a1',
            'x-align': 'left',
          },
          a2: {
            title: 'Action 2',
            'x-component': 'Action',
            'x-action': 'a2',
            'x-align': 'right',
          },
        },
      },
    },
  },
  appOptions: {
    schemaInitializers: [addActionButton],
    components: {
      ActionInitializer,
    },
  },
});

export default App;
