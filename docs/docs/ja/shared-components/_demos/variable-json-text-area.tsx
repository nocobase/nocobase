import React from 'react';
import { Application, Plugin, VariableJsonTextArea } from '@nocobase/client-v2';
import { Form } from 'antd';

function DemoPage() {
  return (
    <Form
      layout="vertical"
      style={{ maxWidth: 520 }}
      initialValues={{
        config: {
          endpoint: '{{ $env.API_ENDPOINT }}',
          owner: '{{ $user.email }}',
        },
      }}
    >
      <Form.Item name="config" label="Config">
        <VariableJsonTextArea rows={8} json5 namespaces={['$env', '$user']} />
      </Form.Item>
    </Form>
  );
}

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.context.defineProperty('$env', {
      value: { API_ENDPOINT: 'https://api.example.com' },
      meta: {
        title: 'Environment variables',
        type: 'object',
        properties: {
          API_ENDPOINT: { title: 'API_ENDPOINT', type: 'string' },
        },
      },
    });

    this.flowEngine.context.defineProperty('$user', {
      value: { email: 'alice@example.com' },
      meta: {
        title: 'Current user',
        type: 'object',
        properties: {
          email: { title: 'Email', type: 'string' },
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
