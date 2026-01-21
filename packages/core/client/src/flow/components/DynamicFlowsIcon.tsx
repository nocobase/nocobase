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
  GLOBAL_EMBED_CONTAINER_ID,
  EMBED_REPLACING_DATA_KEY,
} from '@nocobase/flow-engine';
import { Collapse, Input, Button, Space, Tooltip, Empty, Dropdown, Select } from 'antd';
import { uid } from '@formily/shared';
import { useUpdate } from 'ahooks';
import _ from 'lodash';

type FlowOnObject = Exclude<FlowDefinition['on'], string | undefined>;

function isFlowOnObject(on: FlowDefinition['on']): on is FlowOnObject {
  return !!on && typeof on === 'object';
}

function getFlowOnEventName(on: FlowDefinition['on']): string | undefined {
  if (!on) return;
  if (typeof on === 'string') return on;
  if (isFlowOnObject(on)) return on.eventName;
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
  const t = model.translate.bind(model);

  const handleClick = () => {
    const target = document.querySelector<HTMLDivElement>(`#${GLOBAL_EMBED_CONTAINER_ID}`);

    if (!target) {
      return;
    }

    model.context.viewer.embed({
      type: 'embed',
      target,
      title: t('Edit event flows'),
      onOpen() {
        target.style.width = '33.3%';
        target.style.maxWidth = '800px';
        target.style.minWidth = '0px';
      },
      onClose() {
        if (target.dataset[EMBED_REPLACING_DATA_KEY] !== '1') {
          target.style.width = 'auto';
          target.style.maxWidth = 'none';
          target.style.minWidth = 'auto';
        }
      },
      content: <DynamicFlowsEditor model={model} />,
    });
  };

  return <ThunderboltOutlined style={{ cursor: 'pointer' }} onClick={handleClick} />;
};

const styles: Record<string, React.CSSProperties> = {
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '1px solid #f0f0f0',
  },
  sectionMarker: {
    width: '4px',
    height: '16px',
    borderRadius: '2px',
    marginRight: 8,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 500,
    color: '#262626',
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#262626',
  },
  requiredMark: {
    marginInlineStart: 4,
    color: '#ff4d4f',
  },
  colon: {
    marginInlineStart: 2,
    marginInlineEnd: 8,
  },
};

const SectionHeader = ({ color, children }: { color: string; children: React.ReactNode }) => {
  return (
    <div style={styles.sectionHeader}>
      <div style={{ ...styles.sectionMarker, backgroundColor: color }} />
      <h4 style={styles.sectionTitle}>{children}</h4>
    </div>
  );
};

const FieldLabel = ({
  children,
  required,
  style,
}: {
  children: React.ReactNode;
  required?: boolean;
  style?: React.CSSProperties;
}) => {
  return (
    <div style={{ ...styles.fieldLabel, ...style }}>
      {children}
      {required && <span style={styles.requiredMark}>*</span>}
      <span style={styles.colon}>:</span>
    </div>
  );
};

// 事件配置组件 - 独立的 observer 组件确保响应式更新
const EventConfigSection = observer(
  ({ flow, model, flowEngine }: { flow: FlowDefinition; model: FlowModel; flowEngine: any }) => {
    const ctx = useFlowContext<FlowEngineContext>();
    const t = model.translate.bind(model);
    const refresh = useUpdate();

    const eventName = getFlowOnEventName(flow.on);
    const onObj = isFlowOnObject(flow.on) ? flow.on : undefined;
    const uiSchema = eventName ? model.getEvent(eventName)?.uiSchema : undefined;
    const eventUiSchema = typeof uiSchema === 'function' ? uiSchema(ctx) : uiSchema;
    const eventDefaultParams = onObj?.defaultParams;

    const ensureOnObject = React.useCallback(() => {
      if (isFlowOnObject(flow.on)) return flow.on;
      if (!eventName) return;
      const next = { eventName } as FlowOnObject;
      flow.on = next;
      return next;
    }, [eventName, flow]);

    const phaseValue: FlowEventPhase = onObj?.phase ? (String(onObj.phase) as FlowEventPhase) : 'beforeAllFlows';
    const flowKeyValue = onObj?.flowKey ? String(onObj.flowKey) : undefined;
    const stepKeyValue = onObj?.stepKey ? String(onObj.stepKey) : undefined;

    const staticFlows = React.useMemo(() => {
      if (!eventName) return [];
      const ModelClass = model.constructor as typeof FlowModel;
      const globalFlows = Array.from(ModelClass.globalFlowRegistry.getFlows().values());
      return globalFlows.filter((f) => {
        if (eventName === 'beforeRender') {
          if (f.manual === true) return false;
          if (!f.on) return true;
          return getFlowOnEventName(f.on) === 'beforeRender';
        }
        return getFlowOnEventName(f.on) === eventName;
      });
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

    const phaseOptions: Array<{ value: FlowEventPhase; label: string }> = React.useMemo(
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

    const requireFlowKey = ['beforeFlow', 'afterFlow', 'beforeStep', 'afterStep'].includes(phaseValue);
    const requireStepKey = ['beforeStep', 'afterStep'].includes(phaseValue);
    const invalidType = onObj ? validateFlowOnPhase(onObj) : undefined;
    const flowKeyMissing = invalidType === 'flowKey';
    const stepKeyMissing = invalidType === 'stepKey';

    const setEventName = (value: string) => {
      const next = (isFlowOnObject(flow.on) ? flow.on : { eventName: value }) as FlowOnObject;
      flow.on = next;
      next.eventName = value;
      delete next.phase;
      delete next.flowKey;
      delete next.stepKey;
      refresh();
    };

    return (
      <div style={{ marginBottom: 32 }}>
        <SectionHeader color="#1890ff">{t('Event')}</SectionHeader>
        <div style={{ paddingLeft: 12 }}>
          {/* 触发事件 */}
          <div style={{ marginBottom: 16 }}>
            <FieldLabel>{t('Trigger event')}</FieldLabel>
            <Select
              placeholder={t('Select trigger event')}
              style={{ width: '100%' }}
              value={eventName}
              onChange={(value) => {
                setEventName(value);
              }}
              options={[...model.getEvents().values()].map((event) => ({ label: t(event.title), value: event.name }))}
            />
          </div>

          {/* 执行时机 */}
          <div style={{ marginBottom: 16 }}>
            <FieldLabel>{t('Execution timing')}</FieldLabel>
            <Select
              style={{ width: '100%' }}
              disabled={!eventName}
              value={phaseValue}
              onChange={(value) => {
                const onObj = ensureOnObject();
                if (!onObj) return;
                onObj.phase = value as FlowEventPhase;
                normalizeFlowOnPhase(onObj);
                refresh();
              }}
              options={phaseOptions as any}
            />

            {requireFlowKey && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <FieldLabel required={requireFlowKey} style={{ marginBottom: 6 }}>
                    {t('Built-in flow')}
                  </FieldLabel>
                  <Select
                    style={{ width: '100%' }}
                    disabled={!eventName || flowOptions.length === 0}
                    placeholder={t('Select a built-in flow')}
                    value={flowKeyValue}
                    status={flowKeyMissing ? 'error' : undefined}
                    options={flowOptions as any}
                    onChange={(value) => {
                      const onObj = ensureOnObject();
                      if (!onObj) return;
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

                {requireStepKey && (
                  <div>
                    <FieldLabel required={requireStepKey} style={{ marginBottom: 6 }}>
                      {t('Built-in flow step')}
                    </FieldLabel>
                    <Select
                      style={{ width: '100%' }}
                      disabled={!eventName || !flowKeyValue || stepOptions.length === 0}
                      placeholder={t('Select a built-in flow step')}
                      value={stepKeyValue}
                      status={stepKeyMissing ? 'error' : undefined}
                      options={stepOptions as any}
                      onChange={(value) => {
                        const onObj = ensureOnObject();
                        if (!onObj) return;
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
                const onObj = ensureOnObject();
                if (!onObj) return;
                onObj.defaultParams = form.values;
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
  const t = model.translate.bind(model);

  // 添加新流
  const handleAddFlow = () => {
    model.flowRegistry.addFlow(uid(), {
      title: t('Event flow'),
      steps: {},
    });
  };

  // 删除流
  const handleDeleteFlow = (flow: FlowDefinition) => {
    flow.remove();
  };

  // 更新流标题
  const handleTitleChange = (flow: FlowDefinition, title: string) => {
    flow.title = title;
  };

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
  const renderPanelHeader = (flow: FlowDefinition) => (
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
        <Tooltip title="Delete">
          <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteFlow(flow)} />
        </Tooltip>
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
            <SectionHeader color="#52c41a">{t('Steps')}</SectionHeader>
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
            const invalid = model.flowRegistry
              .mapFlows((flow) => {
                if (!isFlowOnObject(flow.on)) return;
                normalizeFlowOnPhase(flow.on);
                const invalidType = validateFlowOnPhase(flow.on);
                if (!invalidType) return;
                return { type: invalidType };
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
