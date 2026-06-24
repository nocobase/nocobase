/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { css, cx } from '@emotion/css';
import { ArrowUpOutlined } from '@ant-design/icons';
import { Card, Checkbox, Form, theme } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { TypedConstantSpec } from '@nocobase/client-v2';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import {
  Branch,
  CalculationConfig,
  NodeDefaultView,
  RadioWithTooltip,
  WorkflowTypedVariableInput,
  useFlowContext,
  useNodeContext,
  useStyles,
  useWorkflowVariableOptions,
} from '@nocobase/plugin-workflow/client-v2';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useT } from '../../locale';
import { createDefaultLoopCondition, LOOP_SCOPE_ROOT, useLoopScopeVariables } from '../loop';

type LoopConditionValue =
  | false
  | {
      checkpoint: 0 | 1;
      continueOnFalse: boolean;
      calculation?: {
        group: {
          type: string;
          calculations: unknown[];
        };
      };
      expression?: string;
    };

type LoopNodeLike = {
  id: string | number;
  key: string;
  title?: string;
  config?: {
    target?: unknown;
  };
};

const LOOP_TARGET_TYPES: TypedConstantSpec[] = ['string', ['number', { step: 1, min: 0, precision: 0 }]];

function prefixMetaTreeNodes(nodes: MetaTreeNode[], prefix: string[]): MetaTreeNode[] {
  return nodes.map((node) => {
    const nextNode: MetaTreeNode = {
      ...node,
      paths: [...prefix, ...(node.paths ?? [String(node.name ?? '')])],
    };

    if (Array.isArray(node.children)) {
      nextNode.children = prefixMetaTreeNodes(node.children, prefix);
    } else if (typeof node.children === 'function') {
      nextNode.children = async () => {
        const loaded = await node.children();
        return prefixMetaTreeNodes(loaded, prefix);
      };
    }

    return nextNode;
  });
}

function useLoopConditionMetaTree(): MetaTreeNode[] {
  const t = useT();
  const flowEngine = useFlowEngine();
  const node = useNodeContext() as LoopNodeLike;
  const workflowMetaTree = useWorkflowVariableOptions();
  const loopScopeVariables = useLoopScopeVariables(node);

  return useMemo(() => {
    if (!node?.key || !loopScopeVariables?.length) {
      return workflowMetaTree;
    }

    const currentScopeNode: MetaTreeNode = {
      name: node.key,
      title: node.title ?? `#${node.id}`,
      type: '',
      paths: [LOOP_SCOPE_ROOT, node.key],
      children: prefixMetaTreeNodes(loopScopeVariables, [LOOP_SCOPE_ROOT, node.key]),
    };

    const existingScopeRoot = workflowMetaTree.find((item) => item.name === LOOP_SCOPE_ROOT);
    const otherRoots = workflowMetaTree.filter((item) => item.name !== LOOP_SCOPE_ROOT);

    if (!existingScopeRoot) {
      return [
        {
          name: LOOP_SCOPE_ROOT,
          title: flowEngine.context.t('Scope variables', { ns: ['workflow', 'client'], nsMode: 'fallback' }),
          type: '',
          paths: [LOOP_SCOPE_ROOT],
          children: [currentScopeNode],
        },
        ...otherRoots,
      ];
    }

    const existingChildren = Array.isArray(existingScopeRoot.children) ? existingScopeRoot.children : [];
    const nextChildren = [
      currentScopeNode,
      ...existingChildren.filter((child) => String(child.name) !== String(node.key)),
    ];

    return [
      { ...existingScopeRoot, children: nextChildren, title: existingScopeRoot.title ?? t('Scope variables') },
      ...otherRoots,
    ];
  }, [flowEngine.context, loopScopeVariables, node?.id, node?.key, node?.title, t, workflowMetaTree]);
}

function LoopConditionEditor({
  value,
  onChange,
}: {
  value?: LoopConditionValue;
  onChange?: (value: LoopConditionValue) => void;
}) {
  const t = useT();
  const { token } = theme.useToken();
  const metaTreeHook = useLoopConditionMetaTree;

  const controlClassName = useMemo(
    () => css`
      margin-top: ${token.marginSM}px;
    `,
    [token.marginSM],
  );

  const checked = Boolean(value);
  const nextValue = value && typeof value === 'object' ? value : createDefaultLoopCondition();

  return (
    <>
      <Checkbox
        checked={checked}
        onChange={(event) => {
          onChange?.(event.target.checked ? createDefaultLoopCondition() : false);
        }}
      >
        {t('Enable loop condition')}
      </Checkbox>
      {checked ? (
        <Card className={controlClassName} size="small">
          <Form.Item label={t('Condition')} style={{ marginBottom: token.marginSM }}>
            <CalculationConfig
              value={nextValue.calculation}
              onChange={(calculation) => onChange?.({ ...nextValue, calculation })}
              useVariableHook={metaTreeHook}
            />
          </Form.Item>
          <Form.Item label={t('When to check')} style={{ marginBottom: token.marginSM }}>
            <RadioWithTooltip
              value={nextValue.checkpoint}
              onChange={(event: RadioChangeEvent) => onChange?.({ ...nextValue, checkpoint: event.target.value })}
              options={[
                { label: t('Before each starts'), value: 0 },
                { label: t('After each ends'), value: 1 },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('When condition is not met on item')}>
            <RadioWithTooltip
              value={nextValue.continueOnFalse}
              onChange={(event: RadioChangeEvent) => onChange?.({ ...nextValue, continueOnFalse: event.target.value })}
              options={[
                { label: t('Exit loop'), value: false },
                { label: t('Continue on next item'), value: true },
              ]}
            />
          </Form.Item>
        </Card>
      ) : null}
    </>
  );
}

function useResetLoopConditionOnTargetChange() {
  const form = Form.useFormInstance();
  const target = Form.useWatch(['config', 'target'], form);
  const previousTargetRef = useRef(target);

  useEffect(() => {
    if (typeof previousTargetRef.current === 'undefined') {
      previousTargetRef.current = target;
      return;
    }

    if (previousTargetRef.current === target) {
      return;
    }

    const condition = form.getFieldValue(['config', 'condition']) as LoopConditionValue;
    if (condition && typeof condition === 'object') {
      form.setFieldValue(['config', 'condition'], {
        ...condition,
        calculation: undefined,
        expression: '',
      });
    }

    previousTargetRef.current = target;
  }, [form, target]);
}

export function LoopFieldset() {
  const t = useT();
  const target = Form.useWatch(['config', 'target']);

  useResetLoopConditionOnTargetChange();

  return (
    <>
      <Form.Item
        name={['config', 'target']}
        label={t('Loop target')}
        extra={t(
          'A single number will be treated as a loop count, a single string will be treated as an array of characters, and other non-array values will be converted to arrays. The loop node ends when the loop count is reached, or when the array loop is completed. You can also add condition nodes to the loop to terminate it.',
        )}
        rules={[{ required: true }]}
        initialValue={1}
      >
        <WorkflowTypedVariableInput nullable={false} types={LOOP_TARGET_TYPES} />
      </Form.Item>

      {target ? (
        <Form.Item name={['config', 'condition']} initialValue={false}>
          <LoopConditionEditor />
        </Form.Item>
      ) : null}

      <Form.Item name={['config', 'exit']} label={t('When node inside loop failed')} initialValue={0}>
        <RadioWithTooltip
          direction="vertical"
          options={[
            { label: t('Exit workflow'), value: 0 },
            { label: t('Exit loop and continue workflow'), value: 1 },
            { label: t('Continue loop on next item'), value: 2 },
          ]}
        />
      </Form.Item>
    </>
  );
}

export function LoopCanvasComponent({ data }: { data: any }) {
  const { nodes } = useFlowContext() ?? {};
  const { styles } = useStyles();

  const entry = (nodes ?? []).find((node) => node.upstreamId === data.id && node.branchIndex != null);

  return (
    <NodeDefaultView data={data}>
      <div className={styles.nodeSubtreeClass}>
        <div
          className={cx(
            styles.branchBlockClass,
            css`
              padding-left: 4em;
            `,
          )}
        >
          <Branch from={data} entry={entry} branchIndex={entry?.branchIndex ?? 0} />

          <div
            className={styles.branchClass}
            style={{
              minWidth: '4em',
            }}
          >
            <div className="workflow-branch-lines" />
            <div className={styles.loopLineClass}>
              <ArrowUpOutlined />
            </div>
          </div>
        </div>
      </div>
    </NodeDefaultView>
  );
}

export default LoopFieldset;
