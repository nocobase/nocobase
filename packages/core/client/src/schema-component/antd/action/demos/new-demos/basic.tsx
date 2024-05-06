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
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          ghost: true, // ButtonProps
          type: 'dashed', // ButtonProps
          danger: true, // ButtonProps
          title: 'Open', // title
        },
        // title: 'Open', // It's also possible here
      },
    },
  },
});

export default App;
