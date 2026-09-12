import React from 'react';
import { Application, Plugin, VariableTextArea } from '@nocobase/client-v2';
import { Form } from 'antd';

function DemoPage() {
  return (
    <Form layout="vertical" style={{ maxWidth: 520 }}>
      <Form.Item name="content" label="Content">
        <VariableTextArea rows={5} namespaces={['$user', '$env']} />
      </Form.Item>
    </Form>
  );
}

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.context.defineProperty('$user', {
      value: { name: 'Alice', email: 'alice@example.com' },
      meta: {
        title: 'Current user',
        type: 'object',
        properties: {
          name: { title: 'Name', type: 'string' },
          email: { title: 'Email', type: 'string' },
        },
      },
    });

    this.flowEngine.context.defineProperty('$env', {
      value: { SMTP_HOST: 'smtp.example.com' },
      meta: {
        title: 'Environment variables',
        type: 'object',
        properties: {
          SMTP_HOST: { title: 'SMTP_HOST', type: 'string' },
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
