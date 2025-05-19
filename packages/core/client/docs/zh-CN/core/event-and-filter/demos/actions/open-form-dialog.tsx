import { Modal, Input } from 'antd';
import { ActionDefinition, FlowContext, BaseFlowModel } from '@nocobase/client';
import React from 'react';

/**
 * 打开表单对话框的action配置
 */
export const openFormDialogAction: ActionDefinition = {
  name: 'openFormDialog',
  title: '显示表单对话框',
  uiSchema: {
    title: {
      type: 'string',
      title: '对话框标题',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      required: true,
    },
    width: {
      type: 'number',
      title: '对话框宽度',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
    },
    formFieldsJson: {
      type: 'string',
      title: '表单字段 (JSON)',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      description: '定义表单字段及其初始值, e.g., {\"name\": \"Default Name\", \"email\": \"\"}',
    },
  },
  defaultParams: {
    title: '请填写表单',
    width: 600,
    formFieldsJson: JSON.stringify({ 
      name: '示例用户', 
      email: 'user@example.com',
      notes: '一些初始备注'
    }),
  },
  handler: async (ctx: FlowContext, model: BaseFlowModel, params: any) => {
    const { title, width, formFieldsJson } = params;
    let initialValues: Record<string, any> = {};
    try {
      initialValues = JSON.parse(formFieldsJson);
    } catch (e) {
      console.error('Invalid formFieldsJson, using empty initial values:', formFieldsJson, e);
      initialValues = { error: '无效的字段定义' };
    }

    return new Promise<Record<string, any> | null>((resolve) => {
      const formState: Record<string, any> = { ...initialValues };

      const handleChange = (key: string, value: any) => {
        formState[key] = value;
      };

      const renderFormItems = () => {
        return Object.entries(formState).map(([key, value]) => {
          return (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontWeight: 'bold' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
              </div>
              <Input
                placeholder={`请输入 ${key}`}
                defaultValue={value as string}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={key === 'error'}
              />
            </div>
          );
        });
      };

      Modal.confirm({
        title: title,
        width: width,
        content: <div style={{ paddingTop: 10 }}>{renderFormItems()}</div>,
        okText: '提交',
        cancelText: '取消',
        onOk: () => {
          resolve(formState.error ? null : formState);
        },
        onCancel: () => {
          resolve(null);
        },
      });
    });
  },
};

export default openFormDialogAction;
