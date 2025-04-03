import { Button } from 'antd';
import { EventManager } from '../libs/event-manager';
import React from 'react';
import openDialog from '../actions/open-simple-dialog';
import openNotification from '../actions/open-notification';

// 创建事件管理器实例
const eventManager = new EventManager();

// 监听第一个事件 - 显示对话框
eventManager.on('button:event1', async (ctx) => {
  const result = await openDialog({
    eventType: 'event1',
    message: '这是对话框事件',
    data: ctx,
  });
  console.log('对话框结果:', result);
  console.log('ctx', ctx);
});

// 监听第二个事件 - 显示通知
eventManager.on('button:event2', async (ctx) => {
  const result = await openNotification({
    title: '通知事件',
    message: '这是通知事件',
    data: ctx,
  });
  console.log('通知结果:', result);
  console.log('ctx', ctx);
});

export default () => {
  // 处理点击事件 - 同时触发多个事件（同步）
  const handleClick = async () => {
    // 触发第一个事件，等待完成
    await eventManager.dispatchEvent('button:event1', {
      payload: {
        eventId: 'event1',
      },
    });

    // 完成第一个事件后，触发第二个事件
    await eventManager.dispatchEvent('button:event2', {
      payload: {
        eventId: 'event2',
      },
    });
  };

  return (
    <Button type="primary" onClick={handleClick}>
      点击
    </Button>
  );
};
