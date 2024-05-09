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
import { useActionContext } from '@nocobase/client';

const useCloseActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'primary',
    onClick() {
      console.log('submit');
      setVisible(false);
    },
  };
};

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
        properties: {
          drawer: {
            type: 'void',
            'x-component': 'Action.Drawer',
            title: 'Drawer Title',
            properties: {
              content: {
                type: 'void',
                'x-content': 'Hello',
              },
              footer: {
                type: 'void',
                'x-component': 'Action.Drawer.Footer', // must be `Action.Drawer.Footer`
                properties: {
                  close: {
                    title: 'Close',
                    'x-component': 'Action',
                    'x-use-component-props': 'useCloseActionProps',
                  },
                  submit: {
                    title: 'Submit',
                    'x-component': 'Action',
                    'x-use-component-props': 'useSubmitActionProps',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  appOptions: {
    scopes: {
      useCloseActionProps,
      useSubmitActionProps,
    },
  },
  apis: {
    test: { data: 'ok' },
  },
});

export default App;
