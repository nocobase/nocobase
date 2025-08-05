import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContextSelector, MetaTreeNode } from '@nocobase/flow-engine';
import { Button, Card, Space, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

class PluginFlowContextSelectorDemo extends Plugin {
  async load() {
    const FlowContextSelectorDemo = () => {
      const [selectedVariable, setSelectedVariable] = useState('');
      const [customButtonValue, setCustomButtonValue] = useState('');

      // 创建示例的 MetaTree
      const metaTree: MetaTreeNode[] = [
        {
          name: 'user',
          title: 'User',
          type: 'object',
          children: [
            { name: 'name', title: 'Name', type: 'string' },
            { name: 'email', title: 'Email', type: 'string' },
            {
              name: 'profile',
              title: 'Profile',
              type: 'object',
              children: async () => [
                { name: 'avatar', title: 'Avatar', type: 'string' },
                { name: 'bio', title: 'Bio', type: 'string' },
                {
                  name: 'preferences',
                  title: 'Preferences',
                  type: 'object',
                  children: async () => [
                    { name: 'theme', title: 'Theme', type: 'string' },
                    { name: 'language', title: 'Language', type: 'string' },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'system',
          title: 'System',
          type: 'object',
          children: [
            { name: 'timestamp', title: 'Timestamp', type: 'number' },
            { name: 'version', title: 'Version', type: 'string' },
            {
              name: 'config',
              title: 'Config',
              type: 'object',
              children: [
                { name: 'debug', title: 'Debug Mode', type: 'boolean' },
                { name: 'timeout', title: 'Timeout (ms)', type: 'number' },
              ],
            },
          ],
        },
        {
          name: 'data',
          title: 'Data',
          type: 'object',
          children: async () => {
            // 模拟异步加载
            await new Promise((resolve) => setTimeout(resolve, 500));
            return [
              { name: 'items', title: 'Items', type: 'array' },
              { name: 'count', title: 'Total Count', type: 'number' },
            ];
          },
        },
      ];

      return (
        <div style={{ padding: 20 }}>
          <Title level={2}>FlowContextSelector 独立使用演示</Title>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="1. 基础用法 - 默认按钮" size="small">
              <Paragraph>
                <Text type="secondary">使用默认的 &quot;Select Variable&quot; 按钮。</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <FlowContextSelector
                    metaTree={metaTree}
                    value={selectedVariable}
                    onChange={setSelectedVariable}
                    showSearch
                  />
                </div>
                <div>
                  <Text>选中的变量: </Text>
                  <Text code>{selectedVariable || '未选择'}</Text>
                </div>
              </Space>
            </Card>

            <Card title="2. 自定义触发按钮" size="small">
              <Paragraph>
                <Text type="secondary">可以自定义触发选择器的按钮样式和文本。</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <FlowContextSelector
                    metaTree={metaTree}
                    value={customButtonValue}
                    onChange={setCustomButtonValue}
                    showSearch
                  >
                    <Button type="primary" size="small">
                      🔍 选择上下文变量
                    </Button>
                  </FlowContextSelector>
                </div>
                <div>
                  <Text>选中的变量: </Text>
                  <Text code>{customButtonValue || '未选择'}</Text>
                </div>
              </Space>
            </Card>

            <Card title="3. 功能特性说明" size="small">
              <ul>
                <li>
                  <Text strong>搜索功能</Text>：支持在多级菜单中搜索变量名
                </li>
                <li>
                  <Text strong>懒加载</Text>：子节点支持异步加载（如 user.profile 和 data 节点）
                </li>
                <li>
                  <Text strong>层级展示</Text>：支持多级嵌套的上下文结构
                </li>
                <li>
                  <Text strong>变量格式</Text>：自动生成 `{'{'}
                  {'{'} ctx.path {'}}'}` 格式的变量字符串
                </li>
                <li>
                  <Text strong>预选中</Text>：如果提供了 value，会自动展开并选中对应路径
                </li>
              </ul>
            </Card>

            <Card title="4. MetaTree 数据结构示例" size="small">
              <Paragraph>
                <Text type="secondary">MetaTree 支持同步数组、异步函数等多种形式：</Text>
              </Paragraph>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {`const metaTree: MetaTreeNode[] = [
  {
    name: 'user',
    title: 'User',
    type: 'object',
    children: [
      { name: 'name', title: 'Name', type: 'string' },
      { name: 'profile', title: 'Profile', type: 'object',
        children: async () => [
          { name: 'avatar', title: 'Avatar', type: 'string' },
        ]
      },
    ],
  },
];`}
              </pre>
            </Card>
          </Space>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <FlowContextSelectorDemo />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFlowContextSelectorDemo],
});

export default app.getRootComponent();
