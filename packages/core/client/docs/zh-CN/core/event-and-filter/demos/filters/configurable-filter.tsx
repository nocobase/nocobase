import { Button, Card, Form, Input, Select, Space, Typography, Modal, Switch, InputNumber } from 'antd';
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
  name: 'replaceText',
  title: '文本替换',
  description: '替换文本中的指定内容',
  group: 'textTransform',
  sort: 1,
  uiSchema: {
    type: 'object',
    properties: {
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
  },
  handler: (currentValue, params, context) => {
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
    type: 'object',
    properties: {
      maxLength: {
        type: 'number',
        title: '最大长度',
        default: 10,
        'x-decorator': 'FormItem',
        'x-component': 'NumberPicker',
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
  },
  handler: (currentValue, params, context) => {
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

// 创建可配置过滤器流
filterFlowManager.addFlow({
  name: 'configurable-text-transform',
  title: '可配置文本转换',
  steps: [
    {
      key: 'replace-step',
      filterName: 'replaceText',
      title: '替换文本',
      params: {
        search: 'world',
        replacement: 'NocoBase',
        useRegex: false,
      },
    },
    {
      key: 'truncate-step',
      filterName: 'truncateText',
      title: '截断文本',
      params: {
        maxLength: 20,
        suffix: '...',
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
    const flow = filterFlowManager.getFlow('configurable-text-transform');
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
      const result = await filterFlowManager.applyFilters('configurable-text-transform', inputText, context);

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

    const filterName = currentStep.filterName;

    if (filterName === 'replaceText') {
      return (
        <Form form={configForm} layout="vertical">
          <Form.Item name="search" label="查找" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="replacement" label="替换为">
            <Input />
          </Form.Item>
          <Form.Item name="useRegex" label="使用正则表达式" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="flags" label="正则标志" valuePropName="checked">
            <Input />
          </Form.Item>
        </Form>
      );
    } else if (filterName === 'truncateText') {
      return (
        <Form form={configForm} layout="vertical">
          <Form.Item name="maxLength" label="最大长度" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="suffix" label="后缀">
            <Input />
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
