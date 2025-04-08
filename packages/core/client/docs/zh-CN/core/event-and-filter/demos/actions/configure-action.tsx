import { Modal, Form, Input, Select } from 'antd';
import React, { useState, useEffect } from 'react';
import { EventFlowActionOptions } from '../libs/eventflow-manager';

// 通用的配置动作定义
export const configureAction: EventFlowActionOptions = {
  name: 'configureAction',
  title: '配置动作',
  description: '打开配置弹窗，修改动作参数',
  group: 'ui',
  sort: 1,
  uiSchema: {
    actionName: {
      type: 'string',
      title: '动作名称',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: '要配置的动作名称',
      },
    },
    stepKey: {
      type: 'string',
      title: '步骤标识',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: '要配置的步骤Key',
      },
    },
    flowKey: {
      type: 'string',
      title: '流程标识',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: '所属流程的Key',
      },
    },
  },
  handler: async (params, context) => {
    const { actionName, stepKey, flowKey, eventFlowManager, customCallback } = params;

    // 查找指定的 action 定义
    const action = eventFlowManager.getAction(actionName);
    if (!action) {
      console.error(`找不到名为 ${actionName} 的动作`);
      return {
        success: false,
        error: `找不到名为 ${actionName} 的动作`,
      };
    }

    // 查找步骤实例
    const flow = eventFlowManager.getFlow(flowKey);
    if (!flow) {
      console.error(`找不到名为 ${flowKey} 的流程`);
      return {
        success: false,
        error: `找不到名为 ${flowKey} 的流程`,
      };
    }

    // 获取步骤
    const steps = Object.values(flow['eventFlowSteps']);
    const step = steps.find((s) => s.key === stepKey);

    if (!step) {
      console.error(`在流程 ${flowKey} 中找不到名为 ${stepKey} 的步骤`);
      return {
        success: false,
        error: `找不到指定的步骤`,
      };
    }

    // 从 action 的 uiSchema 生成配置表单
    const uiSchema = action.uiSchema;
    const initialValues = step.params || {};

    // 创建一个承诺，当表单提交或取消时解决
    return new Promise((resolve) => {
      // 打开配置弹窗
      const ConfigurationModal = ({ onSave, onCancel }) => {
        const [form] = Form.useForm();
        const [visible, setVisible] = useState(true);

        // 初始化表单值
        useEffect(() => {
          if (initialValues) {
            form.setFieldsValue(initialValues);
          }
        }, [form]);

        // 处理表单提交
        const handleSubmit = () => {
          form
            .validateFields()
            .then((values) => {
              // 更新步骤参数
              step.set('params', values);

              // 如果有自定义回调，执行它
              if (typeof customCallback === 'function') {
                customCallback(values);
              }

              // 关闭弹窗
              setVisible(false);
              onSave(values);
            })
            .catch((info) => {
              console.log('验证失败:', info);
            });
        };

        // 处理取消
        const handleCancel = () => {
          setVisible(false);
          onCancel();
        };

        // 根据 uiSchema 动态渲染表单项
        const renderFormItems = () => {
          return Object.entries(uiSchema).map(([key, schema]) => {
            // 设置通用属性
            const commonProps = {
              name: key,
              label: schema.title,
              rules: [{ required: schema.required, message: `请输入${schema.title}` }],
            };

            // 根据组件类型渲染不同的表单项
            if (schema['x-component'] === 'Input') {
              return (
                <Form.Item key={key} {...commonProps}>
                  <Input placeholder={schema['x-component-props']?.placeholder} />
                </Form.Item>
              );
            } else if (schema['x-component'] === 'Input.TextArea') {
              return (
                <Form.Item key={key} {...commonProps}>
                  <Input.TextArea rows={3} placeholder={schema['x-component-props']?.placeholder} />
                </Form.Item>
              );
            } else if (schema['x-component'] === 'Select') {
              return (
                <Form.Item key={key} {...commonProps}>
                  <Select placeholder={schema['x-component-props']?.placeholder}>
                    {schema.enum?.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            }

            // 默认返回文本输入框
            return (
              <Form.Item key={key} {...commonProps}>
                <Input />
              </Form.Item>
            );
          });
        };

        return (
          <Modal
            title={`配置 ${action.title}`}
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            destroyOnClose
          >
            <Form form={form} layout="vertical" initialValues={initialValues}>
              {renderFormItems()}
            </Form>
          </Modal>
        );
      };

      // 渲染弹窗并设置回调
      const container = document.createElement('div');
      document.body.appendChild(container);

      const onSave = (values) => {
        document.body.removeChild(container);
        resolve({
          success: true,
          data: values,
        });
      };

      const onCancel = () => {
        document.body.removeChild(container);
        resolve({
          success: false,
          canceled: true,
        });
      };

      // 使用 React 渲染弹窗
      const { createRoot } = require('react-dom/client');
      const root = createRoot(container);
      root.render(<ConfigurationModal onSave={onSave} onCancel={onCancel} />);
    });
  },
};
