import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput, Converters, ContextSelectorItem } from '@nocobase/flow-engine';
import { Card, Space, Typography, InputNumber, DatePicker, Switch, Input } from 'antd';

const { Title, Paragraph, Text } = Typography;

class PluginConstantMultiLevelDemo extends Plugin {
  async load() {
    // 创建示例的 Flow Context
    const flowContext = new FlowContext();

    // 定义二层常量结构 - Constant 父级包含不同类型的子常量
    flowContext.defineProperty('Constant', {
      value: {
        number: 42,
        string: 'Hello World',
        date: new Date().toISOString(),
        config: {
          timeout: 5000,
          enabled: true,
          retries: 3,
        },
      },
      meta: {
        title: 'Constant',
        type: 'object',
        properties: {
          number: {
            title: 'Number Value',
            type: 'number',
          },
          string: {
            title: 'String Value',
            type: 'string',
          },
          date: {
            title: 'Date Value',
            type: 'string',
            interface: 'date',
          },
          config: {
            title: 'Config',
            type: 'object',
            properties: {
              timeout: {
                title: 'Timeout (ms)',
                type: 'number',
              },
              enabled: {
                title: 'Enabled',
                type: 'boolean',
              },
              retries: {
                title: 'Retry Count',
                type: 'number',
              },
            },
          },
        },
      },
    });

    // 定义业务相关的二层常量
    flowContext.defineProperty('Business', {
      value: {
        pricing: {
          basePrice: 99.99,
          discount: 0.15,
          currency: 'USD',
        },
        limits: {
          maxUsers: 100,
          maxStorage: 1024,
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      meta: {
        title: 'Business',
        type: 'object',
        properties: {
          pricing: {
            title: 'Pricing',
            type: 'object',
            properties: {
              basePrice: { title: 'Base Price', type: 'number' },
              discount: { title: 'Discount Rate', type: 'number' },
              currency: { title: 'Currency', type: 'string' },
            },
          },
          limits: {
            title: 'Limits',
            type: 'object',
            properties: {
              maxUsers: { title: 'Max Users', type: 'number' },
              maxStorage: { title: 'Max Storage (GB)', type: 'number' },
              validUntil: { title: 'Valid Until', type: 'string', interface: 'date' },
            },
          },
        },
      },
    });

    // 自定义 Converters - 针对二层结构的专门组件选择
    const multiLevelConverters: Converters = {
      renderInputComponent: (item: ContextSelectorItem) => {
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
      resolveValueFromPath(contextSelectorItem, path) {
        if (path?.[0] === 'Constant') {
          return null;
        }
      },
    };

    // 演示组件
    const ConstantMultiLevelDemo = () => {
      const [numberValue, setNumberValue] = useState(100);
      const [stringValue, setStringValue] = useState('Demo Text');
      const [dateValue, setDateValue] = useState('2024-12-31T23:59:59.000Z');
      const [timeoutValue, setTimeoutValue] = useState(3000);
      const [enabledValue, setEnabledValue] = useState(true);
      const [priceValue, setPriceValue] = useState(199.99);

      return (
        <div style={{ padding: 20 }}>
          <Title level={2}>Constant 二层上下文演示</Title>

          <Paragraph>
            <Text type="secondary">
              演示二层结构的常量定义和专门的组件选择机制。通过 Constant → type 的路径结构，
              可以选择到具体的子常量，并根据其类型自动匹配合适的 Ant Design 组件。
            </Text>
          </Paragraph>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="1. Constant 基础类型" size="small">
              <Paragraph>
                <Text type="secondary">演示 Constant 下的基础类型常量：number、string、date</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 150, display: 'inline-block' }}>
                    Constant.number:
                  </Text>
                  <VariableInput
                    value={numberValue}
                    onChange={setNumberValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={multiLevelConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(numberValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 150, display: 'inline-block' }}>
                    Constant.string:
                  </Text>
                  <VariableInput
                    value={stringValue}
                    onChange={setStringValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={multiLevelConverters}
                    placeholder="输入字符串"
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(stringValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 150, display: 'inline-block' }}>
                    Constant.date:
                  </Text>
                  <VariableInput
                    value={dateValue}
                    onChange={setDateValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={multiLevelConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(dateValue).slice(0, 25)}...
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="2. Constant.config 子级配置" size="small">
              <Paragraph>
                <Text type="secondary">演示更深层级的配置常量：Constant → config → timeout/enabled</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 150, display: 'inline-block' }}>
                    Config.timeout:
                  </Text>
                  <VariableInput
                    value={timeoutValue}
                    onChange={setTimeoutValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={multiLevelConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(timeoutValue)} ms
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 150, display: 'inline-block' }}>
                    Config.enabled:
                  </Text>
                  <VariableInput
                    value={enabledValue}
                    onChange={setEnabledValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={multiLevelConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(enabledValue)}
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="3. Business 业务常量" size="small">
              <Paragraph>
                <Text type="secondary">演示业务相关的二层常量：Business → pricing → basePrice</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 150, display: 'inline-block' }}>
                    Pricing.basePrice:
                  </Text>
                  <VariableInput
                    value={priceValue}
                    onChange={setPriceValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={multiLevelConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ${JSON.stringify(priceValue)}
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="4. 智能组件切换演示" size="small">
              <Paragraph>
                <Text type="secondary">演示从二层变量切换回静态值时保持组件类型的功能：</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 150, display: 'inline-block' }}>
                    智能切换示例:
                  </Text>
                  <VariableInput
                    value={numberValue}
                    onChange={setNumberValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={multiLevelConverters}
                    style={{ width: 250 }}
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    💡 使用步骤：
                    <br />
                    1. 点击变量选择按钮 → 选择 &quot;Constant&quot; → 选择 &quot;Number Value&quot;
                    <br />
                    2. 点击变量标签中的清除按钮
                    <br />
                    3. 注意：清除后显示专门的 InputNumber 组件，而不是普通文本输入框
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="5. 二层结构定义说明" size="small">
              <Paragraph>
                <Text type="secondary">二层常量的定义结构：</Text>
              </Paragraph>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {`// 二层常量定义
flowContext.defineProperty('Constant', {
  value: {
    number: 42,
    string: 'Hello World',
    date: new Date().toISOString(),
    config: {
      timeout: 5000,
      enabled: true
    }
  },
  meta: {
    title: 'Constant',
    type: 'object',
    properties: {
      number: { title: 'Number Value', type: 'number' },
      string: { title: 'String Value', type: 'string' },
      config: {
        title: 'Config',
        type: 'object',
        properties: {
          timeout: { title: 'Timeout', type: 'number' },
          enabled: { title: 'Enabled', type: 'boolean' }
        }
      }
    }
  }
});`}
              </pre>

              <ul style={{ marginTop: 16 }}>
                <li>
                  <Text strong>层级结构</Text>：支持 Constant → subtype 的二层或多层嵌套
                </li>
                <li>
                  <Text strong>路径生成</Text>：自动生成完整变量路径，如 <Text code>{'{{ ctx.Constant.number }}'}</Text>
                </li>
                <li>
                  <Text strong>专门组件</Text>：根据子节点的 type 和 interface 选择专门的 Ant Design 组件
                </li>
                <li>
                  <Text strong>懒加载</Text>：支持异步加载深层子节点，适合大型配置结构
                </li>
                <li>
                  <Text strong>类型安全</Text>：完整的 TypeScript 类型推断和检查
                </li>
              </ul>
            </Card>

            <Card title="6. 可选择的常量路径" size="small">
              <Paragraph>
                <Text type="secondary">当前可选择的二层常量路径：</Text>
              </Paragraph>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                <Text code>Constant</Text>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>
                    <Text code>→ number</Text> (InputNumber)
                  </li>
                  <li>
                    <Text code>→ string</Text> (Input)
                  </li>
                  <li>
                    <Text code>→ date</Text> (DatePicker)
                  </li>
                  <li>
                    <Text code>→ config</Text>
                    <ul>
                      <li>
                        <Text code>→ timeout</Text> (InputNumber)
                      </li>
                      <li>
                        <Text code>→ enabled</Text> (Switch)
                      </li>
                      <li>
                        <Text code>→ retries</Text> (InputNumber)
                      </li>
                    </ul>
                  </li>
                </ul>

                <Text code style={{ marginTop: 12, display: 'block' }}>
                  Business
                </Text>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>
                    <Text code>→ pricing</Text>
                    <ul>
                      <li>
                        <Text code>→ basePrice</Text> (InputNumber)
                      </li>
                      <li>
                        <Text code>→ discount</Text> (InputNumber)
                      </li>
                      <li>
                        <Text code>→ currency</Text> (Input)
                      </li>
                    </ul>
                  </li>
                  <li>
                    <Text code>→ limits</Text>
                    <ul>
                      <li>
                        <Text code>→ maxUsers</Text> (InputNumber)
                      </li>
                      <li>
                        <Text code>→ maxStorage</Text> (InputNumber)
                      </li>
                      <li>
                        <Text code>→ validUntil</Text> (DatePicker)
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </Card>
          </Space>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <ConstantMultiLevelDemo />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginConstantMultiLevelDemo],
});

export default app.getRootComponent();
