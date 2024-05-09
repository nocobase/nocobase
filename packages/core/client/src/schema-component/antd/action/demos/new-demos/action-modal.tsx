import { App as AntdApp } from 'antd';
import { useAPIClient, useActionContext, Plugin, SchemaComponent } from '@nocobase/client';
import { ISchema, useForm } from '@formily/react';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

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

const schema: ISchema = {
  name: 'test',
  type: 'void',
  'x-component': 'Action',
  title: 'Open Modal',
  'x-component-props': {
    openSize: 'small',
  },
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Modal',
      title: 'Modal Title',
      'x-decorator': 'FormV2',
      properties: {
        username: {
          type: 'string',
          title: `Username`,
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Modal.Footer',
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
}

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useSubmitActionProps, useCloseActionProps }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  apis: {
    test: { data: 'ok' },
  },
});

export default app.getRootComponent();

