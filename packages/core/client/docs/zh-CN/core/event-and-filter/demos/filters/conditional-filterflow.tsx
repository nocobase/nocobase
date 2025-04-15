import { Button, Card, Input, Radio, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { FilterFlowManager } from '@nocobase/client';

// 创建FilterFlowManager实例
const filterFlowManager = new FilterFlowManager();

// 注册FilterGroup
filterFlowManager.addFilterGroup({
  name: 'textTransform',
  title: '文本转换',
  sort: 1,
});

// 注册Filter
filterFlowManager.addFilter({
  name: 'uppercase',
  title: '转换为大写',
  description: '将字符串转换为大写',
  group: 'textTransform',
  sort: 1,
  uiSchema: {},
  handler: (currentValue, params, context) => {
    if (typeof currentValue === 'string') {
      return currentValue.toUpperCase();
    }
    return currentValue;
  },
});

filterFlowManager.addFilter({
  name: 'lowercase',
  title: '转换为小写',
  description: '将字符串转换为小写',
  group: 'textTransform',
  sort: 2,
  uiSchema: {},
  handler: (currentValue, params, context) => {
    if (typeof currentValue === 'string') {
      return currentValue.toLowerCase();
    }
    return currentValue;
  },
});

filterFlowManager.addFilter({
  name: 'reverse',
  title: '文本反转',
  description: '将字符串反转',
  group: 'textTransform',
  sort: 3,
  uiSchema: {},
  handler: (currentValue, params, context) => {
    if (typeof currentValue === 'string') {
      return currentValue.split('').reverse().join('');
    }
    return currentValue;
  },
});

// 创建条件FilterFlow
filterFlowManager.addFlow({
  name: 'conditional-text-transform',
  title: '条件文本转换',
  steps: [
    {
      key: 'uppercase-step',
      filterName: 'uppercase',
      title: '转换为大写',
      params: {},
      // 条件：仅当输入文本长度大于5时应用
      condition: '{{ ctx.payload.inputText.length > 5 }}',
    },
    {
      key: 'lowercase-step',
      filterName: 'lowercase',
      title: '转换为小写',
      params: {},
      // 条件：仅当输入文本包含大写字母时应用
      condition: '{{ /[A-Z]/.test(ctx.payload.inputText) }}',
    },
    {
      key: 'reverse-step',
      filterName: 'reverse',
      title: '文本反转',
      params: {},
      // 条件：仅当输入文本包含数字时应用
      condition: '{{ /[0-9]/.test(ctx.payload.inputText) }}',
    },
  ],
});

const ConditionalFilterFlow = () => {
  const [inputText, setInputText] = useState('Hello, Conditional FilterFlow!');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyFilter = async () => {
    setIsProcessing(true);
    try {
      // 创建FilterFlow上下文
      const context = {
        payload: {
          inputText,
        },
      };

      // 应用过滤器流
      const result = await filterFlowManager.applyFilters('conditional-text-transform', inputText, context);

      setOutputText(result);
    } catch (error) {
      console.error('FilterFlow应用失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Paragraph>
        这个示例展示了如何创建一个条件FilterFlow，根据输入文本的条件应用不同的Filter。
      </Typography.Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>输入文本:</Typography.Text>
            <Input value={inputText} onChange={(e) => setInputText(e.target.value)} />
          </div>

          <div>
            <Typography.Text strong>该FilterFlow包含以下三个Filter:</Typography.Text>
            <Typography.Paragraph>
              <ul>
                <li>
                  转换为大写 <Typography.Text code>（仅当输入文本长度大于5时应用）</Typography.Text>
                </li>
                <li>
                  转换为小写 <Typography.Text code>（仅当输入文本包含大写字母时应用）</Typography.Text>
                </li>
                <li>
                  文本反转 <Typography.Text code>（仅当输入文本包含数字时应用）</Typography.Text>
                </li>
              </ul>
            </Typography.Paragraph>
          </div>

          <div>
            <Typography.Text strong>FilterFlow 结果:</Typography.Text>
            <div>{outputText || '尚未处理'}</div>
          </div>
        </Space>
      </Card>

      <Button type="primary" onClick={handleApplyFilter} loading={isProcessing}>
        应用 FilterFlow
      </Button>
    </div>
  );
};

export default ConditionalFilterFlow;
