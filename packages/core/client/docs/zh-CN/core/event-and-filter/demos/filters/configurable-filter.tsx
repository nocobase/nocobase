import { Button, Card, Form, Input, Select, Space, Typography, Modal, Switch, InputNumber } from 'antd';
import React, { useState } from 'react';
import { FilterFlowManager } from '../libs/filterflow-manager';

// 创建过滤器管理器实例
const filterFlowManager = new FilterFlowManager();

// 注册过滤器处理器组
filterFlowManager.addFilterHandlerGroup({
  name: 'stringFilters',
  title: '字符串过滤器',
  sort: 1,
});

// 注册过滤器处理器 - 替换文本
filterFlowManager.addFilterHandler({
  name: 'replaceText',
  title: '替换文本',
  description: '替换文本中的指定内容',
  group: 'stringFilters',
  sort: 1,
  uiSchema: {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        title: '查找内容',
        'x-component': 'Input',
      },
      replace: {
        type: 'string',
        title: '替换为',
        'x-component': 'Input',
      },
      caseSensitive: {
        type: 'boolean',
        title: '区分大小写',
        default: false,
        'x-component': 'Switch',
      },
      replaceAll: {
        type: 'boolean',
        title: '替换所有匹配项',
        default: true,
        'x-component': 'Switch',
      },
    },
  },
  handler: (currentValue, params, context) => {
    if (typeof currentValue === 'string' && params.search) {
      if (params.replaceAll) {
        // 全局替换
        const flags = params.caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        return currentValue.replace(regex, params.replace || '');
      } else {
        // 替换第一个匹配项
        if (params.caseSensitive) {
          return currentValue.replace(params.search, params.replace || '');
        } else {
          const index = currentValue.toLowerCase().indexOf(params.search.toLowerCase());
          if (index >= 0) {
            return (
              currentValue.substring(0, index) +
              (params.replace || '') +
              currentValue.substring(index + params.search.length)
            );
          }
        }
      }
    }
    return currentValue;
  },
});

// 注册过滤器处理器 - 截取文本
filterFlowManager.addFilterHandler({
  name: 'truncateText',
  title: '截取文本',
  description: '截取指定长度的文本，可添加省略号',
  group: 'stringFilters',
  sort: 2,
  uiSchema: {
    type: 'object',
    properties: {
      maxLength: {
        type: 'number',
        title: '最大长度',
        default: 10,
        'x-component': 'InputNumber',
      },
      addEllipsis: {
        type: 'boolean',
        title: '添加省略号',
        default: true,
        'x-component': 'Switch',
      },
    },
  },
  handler: (currentValue, params, context) => {
    if (typeof currentValue === 'string' && params.maxLength > 0) {
      if (currentValue.length <= params.maxLength) {
        return currentValue;
      }
      const truncated = currentValue.substring(0, params.maxLength);
      return params.addEllipsis ? truncated + '...' : truncated;
    }
    return currentValue;
  },
});

// 创建可配置过滤器流
filterFlowManager.addFlow({
  name: 'configurable-filter-flow',
  title: '可配置过滤器流',
  steps: [
    {
      key: 'replace-step',
      filterHandlerName: 'replaceText',
      title: '替换文本',
      params: {
        search: 'NocoBase',
        replace: 'NocoBase平台',
        caseSensitive: true,
        replaceAll: true,
      },
    },
    {
      key: 'truncate-step',
      filterHandlerName: 'truncateText',
      title: '截取文本',
      params: {
        maxLength: 50,
        addEllipsis: true,
      },
    },
  ],
});

const ConfigurableFilter = () => {
  const [inputText, setInputText] = useState('欢迎使用NocoBase进行低代码开发。NocoBase提供了丰富的组件和工具。');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [configForm] = Form.useForm();

  // 打开配置Modal
  const openConfigModal = (stepKey) => {
    const flow = filterFlowManager.getFlow('configurable-filter-flow');
    const step = flow.getStep(stepKey);

    if (step) {
      setCurrentStep(step);
      configForm.setFieldsValue(step.params);
      setConfigModalVisible(true);
    }
  };

  // 保存配置
  const handleSaveConfig = () => {
    configForm
      .validateFields()
      .then((values) => {
        if (currentStep) {
          currentStep.set('params', values);
          setConfigModalVisible(false);
        }
      })
      .catch((err) => {
        console.error('Failed to validate form:', err);
      });
  };

  // 应用过滤器
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
      const result = await filterFlowManager.applyFilters('configurable-filter-flow', inputText, context);

      setOutputText(result);
    } catch (error) {
      console.error('过滤器应用失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 渲染配置表单
  const renderConfigForm = () => {
    if (!currentStep) return null;

    const handlerName = currentStep.filterHandlerName;

    if (handlerName === 'replaceText') {
      return (
        <Form form={configForm} layout="vertical">
          <Form.Item name="search" label="查找内容" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="replace" label="替换为">
            <Input />
          </Form.Item>
          <Form.Item name="caseSensitive" label="区分大小写" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="replaceAll" label="替换所有匹配项" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      );
    } else if (handlerName === 'truncateText') {
      return (
        <Form form={configForm} layout="vertical">
          <Form.Item name="maxLength" label="最大长度" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="addEllipsis" label="添加省略号" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      );
    }

    return null;
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Title level={4}>可配置过滤器</Typography.Title>
      <Typography.Paragraph>
        这个示例展示了如何创建可配置的过滤器。用户可以通过界面修改过滤器参数，然后应用过滤操作。
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
            <Typography.Text strong>过滤器配置:</Typography.Text>
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
            <Typography.Text strong>过滤结果:</Typography.Text>
            <div
              style={{
                padding: 8,
                border: '1px dashed #d9d9d9',
                borderRadius: 4,
                background: outputText ? '#f6ffed' : '#f0f0f0',
                marginTop: 8,
                minHeight: 40,
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

      <Modal
        title={`配置${currentStep?.title || '过滤器'}`}
        open={configModalVisible}
        onOk={handleSaveConfig}
        onCancel={() => setConfigModalVisible(false)}
      >
        {renderConfigForm()}
      </Modal>
    </div>
  );
};

export default ConfigurableFilter;
