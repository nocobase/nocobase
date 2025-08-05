import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { VariableInput, Converters, MetaTreeNode } from '@nocobase/flow-engine';
import { Card, Space, Typography, Select, InputNumber, Switch, DatePicker, Rate } from 'antd';

const { Title, Paragraph, Text } = Typography;

class PluginCustomConvertersDemo extends Plugin {
  async load() {
    const CustomConvertersDemo = () => {
      const [stringValue, setStringValue] = useState('');
      const [numberValue, setNumberValue] = useState(0);
      const [selectValue, setSelectValue] = useState('');
      const [booleanValue, setBooleanValue] = useState(false);
      const [dateValue, setDateValue] = useState(null);
      const [ratingValue, setRatingValue] = useState(0);

      // 示例 MetaTree，包含不同类型和接口的字段
      const metaTree: MetaTreeNode[] = [
        {
          name: 'config',
          title: 'Config',
          type: 'object',
          children: [
            { name: 'theme', title: 'Theme', type: 'string', interface: 'select' },
            { name: 'timeout', title: 'Timeout', type: 'number' },
            { name: 'enabled', title: 'Enabled', type: 'boolean' },
            { name: 'createdAt', title: 'Created At', type: 'string', interface: 'date' },
            { name: 'rating', title: 'Rating', type: 'number', interface: 'rate' },
          ],
        },
        {
          name: 'user',
          title: 'User',
          type: 'object',
          children: [
            { name: 'userRating', title: 'User Rating', type: 'number' },
            { name: 'switchValue', title: 'Switch Value', type: 'boolean' },
            { name: 'numberCount', title: 'Number Count', type: 'number' },
            { name: 'dateValue', title: 'Date Value', type: 'string' },
            { name: 'selectOption', title: 'Select Option', type: 'string' },
          ],
        },
      ];

      // 自定义 Converters - 根据字段类型和接口选择不同的输入组件
      const customConverters: Converters = {
        renderInputComponent: (meta, value, componentTypeHint) => {
          // 如果没有 meta（静态值），根据值的类型选择组件
          if (!meta) {
            if (typeof value === 'number') {
              return (props) => <InputNumber {...props} />;
            }
            if (typeof value === 'boolean') {
              return (props) => <Switch checked={props.value} onChange={props.onChange} />;
            }
            return null; // 使用默认的 Input 组件
          }

          // 如果有 meta（动态变量），已经有默认的 VariableTag 处理
          return null;
        },
      };

      // 特殊类型的 Converters - 根据 interface 字段选择组件
      const interfaceConverters: Converters = {
        renderInputComponent: (meta, value, componentTypeHint) => {
          if (!meta) {
            // 优先使用组件类型提示，这样从变量切换回静态值时能保持组件类型
            if (componentTypeHint) {
              switch (componentTypeHint) {
                case 'rate':
                  return (props) => <Rate value={props.value} onChange={props.onChange} />;
                case 'switch':
                  return (props) => (
                    <Switch
                      checked={props.value}
                      onChange={props.onChange}
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  );
                case 'number':
                  return (props) => <InputNumber {...props} />;
                case 'date':
                  return (props) => <DatePicker {...props} />;
                case 'select':
                  return (props) => (
                    <Select {...props} placeholder="选择主题">
                      <Select.Option value="light">Light</Select.Option>
                      <Select.Option value="dark">Dark</Select.Option>
                      <Select.Option value="auto">Auto</Select.Option>
                    </Select>
                  );
              }
            }

            // 回退到基于值类型的判断（原有逻辑）
            if (value === 'light' || value === 'dark' || value === '') {
              return (props) => (
                <Select {...props} placeholder="选择主题">
                  <Select.Option value="light">Light</Select.Option>
                  <Select.Option value="dark">Dark</Select.Option>
                  <Select.Option value="auto">Auto</Select.Option>
                </Select>
              );
            }

            if (typeof value === 'boolean') {
              return (props) => (
                <Switch
                  checked={props.value}
                  onChange={props.onChange}
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                />
              );
            }

            // 日期相关
            if (value && typeof value === 'string' && (value.includes('T') || value.includes('-'))) {
              return (props) => <DatePicker {...props} />;
            }

            // 评分相关
            if (typeof value === 'number' && value >= 0 && value <= 5) {
              return (props) => <Rate value={props.value} onChange={props.onChange} />;
            }
          }
          return null;
        },
      };

      return (
        <div style={{ padding: 20 }}>
          <Title level={2}>自定义 Converters 演示</Title>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="1. 基础类型自定义" size="small">
              <Paragraph>
                <Text type="secondary">根据值的类型自动选择不同的输入组件。</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    字符串输入:
                  </Text>
                  <VariableInput
                    value={stringValue}
                    onChange={setStringValue}
                    metaTree={metaTree}
                    converters={customConverters}
                    placeholder="输入字符串"
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(stringValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    数字输入:
                  </Text>
                  <VariableInput
                    value={numberValue}
                    onChange={setNumberValue}
                    metaTree={metaTree}
                    converters={customConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(numberValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    布尔值输入:
                  </Text>
                  <VariableInput
                    value={booleanValue}
                    onChange={setBooleanValue}
                    metaTree={metaTree}
                    converters={customConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(booleanValue)}
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="2. 特殊接口组件" size="small">
              <Paragraph>
                <Text type="secondary">根据字段的特殊需求使用专门的组件。</Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    主题选择:
                  </Text>
                  <VariableInput
                    value={selectValue}
                    onChange={setSelectValue}
                    metaTree={metaTree}
                    converters={interfaceConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(selectValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    日期选择:
                  </Text>
                  <VariableInput
                    value={dateValue}
                    onChange={setDateValue}
                    metaTree={metaTree}
                    converters={interfaceConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(dateValue)}
                  </Text>
                </div>

                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    评分输入:
                  </Text>
                  <VariableInput
                    value={ratingValue}
                    onChange={setRatingValue}
                    metaTree={metaTree}
                    converters={interfaceConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(ratingValue)}
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="3. 智能组件切换演示" size="small">
              <Paragraph>
                <Text type="secondary">
                  演示从变量切换回静态值时保持组件类型的功能。尝试选择 user.userRating
                  变量，然后清除回到静态值，Rate组件会被保持。
                </Text>
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ width: 120, display: 'inline-block' }}>
                    智能切换:
                  </Text>
                  <VariableInput
                    value={ratingValue}
                    onChange={setRatingValue}
                    metaTree={metaTree}
                    converters={interfaceConverters}
                    style={{ width: 250 }}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {JSON.stringify(ratingValue)}
                  </Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    💡 使用步骤：
                    <br />
                    1. 点击变量选择按钮 → 选择 &quot;User&quot; → 选择 &quot;User Rating&quot;
                    <br />
                    2. 点击变量标签中的清除按钮
                    <br />
                    3. 注意：清除后仍然显示 Rate 组件，而不是普通输入框
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="4. Converters 配置说明" size="small">
              <Paragraph>
                <Text type="secondary">Converters 对象可以包含以下方法：</Text>
              </Paragraph>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {`interface Converters {
  // 自定义输入组件渲染
  renderInputComponent?: (
    meta: MetaTreeNode | null, 
    value: any, 
    componentTypeHint?: string | null
  ) => React.ComponentType<any> | null;
    
  // 自定义路径解析
  resolvePathFromValue?: (value: any) => string[] | null;
  
  // 自定义值生成
  resolveValueFromPath?: (meta: MetaTreeNode, path: string[]) => any;
}`}
              </pre>

              <ul style={{ marginTop: 16 }}>
                <li>
                  <Text strong>renderInputComponent</Text>：返回 null 使用默认组件，返回自定义组件覆盖默认行为
                </li>
                <li>
                  <Text strong>meta 参数</Text>：如果是变量值则有 meta 信息，静态值时为 null
                </li>
                <li>
                  <Text strong>componentTypeHint 参数</Text>：组件类型提示，从变量名推断（如 &apos;rate&apos;,
                  &apos;switch&apos;, &apos;number&apos; 等）
                </li>
                <li>
                  <Text strong>优先级</Text>：componentTypeHint {'>'}值类型判断 {'>'} 默认组件
                </li>
                <li>
                  <Text strong>智能切换</Text>：从变量切换回静态值时，会基于 componentTypeHint 保持组件类型
                </li>
              </ul>
            </Card>
          </Space>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <CustomConvertersDemo />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginCustomConvertersDemo],
});

export default app.getRootComponent();
