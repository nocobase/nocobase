import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput } from '@nocobase/flow-engine';
import { Card, Space } from 'antd';

class PluginOnlyLeafSelectableExample extends Plugin {
  async load() {
    const OnlyLeafSelectableExample = () => {
      const [value1, setValue1] = useState('');
      const [value2, setValue2] = useState('');

      const flowContext = new FlowContext();
      flowContext.defineProperty('user', {
        value: { profile: { name: 'John', age: 30 }, settings: { theme: 'dark' } },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            profile: {
              title: 'Profile',
              type: 'object',
              properties: {
                name: { title: 'Name', type: 'string' },
                age: { title: 'Age', type: 'number' },
              },
            },
            settings: {
              title: 'Settings',
              type: 'object',
              properties: {
                theme: { title: 'Theme', type: 'string' },
              },
            },
          },
        },
      });

      return (
        <div style={{ padding: 20 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card title="允许选择所有节点 (默认)" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <VariableInput
                  value={value1}
                  onChange={setValue1}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  onlyLeafSelectable={false}
                  style={{ width: 300 }}
                />
                <div>
                  <code>{JSON.stringify(value1)}</code>
                </div>
              </Space>
            </Card>

            <Card title="仅允许选择叶子节点" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <VariableInput
                  value={value2}
                  onChange={setValue2}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  onlyLeafSelectable={true}
                  style={{ width: 300 }}
                />
                <div>
                  <code>{JSON.stringify(value2)}</code>
                </div>
              </Space>
            </Card>
          </Space>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <OnlyLeafSelectableExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginOnlyLeafSelectableExample],
});

export default app.getRootComponent();
