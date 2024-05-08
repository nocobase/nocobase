/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';
import { Button, Space } from 'antd';
import React from 'react';

const ComponentButton = (props) => {
  return <Button {...props}>Custom Component</Button>;
};

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-component': Space,
    properties: {
      test1: {
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          component: 'ComponentButton', // string type
        },
      },
      test2: {
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          component: ComponentButton, // ComponentType type
        },
      },
    },
  },
  appOptions: {
    components: {
      ComponentButton, // register custom component
    },
  },
});

export default App;
