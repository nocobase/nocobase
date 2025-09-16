/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ThunderboltOutlined, DeleteOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import {
  ActionDefinition,
  ActionScene,
  FlowModel,
  observable,
  StepDefinition,
  useFlowContext,
} from '@nocobase/flow-engine';
import { Collapse, Input, Button, Space, Tooltip, Empty, Dropdown, Select } from 'antd';
import { uid } from '@formily/shared';
import { observer } from '@formily/react';
import { FilterGroup, LinkageFilterItem } from '@nocobase/client';
import { FlowDefinition, FlowStep } from '../../../../FlowDefinition';
import { useUpdate } from 'ahooks';
import _ from 'lodash';

export const DynamicFlowsIcon: React.FC<{ model: FlowModel }> = (props) => {
  const { model } = props;

  const handleClick = () => {
    const target = document.querySelector<HTMLDivElement>('#nocobase-embed-container');

    model.context.viewer.embed({
      type: 'embed',
      target,
      onOpen() {
        target.style.width = '50%';
        target.style.maxWidth = '800px';
      },
      onClose() {
        target.style.width = 'auto';
        target.style.maxWidth = 'none';
      },
      content: <DynamicFlowsEditor model={model} />,
    });
  };

  return <ThunderboltOutlined style={{ cursor: 'pointer' }} onClick={handleClick} />;
};

const DynamicFlowsEditor = observer((props: { model: FlowModel }) => {
  const { model } = props;
  const ctx = useFlowContext();
  const flowEngine = model.flowEngine;
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const refresh = useUpdate();

  // 创建新流的默认值
  const createNewFlow = (): any => ({
    title: 'Event flow',
    on: {
      condition: { logic: '$and', items: [] },
    },
    steps: {},
  });

  // 添加新流
  const handleAddFlow = () => {
    model.flowRegistry.addFlow(uid(), createNewFlow());
  };

  // 删除流
  const handleDeleteFlow = (flow: FlowDefinition) => {
    flow.destroy();
  };

  // 上移流
  // const handleMoveUp = (index: number) => {
  //   if (index > 0) {
  //     const flow = flows[index];
  //     flows.splice(index, 1);
  //     flows.splice(index - 1, 0, flow);
  //   }
  // };

  // 下移流
  // const handleMoveDown = (index: number) => {
  //   if (index < flows.length - 1) {
  //     const flow = flows[index];
  //     flows.splice(index, 1);
  //     flows.splice(index + 1, 0, flow);
  //   }
  // };

  // 复制流
  // const handleCopyFlow = (index: number) => {
  //   const originalFlow = flows[index];
  //   const newFlow: any = {
  //     ...originalFlow,
  //     key: uid(),
  //     title: `${originalFlow.title} (Copy)`,
  //   };
  //   flows.splice(index + 1, 0, newFlow);
  // };

  // 更新流标题
  const handleTitleChange = (flow: FlowDefinition, title: string) => {
    flow.title = title;
  };

  // 切换流启用状态
  // const handleToggleEnable = (index: number, enable: boolean) => {
  //   flows[index].enable = enable;
  // };

  // 获取可用的动作类型
  const getActionList = () => {
    return [...model.getActions().values()].filter((action) =>
      _.castArray(action.scene).includes(ActionScene.DYNAMIC_EVENT_FLOW),
    );
  };

  const getEventList = () => {
    return [...model.getEvents().values()].map((event) => ({ label: model.translate(event.label), value: event.name }));
  };

  // 添加步骤
  const handleAddStep = (flow: FlowDefinition, action: ActionDefinition) => {
    const newStep: StepDefinition = {
      use: action.name,
    };
    flow.addStep(uid(), newStep);
  };

  // 删除步骤
  const handleDeleteStep = (step: FlowStep) => {
    step.remove();
  };

  // 更新步骤的值
  const handleActionValueChange = (step: FlowStep, value: any) => {
    step.defaultParams = value;
  };

  // 生成折叠面板的自定义标题
  const renderPanelHeader = (flow) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <Input
          value={flow.title}
          onChange={(e) => handleTitleChange(flow, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Enter flow title"
        />
      </div>
      <Space onClick={(e) => e.stopPropagation()}>
        <Tooltip title="Delete">
          <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteFlow(flow)} />
        </Tooltip>
        {/* <Tooltip title="Move up">
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => handleMoveUp(index)}
            disabled={index === 0}
          />
        </Tooltip>
        <Tooltip title="Move down">
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => handleMoveDown(index)}
            disabled={index === flows.length - 1}
          />
        </Tooltip>
        <Tooltip title="Copy">
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyFlow(index)} />
        </Tooltip>
        <Switch
          size="small"
          checked={flow.enable}
          onChange={(checked) => handleToggleEnable(index, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        /> */}
      </Space>
    </div>
  );

  // 生成折叠面板项
  const collapseItems = model.flowRegistry.mapFlows((flow) => ({
    key: flow.key,
    label: renderPanelHeader(flow),
    styles: {
      header: {
        display: 'flex',
        alignItems: 'center',
      },
    },
    children: (
      <div>
        {/* 事件部分 */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div
              style={{
                width: '4px',
                height: '16px',
                backgroundColor: '#1890ff',
                borderRadius: '2px',
                marginRight: 8,
              }}
            ></div>
            <h4
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 500,
                color: '#262626',
              }}
            >
              事件
            </h4>
          </div>
          <div style={{ paddingLeft: 12 }}>
            {/* 触发事件 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#262626' }}>触发事件</div>
              <Select
                placeholder="选择触发事件"
                style={{ width: '100%' }}
                value={(flow.on as any)?.eventName}
                onChange={(value) => {
                  if (!flow.on) {
                    flow.on = { eventName: value, condition: { logic: '$and', items: [] } } as any;
                  } else {
                    (flow.on as any).eventName = value;
                  }
                  refresh();
                }}
                options={getEventList()}
              />
            </div>

            {/* 触发条件 */}
            {(flow.on as any)?.eventName && (
              <div>
                <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#262626' }}>触发条件</div>
                <FilterGroup
                  value={(flow.on as any)?.condition}
                  FilterItem={(props) => <LinkageFilterItem model={model} value={props.value} />}
                  onChange={refresh}
                />
              </div>
            )}
          </div>
        </div>

        {/* 步骤部分 */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div
              style={{
                width: '4px',
                height: '16px',
                backgroundColor: '#52c41a',
                borderRadius: '2px',
                marginRight: 8,
              }}
            ></div>
            <h4
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 500,
                color: '#262626',
              }}
            >
              步骤
            </h4>
          </div>
          <div style={{ paddingLeft: 12 }}>
            {/* 渲染已有的步骤 */}
            <div style={{ marginBottom: 16 }}>
              {flow.mapSteps((step) => {
                const actionDef = model.getAction(step.use);
                if (!actionDef) return null;

                return (
                  <div
                    key={step.key}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontWeight: 500, color: '#262626' }}>{model.translate(actionDef.title)}</span>
                      <Tooltip title="Delete step">
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteStep(step)}
                        />
                      </Tooltip>
                    </div>
                    <div>
                      {flowEngine.flowSettings.renderStepForm({
                        uiSchema: actionDef.uiSchema,
                        initialValues: step.defaultParams,
                        flowEngine,
                        onFormValuesChange: (form: any) => handleActionValueChange(step, form.values),
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add step 按钮 */}
            <Dropdown
              menu={{
                items: getActionList().map((action) => ({
                  key: action.name,
                  label: model.translate(action.title) || action.name,
                  onClick: () => handleAddStep(flow, action),
                })),
              }}
              trigger={['hover']}
            >
              <Button type="link" icon={<PlusOutlined />} style={{ padding: 0, height: 'auto', textAlign: 'left' }}>
                Add action
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#fff',
        borderLeft: '1px solid #e0e0e0',
        position: 'relative',
      }}
    >
      {/* 顶部标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#262626' }}>Flows</div>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          style={{ color: '#8c8c8c' }}
          onClick={() => ctx.view.destroy()}
        />
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        {collapseItems.length > 0 ? (
          <Collapse
            items={collapseItems}
            size="small"
            style={{ marginBottom: 8 }}
            defaultActiveKey={[collapseItems[0].key]}
            accordion
          />
        ) : (
          <div
            style={{
              border: '1px dashed #d9d9d9',
              borderRadius: '6px',
              backgroundColor: '#fafafa',
              marginBottom: '8px',
            }}
          >
            <Empty description="No flows" style={{ margin: '20px 0' }} />
          </div>
        )}
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddFlow} style={{ width: '100%' }}>
          Add flow
        </Button>
      </div>

      {/* 底部按钮区域 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          padding: '8px 16px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fff',
          flexShrink: 0,
        }}
      >
        <Button onClick={() => ctx.view.destroy()}>Cancel</Button>
        <Button
          type="primary"
          loading={submitLoading}
          onClick={async () => {
            setSubmitLoading(true);
            await model.flowRegistry.save();
            setSubmitLoading(false);
            ctx.view.destroy();
          }}
        >
          OK
        </Button>
      </div>
    </div>
  );
});
