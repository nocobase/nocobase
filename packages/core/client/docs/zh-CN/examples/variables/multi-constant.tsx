import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput, Converters } from '@nocobase/flow-engine';
import { Card, Space, Typography, Input, InputNumber, DatePicker } from 'antd';

const { Text } = Typography;

class PluginMultiConstantExample extends Plugin {
  async load() {
    const MultiConstantExample = () => {
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

      // 获取基础 metaTree 并添加多层 Constant 选项
      const getMetaTreeWithMultiConstant = () => {
        const baseMetaTree = flowContext.getPropertyMetaTree();
        // 在第一层数组中添加多层 constant 选项
        baseMetaTree.splice(0, 0, {
          name: 'Constant',
          title: '常量',
          type: 'object',
          children: [
            { name: 'string', title: 'String', type: 'string' },
            { name: 'number', title: 'Number', type: 'number' },
            { name: 'date', title: 'Date', type: 'string', interface: 'date' },
          ],
        });
        return baseMetaTree;
      };

      // 多层 Constant 的 converters
      const converters: Converters = {
        renderInputComponent: (item) => {
          let ret = null;
          if (!item) {
            return ret;
          }
          if (item?.fullPath && item.fullPath[0] === 'Constant') {
            ret = Input;
            switch (item.fullPath[1]) {
              case 'number':
                ret = InputNumber;
                break;
              case 'date':
                ret = DatePicker;
                break;
              case 'string':
                ret = Input;
                break;
              default:
                ret = Input;
                break;
            }
          }
          return ret;
        },
        resolveValueFromPath: (item, path) => {
          if (path[0] === 'Constant') {
            const type = path[path.length - 1];
            switch (type) {
              case 'string':
                return '';
              case 'number':
                return 0;
              case 'date':
                return null;
              default:
                return null;
            }
          }
        },
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="多层 Constant 示例" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>多层常量：</Text>
                <VariableInput
                  value={value}
                  onChange={setValue}
                  metaTree={getMetaTreeWithMultiConstant}
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
                  💡 选择 &quot;Constant&quot; → &quot;String/Number/Date&quot;，会根据类型显示不同的输入组件
                </Text>
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <MultiConstantExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginMultiConstantExample],
});

export default app.getRootComponent();
