import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, FlowContextSelector, VariableInput } from '@nocobase/flow-engine';
import { Card, Space, Typography, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

class PluginVariablesDemo extends Plugin {
  async load() {
    // 创建示例的 Flow Context
    const flowContext = new FlowContext();

    // 定义用户相关属性
    flowContext.defineProperty('user', {
      value: { name: 'John Doe', email: 'john@example.com', id: 1 },
      meta: {
        title: 'User',
        type: 'object',
        properties: {
          name: { title: 'Name', type: 'string' },
          email: { title: 'Email', type: 'string' },
          id: { title: 'ID', type: 'number' },
          profile: {
            title: 'Profile',
            type: 'object',
            properties: {
              avatar: { title: 'Avatar', type: 'string' },
              bio: { title: 'Bio', type: 'string' },
              settings: {
                title: 'Settings',
                type: 'object',
                properties: {
                  theme: { title: 'Theme', type: 'string' },
                  notifications: { title: 'Notifications', type: 'boolean' },
                },
              },
            },
          },
        },
      },
    });

    // 定义系统相关属性
    flowContext.defineProperty('system', {
      value: { timestamp: Date.now(), version: '1.0.0' },
      meta: {
        title: 'System',
        type: 'object',
        properties: {
          timestamp: { title: 'Timestamp', type: 'number' },
          version: { title: 'Version', type: 'string' },
          config: {
            title: 'Config',
            type: 'object',
            properties: {
              debug: { title: 'Debug Mode', type: 'boolean' },
              timeout: { title: 'Timeout', type: 'number' },
            },
          },
        },
      },
    });

    // 演示组件
    const VariablesDemo = () => {
      const [basicValue, setBasicValue] = useState('');
      const [selectorValue, setSelectorValue] = useState('');
      const [staticValue, setStaticValue] = useState('Hello World');
      const [dynamicValue, setDynamicValue] = useState('{{ ctx.user.name }}');

      return (
        <div style={{ padding: 20 }}>
          <Title level={2}>Variables 组件演示</Title>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="1. VariableInput 基础用法" size="small">
              <Paragraph>
                <Text type="secondary">
                  VariableInput 会根据值的类型自动切换显示模式：静态值显示为 Input，动态变量显示为 VariableTag。
                </Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>输入框：</Text>
                  <VariableInput
                    value={basicValue}
                    onChange={setBasicValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    placeholder="输入静态值或选择变量"
                    style={{ width: 300, marginLeft: 8 }}
                  />
                </div>
                <div>
                  <Text>当前值: </Text>
                  <Text code>{JSON.stringify(basicValue)}</Text>
                </div>
              </Space>
            </Card>

            <Card title="2. FlowContextSelector 独立使用" size="small">
              <Paragraph>
                <Text type="secondary">FlowContextSelector 可以独立使用，专门用于选择上下文变量。</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>选择器：</Text>
                  <FlowContextSelector
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    value={selectorValue}
                    onChange={setSelectorValue}
                    showSearch
                    style={{ width: 300, marginLeft: 8 }}
                  />
                </div>
                <div>
                  <Text>选中的变量: </Text>
                  <Text code>{selectorValue || '未选择'}</Text>
                </div>
              </Space>
            </Card>

            <Card title="3. 静态值 vs 动态变量对比" size="small">
              <Paragraph>
                <Text type="secondary">对比静态值和动态变量在 VariableInput 中的不同显示效果。</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>静态值模式：</Text>
                  <VariableInput
                    value={staticValue}
                    onChange={setStaticValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    style={{ width: 300, marginLeft: 8 }}
                  />
                </div>
                <div>
                  <Text strong>动态变量模式：</Text>
                  <VariableInput
                    value={dynamicValue}
                    onChange={setDynamicValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    style={{ width: 300, marginLeft: 8 }}
                  />
                </div>

                <Divider />

                <div>
                  <Title level={5}>当前值对比：</Title>
                  <div>
                    <Text>静态值: </Text>
                    <Text code>{JSON.stringify(staticValue)}</Text>
                  </div>
                  <div>
                    <Text>动态变量: </Text>
                    <Text code>{JSON.stringify(dynamicValue)}</Text>
                  </div>
                </div>
              </Space>
            </Card>

            <Card title="4. 使用说明" size="small">
              <ul>
                <li>
                  <Text strong>点击变量选择按钮</Text>：打开上下文变量选择器
                </li>
                <li>
                  <Text strong>搜索功能</Text>：在选择器中输入关键字快速查找
                </li>
                <li>
                  <Text strong>懒加载</Text>：异步加载子节点（如 user.profile 下的属性）
                </li>
                <li>
                  <Text strong>清除功能</Text>：点击变量标签中的清除按钮可以清空当前变量
                </li>
                <li>
                  <Text strong>智能切换</Text>：组件会根据值的格式自动切换显示模式
                </li>
              </ul>
            </Card>
          </Space>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <VariablesDemo />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginVariablesDemo],
});

export default app.getRootComponent();
