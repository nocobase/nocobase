import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput, Converters } from '@nocobase/flow-engine';
import { Card, Space, Typography, Input } from 'antd';

const { Text } = Typography;

class PluginSingleConstantExample extends Plugin {
  async load() {
    const SingleConstantExample = () => {
      const [value, setValue] = useState('');

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

      // 获取基础 metaTree 并添加单层 Constant 选项
      const getMetaTreeWithSingleConstant = () => {
        const baseMetaTree = flowContext.getPropertyMetaTree();
        // 在第一层数组中添加单层 constant 选项，放到第一位
        baseMetaTree.splice(0, 0, {
          name: 'Constant',
          title: '常量',
          type: 'string',
        });
        return baseMetaTree;
      };

      // 单层 Constant 的 converters
      const converters: Converters = {
        renderInputComponent: (item) => {
          let ret = null;
          if (!item) {
            return ret;
          }
          if (item?.fullPath && item.fullPath[0] === 'Constant') {
            ret = Input;
          }
          return ret;
        },
        resolveValueFromPath: (item, path) => {
          if (path[0] === 'Constant') {
            return '';
          }
        },
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="单层 Constant 示例" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>单层常量：</Text>
                <VariableInput
                  value={value}
                  onChange={setValue}
                  metaTree={getMetaTreeWithSingleConstant}
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
                  💡 选择 &quot;Constant&quot; 选项，会自动切换为普通 Input 组件用于输入常量值
                </Text>
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <SingleConstantExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginSingleConstantExample],
});

export default app.getRootComponent();
