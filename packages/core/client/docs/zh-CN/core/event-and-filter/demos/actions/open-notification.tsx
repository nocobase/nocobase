import { notification, Button, Flex } from 'antd';
import { ActionDefinition, FlowContext, FlowModel } from '@nocobase/client';
import React from 'react';

/**
 * 打开通知的action配置
 */
export const openNotificationAction: ActionDefinition = {
  name: 'openNotification',
  title: '显示通知',
  uiSchema: {
    title: {
      type: 'string',
      title: '通知标题',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    description: {
      type: 'string',
      title: '通知内容',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    duration: {
      type: 'number',
      title: '显示时长(秒)',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
    },
  },
  defaultParams: {
    title: '通知',
    description: '默认通知内容。可以在步骤参数中覆盖。',
    duration: 4.5,
  },
  handler: async (ctx: FlowContext, model: FlowModel, params: any) => {
    const key = `notification-${Date.now()}`;
    const { title, description, duration } = params;

    notification.info({
      message: title,
      description: (
        <pre
          style={{
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 4,
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          {description}
        </pre>
      ),
      key,
      duration: duration,
      btn: (
        <Flex gap="small">
          <Button
            size="small"
            onClick={() => {
              notification.destroy(key);
            }}
          >
            知道了
          </Button>
        </Flex>
      ),
      onClose: () => {
        // console.log('Notification closed');
      },
    });

    return Promise.resolve();
  },
};

export default openNotificationAction;
