import { Button, Card, Form, Input, Select, Space, Typography, Modal, Switch, InputNumber } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { FilterFlowManager, FilterHandlerContext, FilterStepParams, useApplyFilters } from '@nocobase/client';
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
  handler: (currentValue, params) => {
    if (typeof currentValue === 'string' && params.search) {
      if (params.useRegex) {
        try {
          const regex = new RegExp(params.search, params.flags || 'g');
          return currentValue.replace(regex, params.replacement || '');
        } catch (error) {
          console.error('正则表达式错误:', error);
          return currentValue;
        }
      } else {
        return currentValue.replace(
          new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          params.replacement || '',
        );
      }
    }
    return currentValue;
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
  handler: (currentValue, params) => {
    if (typeof currentValue === 'string') {
      const maxLength = params.maxLength || 10;
      if (currentValue.length <= maxLength) {
        return currentValue;
      }
      return currentValue.substring(0, maxLength) + (params.suffix || '...');
    }
    return currentValue;
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

const PARAMS = {
  filters: {
    'demo-id': {
      'replace-step': {
        search: 'Hello',
        replacement: 'hi',
        useRegex: false,
      },
      'truncate-step': {
        maxLength: 10,
        suffix: '...',
      },
    },
  },
};

const getParams = async (id: string): Promise<FilterStepParams> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(PARAMS['filters'][id]); // 模拟异步获取
    }, 1000);
  });
};

const setParams = async (id: string, params: Record<string, any>) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      PARAMS['filters'][id] = params; // 模拟异步更新
      resolve(params);
    }, 1000);
  });
};
const ConfigurableFilter = () => {
  const demoId = 'demo-id';
  const [inputText, setInputText] = useState('Hello configurable filter demo');

  const getContext = useCallback(
    async (): Promise<FilterHandlerContext> => ({
      meta: {
        params: await getParams(demoId),
      },
    }),
    [demoId],
  );

  const { data: outputText, reApplyFilters } = useApplyFilters(
    filterFlowManager,
    'configurable-text-transform',
    inputText,
    getContext,
    demoId,
  );

  // 打开配置Modal
  const openConfigModal = async (stepKey) => {
    const flow = filterFlowManager.getFlow('configurable-text-transform');
    const step = flow.getStep(stepKey);
    const actionContext = {
      payload: {
        step,
        currentParams: (await getParams(demoId))?.[stepKey],
        onChange: async (values) => {
          // await setParams(demoId, PARAMS['filters'][demoId]);
          await setParams(demoId, {
            ...PARAMS['filters'][demoId],
            [stepKey]: values,
          });
          reApplyFilters();
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
