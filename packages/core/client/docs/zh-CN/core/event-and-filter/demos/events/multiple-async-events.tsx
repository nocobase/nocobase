import { Button } from 'antd';
import { EventManager } from '../libs/event-manager';
import React from 'react';
import openDialog from '../actions/open-simple-dialog';

// 创建事件管理器实例
const eventManager = new EventManager();

// 监听第一个事件
eventManager.on('button:event1', async (ctx) => {
  const result = await openDialog({
    eventType: 'event1',
    message: '这是第一个事件弹窗',
    data: ctx,
  });
  console.log('事件1结果:', result);
});

// 监听第二个事件
eventManager.on('button:event2', async (ctx) => {
  const result = await openDialog({
    eventType: 'event2',
    message: '这是第二个事件弹窗',
    data: ctx,
  });
  console.log('事件2结果:', result);
});

export default () => {
  // 处理点击事件 - 同时触发多个事件（异步并行执行）
  const handleClick = () => {
    // 触发第一个事件，不等待其完成
    eventManager.dispatchEvent('button:event1', {
      payload: {
        eventId: 'event1',
      },
    });

    // 立即触发第二个事件，不等待第一个事件完成
    eventManager.dispatchEvent('button:event2', {
      payload: {
        eventId: 'event2',
      },
    });
  };

  return (
    <Button type="primary" onClick={handleClick}>
      同时触发多个事件
    </Button>
  );
};
