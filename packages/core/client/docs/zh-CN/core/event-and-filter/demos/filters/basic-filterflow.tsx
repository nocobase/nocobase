import { Card, Space, Typography, Input } from 'antd';
import React, { Suspense, useState, useEffect } from 'react';
import { FilterFlowManager, BaseModel } from '@nocobase/client';

// 创建过滤器管理器实例
const filterFlowManager = new FilterFlowManager();

// 注册过滤器组
filterFlowManager.addFilterGroup({
  name: 'dataTransform',
  title: '数据转换',
  sort: 1,
});

// 注册文本转换过滤器
filterFlowManager.addFilter({
  name: 'uppercase',
  title: '转换为大写',
  description: '将字符串转换为大写',
  group: 'dataTransform',
  sort: 1,
  uiSchema: {},
  handler: (model) => {
    // 从模型中获取文本
    const text = model.getProps()['text'];
    if (typeof text === 'string') {
      // 设置转换后的文本
      model.setProps('text', text.toUpperCase());
    }
  },
});

// 创建过滤器流
filterFlowManager.addFlow({
  key: 'basic-text-transform',
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
  const [outputText, setOutputText] = useState('');

  useEffect(() => {
    // 创建模型实例
    const model = new BaseModel('text-model');
    model.setProps('text', inputText);
    
    // 应用过滤器流
    filterFlowManager.applyFilters('basic-text-transform', model, {})
      .then(() => {
        // 获取处理后的结果
        setOutputText(model.getProps()['text'] as string);
      })
      .catch(console.error);
  }, [inputText]);

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
    <Suspense fallback={<div>Loading...</div>}>
      <BasicFilterFlow />
    </Suspense>
  );
}
