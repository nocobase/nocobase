import { Button, Card, Checkbox, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { FilterFlowManager } from '../libs/filterflow-manager';

// 创建过滤器管理器实例
const filterFlowManager = new FilterFlowManager();

// 注册过滤器组
filterFlowManager.addFilterGroup({
  name: 'textTransform',
  title: '文本转换',
  sort: 1,
});

// 注册过滤器
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
  name: 'trim',
  title: '去除两端空格',
  description: '去除字符串两端的空格',
  group: 'textTransform',
  sort: 2,
  uiSchema: {},
  handler: (currentValue, params, context) => {
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
  sort: 3,
  uiSchema: {},
  handler: (currentValue, params, context) => {
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
  sort: 4,
  uiSchema: {},
  handler: (currentValue, params, context) => {
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
  sort: 5,
  uiSchema: {},
  handler: (currentValue, params, context) => {
    if (typeof currentValue === 'string') {
      return `${currentValue}${params.suffix || ''}`;
    }
    return currentValue;
  },
});

// 创建多步骤过滤器流
filterFlowManager.addFlow({
  name: 'multi-step-text-transform',
  title: '多步骤文本转换',
  steps: [
    {
      key: 'trim-step',
      filterName: 'trim',
      title: '去除空格',
      params: {},
    },
    {
      key: 'uppercase-step',
      filterName: 'uppercase',
      title: '转换为大写',
      params: {},
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
      params: {},
    },
  ],
});

const MultiStepFilterFlow = () => {
  const [inputText, setInputText] = useState('  hello, multi-step filterflow!  ');
  const [outputText, setOutputText] = useState('');
  const [intermediateResults, setIntermediateResults] = useState([]);
  const [showIntermediateResults, setShowIntermediateResults] = useState(false);
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

      // 追踪中间结果
      const tempResults = [];
      let currentValue = inputText;

      const flow = filterFlowManager.getFlow('multi-step-text-transform');
      const steps = flow.getSteps();

      for (const step of steps) {
        const handler = step.getHandler();
        if (handler) {
          currentValue = await handler(currentValue, step.params, context);
          tempResults.push({
            stepKey: step.key,
            title: step.title,
            result: currentValue,
          });
        }
      }

      setIntermediateResults(tempResults);
      setOutputText(currentValue);
    } catch (error) {
      console.error('过滤器应用失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Title level={4}>多步骤过滤器流</Typography.Title>
      <Typography.Paragraph>这个示例展示了如何创建一个多步骤过滤器流，每个步骤依次处理文本。</Typography.Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>输入文本:</Typography.Text>
            <div style={{ padding: 8, border: '1px dashed #d9d9d9', borderRadius: 4 }}>&quot;{inputText}&quot;</div>
          </div>

          <Checkbox checked={showIntermediateResults} onChange={(e) => setShowIntermediateResults(e.target.checked)}>
            显示中间步骤结果
          </Checkbox>

          {showIntermediateResults && intermediateResults.length > 0 && (
            <div>
              <Typography.Text strong>中间步骤结果:</Typography.Text>
              <div style={{ padding: 8, border: '1px dashed #d9d9d9', borderRadius: 4 }}>
                {intermediateResults.map((item, index) => (
                  <div key={item.stepKey} style={{ marginBottom: 8 }}>
                    <Typography.Text type="secondary">
                      步骤 {index + 1}: {item.title}
                    </Typography.Text>
                    <div
                      style={{
                        padding: 4,
                        marginTop: 4,
                        marginLeft: 16,
                        borderLeft: '2px solid #1890ff',
                        paddingLeft: 8,
                      }}
                    >
                      {item.result}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Typography.Text strong>最终结果:</Typography.Text>
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

export default MultiStepFilterFlow;
