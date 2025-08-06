import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput } from '@nocobase/flow-engine';
import { Card, Space, Typography } from 'antd';

const { Text } = Typography;

class PluginBasicExample extends Plugin {
  async load() {
    const BasicExample = () => {
      const [value, setValue] = useState('');

      // 创建简单的 FlowContext
      const flowContext = new FlowContext();
      flowContext.defineProperty('user', {
        value: { name: 'John Doe', email: 'john@example.com' },
        meta: {
          title: '用户',
          type: 'object',
          properties: {
            name: { title: '姓名', type: 'string' },
            email: { title: '邮箱', type: 'string' },
          },
        },
      });

      return (
        <div style={{ padding: 20 }}>
          <Card title="基础示例" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>VariableInput：</Text>
                <VariableInput
                  value={value}
                  onChange={setValue}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  style={{ width: 300, marginLeft: 8 }}
                />
              </div>
              <div>
                <Text>当前值：</Text>
                <Text code>{JSON.stringify(value)}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 尝试输入文本或点击变量选择按钮选择变量
                </Text>
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
