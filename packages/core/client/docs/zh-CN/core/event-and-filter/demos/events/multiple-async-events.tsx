import { Button } from 'antd';
import { EventBus } from '@nocobase/client';
import React from 'react';
import openSimpleDialogAction from '../actions/open-simple-dialog';
import openNotificationAction from '../actions/open-notification';

// 创建事件管理器实例
const eventBus = new EventBus();

// 监听第一个事件 - 显示对话框
eventBus.on('button:event1', async (ctx) => {
  const result = await openSimpleDialogAction.handler({}, ctx);
  console.log('对话框结果:', result);
});

// 监听第二个事件 - 显示通知
eventBus.on('button:event2', async (ctx) => {
  const result = await openNotificationAction.handler({ title: '通知' }, ctx);
  console.log('通知结果:', result);
});

export default () => {
  // 处理点击事件 - 同时触发多个事件（异步并行执行）
  const handleClick = () => {
    // 触发第一个事件，不等待其完成
    eventBus.dispatchEvent('button:event1', {
      payload: {
        eventId: 'event1',
      },
    });

    // 立即触发第二个事件，不等待第一个事件完成
    eventBus.dispatchEvent('button:event2', {
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
