import { Card, Space, Typography, Input } from 'antd';
import React, { Suspense, useState } from 'react';
import { FilterFlowManager, useApplyFilters } from '@nocobase/client';

// 创建过滤器管理器实例
const filterFlowManager = new FilterFlowManager();

// 注册过滤器组
filterFlowManager.addFilterGroup({
  name: 'dataTransform',
  title: '数据转换',
  sort: 1,
});

// 注册过滤器
filterFlowManager.addFilter({
  name: 'uppercase',
  title: '转换为大写',
  description: '将字符串转换为大写',
  group: 'dataTransform',
  sort: 1,
  uiSchema: {},
  handler: (currentValue, params, context) => {
    if (typeof currentValue === 'string') {
      return currentValue.toUpperCase();
    }
    return currentValue;
  },
});

// 创建过滤器流
filterFlowManager.addFlow({
  name: 'basic-text-transform',
  title: '基础文本转换',
  steps: [
    {
      key: 'uppercase-step',
      filterName: 'uppercase',
      title: '转换为大写',
    },
  ],
});

const BasicFilterFlow = () => {
  const [inputText, setInputText] = useState('Hello, FilterFlow!');
  const outputText = useApplyFilters(filterFlowManager, 'basic-text-transform', inputText);

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Paragraph>
        这个示例展示了如何创建一个简单的FilterFlow并应用它。这里我们注册了一个文本转换为大写的Filter。
      </Typography.Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>输入文本:</Typography.Text>
            <Input value={inputText} onChange={(e) => setInputText(e.target.value)} />
          </div>
          <Typography.Text strong>FilterFlow 结果:</Typography.Text>
          <div>{outputText || '尚未处理'}</div>
        </Space>
      </Card>
    </div>
  );
};

export default function Demo() {
  return (
    <Suspense fallback={<div>Loading1...</div>}>
      <BasicFilterFlow />
    </Suspense>
  );
}
