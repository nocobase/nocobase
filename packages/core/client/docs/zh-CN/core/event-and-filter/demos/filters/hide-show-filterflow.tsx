import { Card, Space, Typography, Input, Button, Form, Checkbox } from 'antd';
import React, { useState, useEffect, useMemo } from 'react';
import { FilterFlowManager, useApplyFilters } from '@nocobase/client';

// 创建过滤器管理器实例
const filterFlowManager = new FilterFlowManager();

// 注册过滤器组
filterFlowManager.addFilterGroup({
  name: 'visibilityControl',
  title: '可见性控制',
  sort: 1,
});

// 注册过滤器
filterFlowManager.addFilter({
  name: 'showHideElements',
  title: '显示/隐藏元素',
  description: '根据条件控制 actions 和 fields 的可见性',
  group: 'visibilityControl',
  sort: 1,
  uiSchema: {
    showActions: {
      type: 'array',
      title: '显示的操作',
      enum: [
        { label: 'Action 1', value: 'action1' },
        { label: 'Action 2', value: 'action2' },
        { label: 'Action 3', value: 'action3' },
      ],
      default: ['action1', 'action2', 'action3'],
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox.Group',
    },
    showFields: {
      type: 'array',
      title: '显示的字段',
      enum: [
        { label: 'Field 1', value: 'field1' },
        { label: 'Field 2', value: 'field2' },
        { label: 'Field 3', value: 'field3' },
      ],
      default: ['field1', 'field2', 'field3'],
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox.Group',
    },
  },
  handler: (currentValue, params, context) => {
    // 过滤器处理函数，返回应显示的元素配置
    return {
      visibleActions: params.showActions || [],
      visibleFields: params.showFields || [],
    };
  },
});

// 创建过滤器流
filterFlowManager.addFlow({
  key: 'visibility-control',
  title: '元素可见性控制',
  steps: [
    {
      key: 'show-hide-step',
      filterName: 'showHideElements',
      title: '控制元素可见性',
    },
  ],
});

const HideShowFilterFlow = () => {
  const [filterParams, setFilterParams] = useState({
    showActions: ['action1', 'action2', 'action3'],
    showFields: ['field1', 'field2', 'field3'],
  });
  const filterContext = useMemo(() => {
    return {
      meta: {
        params: {
          'show-hide-step': filterParams,
        },
      },
    };
  }, [filterParams]);
  // 应用过滤器获取可见性配置
  const visibilityConfig = useApplyFilters(filterFlowManager, 'visibility-control', null, filterContext);

  // 渲染 Action 按钮
  const renderActions = () => {
    const actions = [
      { key: 'action1', title: 'Action 1', color: '#1890ff' },
      { key: 'action2', title: 'Action 2', color: '#52c41a' },
      { key: 'action3', title: 'Action 3', color: '#faad14' },
    ];

    return (
      <Space>
        {actions.map((action) => (
          <Button
            key={action.key}
            type="primary"
            style={{
              display: visibilityConfig?.visibleActions?.includes(action.key) ? 'inline-block' : 'none',
              backgroundColor: action.color,
            }}
          >
            {action.title}
          </Button>
        ))}
      </Space>
    );
  };

  // 渲染 Field 表单项
  const renderFields = () => {
    const fields = [
      { key: 'field1', title: 'Field 1', placeholder: '请输入 Field 1' },
      { key: 'field2', title: 'Field 2', placeholder: '请输入 Field 2' },
      { key: 'field3', title: 'Field 3', placeholder: '请输入 Field 3' },
    ];

    return (
      <Form layout="vertical">
        {fields.map((field) => (
          <Form.Item
            key={field.key}
            label={field.title}
            style={{
              display: visibilityConfig?.visibleFields?.includes(field.key) ? 'block' : 'none',
            }}
          >
            <Input placeholder={field.placeholder} />
          </Form.Item>
        ))}
      </Form>
    );
  };

  // 过滤器配置表单
  const handleVisibilityChange = (type, values) => {
    setFilterParams((prev) => ({
      ...prev,
      [type]: values,
    }));
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Title level={4}>显示/隐藏元素过滤器演示</Typography.Title>
      <Typography.Paragraph>
        这个示例展示了如何使用过滤器配置来控制界面元素（actions 和 fields）的可见性。
      </Typography.Paragraph>

      <Card title="配置可见性" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>显示的操作:</Typography.Text>
            <div>
              <Checkbox.Group
                options={[
                  { label: 'Action 1', value: 'action1' },
                  { label: 'Action 2', value: 'action2' },
                  { label: 'Action 3', value: 'action3' },
                ]}
                value={filterParams.showActions}
                onChange={(values) => handleVisibilityChange('showActions', values)}
              />
            </div>
          </div>

          <div>
            <Typography.Text strong>显示的字段:</Typography.Text>
            <div>
              <Checkbox.Group
                options={[
                  { label: 'Field 1', value: 'field1' },
                  { label: 'Field 2', value: 'field2' },
                  { label: 'Field 3', value: 'field3' },
                ]}
                value={filterParams.showFields}
                onChange={(values) => handleVisibilityChange('showFields', values)}
              />
            </div>
          </div>
        </Space>
      </Card>

      <Card title="过滤器效果" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>操作按钮:</Typography.Text>
            <div style={{ margin: '16px 0' }}>{renderActions()}</div>
          </div>

          <div>
            <Typography.Text strong>表单字段:</Typography.Text>
            <div style={{ margin: '16px 0' }}>{renderFields()}</div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default HideShowFilterFlow;
