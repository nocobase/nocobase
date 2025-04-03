import { Button, Card, Space, Typography } from 'antd';
import { EventManager } from '../libs/event-manager';
import React, { useState } from 'react';

const { Text } = Typography;

// 创建事件管理器实例
const eventManager = new EventManager();

export default () => {
  const [hoverCount, setHoverCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);

  // 注册事件监听器
  React.useEffect(() => {
    // 监听按钮点击事件
    const clickUnsubscribe = eventManager.on('button:click', (ctx) => {
      setLastEvent({
        type: 'click',
        data: ctx,
      });
    });

    // 监听按钮悬停事件
    const mouseoverUnsubscribe = eventManager.on('button:mouseover', (ctx) => {
      setLastEvent({
        type: 'mouseover',
        data: ctx,
      });
    });

    // 清理函数
    return () => {
      clickUnsubscribe();
      mouseoverUnsubscribe();
    };
  }, []);

  // 处理点击事件
  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // 准备事件上下文
    const ctx = {
      payload: {
        action: 'click',
        count: newCount,
      },
    };

    // 触发点击事件
    eventManager.dispatchEvent('button:click', ctx);
  };

  // 处理悬停事件
  const handleMouseOver = () => {
    const newCount = hoverCount + 1;
    setHoverCount(newCount);

    // 准备事件上下文
    const ctx = {
      payload: {
        action: 'mouseover',
        count: newCount,
      },
    };

    // 触发悬停事件
    eventManager.dispatchEvent('button:mouseover', ctx);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Button type="primary" onClick={handleClick} onMouseOver={handleMouseOver}>
        悬停和点击
      </Button>

      <Space>
        <Text>悬停次数: {hoverCount}</Text>
        <Text>点击次数: {clickCount}</Text>
      </Space>

      {lastEvent && (
        <Card size="small" title={`最近事件: ${lastEvent.type}`} style={{ marginTop: 16 }}>
          <pre
            style={{
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 4,
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(lastEvent.data, null, 2)}
          </pre>
        </Card>
      )}
    </Space>
  );
};
