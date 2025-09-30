import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, SlateVariableEditor } from '@nocobase/flow-engine';
import { Card, Space, Typography, Alert, Tag } from 'antd';

const { Title, Paragraph, Text } = Typography;

class PluginSlateVariableEditorExample extends Plugin {
  async load() {
    const SlateVariableEditorExample = () => {
      const [basicValue, setBasicValue] = useState(
        'Hello {{ctx.user.profile.personal.firstName}}, welcome to {{ctx.system.config.app.name}}!',
      );
      const [multilineValue, setMultilineValue] = useState(
        `Dear {{ctx.user.name}},

Your account {{ctx.user.email}} has been activated on {{ctx.system.date}}.
You are using version {{ctx.system.version}} of our platform.

Best regards,
The Team`,
      );

      const flowContext = new FlowContext();

      // 添加用户信息变量
      flowContext.defineProperty('user', {
        value: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Admin',
          profile: {
            personal: {
              firstName: 'John',
              lastName: 'Doe',
              age: 28,
              avatar: 'https://example.com/avatar.jpg',
            },
            contact: {
              phone: '+1-555-0123',
              address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA',
              },
            },
            preferences: {
              language: 'en',
              timezone: 'America/New_York',
              notifications: {
                email: true,
                sms: false,
                push: true,
              },
            },
          },
        },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            name: { title: 'Name', type: 'string' },
            email: { title: 'Email', type: 'string' },
            role: { title: 'Role', type: 'string' },
            profile: {
              title: 'Profile',
              type: 'object',
              properties: {
                personal: {
                  title: 'Personal Info',
                  type: 'object',
                  properties: {
                    firstName: { title: 'First Name', type: 'string' },
                    lastName: { title: 'Last Name', type: 'string' },
                    age: { title: 'Age', type: 'number' },
                    avatar: { title: 'Avatar URL', type: 'string' },
                  },
                },
                contact: {
                  title: 'Contact Info',
                  type: 'object',
                  properties: {
                    phone: { title: 'Phone', type: 'string' },
                    address: {
                      title: 'Address',
                      type: 'object',
                      properties: {
                        street: { title: 'Street', type: 'string' },
                        city: { title: 'City', type: 'string' },
                        state: { title: 'State', type: 'string' },
                        zipCode: { title: 'Zip Code', type: 'string' },
                        country: { title: 'Country', type: 'string' },
                      },
                    },
                  },
                },
                preferences: {
                  title: 'Preferences',
                  type: 'object',
                  properties: {
                    language: { title: 'Language', type: 'string' },
                    timezone: { title: 'Timezone', type: 'string' },
                    notifications: {
                      title: 'Notifications',
                      type: 'object',
                      properties: {
                        email: { title: 'Email Notifications', type: 'boolean' },
                        sms: { title: 'SMS Notifications', type: 'boolean' },
                        push: { title: 'Push Notifications', type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // 添加系统变量 (2层嵌套)
      flowContext.defineProperty('system', {
        value: {
          date: new Date().toLocaleDateString(),
          version: '2.0.0',
          platform: 'NocoBase',
          config: {
            name: 'NocoBase App',
            env: 'production',
            debug: false,
          },
        },
        meta: {
          title: 'System',
          type: 'object',
          properties: {
            date: { title: 'Current Date', type: 'string' },
            version: { title: 'Version', type: 'string' },
            platform: { title: 'Platform', type: 'string' },
            config: {
              title: 'Configuration',
              type: 'object',
              properties: {
                name: { title: 'App Name', type: 'string' },
                env: { title: 'Environment', type: 'string' },
                debug: { title: 'Debug Mode', type: 'boolean' },
              },
            },
          },
        },
      });

      // 添加订单信息变量 (2层嵌套)
      flowContext.defineProperty('order', {
        value: {
          id: 'ORD-2024-001',
          amount: 299.99,
          status: 'Completed',
          customer: {
            name: 'Jane Smith',
            email: 'jane@example.com',
          },
          payment: {
            method: 'credit_card',
            status: 'completed',
          },
        },
        meta: {
          title: 'Order',
          type: 'object',
          properties: {
            id: { title: 'Order ID', type: 'string' },
            amount: { title: 'Amount', type: 'number' },
            status: { title: 'Status', type: 'string' },
            customer: {
              title: 'Customer',
              type: 'object',
              properties: {
                name: { title: 'Customer Name', type: 'string' },
                email: { title: 'Email', type: 'string' },
              },
            },
            payment: {
              title: 'Payment',
              type: 'object',
              properties: {
                method: { title: 'Payment Method', type: 'string' },
                status: { title: 'Payment Status', type: 'string' },
              },
            },
          },
        },
      });

      return (
        <div style={{ padding: 20 }}>
          <Card title="SlateVariableEditor - 基于 Slate.js 的专业编辑器" size="small">
            <Alert
              message="🎯 推荐使用的解决方案"
              description={
                <span>
                  SlateVariableEditor 基于 Slate.js（8.7k+ stars）构建，完美集成了 NocoBase 的组件生态：
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>
                      使用 <Tag color="blue">FlowContextSelector</Tag> 作为变量选择器
                    </li>
                    <li>
                      使用 <Tag color="green">InlineVariableTag</Tag> 作为变量显示组件
                    </li>
                    <li>支持 inline void 元素，变量作为原子单位不可编辑</li>
                    <li>精确的光标控制，专业的编辑体验</li>
                    <li>内置撤销/重做、键盘导航等高级功能</li>
                  </ul>
                </span>
              }
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 基础示例 */}
              <div>
                <Title level={4}>基础示例 - 单行编辑</Title>
                <Paragraph type="secondary">
                  输入 <Text code>{'{{'}</Text> 触发变量选择器，选择的变量将以标签形式显示
                </Paragraph>

                <SlateVariableEditor
                  value={basicValue}
                  onChange={setBasicValue}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  placeholder="输入文本，使用 {{ 插入变量"
                  style={{ width: '100%' }}
                />

                <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  <Text type="secondary">输出值：</Text>
                  <pre style={{ margin: '8px 0 0 0', fontFamily: 'monospace', fontSize: 13 }}>{basicValue}</pre>
                </div>
              </div>

              {/* 多行编辑示例 */}
              <div>
                <Title level={4}>多行编辑模式</Title>
                <Paragraph type="secondary">支持多行文本编辑，适合邮件模板、通知模板等场景</Paragraph>

                <SlateVariableEditor
                  value={multilineValue}
                  onChange={setMultilineValue}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  placeholder="编写邮件模板，使用 {{ 插入变量"
                  multiline
                  style={{ width: '100%', minHeight: 150 }}
                />

                <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  <Text type="secondary">输出值：</Text>
                  <pre style={{ margin: '8px 0 0 0', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                    {multilineValue}
                  </pre>
                </div>
              </div>

              {/* 特性说明 */}
              <div>
                <Title level={4}>核心特性</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    message="变量作为原子单位"
                    description="变量在编辑器中作为 inline void 元素，不可直接编辑内容，只能整体删除或移动"
                    type="info"
                  />
                  <Alert
                    message="智能键盘导航"
                    description="使用方向键在变量间跳转，Backspace 删除整个变量，ESC 关闭选择器"
                    type="info"
                  />
                  <Alert
                    message="完整的编辑功能"
                    description="支持撤销/重做（Ctrl+Z/Ctrl+Y）、文本选择、复制粘贴等标准编辑操作"
                    type="info"
                  />
                </Space>
              </div>

              {/* 自定义触发字符 */}
              {/* <div>
                <Title level={4}>自定义配置</Title>
                <Paragraph type="secondary">
                  可以自定义触发字符，例如使用 <Text code>@@</Text> 替代默认的 <Text code>{'{{'}</Text>
                </Paragraph>
                
                <SlateVariableEditor
                  value=""
                  onChange={(v) => console.log('Custom trigger:', v)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  placeholder="输入 @@ 来插入变量"
                  triggerChars="@@"
                  style={{ width: '100%' }}
                />
              </div> */}
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <SlateVariableEditorExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginSlateVariableEditorExample],
});

export default app.getRootComponent();
