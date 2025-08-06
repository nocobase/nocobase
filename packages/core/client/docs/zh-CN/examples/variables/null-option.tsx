import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput, Converters } from '@nocobase/flow-engine';
import { Card, Space, Typography, Input } from 'antd';

const { Text } = Typography;

class PluginNullOptionExample extends Plugin {
  async load() {
    const NullOptionExample = () => {
      const [value, setValue] = useState(null);

      // 创建 FlowContext 并定义基础属性
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

      // 获取基础 metaTree 并添加 Null 选项
      const getMetaTreeWithNull = () => {
        const baseMetaTree = flowContext.getPropertyMetaTree();
        // 在第一层数组中添加 null 选项
        baseMetaTree.push({
          name: 'null',
          title: 'Null',
          type: 'null',
        });
        return baseMetaTree;
      };

      // Null 选项的 converters
      const converters: Converters = {
        renderInputComponent: (meta) => {
          if (!meta) {
            return (props) => <Input {...props} readOnly value="<Null>" />;
          }
          return null;
        },
        resolveValueFromPath: (meta, path) => {
          if (path[0] === 'null') {
            return null;
          }
        },
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="Null 选项示例" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>带 Null 选项：</Text>
                <VariableInput
                  value={value}
                  onChange={setValue}
                  metaTree={getMetaTreeWithNull}
                  converters={converters}
                  style={{ width: 300, marginLeft: 8 }}
                />
              </div>
              <div>
                <Text>当前值：</Text>
                <Text code>{JSON.stringify(value)}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 点击变量选择按钮，选择 &quot;Null&quot; 选项，会显示只读的 &lt;Null&gt; 输入框
                </Text>
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <NullOptionExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginNullOptionExample],
});

export default app.getRootComponent();
