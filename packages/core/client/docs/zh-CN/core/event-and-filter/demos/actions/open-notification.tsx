import { notification, Button, Flex } from 'antd';
import { EventFlowActionOptions } from '@nocobase/client';
import React from 'react';

/**
 * 打开通知的action配置
 */
export const openNotificationAction: EventFlowActionOptions = {
  name: 'openNotification',
  title: '显示通知',
  description: '在界面上显示一个通知消息',
  group: 'ui',
  sort: 100,
  uiSchema: {
    title: {
      type: 'string',
      title: '通知标题',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      default: '通知',
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
      default: 4.5,
    },
  },
  handler: async (params, context) => {
    return new Promise<boolean>((resolve) => {
      const key = `notification-${Date.now()}`;
      const { title = '通知', description, duration = 4.5 } = params;

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
            {description || JSON.stringify(context, null, 2)}
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
                resolve(false);
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                notification.destroy(key);
                resolve(true);
              }}
              style={{ marginRight: 8 }}
            >
              确定
            </Button>
          </Flex>
        ),
        onClose: () => {
          resolve(false);
        },
      });
    });
  },
};

export default openNotificationAction;
