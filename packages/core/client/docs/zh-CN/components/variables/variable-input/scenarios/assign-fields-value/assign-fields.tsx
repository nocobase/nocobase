/**
 * defaultShowCode: false
 * title: 字段赋值（支持不同类型的 Constant）
 */

import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput, Converters, MetaTreeNode } from '@nocobase/flow-engine';
import { Card, Space, Input, InputNumber, DatePicker, Form } from 'antd';

class PluginAssignFieldsExample extends Plugin {
  async load() {
    const AssignFieldsExample = () => {
      const [formValues, setFormValues] = useState({
        name: '',
        age: 0,
        email: '',
        birthdate: '',
        salary: 0,
      });

      const flowContext = React.useMemo(() => {
        const ctx = new FlowContext();
        ctx.defineProperty('user', {
          value: { name: 'John', email: 'john@example.com', age: 30 },
          meta: {
            title: 'User',
            type: 'object',
            properties: {
              name: { title: 'Name', type: 'string' },
              email: { title: 'Email', type: 'string' },
              age: { title: 'Age', type: 'number' },
            },
          },
        });
        ctx.defineProperty('org', {
          value: { title: 'Engineering', budget: 100000 },
          meta: {
            title: 'Organization',
            type: 'object',
            properties: {
              title: { title: 'Title', type: 'string' },
              budget: { title: 'Budget', type: 'number' },
            },
          },
        });
        return ctx;
      }, []);

      // 为不同类型的字段创建对应的 metaTree 和 converters
      const createFieldConfig = (fieldType: 'string' | 'number' | 'date') => {
        const getMetaTree = () => {
          const baseMetaTree = flowContext.getPropertyMetaTree();

          // 添加 Null 选项
          baseMetaTree.splice(0, 0, {
            name: 'Null',
            title: 'Null',
            type: 'null',
            paths: ['Null'],
            render: () => <span style={{ color: '#999' }}>null</span>,
          });

          // 根据字段类型添加不同的 Constant 选项
          if (fieldType === 'string') {
            baseMetaTree.splice(0, 0, {
              name: 'Constant',
              title: 'Constant',
              type: 'string',
              paths: ['Constant'],
              render: () => <Input placeholder="输入文本常量" />,
            });
          } else if (fieldType === 'number') {
            baseMetaTree.splice(0, 0, {
              name: 'Constant',
              title: 'Constant',
              type: 'number',
              paths: ['Constant'],
              render: () => <InputNumber placeholder="输入数字常量" style={{ width: '100%' }} />,
            });
          } else if (fieldType === 'date') {
            baseMetaTree.splice(0, 0, {
              name: 'Constant',
              title: 'Constant',
              type: 'date',
              paths: ['Constant'],
              render: () => <DatePicker placeholder="选择日期常量" style={{ width: '100%' }} />,
            });
          }

          return baseMetaTree;
        };

        const converters: Converters = {
          // 根据选中的节点类型动态渲染输入组件
          renderInputComponent: (metaTreeNode: MetaTreeNode | null) => {
            if (metaTreeNode) {
              return metaTreeNode.render;
            }
            if (fieldType === 'number') {
              return InputNumber;
            }
            if (fieldType === 'date') {
              return DatePicker;
            }
            return Input;
          },
          resolveValueFromPath: (item) => {
            if (item?.paths[0] === 'Constant') {
              return fieldType === 'number' ? 0 : '';
            }
            if (item?.paths[0] === 'Null') {
              return null;
            }
            return undefined;
          },
        };

        return { getMetaTree, converters };
      };

      const stringFieldConfig = createFieldConfig('string');
      const numberFieldConfig = createFieldConfig('number');
      const dateFieldConfig = createFieldConfig('date');

      const handleFieldChange = (fieldName: string, value: any) => {
        setFormValues((prev) => ({ ...prev, [fieldName]: value }));
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="字段赋值示例" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Form layout="vertical" style={{ maxWidth: 600 }}>
                <Form.Item label="姓名（文本字段）" required>
                  <VariableInput
                    value={formValues.name}
                    onChange={(value) => handleFieldChange('name', value)}
                    metaTree={stringFieldConfig.getMetaTree}
                    converters={stringFieldConfig.converters}
                    style={{ width: '100%' }}
                    placeholder="选择变量或输入常量"
                  />
                </Form.Item>

                <Form.Item label="年龄（数字字段）" required>
                  <VariableInput
                    value={formValues.age}
                    onChange={(value) => handleFieldChange('age', value)}
                    metaTree={numberFieldConfig.getMetaTree}
                    converters={numberFieldConfig.converters}
                    style={{ width: '100%' }}
                    placeholder="选择变量或输入数字常量"
                  />
                </Form.Item>

                <Form.Item label="邮箱（文本字段）">
                  <VariableInput
                    value={formValues.email}
                    onChange={(value) => handleFieldChange('email', value)}
                    metaTree={stringFieldConfig.getMetaTree}
                    converters={stringFieldConfig.converters}
                    style={{ width: '100%' }}
                    placeholder="选择变量或输入邮箱常量"
                  />
                </Form.Item>

                <Form.Item label="生日（日期字段）">
                  <VariableInput
                    value={formValues.birthdate}
                    onChange={(value) => handleFieldChange('birthdate', value)}
                    metaTree={dateFieldConfig.getMetaTree}
                    converters={dateFieldConfig.converters}
                    style={{ width: '100%' }}
                    placeholder="选择变量或选择日期常量"
                  />
                </Form.Item>

                <Form.Item label="薪资（数字字段）">
                  <VariableInput
                    value={formValues.salary}
                    onChange={(value) => handleFieldChange('salary', value)}
                    metaTree={numberFieldConfig.getMetaTree}
                    converters={numberFieldConfig.converters}
                    style={{ width: '100%' }}
                    placeholder="选择变量或输入薪资常量"
                  />
                </Form.Item>
              </Form>

              <Card size="small" title="当前表单值" style={{ backgroundColor: '#fafafa' }}>
                <pre style={{ marginTop: 8, fontSize: '12px' }}>{JSON.stringify(formValues, null, 2)}</pre>
              </Card>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <AssignFieldsExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginAssignFieldsExample],
});

export default app.getRootComponent();
