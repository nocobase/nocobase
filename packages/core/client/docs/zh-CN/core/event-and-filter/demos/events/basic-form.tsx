import { Button, Space, Alert, Card, Divider } from 'antd';
import { EventManager } from '../libs/event-manager';
import React, { useState } from 'react';
import { openFormDialogAction } from '../actions/open-form-dialog';

async function showFormResult(formData: Record<string, string>) {
  // 触发表单提交成功事件
  await eventManager.dispatchEvent('form:afterSubmit', {
    payload: {
      ...formData,
    },
  });
}

// 创建事件管理器实例
const eventManager = new EventManager();
// 监听表单提交事件
eventManager.on('form:submit', async (ctx) => {
  const formData = await openFormDialogAction.handler({}, ctx.payload);
  await showFormResult(formData);
});

export default () => {
  const [submittedData, setSubmittedData] = useState<Record<string, string> | null>(null);

  // 初始化注册结果事件监听器
  React.useEffect(() => {
    const unsubscribe = eventManager.on('form:afterSubmit', (ctx) => {
      setSubmittedData(ctx.payload);
    });

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
    eventManager.dispatchEvent('form:submit', ctx);
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
