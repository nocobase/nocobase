import { Modal } from 'antd';
import { ActionDefinition, FlowContext, BaseFlowModel } from '@nocobase/client';
import React from 'react';

/**
 * 打开简单对话框的action配置
 */
export const openSimpleDialogAction: ActionDefinition = {
  name: 'openSimpleDialog',
  title: '显示简单对话框',
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
    content: {
      type: 'string',
      title: '对话框内容',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
  defaultParams: {
    title: '对话框',
    width: 600,
    content: '这是通过 FlowEngine Action 显示的简单对话框。\n参数可以在步骤配置中提供。'
  },
  handler: async (ctx: FlowContext, model: BaseFlowModel, params: any) => {
    const { title, width, content } = params;

    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: title,
        width: width,
        content: (
          <pre
            style={{
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 4,
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            {content}
          </pre>
        ),
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  },
};

export default openSimpleDialogAction;
