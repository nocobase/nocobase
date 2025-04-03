import { Button, Flex, notification } from 'antd';
import React from 'react';

/**
 * 打开通知的全局方法
 * @param data 要显示的数据
 * @returns Promise 用户点击通知返回true，关闭通知返回false
 */
const openNotification = async (data: any): Promise<boolean> => {
  return new Promise((resolve) => {
    const key = `notification-${Date.now()}`;

    notification.info({
      message: data.title || '通知',
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
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
      key,
      duration: 4.5, // 4.5秒后自动关闭
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
};

export default openNotification;
