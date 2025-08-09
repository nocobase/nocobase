import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { VariableInput, Converters, createRecordProxyContext, useFlowContext } from '@nocobase/flow-engine';
import { Card, Space, Input, InputNumber, Select, DatePicker } from 'antd';

class PluginFieldInterfaceBasedExample extends Plugin {
  async load() {
    // 使用已存在的 'main' 数据源，添加用户字段示例集合
    const mainDataSource = this.flowEngine.context.dataSourceManager.getDataSource('main');

    // 检查是否已经存在 demoUsers 集合，如果不存在则创建
    if (!mainDataSource.getCollection('demoUsers')) {
      mainDataSource.addCollection({
        name: 'demoUsers',
        title: 'Demo Users',
        filterTargetKey: 'id', // 添加必要的 filterTargetKey
        fields: [
          {
            name: 'id',
            title: 'ID',
            type: 'integer',
            interface: 'id',
            primaryKey: true,
          },
          {
            name: 'name',
            title: 'Name',
            type: 'string',
            interface: 'input',
            uiSchema: {
              type: 'string',
              'x-component': 'Input',
            },
          },
          {
            name: 'age',
            title: 'Age',
            type: 'integer',
            interface: 'number',
            uiSchema: {
              type: 'number',
              'x-component': 'InputNumber',
            },
          },
          {
            name: 'status',
            title: 'Status',
            type: 'string',
            interface: 'select',
            uiSchema: {
              type: 'string',
              'x-component': 'Select',
              enum: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Pending', value: 'pending' },
              ],
            },
          },
          {
            name: 'bio',
            title: 'Bio',
            type: 'text',
            interface: 'textarea',
            uiSchema: {
              type: 'string',
              'x-component': 'Input.TextArea',
            },
          },
          {
            name: 'birthday',
            title: 'Birthday',
            type: 'date',
            interface: 'date',
            uiSchema: {
              type: 'string',
              'x-component': 'DatePicker',
            },
          },
          {
            name: 'email',
            title: 'Email',
            type: 'string',
            interface: 'email',
            uiSchema: {
              type: 'string',
              'x-component': 'Input',
            },
          },
        ],
      });
    }

    // 创建示例记录数据
    const currentRecord = {
      id: 1,
      name: 'John Doe',
      age: 30,
      status: 'active',
      bio: 'Software developer with 10+ years experience',
      birthday: '1993-05-15',
      email: 'john.doe@example.com',
    };

    // 使用 createRecordProxyContext 创建记录上下文
    const recordContext = createRecordProxyContext(currentRecord, () => mainDataSource.getCollection('demoUsers'));

    // 注册记录上下文到全局 FlowContext
    this.flowEngine.context.defineProperty('demoRecord', recordContext);

    const FieldInterfaceBasedExample = () => {
      const [value, setValue] = useState('');
      const flowContext = useFlowContext();

      const converters: Converters = {
        renderInputComponent: (contextSelectorItem) => {
          // 检查是否为 demoRecord 的字段
          if (!contextSelectorItem?.fullPath || contextSelectorItem.fullPath[0] !== 'demoRecord') {
            return null;
          }

          // 获取字段的 interface 属性
          const fieldInterface = contextSelectorItem.meta?.interface;
          if (!fieldInterface) return null;

          // 根据字段的 interface 属性选择合适的输入组件
          switch (fieldInterface) {
            case 'input':
            case 'email':
              return Input;
            case 'number':
            case 'id':
              return InputNumber;
            case 'select':
              return ({ onChange, ...props }) => (
                <Select
                  {...props}
                  onChange={onChange}
                  options={contextSelectorItem.meta?.uiSchema?.enum || []}
                  style={{ width: '100%' }}
                />
              );
            case 'textarea':
              return Input.TextArea;
            case 'date':
              return ({ onChange, value, ...props }) => (
                <DatePicker {...props} value={value} onChange={onChange} style={{ width: '100%' }} />
              );
            default:
              return null;
          }
        },
        resolveValueFromPath: (item) => {
          // 检查是否为 demoRecord 的字段
          const path = item?.fullPath;
          if (!path || path[0] !== 'demoRecord') {
            return undefined;
          }

          const fieldInterface = item.meta?.interface;
          if (!fieldInterface) return undefined;

          // 根据字段类型返回合适的默认值
          switch (fieldInterface) {
            case 'input':
            case 'email':
            case 'textarea':
              return '';
            case 'number':
            case 'id':
              return 0;
            case 'select':
              return null;
            case 'date':
              return null;
            default:
              return null;
          }
        },
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="Field Interface Based Components" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <p>这个示例展示了如何根据字段的 interface 属性来渲染不同的输入组件。</p>
                <p>可用字段类型包括：input、number、select、textarea、date、email</p>
                <p>选择 &quot;Demo Record&quot; 下的字段来查看不同的输入组件。</p>
              </div>
              <VariableInput
                value={value}
                onChange={setValue}
                metaTree={() => flowContext.getPropertyMetaTree()}
                converters={converters}
                style={{ width: 400 }}
              />
              <div>
                <strong>当前值：</strong>
                <code>{JSON.stringify(value)}</code>
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <FieldInterfaceBasedExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFieldInterfaceBasedExample],
});

export default app.getRootComponent();
