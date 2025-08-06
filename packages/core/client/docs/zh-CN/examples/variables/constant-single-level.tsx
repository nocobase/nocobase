import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput, Converters } from '@nocobase/flow-engine';
import { Card, Space, Typography, InputNumber, Switch, DatePicker } from 'antd';

const { Title, Paragraph, Text } = Typography;

class PluginConstantSingleLevelDemo extends Plugin {
  async load() {
    // 创建示例的 Flow Context
    const flowContext = new FlowContext();

    // 定义单层常量 - 应用配置相关
    flowContext.defineProperty('appName', {
      value: 'NocoBase',
      meta: {
        title: 'Application Name',
        type: 'string',
      },
    });

    flowContext.defineProperty('version', {
      value: 2.0,
      meta: {
        title: 'Version',
        type: 'number',
      },
    });

    flowContext.defineProperty('debugMode', {
      value: false,
      meta: {
        title: 'Debug Mode',
        type: 'boolean',
      },
    });

    flowContext.defineProperty('releaseDate', {
      value: new Date().toISOString(),
      meta: {
        title: 'Release Date',
        type: 'string',
        interface: 'date',
      },
    });

    // 定义单层常量 - 业务配置相关
    flowContext.defineProperty('taxRate', {
      value: 0.13,
      meta: {
        title: 'Tax Rate',
        type: 'number',
      },
    });

    flowContext.defineProperty('isOnline', {
      value: true,
      meta: {
        title: 'Online Status',
        type: 'boolean',
      },
    });

    flowContext.defineProperty('currentTime', {
      value: new Date().toISOString(),
      meta: {
        title: 'Current Time',
        type: 'string',
        interface: 'date',
      },
    });

    // 自定义 Converters - 根据常量类型选择输入组件
    const constantConverters: Converters = {
      renderInputComponent: (meta, value) => {
        if (!meta) {
          // 静态值模式 - 根据值的类型选择组件
          if (typeof value === 'number') {
            return (props) => <InputNumber {...props} placeholder="输入数字" style={{ width: '100%' }} precision={2} />;
          }

          if (typeof value === 'boolean') {
            return (props) => (
              <Switch checked={props.value} onChange={props.onChange} checkedChildren="开启" unCheckedChildren="关闭" />
            );
          }

          // 根据值的内容判断是否为日期
          if (typeof value === 'string' && (value.includes('T') || value.includes('-'))) {
            return (props) => <DatePicker {...props} showTime placeholder="选择日期时间" style={{ width: '100%' }} />;
          }

          // 默认使用 Input 组件（字符串）
          return null;
        }

        // 变量模式使用默认的 VariableTag
        return null;
      },
    };

    // 演示组件
    const ConstantSingleLevelDemo = () => {
      const [appNameValue, setAppNameValue] = useState('NocoBase Demo');
      const [versionValue, setVersionValue] = useState(1.5);
      const [debugValue, setDebugValue] = useState(true);
      const [dateValue, setDateValue] = useState('2024-01-01T10:00:00.000Z');
      const [taxRateValue, setTaxRateValue] = useState(0.15);
      const [onlineValue, setOnlineValue] = useState(false);

      return (
        <div style={{ padding: 20 }}>
          <Title level={2}>Constant 单层上下文演示</Title>

          <Paragraph>
            <Text type="secondary">
              演示如何使用单层常量定义和智能组件选择。常量通过 FlowContext.defineProperty() 定义，
              组件会根据常量的类型自动选择合适的输入组件。
            </Text>
          </Paragraph>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="1. 应用配置常量" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 140, display: 'inline-block' }}>
                    应用名称 (string):
                  </Text>
                  <VariableInput
                    value={appNameValue}
                    onChange={setAppNameValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={constantConverters}
                    placeholder="输入应用名称"
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(appNameValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 140, display: 'inline-block' }}>
                    版本号 (number):
                  </Text>
                  <VariableInput
                    value={versionValue}
                    onChange={setVersionValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={constantConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(versionValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 140, display: 'inline-block' }}>
                    调试模式 (boolean):
                  </Text>
                  <VariableInput
                    value={debugValue}
                    onChange={setDebugValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={constantConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(debugValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 140, display: 'inline-block' }}>
                    发布日期 (date):
                  </Text>
                  <VariableInput
                    value={dateValue}
                    onChange={setDateValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={constantConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(dateValue).slice(0, 30)}...
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="2. 业务配置常量" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 140, display: 'inline-block' }}>
                    税率 (number):
                  </Text>
                  <VariableInput
                    value={taxRateValue}
                    onChange={setTaxRateValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={constantConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(taxRateValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 140, display: 'inline-block' }}>
                    在线状态 (boolean):
                  </Text>
                  <VariableInput
                    value={onlineValue}
                    onChange={setOnlineValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={constantConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(onlineValue)}
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="3. 智能组件切换演示" size="small">
              <Paragraph>
                <Text type="secondary">演示从变量切换回静态值时保持组件类型的功能：</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 140, display: 'inline-block' }}>
                    智能切换示例:
                  </Text>
                  <VariableInput
                    value={versionValue}
                    onChange={setVersionValue}
                    metaTree={() => flowContext.getPropertyMetaTree()}
                    converters={constantConverters}
                    style={{ width: 250 }}
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    💡 使用步骤：
                    <br />
                    1. 点击变量选择按钮 → 选择 &quot;Version&quot; 常量
                    <br />
                    2. 点击变量标签中的清除按钮
                    <br />
                    3. 注意：清除后显示 InputNumber 组件（数字输入），而不是普通文本输入框
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="4. 常量定义说明" size="small">
              <Paragraph>
                <Text type="secondary">通过 FlowContext.defineProperty() 定义的单层常量：</Text>
              </Paragraph>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {`// 字符串常量
flowContext.defineProperty('appName', {
  value: 'NocoBase',
  meta: { title: 'Application Name', type: 'string' }
});

// 数字常量  
flowContext.defineProperty('version', {
  value: 2.0,
  meta: { title: 'Version', type: 'number' }
});

// 布尔常量
flowContext.defineProperty('debugMode', {
  value: false,
  meta: { title: 'Debug Mode', type: 'boolean' }
});`}
              </pre>

              <ul style={{ marginTop: 16 }}>
                <li>
                  <Text strong>单层结构</Text>：直接在根级别定义常量，无嵌套层级
                </li>
                <li>
                  <Text strong>类型推断</Text>：组件根据 meta.type 和 value 的类型自动选择输入组件
                </li>
                <li>
                  <Text strong>智能切换</Text>：从变量切换回静态值时保持组件类型一致性
                </li>
                <li>
                  <Text strong>即插即用</Text>：定义的常量可立即在变量选择器中使用
                </li>
              </ul>
            </Card>
          </Space>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <ConstantSingleLevelDemo />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginConstantSingleLevelDemo],
});

export default app.getRootComponent();
