import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput } from '@nocobase/flow-engine';
import { Card, Space, Typography } from 'antd';

const { Text } = Typography;

class PluginVariableFormsExample extends Plugin {
  async load() {
    const VariableFormsExample = () => {
      const [withInputValue, setWithInputValue] = useState('');
      const [selectorOnlyValue, setSelectorOnlyValue] = useState('');

      const flowContext = new FlowContext();
      flowContext.defineProperty('user', {
        value: { name: 'John', email: 'john@example.com', age: 30 },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            name: { title: 'Name', type: 'string' },
            email: { title: 'Email', type: 'string' },
            age: { title: 'Age', type: 'number' },
          },
        },
      });

      flowContext.defineProperty('system', {
        value: { version: '1.0.0', mode: 'production' },
        meta: {
          title: 'System',
          type: 'object',
          properties: {
            version: { title: 'Version', type: 'string' },
            mode: { title: 'Mode', type: 'string' },
          },
        },
      });

      return (
        <div style={{ padding: 20 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="显示Value组件形态" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">showValueComponent=true - 显示值组件和选择器</Text>
                <VariableInput
                  value={withInputValue}
                  onChange={setWithInputValue}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  showValueComponent={true}
                  style={{ width: 300 }}
                  placeholder="输入值或选择变量"
                />
                <div>
                  <Text strong>当前值：</Text>
                  <code>{JSON.stringify(withInputValue)}</code>
                </div>
              </Space>
            </Card>

            <Card title="不显示Value组件形态" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">showValueComponent=false - 只显示选择器</Text>
                <VariableInput
                  value={selectorOnlyValue}
                  onChange={setSelectorOnlyValue}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  showValueComponent={false}
                  style={{ width: 300 }}
                />
                <div>
                  <Text strong>当前值：</Text>
                  <code>{JSON.stringify(selectorOnlyValue)}</code>
                </div>
              </Space>
            </Card>
          </Space>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <VariableFormsExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginVariableFormsExample],
});

export default app.getRootComponent();
