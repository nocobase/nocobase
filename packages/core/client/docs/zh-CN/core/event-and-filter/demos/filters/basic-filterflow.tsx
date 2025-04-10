import { Button, Card, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { FilterFlowManager } from '../libs/filterflow-manager';

// 创建过滤器管理器实例
const filterFlowManager = new FilterFlowManager();

// 注册过滤器处理器组
filterFlowManager.addFilterHandlerGroup({
  name: 'dataTransform',
  title: '数据转换',
  sort: 1,
});

// 注册过滤器处理器
filterFlowManager.addFilterHandler({
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
      filterHandlerName: 'uppercase',
      title: '转换为大写',
      params: {},
    },
  ],
});

const BasicFilterFlow = () => {
  const [inputText, setInputText] = useState('Hello, FilterFlow!');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyFilter = async () => {
    setIsProcessing(true);
    try {
      // 创建过滤上下文
      const context = {
        props: {
          inputText,
        },
      };

      // 应用过滤器流
      const result = await filterFlowManager.applyFilters('basic-text-transform', inputText, context);

      setOutputText(result);
    } catch (error) {
      console.error('过滤器应用失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Title level={4}>基础过滤器流</Typography.Title>
      <Typography.Paragraph>
        这个示例展示了如何创建一个简单的过滤器流并应用它。这里我们注册了一个文本转换为大写的过滤器。
      </Typography.Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>输入文本:</Typography.Text>
            <div style={{ padding: 8, border: '1px dashed #d9d9d9', borderRadius: 4 }}>{inputText}</div>
          </div>

          <div>
            <Typography.Text strong>过滤结果:</Typography.Text>
            <div
              style={{
                padding: 8,
                border: '1px dashed #d9d9d9',
                borderRadius: 4,
                background: outputText ? '#f6ffed' : '#f0f0f0',
              }}
            >
              {outputText || '尚未处理'}
            </div>
          </div>
        </Space>
      </Card>

      <Button type="primary" onClick={handleApplyFilter} loading={isProcessing}>
        应用过滤器
      </Button>
    </div>
  );
};

export default BasicFilterFlow;
