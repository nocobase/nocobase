import { Button } from 'antd';
import { EventManager } from '../libs/event-manager';
import React from 'react';
import openDialog from '../actions/open-simple-dialog';

// 创建事件管理器实例, 并监听按钮点击事件
const eventManager = new EventManager();
eventManager.on('button:click', (ctx) => {
  openDialog(ctx);
});

export default () => {
  const handleClick = () => {
    // 准备事件上下文
    const ctx = {
      payload: {
        name: 'test',
      },
      source: {
        type: 'user-interaction',
        component: 'Button',
      },
    };
    // 触发事件
    eventManager.dispatchEvent('button:click', ctx);
  };

  return (
    <Button type="primary" onClick={handleClick}>
      点击
    </Button>
  );
};
