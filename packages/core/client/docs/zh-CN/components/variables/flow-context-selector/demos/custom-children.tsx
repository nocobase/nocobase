import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, FlowContextSelector } from '@nocobase/flow-engine';
import { Button, Card, Space, Tag } from 'antd';

class PluginCustomChildrenExample extends Plugin {
  async load() {
    const CustomChildrenExample = () => {
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

      return (
        <div style={{ padding: 20 }}>
          <Card title="Custom Children" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Custom Button: </label>
                <FlowContextSelector
                  value={value}
                  onChange={(val) => setValue(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                >
                  <Button type="primary">Select Variable</Button>
                </FlowContextSelector>
              </div>

              <div>
                <label>Custom Tag: </label>
                <FlowContextSelector
                  value={value}
                  onChange={(val) => setValue(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                >
                  <Tag color="blue" style={{ cursor: 'pointer' }}>
                    {value || 'Click to select'}
                  </Tag>
                </FlowContextSelector>
              </div>

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
      element: <CustomChildrenExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginCustomChildrenExample],
});

export default app.getRootComponent();
