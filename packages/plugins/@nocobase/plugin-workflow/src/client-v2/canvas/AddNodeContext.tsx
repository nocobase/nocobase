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

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { App, Menu } from 'antd';
import { css } from '@emotion/css';
import { useFlowContext as useFlowEngineContext, useFlowView } from '@nocobase/flow-engine';
import { uid } from '@nocobase/utils/client';
import type { MenuProps } from 'antd';
import { useFlowContext } from './contexts';
import { useT } from '../locale';
import { PluginWorkflowClientV2 } from '../plugin';
import type { Instruction } from './Instruction';

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

export function AddNodeContextProvider(props: { children: React.ReactNode }) {
  const ctx = useFlowEngineContext();
  const t = useT();
  const { message } = App.useApp();
  const plugin = ctx.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  const { workflow, refresh } = useFlowContext() ?? {};

  const [creating, setCreating] = useState<{ upstreamId: any; branchIndex: number | null } | null>(null);

  const buildItems = useCallback((): MenuProps['items'] => {
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
  }, [plugin, t]);

  const onCreate = useCallback(
    async (anchor: Anchor, type: string) => {
      const instruction = plugin?.getInstruction(type);
      if (!instruction || !workflow?.id) {
        return;
      }
      const upstreamId = anchor.upstream?.id ?? null;
      const branchIndex = anchor.branchIndex ?? null;
      setCreating({ upstreamId, branchIndex });
      try {
        await ctx.api.resource('workflows.nodes', workflow.id).create({
          values: {
            key: uid(),
            type,
            upstreamId,
            branchIndex,
            title: t(instruction.title as string),
            config: instruction.createDefaultConfig?.() ?? {},
          },
        });
        refresh?.();
      } catch (err) {
        message.error(t('Failed to add node'));
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        setCreating(null);
      }
    },
    [plugin, workflow?.id, ctx, t, refresh, message],
  );

  const onMenuOpen = useCallback(
    (anchor: Anchor) => {
      const items = buildItems();
      ctx.viewer.drawer({
        width: '50%',
        closable: true,
        title: t('Add node'),
        content: () => <AddNodeMenu items={items} onPick={(type) => onCreate(anchor, type)} />,
      });
    },
    [buildItems, ctx, t, onCreate],
  );

  const value = useMemo<AddNodeContextValue>(() => ({ creating, onMenuOpen }), [creating, onMenuOpen]);

  return <AddNodeContext.Provider value={value}>{props.children}</AddNodeContext.Provider>;
}
