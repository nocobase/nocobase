/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { App, Button, Form, Input, Space, Tooltip, theme } from 'antd';
import { DialogFormLayout } from '@nocobase/client-v2';
import { useFlowContext as useFlowEngineContext } from '@nocobase/flow-engine';
import { Branch } from '../../canvas/Branch';
import {
  CurrentWorkflowContext,
  NodeContext,
  useFlowContext,
  useNodeContext,
  useWorkflowCanvasExecuted,
} from '../../canvas/contexts';
import { NodeDefaultView } from '../../canvas/Node';
import useStyles from '../../canvas/style';
import { ConditionRuleFields } from './conditionShared';
import { useT } from '../../locale';
import { RadioWithTooltip } from '../../components/RadioWithTooltip';
import {
  MULTI_CONDITION_BRANCH_INDEX,
  createEmptyMultiCondition,
  type MultiConditionConfigItem,
} from './multiConditionsShared';

function useConditionLabel(condition: MultiConditionConfigItem, index: number) {
  const t = useT();
  return condition.title || t('Condition {{index}}', { index });
}

function getConditionResultColor(
  result: unknown,
  colors: {
    success: string;
    error: string;
  },
) {
  switch (true) {
    case result === false:
      return colors.error;
    case result === true:
      return colors.success;
    case typeof result === 'string':
      return colors.error;
    case typeof result === 'number':
      return colors.success;
    default:
      return undefined;
  }
}

function getTooltipByResult(result: unknown) {
  return typeof result === 'string' ? result : null;
}

function ConditionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={css`
        position: relative;
        z-index: 1;
        padding-top: 1em;
      `}
    >
      {children}
    </div>
  );
}

function ConditionHeaderCard({
  children,
  color,
  tooltip,
}: {
  children: React.ReactNode;
  color?: string;
  tooltip?: string | null;
}) {
  const { token } = theme.useToken();
  const content = (
    <Space
      className={css`
        padding: 0.5em 1em;
        border-radius: 2em;
        background-color: ${token.colorBgContainer};
        font-size: 0.8rem;
        position: relative;
        z-index: 1;
        ${color ? `outline: 1px solid ${color};` : ''}

        .workflow-condition-action {
          display: inline-flex;
          align-items: center;
          text-wrap: nowrap;
          margin: -12px;
          padding: 12px;
          font-size: 0.8rem;
          line-height: 1;
          color: ${color || '#1677ff'};
          font-weight: normal;
          text-decoration: none;
          background: transparent;
          border: 0;
          cursor: pointer;
        }
      `}
    >
      {children}
    </Space>
  );

  return tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content;
}

function ConditionConfigDialog({
  condition,
  node,
  workflow,
  onSubmit,
}: {
  condition: MultiConditionConfigItem;
  node: any;
  workflow: any;
  onSubmit: (values: MultiConditionConfigItem) => Promise<void>;
}) {
  const t = useT();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const executed = Boolean(workflow?.versionStats?.executed);

  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <CurrentWorkflowContext.Provider value={workflow}>
      <NodeContext.Provider value={node}>
        <DialogFormLayout
          title={t('Configure condition')}
          onSubmit={handleSubmit}
          submitting={submitting}
          footer={executed ? <span /> : undefined}
        >
          <Form form={form} layout="vertical" initialValues={condition} disabled={executed}>
            <Form.Item name="title" label={t('Condition label')}>
              <Input />
            </Form.Item>
            <ConditionRuleFields prefix={[]} />
          </Form>
        </DialogFormLayout>
      </NodeContext.Provider>
    </CurrentWorkflowContext.Provider>
  );
}

function ConditionController({ condition, index }: { condition: MultiConditionConfigItem; index: number }) {
  const t = useT();
  const flowEngine = useFlowEngineContext();
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const node = useNodeContext();
  const executed = Boolean(useWorkflowCanvasExecuted());
  const { refresh } = useFlowContext() ?? {};
  const { workflow } = useFlowContext() ?? {};
  const latestJob = node.jobs?.[node.jobs.length - 1];
  const result = latestJob?.meta?.conditions?.[index - 1];
  const color = getConditionResultColor(result, {
    success: token.colorSuccess,
    error: token.colorError,
  });
  const label = useConditionLabel(condition, index);

  const updateCondition = useMemoizedFn(async (nextCondition: MultiConditionConfigItem) => {
    await flowEngine.api.resource('flow_nodes').update({
      filterByTk: node.id,
      values: {
        config: {
          ...node.config,
          conditions: node.config.conditions.map((item: MultiConditionConfigItem, itemIndex: number) =>
            itemIndex === index - 1 ? { ...item, ...nextCondition } : item,
          ),
        },
      },
    });
    refresh?.();
  });

  const onOpen = useMemoizedFn(() => {
    flowEngine.viewer.dialog({
      width: 720,
      closable: true,
      content: () => (
        <ConditionConfigDialog condition={condition} node={node} workflow={workflow} onSubmit={updateCondition} />
      ),
    });
  });

  const onRemoveConfirm = useMemoizedFn(async () => {
    const nextConditions = [...(node.config.conditions ?? [])];
    nextConditions.splice(index - 1, 1);
    if (node.config.conditions.length) {
      await flowEngine.api.resource('flow_nodes').destroyBranch({
        filterByTk: node.id,
        branchIndex: index,
        shift: 1,
      });
    }
    await flowEngine.api.resource('flow_nodes').update({
      filterByTk: node.id,
      values: {
        config: {
          ...node.config,
          conditions: nextConditions,
        },
      },
    });
    refresh?.();
  });

  const onRemove = useMemoizedFn(() => {
    modal.confirm({
      title: t('Delete'),
      content: t('Are you sure you want to delete it?'),
      onOk: onRemoveConfirm,
    });
  });

  return (
    <ConditionHeader>
      {!executed && node.config.conditions.length > 1 ? (
        <Tooltip title={t('Delete branch')}>
          <Button
            type="text"
            shape="circle"
            icon={<DeleteOutlined />}
            onClick={onRemove}
            className={[
              'workflow-node-remove-button',
              'workflow-branch-remove-button',
              css({
                display: 'none',
                position: 'absolute',
                right: '-2em',
                top: '1.35em',
              }),
            ].join(' ')}
            size="small"
          />
        </Tooltip>
      ) : null}
      <ConditionHeaderCard color={color} tooltip={getTooltipByResult(result)}>
        <a role="button" className="workflow-condition-action" title={label} onClick={onOpen}>
          <span style={{ paddingRight: 3 }}>{label}</span>
        </a>
      </ConditionHeaderCard>
    </ConditionHeader>
  );
}

function ConditionBranch({ condition, index }: { condition: MultiConditionConfigItem; index: number }) {
  const node = useNodeContext();
  const { nodes } = useFlowContext() ?? {};
  const entry = (nodes ?? []).find((item: any) => item.upstreamId === node.id && item.branchIndex === index);

  return (
    <Branch
      from={node}
      entry={entry}
      branchIndex={index}
      controller={<ConditionController condition={condition} index={index} />}
      className={css({
        '&:hover > .workflow-branch-controller .workflow-node-remove-button': {
          display: 'block',
        },
      })}
    />
  );
}

export function MultiConditionsFieldset() {
  const t = useT();

  return (
    <>
      {/* Keep the configured condition branches in the submitted `config`
          payload. The shared node drawer submits `values.config` wholesale; if
          the form omits `config.conditions`, toggling only
          `continueOnNoMatch` would overwrite the branch list away. */}
      <Form.Item name={['config', 'conditions']} hidden>
        <Input />
      </Form.Item>
      <Form.Item name={['config', 'continueOnNoMatch']} label={t('When no condition matches')} initialValue={false}>
        <RadioWithTooltip
          options={[
            { label: t('End as failed'), value: false },
            { label: t('Continue the workflow'), value: true },
          ]}
        />
      </Form.Item>
    </>
  );
}

export function MultiConditionsCanvasComponent({ data }: { data: any }) {
  const t = useT();
  const flowEngine = useFlowEngineContext();
  const { token } = theme.useToken();
  const executed = Boolean(useWorkflowCanvasExecuted());
  const { refresh, nodes } = useFlowContext() ?? {};
  const { styles } = useStyles();
  const { id, config: { conditions = [] } = {} } = data;
  const defaultEntry = (nodes ?? []).find((item: any) => item.upstreamId === id && item.branchIndex === 0);

  const onAddBranch = useMemoizedFn(async () => {
    await flowEngine.api.resource('flow_nodes').update({
      filterByTk: id,
      values: {
        config: {
          ...data.config,
          conditions: [...conditions, createEmptyMultiCondition()],
        },
      },
    });
    refresh?.();
  });

  return (
    <NodeDefaultView data={data}>
      <div className={styles.nodeSubtreeClass}>
        <div className={styles.branchBlockClass}>
          {conditions.map((item: MultiConditionConfigItem, index: number) => {
            const branchIndex = index + 1;
            return <ConditionBranch key={item.uid} condition={item} index={branchIndex} />;
          })}
          <Branch
            from={data}
            entry={defaultEntry}
            branchIndex={MULTI_CONDITION_BRANCH_INDEX.OTHERWISE}
            controller={
              <ConditionHeader>
                <ConditionHeaderCard>
                  <span>{t('Otherwise')}</span>
                </ConditionHeaderCard>
              </ConditionHeader>
            }
            end={!data.config.continueOnNoMatch}
          />
        </div>
        <Tooltip title={t('Add branch')}>
          <Button
            aria-label={['add-button', data?.type, data?.title, 'add-branch'].filter(Boolean).join('-')}
            icon={<PlusOutlined />}
            className={css({
              '& .anticon': {
                transformOrigin: 'center',
                transform: 'rotate(-45deg)',
              },
            })}
            style={{
              position: 'relative',
              top: token.padding,
              lineHeight: 1,
              transformOrigin: 'center',
              transform: 'rotate(45deg)',
              visibility: executed ? 'hidden' : 'visible',
            }}
            size="small"
            onClick={onAddBranch}
            disabled={executed}
          />
        </Tooltip>
      </div>
    </NodeDefaultView>
  );
}
