import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, FlowContextSelector } from '@nocobase/flow-engine';
import { Card, Space, Alert } from 'antd';

class PluginOnlyLeafSelectableExample extends Plugin {
  async load() {
    const OnlyLeafSelectableExample = () => {
      const [value1, setValue1] = useState('');
      const [value2, setValue2] = useState('');

      const flowContext = new FlowContext();
      flowContext.defineProperty('user', {
        value: {
          name: 'John',
          email: 'john@example.com',
          profile: {
            age: 30,
            department: 'Engineering',
          },
        },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            name: { title: 'Name', type: 'string' },
            email: { title: 'Email', type: 'string' },
            profile: {
              title: 'Profile',
              type: 'object',
              properties: {
                age: { title: 'Age', type: 'number' },
                department: { title: 'Department', type: 'string' },
              },
            },
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
          <Card title="Only Leaf Selectable" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="onlyLeafSelectable=false (default)"
                description="允许选择非叶子节点（如 'user' 对象），可以通过双击选择中间节点"
                type="info"
                showIcon
              />
              <div>
                <label>Default behavior: </label>
                <FlowContextSelector
                  value={value1}
                  onChange={(val) => setValue1(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  onlyLeafSelectable={false}
                  style={{ width: 300 }}
                />
              </div>
              <div>
                Selected Value: <code>{JSON.stringify(value1)}</code>
              </div>

              <Alert
                message="onlyLeafSelectable=true"
                description="只允许选择叶子节点（如 'name', 'email' 等具体字段），不能选择对象节点"
                type="warning"
                showIcon
              />
              <div>
                <label>Only leaf selectable: </label>
                <FlowContextSelector
                  value={value2}
                  onChange={(val) => setValue2(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  onlyLeafSelectable={true}
                  style={{ width: 300 }}
                />
              </div>
              <div>
                Selected Value: <code>{JSON.stringify(value2)}</code>
              </div>
            </Space>
          </Card>
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
