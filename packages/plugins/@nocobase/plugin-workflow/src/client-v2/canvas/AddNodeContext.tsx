/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Modern canvas add-node flow (doc §9.6), a native-antd rewrite of v1's
 * Formily `AddNodeContext`. Opens a `ctx.viewer.drawer` (50% width, two-column
 * grouped menu — 1:1 with v1) listing the v2-registered instructions; selecting
 * a type creates the node via `workflows.nodes.create` and refreshes.
 *
 * Only types present in *this* (v2) runtime's instruction registry are listed —
 * a type implemented only in v1 simply does not appear (doc §9.1).
 */

import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { App, Form, Menu, Skeleton, Tooltip } from 'antd';
import { css } from '@emotion/css';
import { DialogFormLayout } from '@nocobase/client-v2';
import { useFlowContext as useFlowEngineContext, useFlowView } from '@nocobase/flow-engine';
import { uid } from '@nocobase/utils/client';
import type { MenuProps } from 'antd';
import { useFlowContext } from './contexts';
import { useT } from '../locale';
import { PluginWorkflowClientV2 } from '../plugin';
import type { Instruction } from './Instruction';
import DownstreamBranchIndex, { getDownstreamBranchOptions } from './DownstreamBranchIndex';
import { AddNodeContext, type SharedAddNodeAnchor, useAddNodeContext } from './AddNodeContext.shared';
import { createNodeAndMaybeReparent, resolveAddNodeDecision } from './addNodeController';
import { getInstructionUnavailableMessage } from './instructionAvailability';

// Two-column grouped menu — mirrors v1's `.ant-menu-item-group-list` grid.
const menuGridClass = css`
  .ant-menu-item-group-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  &.ant-menu-root.ant-menu-vertical {
    border-inline-end: none;
  }
  .ant-menu-item {
    display: flex;
    align-items: center;
  }
`;

/** The drawer body: the grouped instruction menu. Rendered inside
 *  `ctx.viewer.drawer`, so it gets the drawer chrome (title + native close).
 *  Closes itself (via `useFlowView`) once a type is picked and created. */
function AddNodeMenu({ items, onPick }: { items: MenuProps['items']; onPick: (type: string) => Promise<void> }) {
  const view = useFlowView();
  return (
    <Menu
      className={menuGridClass}
      mode="vertical"
      selectable={false}
      items={items}
      onClick={async ({ key }) => {
        await onPick(String(key));
        await view.close();
      }}
    />
  );
}

/**
 * The add-time preset dialog body (small modal, mirrors v1's `Action.Modal`).
 * Hosts the instruction's `PresetFieldsetLoader` (e.g. the condition node's mode
 * picker) and, when inserting a branching node above an existing downstream node,
 * the `DownstreamBranchIndex` field. On submit it validates and delegates to
 * `onSubmit(values)` — the provider owns the actual create + downstream
 * re-parenting.
 */
export function PresetDialogForm({
  instruction,
  hasDownstream,
  onSubmit,
}: {
  instruction: Instruction;
  hasDownstream: boolean;
  onSubmit: (values: any) => Promise<void>;
}) {
  const t = useT();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const Preset = useMemo(
    () => (instruction.PresetFieldsetLoader ? lazy(instruction.PresetFieldsetLoader) : null),
    [instruction],
  );

  const config = Form.useWatch('config', form);
  const downstreamOptions = useMemo(
    () =>
      getDownstreamBranchOptions({
        instruction,
        config: config ?? {},
        hasDownstream,
        t,
      }),
    [instruction, config, hasDownstream, t],
  );

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
    <DialogFormLayout title={t('Add node')} onSubmit={handleSubmit} submitting={submitting}>
      <Form form={form} layout="vertical">
        {Preset ? (
          <Suspense fallback={<Skeleton active paragraph={{ rows: 2 }} />}>
            <Preset />
          </Suspense>
        ) : null}
        <DownstreamBranchIndex options={downstreamOptions} />
      </Form>
    </DialogFormLayout>
  );
}

export function AddNodeContextProvider(props: { children: React.ReactNode }) {
  const ctx = useFlowEngineContext();
  const t = useT();
  const { message } = App.useApp();
  const plugin = ctx.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  const { workflow, nodes, refresh } = useFlowContext() ?? {};

  const [creating, setCreating] = useState<{ upstreamId: any; branchIndex: number | null } | null>(null);

  const buildItems = useMemoizedFn((anchor: SharedAddNodeAnchor): MenuProps['items'] => {
    const instructionList = Array.from(plugin?.instructions?.getValues?.() ?? []) as Instruction[];
    const groupList = Array.from(plugin?.instructionGroups?.getValues?.() ?? []) as Array<{
      key: string;
      label: string;
    }>;
    return groupList
      .map((group) => {
        const children = instructionList
          .filter((item) => item.group === group.key)
          .map((item) => {
            const unavailableMessage = getInstructionUnavailableMessage(
              item,
              {
                engine: plugin,
                workflow,
                upstream: anchor.upstream,
                branchIndex: anchor.branchIndex ?? null,
                branchContext: anchor.branchContext ?? null,
              },
              t,
            );
            const title = t(item.title as string);
            return {
              key: item.type,
              label: unavailableMessage ? <Tooltip title={unavailableMessage}>{title}</Tooltip> : title,
              icon: item.icon,
              disabled: Boolean(unavailableMessage),
            };
          });
        return children.length ? { type: 'group' as const, key: group.key, label: t(group.label), children } : null;
      })
      .filter(Boolean) as MenuProps['items'];
  });

  const createNode = useMemoizedFn(async (anchor: SharedAddNodeAnchor, instruction: Instruction, presetValues: any) => {
    const upstreamId = anchor.upstream?.id ?? null;
    const branchIndex = anchor.branchIndex ?? null;
    const { downstreamBranchIndex, config: presetConfig } = presetValues ?? {};
    setCreating({ upstreamId, branchIndex });
    try {
      await createNodeAndMaybeReparent({
        workflowId: workflow.id,
        api: ctx.api,
        refresh,
        values: {
          key: uid(),
          type: instruction.type,
          upstreamId,
          branchIndex,
          title: t(instruction.title as string),
          config: { ...(instruction.createDefaultConfig?.() ?? {}), ...(presetConfig ?? {}) },
        },
        downstreamBranchIndex,
      });
    } catch (err) {
      message.error(t('Failed to add node'));
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    } finally {
      setCreating(null);
    }
  });

  const onCreate = useMemoizedFn(async (anchor: SharedAddNodeAnchor, type: string) => {
    if (!workflow?.id) {
      return;
    }

    const decision = resolveAddNodeDecision({
      type,
      anchor,
      runtime: {
        workflow,
        nodes: nodes ?? [],
        getInstruction: (instructionType) => plugin?.getInstruction(instructionType),
        getInstructionAvailable: (instruction, context) =>
          getInstructionUnavailableMessage(
            instruction,
            {
              engine: plugin,
              workflow: context.workflow,
              upstream: context.upstream,
              branchIndex: context.branchIndex ?? null,
              branchContext: context.branchContext ?? null,
            },
            t,
          ),
        translateTitle: (title) => t(title),
      },
    });

    if (decision.kind === 'missing' || decision.kind === 'blocked') {
      return;
    }

    if (decision.kind === 'modern-preset') {
      ctx.viewer.dialog({
        width: 520,
        closable: true,
        content: () => (
          <PresetDialogForm
            instruction={decision.instruction}
            hasDownstream={decision.hasDownstream}
            onSubmit={(values) => createNode(decision.anchor, decision.instruction, values)}
          />
        ),
      });
      return;
    }

    if (decision.kind === 'branch-fallback') {
      ctx.viewer.dialog({
        width: 520,
        closable: true,
        content: () => (
          <PresetDialogForm
            instruction={decision.instruction}
            hasDownstream
            onSubmit={(values) => createNode(anchor, decision.instruction, values)}
          />
        ),
      });
      return;
    }

    await createNode(anchor, decision.instruction, {});
  });

  const onMenuOpen = useMemoizedFn((anchor: SharedAddNodeAnchor) => {
    const items = buildItems(anchor);
    ctx.viewer.drawer({
      width: '50%',
      closable: true,
      title: t('Add node'),
      content: () => <AddNodeMenu items={items} onPick={(type) => onCreate(anchor, type)} />,
    });
  });

  const value = useMemo(
    () => ({
      creating,
      anchor: null,
      onMenuOpen,
    }),
    [creating, onMenuOpen],
  );

  return <AddNodeContext.Provider value={value}>{props.children}</AddNodeContext.Provider>;
}
