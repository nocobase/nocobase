import { Modal, Form, Input, Select, Switch, InputNumber } from 'antd';
import React, { useState } from 'react';
import { EventFlowActionOptions } from '@nocobase/client';
import { EventContext } from '@nocobase/client';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { createForm } from '@formily/core';
import { ISchema, connect, mapProps, mapReadPretty } from '@formily/react';
import { FormItem } from '@formily/antd-v5';

// 通用的配置动作定义
export const configureAction: EventFlowActionOptions = {
  name: 'configureAction',
  title: '配置动作',
  description: '打开配置弹窗，修改动作参数',
  group: 'ui',
  sort: 1,
  uiSchema: {},
  handler: async (params: Record<string, any>, context: EventContext) => {
    const step = context.payload?.step;
    const onChange = context.payload?.onChange;
    const uiSchema = step.configureUiSchema;
    const initialValues = step.params || {};

    return new Promise((resolve) => {
      const FormInput = connect(
        Input,
        mapProps({}),
        mapReadPretty(() => null),
      );
      const FormTextArea = connect(
        Input.TextArea,
        mapProps({}),
        mapReadPretty(() => null),
      );
      const FormSelect = connect(
        Select,
        mapProps({}),
        mapReadPretty(() => null),
      );
      const FormSwitch = connect(
        Switch,
        mapProps({}),
        mapReadPretty(() => null),
      );
      const FormInputNumber = connect(
        InputNumber,
        mapProps({}),
        mapReadPretty(() => null),
      );

      // 为每个 schema 字段添加装饰器
      const processedSchema = {};
      Object.entries(uiSchema).forEach(([key, schema]) => {
        processedSchema[key] = {
          ...(schema as ISchema),
          'x-decorator': 'FormItem',
        };
      });

      const components = {
        Input: FormInput,
        'Input.TextArea': FormTextArea,
        Select: FormSelect,
        Switch: FormSwitch,
        InputNumber: FormInputNumber,
        FormItem,
      };

      const ConfigurationModal = ({ onSave, onCancel }) => {
        const [visible, setVisible] = useState(true);
        const [form] = useState(() =>
          createForm({
            initialValues,
          }),
        );

        const handleSubmit = () => {
          form
            .submit()
            .then((values) => {
              step.set('params', values);
              if (typeof onChange === 'function') {
                onChange(values);
              }
              setVisible(false);
              onSave(values);
            })
            .catch(() => {});
        };

        const handleCancel = () => {
          setVisible(false);
          onCancel();
        };

        // 构建完整的 schema
        const schema = {
          type: 'object',
          properties: processedSchema,
        };

        return (
          <Modal title={`配置 ${step.title}`} open={visible} onOk={handleSubmit} onCancel={handleCancel} destroyOnClose>
            <SchemaComponentProvider form={form} components={components}>
              <Form layout="vertical">
                <SchemaComponent schema={schema} />
              </Form>
            </SchemaComponentProvider>
          </Modal>
        );
      };

      // 渲染弹窗并设置回调
      const container = document.createElement('div');
      document.body.appendChild(container);

      const cleanupAndResolve = (result) => {
        // 检查 container 是否还在 document.body 中
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
        resolve(result);
      };

      const onSave = (values) => {
        cleanupAndResolve({
          success: true,
          data: values,
        });
      };

      const onCancel = () => {
        cleanupAndResolve({
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
