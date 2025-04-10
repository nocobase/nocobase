import { Button, Card, Radio, Space, Typography } from 'antd';
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

// 创建条件过滤器流
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
      condition: '{{ ctx.props.inputText.length > 5 }}',
    },
    {
      key: 'lowercase-step',
      filterName: 'lowercase',
      title: '转换为小写',
      params: {},
      // 条件：仅当输入文本包含大写字母时应用
      condition: '{{ /[A-Z]/.test(ctx.props.inputText) }}',
    },
    {
      key: 'reverse-step',
      filterName: 'reverse',
      title: '文本反转',
      params: {},
      // 条件：仅当输入文本包含数字时应用
      condition: '{{ /[0-9]/.test(ctx.props.inputText) }}',
    },
  ],
});

const ConditionalFilterFlow = () => {
  const [inputText, setInputText] = useState('Hello, Conditional FilterFlow!');
  const [outputText, setOutputText] = useState('');
  const [transformType, setTransformType] = useState('uppercase');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyFilter = async () => {
    setIsProcessing(true);
    try {
      // 创建过滤上下文
      const context = {
        props: {
          inputText,
          transformType,
        },
      };

      // 应用过滤器流
      const result = await filterFlowManager.applyFilters('conditional-text-transform', inputText, context);

      setOutputText(result);
    } catch (error) {
      console.error('过滤器应用失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Title level={4}>条件过滤器流</Typography.Title>
      <Typography.Paragraph>
        这个示例展示了如何创建一个条件过滤器流，根据选择的转换类型应用不同的过滤器。
      </Typography.Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>输入文本:</Typography.Text>
            <div style={{ padding: 8, border: '1px dashed #d9d9d9', borderRadius: 4 }}>{inputText}</div>
          </div>

          <div>
            <Typography.Text strong>转换类型:</Typography.Text>
            <Radio.Group value={transformType} onChange={(e) => setTransformType(e.target.value)}>
              <Radio value="uppercase">转换为大写</Radio>
              <Radio value="lowercase">转换为小写</Radio>
              <Radio value="reverse">文本反转</Radio>
            </Radio.Group>
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

export default ConditionalFilterFlow;
