import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, FlowContextSelector } from '@nocobase/flow-engine';
import { Button, Card, Space, Switch } from 'antd';

class PluginOpenControlExample extends Plugin {
  async load() {
    const OpenControlExample = () => {
      const [value, setValue] = useState('');
      const [isOpen, setIsOpen] = useState(false);

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
          <Card title="Open State Control" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Space>
                  <label>Controlled Open State: </label>
                  <Switch checked={isOpen} onChange={setIsOpen} checkedChildren="Open" unCheckedChildren="Closed" />
                  <Button type="primary" size="small" onClick={() => setIsOpen(!isOpen)}>
                    Toggle
                  </Button>
                </Space>
              </div>

              <div>
                <FlowContextSelector
                  value={value}
                  onChange={(val) => setValue(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  open={isOpen}
                  style={{ width: 300 }}
                />
              </div>

              <div>
                <label>Auto Open/Close (normal behavior): </label>
                <FlowContextSelector
                  value={value}
                  onChange={(val) => setValue(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  style={{ width: 300 }}
                />
              </div>

              <div>
                Selected Value: <code>{JSON.stringify(value)}</code>
              </div>
              <div>
                Open State: <code>{isOpen.toString()}</code>
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <OpenControlExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginOpenControlExample],
});

export default app.getRootComponent();
