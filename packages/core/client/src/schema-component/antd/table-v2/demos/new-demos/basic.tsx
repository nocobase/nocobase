/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';
import { ActionProps, useAPIClient } from '@nocobase/client';
import { useForm } from '@formily/react';
import { App as AntdApp } from 'antd';

function useMyTableProps() {
  return {};
}

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'array', // 这里需要是 array 类型
        'x-component': 'TableV2',
        'x-use-component-props': 'useMyTableProps',
        properties: {
          usernameColumn: {
            type: 'void',
            'x-component': 'TableV2.Column',
            properties: {
              username: {
                type: 'string',
                'x-component': 'Input',
                title: 'Username',
                'x-pattern': 'readPretty', // 这里需要设置为 true
              },
            },
          },
          nicknameColumn: {
            type: 'void',
            'x-component': 'TableV2.Column',
            nickname: {
              type: 'string',
              'x-component': 'Input',
              title: 'Nickname',
              'x-pattern': 'readPretty', // 这里需要设置为 true
            },
          },
        },
      },
    },
  },
  appOptions: {
    scopes: {
      useMyTableProps,
    },
  },
});

export default App;
