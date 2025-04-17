import { Button, Card, Input, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { FilterFlowManager } from '@nocobase/client';

// 创建FilterFlowManager实例
const filterFlowManager = new FilterFlowManager();

// 注册FilterGroup
filterFlowManager.addFilterGroup({
  name: 'textTransform',
  title: '文本转换',
});

// 注册Filter
filterFlowManager.addFilter({
  name: 'uppercase',
  title: '转换为大写',
  description: '将字符串转换为大写',
  group: 'textTransform',
  uiSchema: {},
  handler: (currentValue) => {
    if (typeof currentValue === 'string') {
      return currentValue.toUpperCase();
    }
    return currentValue;
  },
});

filterFlowManager.addFilter({
  name: 'trim',
  title: '去除两端空格',
  description: '去除字符串两端的空格',
  group: 'textTransform',
  uiSchema: {},
  handler: (currentValue) => {
    if (typeof currentValue === 'string') {
      return currentValue.trim();
    }
    return currentValue;
  },
});

filterFlowManager.addFilter({
  name: 'reverse',
  title: '文本反转',
  description: '将字符串反转',
  group: 'textTransform',
  uiSchema: {},
  handler: (currentValue) => {
    if (typeof currentValue === 'string') {
      return currentValue.split('').reverse().join('');
    }
    return currentValue;
  },
});

filterFlowManager.addFilter({
  name: 'addPrefix',
  title: '添加前缀',
  description: '在字符串前添加前缀',
  group: 'textTransform',
  uiSchema: {},
  handler: (currentValue, params) => {
    if (typeof currentValue === 'string') {
      return `${params.prefix || ''}${currentValue}`;
    }
    return currentValue;
  },
});

filterFlowManager.addFilter({
  name: 'addSuffix',
  title: '添加后缀',
  description: '在字符串后添加后缀',
  group: 'textTransform',
  uiSchema: {},
  handler: (currentValue, params) => {
    if (typeof currentValue === 'string') {
      return `${currentValue}${params.suffix || ''}`;
    }
    return currentValue;
  },
});

// 创建多步骤FilterFlow
filterFlowManager.addFlow({
  name: 'multi-step-text-transform',
  title: '多步骤文本转换',
  steps: [
    {
      key: 'trim-step',
      filterName: 'trim',
      title: '去除空格',
    },
    {
      key: 'uppercase-step',
      filterName: 'uppercase',
      title: '转换为大写',
    },
    {
      key: 'add-prefix-step',
      filterName: 'addPrefix',
      title: '添加前缀',
      params: { prefix: '[PREFIX] ' },
    },
    {
      key: 'add-suffix-step',
      filterName: 'addSuffix',
      title: '添加后缀',
      params: { suffix: ' [SUFFIX]' },
    },
    {
      key: 'reverse-step',
      filterName: 'reverse',
      title: '文本反转',
    },
  ],
});

const MultiStepFilterFlow = () => {
  const [inputText, setInputText] = useState('  hello, multi-step filterflow!  ');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyFilter = async () => {
    setIsProcessing(true);
    try {
      // 创建过滤上下文
      const context = {
        payload: {
          inputText,
        },
      };

      const result = await filterFlowManager.applyFilters('multi-step-text-transform', inputText, context);
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
        这个示例展示了如何创建一个包含多个Filter的FilterFlow，每个步骤依次处理文本。
      </Typography.Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>输入文本:</Typography.Text>
            <Input value={inputText} onChange={(e) => setInputText(e.target.value)} />
          </div>

          <div>
            <Typography.Text strong>最终结果:</Typography.Text>
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

export default MultiStepFilterFlow;
