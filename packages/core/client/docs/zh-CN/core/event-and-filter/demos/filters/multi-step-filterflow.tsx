import { Button, Card, Input, Space, Typography } from 'antd';
import React, { useMemo, useState, useEffect } from 'react';
import { FilterFlowManager, BaseModel } from '@nocobase/client';

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
  handler: (model: BaseModel, params, context) => {
    const text = model.getProps()['text'] as string;
    if (typeof text === 'string') {
      model.setProps('text', text.toUpperCase());
    }
  },
});

filterFlowManager.addFilter({
  name: 'trim',
  title: '去除两端空格',
  description: '去除字符串两端的空格',
  group: 'textTransform',
  uiSchema: {},
  handler: (model: BaseModel, params, context) => {
    const text = model.getProps()['text'] as string;
    if (typeof text === 'string') {
      model.setProps('text', text.trim());
    }
  },
});

filterFlowManager.addFilter({
  name: 'reverse',
  title: '文本反转',
  description: '将字符串反转',
  group: 'textTransform',
  uiSchema: {},
  handler: (model: BaseModel, params, context) => {
    const text = model.getProps()['text'] as string;
    if (typeof text === 'string') {
      model.setProps('text', text.split('').reverse().join(''));
    }
  },
});

filterFlowManager.addFilter({
  name: 'addPrefix',
  title: '添加前缀',
  description: '在字符串前添加前缀',
  group: 'textTransform',
  uiSchema: {},
  handler: (model: BaseModel, params, context) => {
    const text = model.getProps()['text'] as string;
    if (typeof text === 'string') {
      model.setProps('text', `${params?.prefix || ''}${text}`);
    }
  },
});

filterFlowManager.addFilter({
  name: 'addSuffix',
  title: '添加后缀',
  description: '在字符串后添加后缀',
  group: 'textTransform',
  uiSchema: {},
  handler: (model: BaseModel, params, context) => {
    const text = model.getProps()['text'] as string;
    if (typeof text === 'string') {
      model.setProps('text', `${text}${params?.suffix || ''}`);
    }
  },
});

// 创建多步骤FilterFlow
filterFlowManager.addFlow({
  key: 'multi-step-text-transform',
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
    },
    {
      key: 'add-suffix-step',
      filterName: 'addSuffix',
      title: '添加后缀',
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
  
  const params = useMemo(
    () => ({
      'add-prefix-step': {
        prefix: '[PREFIX] ',
      },
      'add-suffix-step': {
        suffix: ' [SUFFIX]',
      },
    }),
    []
  );

  useEffect(() => {
    // 创建模型实例
    const model = new BaseModel('text-model');
    model.setProps({ text: inputText });
    
    // 为特定流程的特定步骤设置参数
    Object.entries(params).forEach(([stepKey, stepParams]) => {
      model.setFilterParams('multi-step-text-transform', stepKey, stepParams);
    });
    
    // 应用过滤器流
    filterFlowManager.applyFilters('multi-step-text-transform', model, {})
      .then(() => {
        // 获取处理后的结果
        setOutputText(model.getProps()['text'] as string);
      })
      .catch(console.error);
  }, [inputText, params]);

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
            <div>{outputText}</div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default MultiStepFilterFlow;
