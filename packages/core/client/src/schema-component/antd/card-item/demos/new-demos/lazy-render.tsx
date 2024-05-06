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
    'x-component': 'div',
    'x-component-props': {
      style: {
        height: 300,
        overflow: 'auto',
        border: '1px solid #f0f0f0',
      },
    },
    properties: {
      block1: {
        type: 'void',
        'x-component': 'CardItem',
        'x-component-props': {
          title: 'Block 1',
        },
        'x-settings': 'simpleSettings',
        properties: {
          hello: {
            type: 'void',
            'x-component': 'div',
            'x-content': 'Hello Card!',
          },
        },
      },
      block2: {
        type: 'void',
        'x-component': 'CardItem',
        'x-settings': 'simpleSettings',
        'x-component-props': {
          title: 'Block 2',
        },
        properties: {
          hello: {
            type: 'void',
            'x-component': 'div',
            'x-content': 'Hello Card!',
          },
        },
      },
      block3: {
        type: 'void',
        'x-component': 'CardItem',
        'x-settings': 'simpleSettings',
        'x-component-props': {
          title: 'Block 3',
          lazyRender: {
            threshold: 1,
          },
        },
        properties: {
          hello: {
            type: 'void',
            'x-component': 'div',
            'x-content': 'Hello Card!',
          },
        },
      },
    },
  },
  appOptions: {
    schemaSettings: [simpleSettings],
  },
});

export default App;
