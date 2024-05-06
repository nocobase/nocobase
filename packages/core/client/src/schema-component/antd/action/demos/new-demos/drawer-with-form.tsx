/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';
import { Space, App as AntdApp } from 'antd';
import { useAPIClient, useActionContext } from '@nocobase/client';
import { useForm } from '@formily/react';

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
  const api = useAPIClient();
  const { message } = AntdApp.useApp();
  const form = useForm();

  return {
    type: 'primary',
    async onClick() {
      // Submit the form
      await form.submit();
      const values = form.values;

      console.log('values:', values);
      const { data } = await api.request({ url: 'test', data: values, method: 'POST' });
      if (data.data === 'ok') {
        message.success('Submit success');
        setVisible(false);
        form.reset(); // 提交成功后重置表单
      }
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
            'x-decorator': 'FormV2', // This uses the `FormV2` component.
            properties: {
              username: {
                // This is a form field.
                type: 'string',
                title: `Username`,
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
              footer: {
                type: 'void',
                'x-component': 'Action.Drawer.Footer',
                properties: {
                  close: {
                    title: 'Close',
                    'x-component': 'Action',
                    'x-component-props': {
                      type: 'default',
                    },
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
      useSubmitActionProps,
      useCloseActionProps,
    },
  },
  apis: {
    test: { data: 'ok' },
  },
});

export default App;
