import { Button, Card, Form, Input, Select, Space, Typography, Modal, Switch, InputNumber } from 'antd';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { FilterFlowManager, FilterHandlerContext, BaseModel } from '@nocobase/client';
import { configureAction } from '../actions/open-configure-dialog';

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
  name: 'replaceText',
  title: '文本替换',
  description: '替换文本中的指定内容',
  group: 'textTransform',
  sort: 1,
  uiSchema: {
    search: {
      type: 'string',
      title: '查找',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    replacement: {
      type: 'string',
      title: '替换为',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    useRegex: {
      type: 'boolean',
      title: '使用正则表达式',
      default: false,
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    flags: {
      type: 'string',
      title: '正则标志',
      default: 'g',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'g, i, m, s, u, y',
      },
      'x-reactions': {
        dependencies: ['useRegex'],
        fulfill: {
          state: {
            visible: '{{$deps[0]}}',
          },
        },
      },
    },
  },
  handler: (model, params) => {
    const text = model.getProps()['text'] as string;
    if (typeof text === 'string' && params?.search) {
      let result;
      if (params.useRegex) {
        try {
          const regex = new RegExp(params.search, params.flags || 'g');
          result = text.replace(regex, params.replacement || '');
        } catch (error) {
          console.error('正则表达式错误:', error);
          result = text;
        }
      } else {
        result = text.replace(
          new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          params.replacement || '',
        );
      }
      model.setProps('text', result);
    }
  },
});

filterFlowManager.addFilter({
  name: 'truncateText',
  title: '文本截断',
  description: '截断文本到指定长度',
  group: 'textTransform',
  sort: 2,
  uiSchema: {
    maxLength: {
      type: 'number',
      title: '最大长度',
      default: 10,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
      },
    },
    suffix: {
      type: 'string',
      title: '后缀',
      default: '...',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
  handler: (model, params) => {
    const text = model.getProps()['text'] as string;
    if (typeof text === 'string') {
      const maxLength = params?.maxLength || 10;
      let result = text;
      if (text.length > maxLength) {
        result = text.substring(0, maxLength) + (params?.suffix || '...');
    }
      model.setProps('text', result);
    }
  },
});

// 创建可配置FilterFlow
filterFlowManager.addFlow({
  key: 'configurable-text-transform',
  title: '可配置文本转换',
  steps: [
    {
      key: 'replace-step',
      filterName: 'replaceText',
      title: '替换文本',
    },
    {
      key: 'truncate-step',
      filterName: 'truncateText',
      title: '截断文本',
    },
  ],
});

// 初始参数
const initialParams = {
      'replace-step': {
        search: 'Hello',
        replacement: 'hi',
        useRegex: false,
      },
      'truncate-step': {
        maxLength: 10,
        suffix: '...',
      },
};

const ConfigurableFilter = () => {
  const [inputText, setInputText] = useState('Hello configurable filter demo');
  const [outputText, setOutputText] = useState('');
  const [filterParams, setFilterParams] = useState(initialParams);
  
  const applyFilters = useCallback(async () => {
    // 创建模型实例
    const model = new BaseModel('text-model');
    model.setProps({ text: inputText });
    
    // 设置过滤器参数
    model.setFilterParams('configurable-text-transform', filterParams);
    
    // 应用过滤器流
    await filterFlowManager.applyFilters('configurable-text-transform', model, {});
    
    // 获取处理后的结果
    setOutputText(model.getProps()['text'] as string);
  }, [inputText, filterParams]);
  
  // 初始应用过滤器
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // 打开配置Modal
  const openConfigModal = async (stepKey) => {
    const flow = filterFlowManager.getFlow('configurable-text-transform');
    const step = flow.getStep(stepKey);
    const actionContext = {
      payload: {
        step,
        currentParams: filterParams[stepKey],
        onChange: (values) => {
          setFilterParams(prev => ({
            ...prev,
            [stepKey]: values,
          }));
        },
      },
    };
    configureAction.handler({}, actionContext);
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Paragraph>
        这个示例展示了如何创建可配置的Filter。用户可以通过界面修改Filter参数，然后应用Filter操作。
      </Typography.Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>输入文本:</Typography.Text>
            <Input.TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 6 }}
              style={{ marginTop: 8 }}
            />
          </div>

          <div>
            <Typography.Text strong>Filter配置:</Typography.Text>
            <Space style={{ marginTop: 8 }}>
              <Button onClick={() => openConfigModal('replace-step')} type="default">
                配置替换文本
              </Button>
              <Button onClick={() => openConfigModal('truncate-step')} type="default">
                配置截取文本
              </Button>
            </Space>
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

export default ConfigurableFilter;
