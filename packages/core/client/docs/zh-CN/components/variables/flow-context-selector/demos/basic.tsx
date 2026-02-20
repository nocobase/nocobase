import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, FlowContextSelector } from '@nocobase/flow-engine';
import { Card, Space } from 'antd';

class PluginBasicExample extends Plugin {
  async load() {
    const BasicExample = () => {
      const [value, setValue] = useState('');

      const flowContext = new FlowContext();
      flowContext.defineProperty('user', {
        value: { name: 'John', email: 'john@example.com' },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            name: { title: 'Name', type: 'string' },
            email: { title: 'Email', type: 'string' },
          },
        },
      });

      flowContext.defineProperty('config', {
        value: 'production',
        meta: {
          title: 'Config',
          type: 'string',
        },
      });

      return (
        <div style={{ padding: 20 }}>
          <Card title="Basic Usage" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <FlowContextSelector
                value={value}
                onChange={(val) => setValue(val)}
                metaTree={() => flowContext.getPropertyMetaTree()}
                style={{ width: 300 }}
              />
              <div>
                Selected Value: <code>{JSON.stringify(value)}</code>
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <BasicExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginBasicExample],
});

export default app.getRootComponent();
