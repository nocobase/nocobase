import { getAppComponent } from '@nocobase/test/web';
import { ActionProps, useAPIClient } from '@nocobase/client';
import { useForm } from '@formily/react';
import { App as AntdApp } from 'antd';

function useSubmitActionProps(): ActionProps {
  const form = useForm();
  const api = useAPIClient();
  const { message } = AntdApp.useApp();

  return {
    type: 'primary',
    htmlType: 'submit',
    async onClick() {
      await form.submit();
      const values = form.values;

      const { data } = await api.request({ url: 'users:create', method: 'post', data: values });
      if (data.result === 'ok') {
        message.success('Submit success');
      }
    },
  };
}

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'FormV2',
        properties: {
          username: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            title: 'Username',
            required: true,
          },
          nickname: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            title: 'Nickname',
          },
          password: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            title: 'Password',
          },
          button: {
            type: 'void',
            'x-component': 'Action',
            title: 'Submit',
            'x-use-component-props': useSubmitActionProps,
          },
        },
      },
    },
  },
  apis: {
    'users:create': { result: 'ok' },
  },
});

export default App;
