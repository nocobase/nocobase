import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { VariableInput, MetaTreeNode } from '@nocobase/flow-engine';
import { Card, Space, Typography, DatePicker, Switch, Rate, Slider, Select } from 'antd';

const { Title, Paragraph, Text } = Typography;

class PluginFunctionalConvertersDemo extends Plugin {
  async load() {
    const FunctionalConvertersDemo = () => {
      const [formData, setFormData] = useState<Record<string, any>>({
        date: null,
        enabled: false,
        rating: 0,
        volume: 50,
        priority: 'medium',
      });

      // 示例 MetaTree，包含不同接口类型的字段
      const metaTree: MetaTreeNode[] = [
        {
          name: 'settings',
          title: 'Settings',
          type: 'object',
          children: [
            { name: 'createdAt', title: 'Created At', type: 'string', interface: 'date' },
            { name: 'enabled', title: 'Enabled', type: 'boolean', interface: 'switch' },
            { name: 'rating', title: 'Rating', type: 'number', interface: 'rate' },
            { name: 'volume', title: 'Volume', type: 'number', interface: 'slider' },
            { name: 'priority', title: 'Priority', type: 'string', interface: 'priority' },
          ],
        },
      ];

      // 函数式 Converters - 根据字段名和 meta 信息动态生成 converters
      const createConverters = (fieldKey: string) => (meta: MetaTreeNode | null) => ({
        renderInputComponent: (metaNode: MetaTreeNode | null, value: any) => {
          // 如果是变量值，使用默认的 VariableTag
          if (metaNode) {
            return null;
          }

          // 根据字段类型和接口选择合适的组件
          const getComponentByField = () => {
            switch (fieldKey) {
              case 'date':
                return (props: any) => <DatePicker {...props} placeholder="选择日期" format="YYYY-MM-DD" />;

              case 'enabled':
                return (props: any) => (
                  <Switch
                    checked={props.value}
                    onChange={props.onChange}
                    checkedChildren="启用"
                    unCheckedChildren="禁用"
                  />
                );

              case 'rating':
                return (props: any) => (
                  <div>
                    <Rate value={props.value} onChange={props.onChange} allowHalf />
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {props.value} 星
                    </Text>
                  </div>
                );

              case 'volume':
                return (props: any) => (
                  <div style={{ width: 200 }}>
                    <Slider
                      value={props.value}
                      onChange={props.onChange}
                      min={0}
                      max={100}
                      marks={{ 0: '0%', 50: '50%', 100: '100%' }}
                    />
                  </div>
                );

              case 'priority':
                return (props: any) => (
                  <Select {...props} placeholder="选择优先级" style={{ width: 120 }}>
                    <Select.Option value="low">🟢 低</Select.Option>
                    <Select.Option value="medium">🟡 中</Select.Option>
                    <Select.Option value="high">🔴 高</Select.Option>
                  </Select>
                );

              default:
                return null;
            }
          };

          return getComponentByField();
        },

        resolveValueFromPath: (metaNode: MetaTreeNode, path: string[]) => {
          // 可以根据不同字段类型自定义变量格式
          return `{{ ctx.${path.join('.')} }}`;
        },
      });

      const handleChange = (key: string) => (value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
      };

      return (
        <div style={{ padding: 20 }}>
          <Title level={2}>函数式 Converters 演示</Title>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="1. 动态组件生成" size="small">
              <Paragraph>
                <Text type="secondary">使用函数式 converters 根据字段类型动态生成最合适的输入组件。</Text>
              </Paragraph>

              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    日期选择:
                  </Text>
                  <VariableInput
                    value={formData.date}
                    onChange={handleChange('date')}
                    metaTree={metaTree}
                    converters={createConverters('date')}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(formData.date)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    开关控制:
                  </Text>
                  <VariableInput
                    value={formData.enabled}
                    onChange={handleChange('enabled')}
                    metaTree={metaTree}
                    converters={createConverters('enabled')}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(formData.enabled)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    评分组件:
                  </Text>
                  <VariableInput
                    value={formData.rating}
                    onChange={handleChange('rating')}
                    metaTree={metaTree}
                    converters={createConverters('rating')}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(formData.rating)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    滑块控制:
                  </Text>
                  <VariableInput
                    value={formData.volume}
                    onChange={handleChange('volume')}
                    metaTree={metaTree}
                    converters={createConverters('volume')}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(formData.volume)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    优先级选择:
                  </Text>
                  <VariableInput
                    value={formData.priority}
                    onChange={handleChange('priority')}
                    metaTree={metaTree}
                    converters={createConverters('priority')}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(formData.priority)}
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="2. 当前表单数据" size="small">
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {JSON.stringify(formData, null, 2)}
              </pre>
            </Card>

            <Card title="3. 函数式 Converters 原理" size="small">
              <Paragraph>
                <Text type="secondary">函数式 converters 允许根据上下文动态生成配置：</Text>
              </Paragraph>

              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {`// 函数式 converters 签名
converters: (meta: MetaTreeNode | null) => Converters

// 使用示例
const createConverters = (fieldKey: string) => (meta: MetaTreeNode | null) => ({
  renderInputComponent: (metaNode, value) => {
    // 根据 fieldKey 和 meta 信息选择组件
    if (fieldKey === 'date') {
      return (props) => <DatePicker {...props} />;
    }
    return null;
  },
});`}
              </pre>

              <ul style={{ marginTop: 16 }}>
                <li>
                  <Text strong>动态性</Text>：可以根据字段名、meta 信息等动态决定使用什么组件
                </li>
                <li>
                  <Text strong>复用性</Text>：同一个 converter 函数可以处理多种情况
                </li>
                <li>
                  <Text strong>灵活性</Text>：每个字段可以有不同的 converter 逻辑
                </li>
                <li>
                  <Text strong>类型安全</Text>：配合 TypeScript 可以获得完整的类型检查
                </li>
              </ul>
            </Card>
          </Space>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <FunctionalConvertersDemo />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFunctionalConvertersDemo],
});

export default app.getRootComponent();
