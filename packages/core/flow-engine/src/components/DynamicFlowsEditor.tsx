/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { uid } from '@nocobase/utils/client';
import { Collapse, Space, Button, Tabs, Input, Modal, Form, Empty } from 'antd';
import type { FormInstance } from 'antd';
import { FlowDefinition } from '../types';
import { observer } from '@formily/react';
import React from 'react';

const Panel = Collapse.Panel;

/**
 * 动态流编辑器（纯组件）
 * - 使用 Tabs 分隔多个 Flow
 * - 每个 Flow 下方显示：事件名输入框（编辑 flow.on）+ Steps 折叠面板
 * - 每个 Step 面板内部：一个 JSON 文本框编辑 defaultParams
 * - 支持新增/删除 Flow 与 Step；所有改动直接作用于传入的响应式 value
 */
export const DynamicFlowsEditor = observer(
  (props: { value: FlowDefinition[] }) => {
    const { value } = props;

    // 活动 tab
    const [activeKey, setActiveKey] = React.useState<string>(() => {
      return value?.[0]?.key || 'flow-1';
    });

    // 工具：生成唯一 flow key（使用 uid()，如冲突则重试）
    const getNextFlowKey = React.useCallback(() => {
      const exists = (k: string) => value.some((f) => f.key === k);
      let key = `flow-${uid()}`;
      let guard = 10;
      while (exists(key) && guard--) {
        key = `flow-${uid()}`;
      }
      return key;
    }, [value]);

    const getNextStepKey = React.useCallback((flow: FlowDefinition) => {
      const keys = Object.keys(flow.steps || {});
      let idx = keys.length + 1;
      let k = `step-${idx}`;
      while (keys.includes(k)) {
        idx += 1;
        k = `step-${idx}`;
      }
      return k;
    }, []);

    const addFlowWithTitle = React.useCallback(
      (title?: string) => {
        const key = getNextFlowKey();
        value.push({ key, title: title?.trim() || `Flow ${value.length + 1}`, steps: {} });
        setActiveKey(key);
      },
      [getNextFlowKey, setActiveKey, value],
    );

    const promptAddFlow = React.useCallback(() => {
      let tempTitle = '';
      const modal = Modal.confirm({
        title: 'Flow title',
        icon: null,
        content: (
          <Input
            autoFocus
            placeholder="Untitled flow"
            onChange={(e: any) => (tempTitle = e.target.value)}
            onPressEnter={() => {
              modal.update({ okButtonProps: { loading: true } });
              // 模拟点击 OK
              modal.destroy();
              addFlowWithTitle(tempTitle);
            }}
          />
        ),
        okText: 'OK',
        cancelText: 'Cancel',
        onOk: () => addFlowWithTitle(tempTitle),
      });
    }, [addFlowWithTitle]);

    const updateFlowOn = React.useCallback((flow: FlowDefinition, onStr: string) => {
      // 简化为字符串形式
      (flow as any).on = onStr || undefined;
    }, []);

    const addStep = React.useCallback(
      (flow: FlowDefinition) => {
        const key = getNextStepKey(flow);
        flow.steps = flow.steps || {};
        (flow.steps as any)[key] = { defaultParams: {} } as any;
      },
      [getNextStepKey],
    );

    const removeStep = React.useCallback((flow: FlowDefinition, stepKey: string) => {
      if (!flow.steps) return;
      delete (flow.steps as any)[stepKey];
    }, []);

    const StepEditor: React.FC<{ flow: FlowDefinition; stepKey: string; form: FormInstance }> = ({
      flow,
      stepKey,
      form,
    }) => {
      // 自定义 JSON 校验器
      const jsonValidator = (_: any, value: string) => {
        if (!value?.trim()) {
          return Promise.reject(new Error('Params JSON is required'));
        }
        try {
          JSON.parse(value);
          return Promise.resolve();
        } catch (e) {
          const msg = (e as Error)?.message || 'Invalid JSON';
          return Promise.reject(new Error(`Invalid JSON: ${msg}`));
        }
      };

      return (
        <Form.Item
          name={['steps', stepKey, 'defaultParamsText']}
          label="Default parameters"
          initialValue={JSON.stringify((flow.steps as any)[stepKey]?.defaultParams || {}, null, 2)}
          validateTrigger={['onBlur']}
          rules={[{ validator: jsonValidator }]}
        >
          <Input.TextArea
            onBlur={() => {
              const v = form.getFieldValue(['steps', stepKey, 'defaultParamsText']);
              try {
                const obj = v ? JSON.parse(v) : {};
                (flow.steps as any)[stepKey].defaultParams = obj;
              } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('DynamicFlowsEditor: invalid JSON for defaultParams', e);
              }
            }}
            autoSize={{ minRows: 6 }}
            placeholder={'{\n  "foo": "bar"\n}'}
          />
        </Form.Item>
      );
    };

    const FlowTab: React.FC<{ flow: FlowDefinition }> = observer(
      ({ flow }) => {
        const [form] = Form.useForm();
        const stepKeys = Object.keys(flow.steps || {});
        const initialValues = React.useMemo(() => {
          const stepsInitial: Record<string, any> = {};
          for (const sk of stepKeys) {
            const params = (flow.steps as any)[sk]?.defaultParams || {};
            stepsInitial[sk] = { defaultParamsText: JSON.stringify(params, null, 2) };
          }
          return {
            eventName: typeof (flow as any).on === 'string' ? (flow as any).on : (flow as any).on?.eventName ?? '',
            steps: stepsInitial,
          } as any;
        }, [flow, stepKeys]);

        // 生成 Step 折叠项
        const items = stepKeys.map((sk) => {
          const headerEl = (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input
                size="small"
                variant="borderless"
                style={{ width: 240, padding: 0, background: 'transparent' }}
                value={(flow.steps as any)[sk]?.title ?? sk}
                placeholder="请输入步骤标题"
                onClick={(e: any) => e.stopPropagation()}
                onChange={(e: any) => {
                  (flow.steps as any)[sk] = (flow.steps as any)[sk] || ({} as any);
                  (flow.steps as any)[sk].title = e.target.value;
                }}
              />
            </div>
          );

          const extraEl = (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeStep(flow, sk);
              }}
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Delete step"
            >
              <DeleteOutlined style={{ color: 'gray' }} />
            </button>
          );

          return (
            <Panel header={headerEl} key={sk} extra={extraEl}>
              <StepEditor flow={flow} stepKey={sk} form={form} />
            </Panel>
          );
        });

        return (
          <Form
            layout="vertical"
            form={form}
            initialValues={initialValues}
            onValuesChange={(changed, all) => {
              if (Object.hasOwn(changed, 'eventName')) {
                updateFlowOn(flow, all.eventName);
              }
            }}
          >
            <Form.Item
              label="Event name"
              name="eventName"
              extra="The event name used to dispatch and trigger this flow"
            >
              <Input style={{ width: '100%' }} placeholder="选择一个事件名称" />
            </Form.Item>

            <Form.Item label="Steps">
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                {stepKeys.length === 0 ? (
                  <div style={{ background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 6, padding: 24 }}>
                    <Empty
                      description="No steps. Click 'Add step' to get started."
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </div>
                ) : (
                  <Collapse accordion defaultActiveKey={stepKeys[0]}>
                    {items}
                  </Collapse>
                )}
                <Button onClick={() => addStep(flow)} type="dashed" block icon={<PlusOutlined />}>
                  Add step
                </Button>
              </Space>
            </Form.Item>
          </Form>
        );
      },
      {
        displayName: 'FlowTab',
      },
    );

    // 组装 Tabs items：每个 flow 一个标签，标签上放删除图标；最后追加“添加”标签
    const items = (value || []).map((f) => {
      const label = (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span>{f.title || f.key}</span>
          <button
            type="button"
            onClick={(e: any) => {
              e.stopPropagation();
              // 删除当前 flow
              const idx = value.findIndex((x) => x.key === f.key);
              if (idx !== -1) {
                value.splice(idx, 1);
                const next = (value[idx] as any)?.key || (value[idx - 1] as any)?.key || '';
                setActiveKey(next);
              }
            }}
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            aria-label="Delete flow"
          >
            <DeleteOutlined style={{ color: 'gray' }} />
          </button>
        </span>
      );
      return { key: f.key, label, children: <FlowTab flow={f} /> } as any;
    });

    const ADD_TAB_KEY = '__add__';
    items.push({
      key: ADD_TAB_KEY,
      label: (
        <span style={{ color: '#1677ff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <PlusOutlined />
          Add flow
        </span>
      ),
      children: null,
    } as any);

    const TabsAny = Tabs as any;
    return (
      <TabsAny
        items={items}
        activeKey={activeKey}
        onChange={(key: string) => {
          if (key === ADD_TAB_KEY) {
            promptAddFlow();
            return;
          }
          setActiveKey(key);
        }}
      />
    );
  },
  {
    displayName: 'DynamicFlowsEditor',
  },
);
