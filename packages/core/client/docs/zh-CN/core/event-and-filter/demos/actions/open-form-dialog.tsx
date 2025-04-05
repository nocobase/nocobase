import { Modal, Input } from 'antd';
import { EventFlowActionOptions } from '../libs/eventflow-manager';
import React from 'react';

/**
 * 打开表单对话框的action配置
 */
export const openFormDialogAction: EventFlowActionOptions = {
  name: 'openFormDialog',
  title: '显示表单对话框',
  description: '在界面上显示一个表单对话框，用于收集用户输入',
  group: 'ui',
  sort: 102,
  uiSchema: {
    title: {
      type: 'string',
      title: '对话框标题',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      default: '请填写表单',
      required: true,
    },
    width: {
      type: 'number',
      title: '对话框宽度',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 600,
    },
  },
  handler: async (params, context) => {
    const { title = '请填写表单', width = 600 } = params;

    // 创建初始值，使用context中传入的数据
    const initialValues = context || {};

    const formData = await new Promise<Record<string, any>>((resolve) => {
      // 保存表单数据的状态
      const formState: Record<string, string> = { ...initialValues };

      // 表单项更改处理
      const handleChange = (key: string, value: string) => {
        formState[key] = value;
      };

      // 渲染表单项
      const renderFormItems = () => {
        return Object.entries(initialValues).map(([key, value]) => {
          return (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontWeight: 'bold' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
              </div>
              <Input
                placeholder={`请输入${key}`}
                defaultValue={value as string}
                onChange={(e) => handleChange(key, e.target.value)}
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
          resolve(formState);
          return true;
        },
        onCancel: () => {
          resolve(null);
          return false;
        },
      });
    });
    return formData;
  },
};

export default openFormDialogAction;
