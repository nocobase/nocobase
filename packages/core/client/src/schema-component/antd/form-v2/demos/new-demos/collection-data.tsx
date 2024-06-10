import { useForm } from '@formily/react';
import {
  ActionProps,
  FormBlockProvider,
  ISchema,
  Plugin,
  SchemaComponent,
  useDataBlockResource,
  useFormBlockProps,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { App as AntdApp } from 'antd';
import React from 'react';

function useSubmitActionProps(): ActionProps {
  const form = useForm();
  const resource = useDataBlockResource();
  const { message } = AntdApp.useApp();

  return {
    type: 'primary',
    htmlType: 'submit',
    async onClick() {
      await form.submit();
      const values = form.values;

      const { data } = await resource.update(values);
      if (data.result === 'ok') {
        message.success('Submit success');
        form.reset();
      }
    },
  };
}
const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-component': 'FormBlockProvider',
      'x-component-props': {
        collection: 'users',
        action: 'get', // 获取数据
        filterByTk: 1, // 获取 id 为 1 的数据
        dataSource: 'main',
      },
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useFormBlockProps',
          properties: {
            username: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            nickname: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            submit: {
              type: 'void',
              'x-component': 'Action',
              title: 'Submit',
              'x-use-component-props': 'useSubmitActionProps',
            },
          },
        },
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useSubmitActionProps }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  components: {
    FormBlockProvider,
  },
  scopes: { useFormBlockProps },
});

export default app.getRootComponent();
