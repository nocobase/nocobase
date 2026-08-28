import React from 'react';
import { Application, EnvVariableInput, Plugin } from '@nocobase/client-v2';
import { Form } from 'antd';

function DemoPage() {
  return (
    <Form
      layout="vertical"
      style={{ maxWidth: 420 }}
      initialValues={{ accessKeySecret: '{{ $env.ACCESS_KEY_SECRET }}' }}
    >
      <Form.Item name="accessKeySecret" label="Access Key Secret">
        <EnvVariableInput
          password
          placeholder="Input secret or select env variable"
        />
      </Form.Item>
    </Form>
  );
}

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.context.defineProperty('$env', {
      value: { ACCESS_KEY_SECRET: 'secret' },
      meta: {
        title: 'Environment variables',
        type: 'object',
        properties: {
          ACCESS_KEY_SECRET: { title: 'ACCESS_KEY_SECRET', type: 'string' },
        },
      },
    });

    this.router.add('root', {
      path: '/',
      element: <DemoPage />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
