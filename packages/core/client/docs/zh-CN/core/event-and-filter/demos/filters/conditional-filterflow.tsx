import { Card, Input, Space, Typography } from 'antd';
import React, { useState, useEffect } from 'react';
import { FilterFlowManager, BaseModel } from '@nocobase/client';

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
  handler: (model) => {
    const text = model.getProps()['text'];
    if (typeof text === 'string') {
      model.setProps('text', text.toUpperCase());
    }
  },
});

filterFlowManager.addFilter({
  name: 'reverse',
  title: '文本反转',
  description: '将字符串反转',
  group: 'textTransform',
  sort: 3,
  uiSchema: {},
  handler: (model) => {
    const text = model.getProps()['text'];
    if (typeof text === 'string') {
      model.setProps('text', text.split('').reverse().join(''));
    }
  },
});

// 创建条件FilterFlow
filterFlowManager.addFlow({
  key: 'conditional-text-transform',
  title: '条件文本转换',
  steps: [
    {
      key: 'uppercase-step',
      filterName: 'uppercase',
      title: '转换为大写',
      // 条件：仅当输入文本长度大于5时应用
      condition: '{{ model.getProps()["text"]?.length > 5 }}',
    },
    {
      key: 'reverse-step',
      filterName: 'reverse',
      title: '文本反转',
      // 条件：仅当输入文本包含数字时应用
      condition: '{{ /[0-9]/.test(model.getProps()["text"]) }}',
    },
  ],
});

const ConditionalFilterFlow = () => {
  const [inputText, setInputText] = useState('Hello, Conditional FilterFlow!');
  const [outputText, setOutputText] = useState('');

  useEffect(() => {
    // 创建模型实例
    const model = new BaseModel('text-model');
    model.setProps({ text: inputText });
    
    // 应用过滤器流
    filterFlowManager.applyFilters('conditional-text-transform', model, {})
      .then(() => {
        // 获取处理后的结果
        setOutputText(model.getProps()['text'] as string);
      })
      .catch(console.error);
  }, [inputText]);

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
                  文本反转 <Typography.Text code>（仅当输入文本包含数字时应用）</Typography.Text>
                </li>
              </ul>
            </Typography.Paragraph>
          </div>

          <div>
            <Typography.Text strong>FilterFlow 结果:</Typography.Text>
            <div>{outputText}</div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default ConditionalFilterFlow;
