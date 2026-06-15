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

import React, { createContext, lazy, Suspense, useContext, useMemo, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { App, Button, Form, Menu, Skeleton, Space } from 'antd';
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

type Anchor = { upstream?: any; branchIndex?: number | null };

type AddNodeContextValue = {
  creating: { upstreamId: any; branchIndex: number | null } | null;
  onMenuOpen: (anchor: Anchor) => void;
};

const AddNodeContext = createContext<AddNodeContextValue | null>(null);

export function useAddNodeContext() {
  return useContext(AddNodeContext);
}

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

  const buildItems = useMemoizedFn((): MenuProps['items'] => {
    const instructionList = Array.from(plugin?.instructions?.getValues?.() ?? []) as Instruction[];
    const groupList = Array.from(plugin?.instructionGroups?.getValues?.() ?? []) as Array<{
      key: string;
      label: string;
    }>;
    return groupList
      .map((group) => {
        const children = instructionList
          .filter((item) => item.group === group.key)
          .map((item) => ({ key: item.type, label: t(item.title as string), icon: item.icon }));
        return children.length ? { type: 'group' as const, key: group.key, label: t(group.label), children } : null;
      })
      .filter(Boolean) as MenuProps['items'];
  });

  // Create the node, then (when a branching node was inserted above an existing downstream node and the user chose a
  // branch) re-parent that downstream node into the chosen branch. Mirrors v1's `useAddNodeSubmitAction`.
  const createNode = useMemoizedFn(async (anchor: Anchor, instruction: Instruction, presetValues: any) => {
    const upstreamId = anchor.upstream?.id ?? null;
    const branchIndex = anchor.branchIndex ?? null;
    const { downstreamBranchIndex, config: presetConfig } = presetValues ?? {};
    setCreating({ upstreamId, branchIndex });
    try {
      const {
        data: { data: newNode },
      } = await ctx.api.resource('workflows.nodes', workflow.id).create({
        values: {
          key: uid(),
          type: instruction.type,
          upstreamId,
          branchIndex,
          title: t(instruction.title as string),
          config: { ...(instruction.createDefaultConfig?.() ?? {}), ...(presetConfig ?? {}) },
        },
      });
      if (typeof downstreamBranchIndex === 'number' && newNode?.downstreamId) {
        await ctx.api.resource('flow_nodes').update({
          filterByTk: newNode.downstreamId,
          values: {
            branchIndex: downstreamBranchIndex,
            upstream: { id: newNode.id, downstreamId: null },
          },
          updateAssociationValues: ['upstream'],
        });
      }
      refresh?.();
    } catch (err) {
      message.error(t('Failed to add node'));
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    } finally {
      setCreating(null);
    }
  });

  const onCreate = useMemoizedFn(async (anchor: Anchor, type: string) => {
    const instruction = plugin?.getInstruction(type);
    if (!instruction || !workflow?.id) {
      return;
    }
    // Does a branching node land above an existing downstream node? If so the user must pick where that downstream
    // goes (DownstreamBranchIndex).
    const upstreamId = anchor.upstream?.id ?? null;
    const branchIndex = anchor.branchIndex ?? null;
    const downstream = anchor.upstream?.id
      ? (nodes ?? []).find((item: any) => item.upstreamId === upstreamId && item.branchIndex === branchIndex)
      : (nodes ?? []).find((item: any) => item.upstreamId == null);

    // Preset dialog when the node has an add-time preset form, or when a branching node needs the
    // downstream-placement choice (mirrors v1).
    if (instruction.PresetFieldsetLoader || Boolean(downstream && instruction.branching)) {
      ctx.viewer.dialog({
        width: 520,
        closable: true,
        content: () => (
          <PresetDialogForm
            instruction={instruction}
            hasDownstream={Boolean(downstream)}
            onSubmit={(values) => createNode(anchor, instruction, values)}
          />
        ),
      });
      return;
    }

    await createNode(anchor, instruction, {});
  });

  const onMenuOpen = useMemoizedFn((anchor: Anchor) => {
    const items = buildItems();
    ctx.viewer.drawer({
      width: '50%',
      closable: true,
      title: t('Add node'),
      content: () => <AddNodeMenu items={items} onPick={(type) => onCreate(anchor, type)} />,
    });
  });

  const value = useMemo<AddNodeContextValue>(() => ({ creating, onMenuOpen }), [creating, onMenuOpen]);

  return <AddNodeContext.Provider value={value}>{props.children}</AddNodeContext.Provider>;
}
