/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ThunderboltOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ActionDefinition,
  ActionScene,
  FlowEngineContext,
  FlowEventPhase,
  FlowModel,
  StepDefinition,
  untracked,
  useFlowContext,
  FlowDefinition,
  FlowStep,
  FlowStepContext,
  isBeforeRenderFlow,
  observer,
} from '@nocobase/flow-engine';
import { Collapse, Input, Button, Space, Empty, Dropdown, Select } from 'antd';
import { uid } from '@formily/shared';
import { useUpdate } from 'ahooks';
import _ from 'lodash';

type FlowOnObject = Exclude<FlowDefinition['on'], string | undefined>;

function isFlowOnObject(on: FlowDefinition['on']): on is FlowOnObject {
  return !!on && typeof on === 'object';
}

function normalizeFlowOnPhase(onObj: FlowOnObject) {
  const phase = onObj.phase;

  if (!phase || phase === 'beforeAllFlows') {
    delete onObj.phase;
    delete onObj.flowKey;
    delete onObj.stepKey;
    return;
  }

  if (phase === 'afterAllFlows') {
    delete onObj.flowKey;
    delete onObj.stepKey;
    return;
  }

  if (phase === 'beforeFlow' || phase === 'afterFlow') {
    delete onObj.stepKey;
    if (!onObj.flowKey) delete onObj.flowKey;
    return;
  }

  if (phase === 'beforeStep' || phase === 'afterStep') {
    if (!onObj.flowKey) delete onObj.flowKey;
    if (!onObj.stepKey) delete onObj.stepKey;
    return;
  }
}

function validateFlowOnPhase(onObj: FlowOnObject): 'flowKey' | 'stepKey' | undefined {
  const phase = onObj.phase;
  if (!phase || phase === 'beforeAllFlows' || phase === 'afterAllFlows') return;

  if (
    (phase === 'beforeFlow' || phase === 'afterFlow' || phase === 'beforeStep' || phase === 'afterStep') &&
    !onObj.flowKey
  ) {
    return 'flowKey';
  }

  if ((phase === 'beforeStep' || phase === 'afterStep') && !onObj.stepKey) {
    return 'stepKey';
  }
}

export const DynamicFlowsIcon: React.FC<{ model: FlowModel }> = (props) => {
  const { model } = props;
  const ctx = useFlowContext<FlowEngineContext>();
  const t = ctx?.t?.bind(ctx) || model.translate.bind(model);

  const handleClick = () => {
    const target = document.querySelector<HTMLDivElement>('#nocobase-embed-container');

    target.innerHTML = ''; // 清空容器内原有内容

    model.context.viewer.embed({
      type: 'embed',
      target,
      title: t('Edit event flows'),
      onOpen() {
        target.style.width = '33.3%';
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

// 事件配置组件 - 独立的 observer 组件确保响应式更新
const EventConfigSection = observer(
  ({ flow, model, flowEngine }: { flow: FlowDefinition; model: FlowModel; flowEngine: any }) => {
    const ctx = useFlowContext<FlowEngineContext>();
    const t = ctx?.t?.bind(ctx) || model.translate.bind(model);
    const refresh = useUpdate();

    const eventName = typeof flow.on === 'string' ? flow.on : isFlowOnObject(flow.on) ? flow.on.eventName : undefined;
    const uiSchema = eventName ? model.getEvent(eventName)?.uiSchema : undefined;
    const eventUiSchema = typeof uiSchema === 'function' ? uiSchema(ctx) : uiSchema;
    const eventDefaultParams = isFlowOnObject(flow.on) ? flow.on.defaultParams : undefined;

    const ensureOnObject = React.useCallback(() => {
      if (!flow.on) {
        if (!eventName) return;
        flow.on = { eventName };
        return flow.on;
      }
      if (typeof flow.on === 'string') {
        flow.on = { eventName: flow.on };
        return flow.on;
      }
      return flow.on;
    }, [eventName, flow]);

    type ExecutionPhase = FlowEventPhase;

    const readTiming = React.useCallback(() => {
      if (!isFlowOnObject(flow.on)) {
        return {
          phase: undefined as ExecutionPhase | undefined,
          flowKey: undefined as string | undefined,
          stepKey: undefined as string | undefined,
        };
      }
      const onObj = flow.on;
      return {
        phase: onObj.phase ? (String(onObj.phase) as ExecutionPhase) : undefined,
        flowKey: onObj.flowKey ? String(onObj.flowKey) : undefined,
        stepKey: onObj.stepKey ? String(onObj.stepKey) : undefined,
      };
    }, [flow]);

    const timing = readTiming();
    const phaseValue = (timing.phase ?? 'beforeAllFlows') as ExecutionPhase;
    const flowKeyValue = timing.flowKey;
    const stepKeyValue = timing.stepKey;

    const staticFlows = React.useMemo(() => {
      if (!eventName) return [];
      const ModelClass = model.constructor as typeof FlowModel;
      const globalFlows = Array.from(ModelClass.globalFlowRegistry.getFlows().values());
      const isBeforeRender = eventName === 'beforeRender';
      const isMatch = (flow: FlowDefinition) => {
        if (isBeforeRender) {
          if (flow.manual === true) return false;
          if (!flow.on) return true;
          return typeof flow.on === 'string'
            ? flow.on === 'beforeRender'
            : (flow.on as any)?.eventName === 'beforeRender';
        }
        const on = flow.on;
        if (!on) return false;
        return typeof on === 'string' ? on === eventName : (on as any)?.eventName === eventName;
      };
      const staticFlows = globalFlows.filter(isMatch);

      return staticFlows;
    }, [eventName, model]);

    const staticFlowsByKey = React.useMemo(() => new Map(staticFlows.map((f) => [f.key, f] as const)), [staticFlows]);

    const formatKeyWithTitle = React.useCallback(
      (key: string, title?: any) => {
        if (!title) return key;
        const titleText = t(String(title));
        return `${key} (${titleText})`;
      },
      [t],
    );

    const flowOptions = React.useMemo(() => {
      return staticFlows.map((f) => ({
        value: f.key,
        label: formatKeyWithTitle(String(f.key), f.title),
        disabled: model.flowRegistry.hasFlow(f.key),
      }));
    }, [formatKeyWithTitle, model.flowRegistry, staticFlows]);

    const stepOptions = React.useMemo(() => {
      if (!flowKeyValue) return [];
      const f = staticFlowsByKey.get(flowKeyValue);
      if (!f) return [];
      return f.mapSteps((s: FlowStep) => {
        const actionDef = s.use ? model.getAction(s.use) : undefined;
        const title = s.title || actionDef?.title;
        return {
          value: s.key,
          label: formatKeyWithTitle(String(s.key), title),
        };
      });
    }, [flowKeyValue, formatKeyWithTitle, model, staticFlowsByKey]);

    const phaseOptions: Array<{ value: ExecutionPhase; label: string }> = React.useMemo(
      () => [
        { value: 'beforeAllFlows', label: t('Before all flows') },
        { value: 'afterAllFlows', label: t('After built-in flows') },
        { value: 'beforeFlow', label: t('Before built-in flow') },
        { value: 'afterFlow', label: t('After built-in flow') },
        { value: 'beforeStep', label: t('Before built-in flow step') },
        { value: 'afterStep', label: t('After built-in flow step') },
      ],
      [t],
    );

    const requireFlowKey =
      phaseValue === 'beforeFlow' ||
      phaseValue === 'afterFlow' ||
      phaseValue === 'beforeStep' ||
      phaseValue === 'afterStep';
    const requireStepKey = phaseValue === 'beforeStep' || phaseValue === 'afterStep';
    const flowKeyMissing = requireFlowKey && !flowKeyValue;
    const stepKeyMissing = requireStepKey && !!flowKeyValue && !stepKeyValue;

    const getEventList = () => {
      return [...model.getEvents().values()].map((event) => ({ label: t(event.title), value: event.name }));
    };

    return (
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
            {t('Event')}
          </h4>
        </div>
        <div style={{ paddingLeft: 12 }}>
          {/* 触发事件 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#262626' }}>
              {t('Trigger event')}
              <span style={{ marginInlineStart: 2, marginInlineEnd: 8 }}>:</span>
            </div>
            <Select
              placeholder={t('Select trigger event')}
              style={{ width: '100%' }}
              value={eventName}
              onChange={(value) => {
                if (!flow.on) {
                  flow.on = { eventName: value } as any;
                } else {
                  if (typeof flow.on === 'string') {
                    flow.on = { eventName: value } as any;
                  } else {
                    (flow.on as any).eventName = value;
                    delete (flow.on as any).phase;
                    delete (flow.on as any).flowKey;
                    delete (flow.on as any).stepKey;
                  }
                }
                refresh();
              }}
              options={getEventList()}
            />
          </div>

          {/* 执行时机 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#262626' }}>
              <span style={{ marginInlineEnd: 6 }}>{t('Execution timing')}</span>
              <span style={{ marginInlineStart: 2, marginInlineEnd: 8 }}>:</span>
            </div>
            <Select
              style={{ width: '100%' }}
              disabled={!eventName}
              value={phaseValue}
              onChange={(value) => {
                const v = value as ExecutionPhase;
                const onObj = ensureOnObject();
                if (!onObj || typeof onObj !== 'object') return;
                onObj.phase = v;
                normalizeFlowOnPhase(onObj as FlowOnObject);
                refresh();
              }}
              options={phaseOptions as any}
            />

            {(phaseValue === 'beforeFlow' ||
              phaseValue === 'afterFlow' ||
              phaseValue === 'beforeStep' ||
              phaseValue === 'afterStep') && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ marginBottom: 6, fontSize: 14, fontWeight: 500, color: '#262626' }}>
                    {t('Built-in flow')}
                    {requireFlowKey && <span style={{ marginInlineStart: 4, color: '#ff4d4f' }}>*</span>}
                    <span style={{ marginInlineStart: 2, marginInlineEnd: 8 }}>:</span>
                  </div>
                  <Select
                    style={{ width: '100%' }}
                    disabled={!eventName || flowOptions.length === 0}
                    placeholder={t('Select a built-in flow')}
                    value={flowKeyValue}
                    status={flowKeyMissing ? 'error' : undefined}
                    options={flowOptions as any}
                    onChange={(value) => {
                      ensureOnObject();
                      if (!isFlowOnObject(flow.on)) return;
                      const onObj = flow.on;
                      if (!value) {
                        delete onObj.flowKey;
                        delete onObj.stepKey;
                      } else {
                        onObj.flowKey = value;
                        delete onObj.stepKey;
                      }
                      refresh();
                    }}
                  />
                  {flowKeyMissing && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#ff4d4f' }}>
                      {t('Please select a built-in flow')}
                    </div>
                  )}
                </div>

                {(phaseValue === 'beforeStep' || phaseValue === 'afterStep') && (
                  <div>
                    <div style={{ marginBottom: 6, fontSize: 14, fontWeight: 500, color: '#262626' }}>
                      {t('Built-in flow step')}
                      {requireStepKey && <span style={{ marginInlineStart: 4, color: '#ff4d4f' }}>*</span>}
                      <span style={{ marginInlineStart: 2, marginInlineEnd: 8 }}>:</span>
                    </div>
                    <Select
                      style={{ width: '100%' }}
                      disabled={!eventName || !flowKeyValue || stepOptions.length === 0}
                      placeholder={t('Select a built-in flow step')}
                      value={stepKeyValue}
                      status={stepKeyMissing ? 'error' : undefined}
                      options={stepOptions as any}
                      onChange={(value) => {
                        ensureOnObject();
                        if (!isFlowOnObject(flow.on)) return;
                        const onObj = flow.on;
                        if (!value) {
                          delete onObj.stepKey;
                        } else {
                          onObj.stepKey = value;
                        }
                        refresh();
                      }}
                    />
                    {stepKeyMissing && (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#ff4d4f' }}>
                        {t('Please select a built-in flow step')}
                      </div>
                    )}
                  </div>
                )}

                {flowOptions.length === 0 && (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                    {t('No built-in flows for this event')}
                  </div>
                )}
              </div>
            )}
          </div>

          {eventName &&
            flowEngine.flowSettings.renderStepForm({
              key: eventName,
              uiSchema: eventUiSchema,
              initialValues: eventDefaultParams,
              flowEngine,
              onFormValuesChange: (form: any) => {
                ensureOnObject();
                if (isFlowOnObject(flow.on)) {
                  flow.on.defaultParams = form.values;
                }
              },
            })}
        </div>
      </div>
    );
  },
);

const DynamicFlowsEditor = observer((props: { model: FlowModel }) => {
  const { model } = props;
  const ctx = useFlowContext<FlowEngineContext>();
  const flowEngine = model.flowEngine;
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const t = ctx?.t?.bind(ctx) || model.translate.bind(model);

  // 创建新流的默认值
  const createNewFlow = (): any => ({
    title: t('Event flow'),
    steps: {},
  });

  // 添加新流
  const handleAddFlow = () => {
    model.flowRegistry.addFlow(uid(), createNewFlow());
  };

  // 删除流
  const handleDeleteFlow = (flow: FlowDefinition) => {
    flow.remove();
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
    return [...model.getActions().values()]
      .filter((action) => _.castArray(action.scene).includes(ActionScene.DYNAMIC_EVENT_FLOW))
      .sort((a, b) => {
        const sortA = a.sort ?? 0;
        const sortB = b.sort ?? 0;
        return sortA - sortB;
      });
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
          placeholder={t('Enter flow title')}
        />
      </div>
      <Space onClick={(e) => e.stopPropagation()}>
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          aria-label={t('Delete')}
          onClick={() => handleDeleteFlow(flow)}
        />
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
  const collapseItems = model.flowRegistry.mapFlows((flow) => {
    return {
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
          <EventConfigSection flow={flow} model={model} flowEngine={flowEngine} />

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
                {t('Steps')}
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
                        <span style={{ fontWeight: 600, color: '#262626' }}>
                          {t(actionDef.title)}
                          <span style={{ marginInlineStart: 2, marginInlineEnd: 8 }}>:</span>
                        </span>
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          aria-label={t('Delete step')}
                          onClick={() => handleDeleteStep(step)}
                        />
                      </div>
                      <div>
                        {React.createElement(
                          FlowStepContext.Provider,
                          {
                            value: {
                              params: untracked(() => step.defaultParams),
                              path: `${model.uid}_${step.flowKey}_${step.key}`,
                            },
                          },
                          flowEngine.flowSettings.renderStepForm({
                            uiSchema: actionDef.uiSchema,
                            initialValues: untracked(() => step.defaultParams), // 防止代码编辑器失焦
                            flowEngine,
                            onFormValuesChange: (form: any) => handleActionValueChange(step, form.values),
                          }),
                        )}
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
                    label: t(action.title) || action.name,
                    onClick: () => handleAddStep(flow, action),
                  })),
                }}
                trigger={['hover']}
              >
                <Button type="link" icon={<PlusOutlined />} style={{ padding: 0, height: 'auto', textAlign: 'left' }}>
                  {t('Add step')}
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>
      ),
    };
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
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
            <Empty description={t('No event flows')} style={{ margin: '20px 0' }} />
          </div>
        )}
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddFlow} style={{ width: '100%' }}>
          {t('Add event flow')}
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
        <Button onClick={() => ctx.view.destroy()}>{t('Cancel')}</Button>
        <Button
          type="primary"
          loading={submitLoading}
          onClick={async () => {
            setSubmitLoading(true);
            const invalid = model.flowRegistry
              .mapFlows((flow) => {
                if (!isFlowOnObject(flow.on)) return;
                normalizeFlowOnPhase(flow.on);
                const invalidType = validateFlowOnPhase(flow.on);
                if (!invalidType) return;
                return { type: invalidType as const };
              })
              .filter(Boolean)[0] as { type: 'flowKey' | 'stepKey' } | undefined;

            if (invalid) {
              const msg =
                invalid.type === 'flowKey'
                  ? t('Please select a built-in flow')
                  : t('Please select a built-in flow step');
              model.context?.message?.error?.(msg);
              setSubmitLoading(false);
              return;
            }

            await model.flowRegistry.save();
            // 保存事件流定义后，失效 beforeRender 缓存并触发一次重跑，确保改动立刻生效
            const beforeRenderFlows = model.flowRegistry
              .mapFlows((flow) => {
                if (isBeforeRenderFlow(flow)) {
                  return flow;
                }
              })
              .filter(Boolean);
            if (beforeRenderFlows.length > 0) {
              model.rerender(); // 不阻塞，后续保存
            }
            setSubmitLoading(false);
            model.context?.message?.success?.(t('Configuration saved'));
            ctx.view.destroy();
          }}
        >
          {t('Save')}
        </Button>
      </div>
    </div>
  );
});
