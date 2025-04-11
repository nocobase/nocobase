import { Button, Space, Alert, Card, Divider } from 'antd';
import { EventBus } from '../libs/event-bus';
import React, { useState } from 'react';
import { openFormDialogAction } from '../actions/open-form-dialog';

// 创建事件总线实例
const eventBus = new EventBus();

async function showFormResult(formData: Record<string, string>) {
  // 触发表单提交成功事件
  await eventBus.dispatchEvent('form:afterSubmit', {
    payload: {
      ...formData,
    },
  });
}

// 监听表单提交事件
eventBus.on('form:submit', async (ctx) => {
  const formData = await openFormDialogAction.handler({}, ctx);
  await showFormResult(formData);
});

export default () => {
  const [submittedData, setSubmittedData] = useState<Record<string, string> | null>(null);

  // 初始化注册结果事件监听器
  React.useEffect(() => {
    const unsubscribe = eventBus.on('form:afterSubmit', (ctx) => {
      setSubmittedData(ctx.payload);
    });

    // 组件卸载时解除事件监听
    return () => unsubscribe();
  }, []);

  // 触发表单事件处理函数
  const handleOpenForm = () => {
    // 准备事件上下文
    const ctx = {
      payload: {
        name: '',
        email: '',
        phone: '',
        address: '',
      },
    };
    // 触发事件
    eventBus.dispatchEvent('form:submit', ctx);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Button type="primary" onClick={handleOpenForm}>
          打开表单
        </Button>
      </Space>
      {submittedData && (
        <Card title="表单提交结果" size="small">
          <pre
            style={{
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 4,
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </Card>
      )}
    </Space>
  );
};
