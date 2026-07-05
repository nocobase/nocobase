import React from 'react';
import { Application, Plugin, TypedVariableInput } from '@nocobase/client-v2';
import { Form } from 'antd';

function DemoPage() {
  return (
    <Form
      layout="vertical"
      style={{ maxWidth: 420 }}
      initialValues={{ port: 465, secure: true }}
    >
      <Form.Item name="port" label="Port">
        <TypedVariableInput
          types={[['number', { min: 1, max: 65535, step: 1 }]]}
          namespaces={['$env']}
        />
      </Form.Item>
      <Form.Item name="secure" label="Secure">
        <TypedVariableInput types={['boolean']} namespaces={['$env']} />
      </Form.Item>
    </Form>
  );
}

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.context.defineProperty('$env', {
      value: { SMTP_PORT: '465', SMTP_SECURE: 'true' },
      meta: {
        title: 'Environment variables',
        type: 'object',
        properties: {
          SMTP_PORT: { title: 'SMTP_PORT', type: 'string' },
          SMTP_SECURE: { title: 'SMTP_SECURE', type: 'string' },
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
