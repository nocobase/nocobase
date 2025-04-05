import { Modal } from 'antd';
import { EventFlowActionOptions } from '../libs/eventflow-manager';
import React from 'react';

/**
 * 打开简单对话框的action配置
 */
export const openSimpleDialogAction: EventFlowActionOptions = {
  name: 'openSimpleDialog',
  title: '显示简单对话框',
  description: '在界面上显示一个简单的对话框，用于展示信息',
  group: 'ui',
  sort: 101,
  uiSchema: {
    title: {
      type: 'string',
      title: '对话框标题',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      default: '对话框',
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
    const { title = '对话框', width = 600 } = params;
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title,
        width,
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
            {JSON.stringify(context, null, 2)}
          </pre>
        ),
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          resolve(true);
          return true;
        },
        onCancel: () => {
          resolve(false);
          return false;
        },
      });
    });
  },
};

export default openSimpleDialogAction;
