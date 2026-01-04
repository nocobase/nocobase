/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ThunderboltOutlined, DeleteOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  ActionDefinition,
  ActionScene,
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
import { Collapse, Input, Button, Space, Tooltip, Empty, Dropdown, Select, Cascader, Segmented } from 'antd';
import { uid } from '@formily/shared';
import { useUpdate } from 'ahooks';
import _ from 'lodash';

export const DynamicFlowsIcon: React.FC<{ model: FlowModel }> = (props) => {
  const { model } = props;
  const ctx = useFlowContext();
  const t = (ctx as any)?.t?.bind(ctx) || model.translate.bind(model);

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
    const ctx = useFlowContext();
    const t = (ctx as any)?.t?.bind(ctx) || model.translate.bind(model);
    const refresh = useUpdate();

    const [timingMode, setTimingMode] = React.useState<'default' | 'afterAllStatic' | 'staticStep'>(() => {
      const when = typeof flow.on === 'object' ? (flow.on as any)?.when : undefined;
      if (when?.anchor === 'afterAllStatic') return 'afterAllStatic';
      if (when?.anchor === 'staticFlow' || when?.anchor === 'staticStep') return 'staticStep';
      return 'default';
    });

    const [draftStaticFlowKey, setDraftStaticFlowKey] = React.useState<string | undefined>(() => {
      const when = typeof flow.on === 'object' ? (flow.on as any)?.when : undefined;
      if (when?.anchor === 'staticFlow' && when.flowKey) {
        return String(when.flowKey);
      }
      return undefined;
    });

    const [draftStaticStep, setDraftStaticStep] = React.useState<[string, string] | undefined>(() => {
      const when = typeof flow.on === 'object' ? (flow.on as any)?.when : undefined;
      if (when?.anchor === 'staticStep' && when.flowKey && when.stepKey) {
        return [when.flowKey, when.stepKey];
      }
      return undefined;
    });

    const [draftPhase, setDraftPhase] = React.useState<'before' | 'after'>(() => {
      const when = typeof flow.on === 'object' ? (flow.on as any)?.when : undefined;
      if (
        (when?.anchor === 'staticStep' || when?.anchor === 'staticFlow') &&
        (when.phase === 'before' || when.phase === 'after')
      ) {
        return when.phase;
      }
      return 'before';
    });

    const eventName = typeof flow.on === 'string' ? flow.on : (flow.on as any)?.eventName;
    const uiSchema = model.getEvent(eventName)?.uiSchema;
    const eventUiSchema = typeof uiSchema === 'function' ? uiSchema(ctx) : uiSchema;
    const eventDefaultParams = typeof flow.on === 'object' ? (flow.on as any)?.defaultParams : undefined;

    const ensureOnObject = React.useCallback(() => {
      if (!flow.on) {
        flow.on = { eventName } as any;
        return;
      }
      if (typeof flow.on === 'string') {
        flow.on = { eventName: flow.on } as any;
        return;
      }
    }, [eventName, flow]);

    const staticFlowOptions = React.useMemo(() => {
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

      const buildStepLabel = (step: FlowStep) => {
        const actionDef = step.use ? model.getAction(step.use) : undefined;
        const raw = actionDef?.title || step.title || step.use || step.key;
        return raw ? t(String(raw)) : step.key;
      };

      return [
        ...staticFlows.map((f) => {
          const children = f.mapSteps((s) => ({
            value: s.key,
            label: buildStepLabel(s),
          }));
          return {
            value: f.key,
            label: t(String(f.title || f.key)),
            disabled: model.flowRegistry.hasFlow(f.key),
            ...(children.length ? { children } : {}),
          };
        }),
      ];
    }, [eventName, model, t]);

    const persistedWhen = React.useMemo(() => {
      const when = typeof flow.on === 'object' ? (flow.on as any)?.when : undefined;
      if (!when || typeof when !== 'object') return undefined;
      return when as any;
    }, [typeof flow.on === 'object' ? (flow.on as any)?.when : undefined]);

    const staticAnchorValue = React.useMemo(() => {
      if (persistedWhen?.anchor === 'staticStep' && persistedWhen.flowKey && persistedWhen.stepKey) {
        return [persistedWhen.flowKey, persistedWhen.stepKey] as [string, string];
      }
      if (persistedWhen?.anchor === 'staticFlow' && persistedWhen.flowKey) {
        return [persistedWhen.flowKey] as [string];
      }
      if (draftStaticStep) return draftStaticStep;
      if (draftStaticFlowKey) return [draftStaticFlowKey] as [string];
      return undefined;
    }, [persistedWhen?.anchor, persistedWhen?.flowKey, persistedWhen?.stepKey, draftStaticStep, draftStaticFlowKey]);

    const phaseValue = React.useMemo(() => {
      if (
        (persistedWhen?.anchor === 'staticStep' || persistedWhen?.anchor === 'staticFlow') &&
        (persistedWhen.phase === 'before' || persistedWhen.phase === 'after')
      ) {
        return persistedWhen.phase as 'before' | 'after';
      }
      return draftPhase;
    }, [persistedWhen?.anchor, persistedWhen?.phase, draftPhase]);

    const anchorKind = React.useMemo<'none' | 'flow' | 'step'>(() => {
      const v = staticAnchorValue as any[] | undefined;
      if (!v || v.length === 0) return 'none';
      return v.length === 1 ? 'flow' : 'step';
    }, [staticAnchorValue]);

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
                    delete (flow.on as any).when;
                  }
                }
                setTimingMode('default');
                setDraftStaticFlowKey(undefined);
                setDraftStaticStep(undefined);
                setDraftPhase('before');
                refresh();
              }}
              options={getEventList()}
            />
          </div>

          {/* 执行时机 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#262626' }}>
              <span style={{ marginInlineEnd: 6 }}>{t('Execution timing')}</span>
              <Tooltip title={t('Default: runs before built-in flows')}>
                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
              </Tooltip>
              <span style={{ marginInlineStart: 2, marginInlineEnd: 8 }}>:</span>
            </div>
            <Select
              style={{ width: '100%' }}
              disabled={!eventName}
              value={timingMode}
              onChange={(value) => {
                const v = value as 'default' | 'afterAllStatic' | 'staticStep';
                setTimingMode(v);

                ensureOnObject();
                if (!flow.on || typeof flow.on !== 'object') return;

                if (v === 'default') {
                  delete (flow.on as any).when;
                  refresh();
                  return;
                }

                if (v === 'afterAllStatic') {
                  (flow.on as any).when = { anchor: 'afterAllStatic' };
                  refresh();
                  return;
                }

                // staticStep: wait for user to pick a step, keep config as draft until then
                delete (flow.on as any).when;
                refresh();
              }}
              options={[
                { value: 'default', label: t('Default') },
                {
                  value: 'afterAllStatic',
                  label: t('After built-in flows'),
                },
                { value: 'staticStep', label: t('Insert relative to a built-in flow or step') },
              ]}
            />

            {timingMode === 'staticStep' && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Cascader
                    allowClear
                    changeOnSelect
                    style={{ flex: 1 }}
                    disabled={!eventName || staticFlowOptions.length === 0}
                    placeholder={t('Select a built-in flow or step')}
                    options={staticFlowOptions as any}
                    value={staticAnchorValue as any}
                    onChange={(value) => {
                      const v = (value || []) as any[];
                      if (v.length === 0) {
                        setDraftStaticFlowKey(undefined);
                        setDraftStaticStep(undefined);
                        ensureOnObject();
                        if (typeof flow.on === 'object') {
                          delete (flow.on as any).when;
                        }
                        refresh();
                        return;
                      }
                      if (v.length === 1) {
                        const nextFlowKey = String(v[0]);
                        setDraftStaticFlowKey(nextFlowKey);
                        setDraftStaticStep(undefined);

                        ensureOnObject();
                        if (typeof flow.on === 'object') {
                          (flow.on as any).when = {
                            anchor: 'staticFlow',
                            flowKey: nextFlowKey,
                            phase: phaseValue,
                          };
                        }
                        refresh();
                        return;
                      }
                      const next: [string, string] = [String(v[0]), String(v[1])];
                      setDraftStaticFlowKey(undefined);
                      setDraftStaticStep(next);

                      ensureOnObject();
                      if (typeof flow.on === 'object') {
                        (flow.on as any).when = {
                          anchor: 'staticStep',
                          flowKey: next[0],
                          stepKey: next[1],
                          phase: phaseValue,
                        };
                      }
                      refresh();
                    }}
                  />
                  <Segmented
                    options={[
                      {
                        value: 'before',
                        label: anchorKind === 'flow' ? t('Before this flow') : t('Before this step'),
                      },
                      {
                        value: 'after',
                        label: anchorKind === 'flow' ? t('After this flow') : t('After this step'),
                      },
                    ]}
                    value={phaseValue}
                    onChange={(value) => {
                      const nextPhase = value as 'before' | 'after';
                      setDraftPhase(nextPhase);

                      const current = staticAnchorValue as any[] | undefined;
                      if (!current || current.length === 0) return;

                      ensureOnObject();
                      if (typeof flow.on === 'object') {
                        if (current.length === 1) {
                          (flow.on as any).when = {
                            anchor: 'staticFlow',
                            flowKey: String(current[0]),
                            phase: nextPhase,
                          };
                        } else {
                          (flow.on as any).when = {
                            anchor: 'staticStep',
                            flowKey: String(current[0]),
                            stepKey: String(current[1]),
                            phase: nextPhase,
                          };
                        }
                      }
                      refresh();
                    }}
                  />
                </div>
                {staticFlowOptions.length === 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
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
                if (typeof flow.on === 'object') {
                  (flow.on as any).defaultParams = form.values;
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
  const ctx = useFlowContext();
  const flowEngine = model.flowEngine;
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const t = model.translate.bind(model);

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
        <Tooltip title={t('Delete')}>
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
                        <Tooltip title={t('Delete step')}>
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteStep(step)}
                          />
                        </Tooltip>
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
