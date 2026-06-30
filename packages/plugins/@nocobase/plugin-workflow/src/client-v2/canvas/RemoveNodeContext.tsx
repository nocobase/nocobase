/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Canvas remove-node flow, shared by BOTH canvases (ADR-0003, doc §9.6). A leaf
 * node deletes after the variable-reference safety check (blocked when another
 * node still references its result, else a confirm); a branching node opens a
 * "keep which branch" modal, then runs the same safety check over the kept-branch
 * + downstream subtree before deleting. Deletes via `flow_nodes.destroy` + refresh.
 *
 * This aligns the modern canvas to v1: the previous v2 implementation deleted
 * immediately and skipped the reference guard entirely. The check logic is the
 * shared pure `findNodesReferencing` / `collectBranchNodes`; the runtime-specific
 * bits (`api`, `nodes`, `refresh`, the instruction registry for branch labels)
 * are read through an injected `useCanvasRuntime` so v1 can re-import this single
 * provider and pass its own runtime (the allowed v1 → v2 direction).
 */

import React, { useCallback, useContext, useMemo, useState } from 'react';
import { App, Modal, Radio, Select, Space } from 'antd';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useFlowContext } from './contexts';
import { useT } from '../locale';
import { getWorkflowSingleton } from '../contextSingleton';
import { PluginWorkflowClientV2 } from '../plugin';
import { collectBranchNodes, findNodesReferencing } from './removeNodeUtils';

type RemoveNodeContextValue = {
  /** Request deletion of a node — runs the safety check and confirm/keep-branch
   *  flow, then deletes. Mirrors v1's `RemoveButton.onRemove`. */
  requestRemove: (node: any) => void;
};

/** Per-canvas runtime the provider needs but that differs by runtime — injected
 *  via `RemoveNodeContextProvider`'s `useCanvasRuntime` prop. */
export type CanvasRemoveRuntime = {
  api: any;
  nodes: any[] | undefined;
  refresh?: () => void;
  /** Resolve an instruction by type — for the branch-label `branching` metadata. */
  getInstruction: (type: string) => any;
};

/** Default (modern-canvas) runtime source: flow-engine `ctx.api`, the v2
 *  `FlowContext`, and the v2 instruction registry. */
function useModernCanvasRuntime(): CanvasRemoveRuntime {
  const flowEngine = useFlowEngine();
  const { nodes, refresh } = useFlowContext() ?? {};
  const plugin = flowEngine.context.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  return {
    api: flowEngine.context.api,
    nodes,
    refresh,
    getInstruction: (type: string) => plugin?.getInstruction(type),
  };
}

const RemoveNodeContext = getWorkflowSingleton('RemoveNodeContext', () =>
  React.createContext<RemoveNodeContextValue | null>(null),
);

export function useRemoveNodeContext() {
  return useContext(RemoveNodeContext);
}

export function RemoveNodeContextProvider(props: {
  children: React.ReactNode;
  /** Injected per-canvas runtime source. Defaults to the modern canvas's; the
   *  legacy canvas passes its own (v1 `FlowContext` + `usePlugin` registry). */
  useCanvasRuntime?: () => CanvasRemoveRuntime;
}) {
  const { useCanvasRuntime = useModernCanvasRuntime } = props;
  const t = useT();
  const { modal, message } = App.useApp();
  const { api, nodes, refresh, getInstruction } = useCanvasRuntime();

  const [deletingNode, setDeletingNode] = useState<any>(null);
  const [keepBranch, setKeepBranch] = useState<number | null>(null);

  const deletingBranches = useMemo(
    () => (nodes ?? []).filter((item: any) => item.upstream === deletingNode && item.branchIndex != null),
    [nodes, deletingNode],
  );

  const destroy = useCallback(
    async (nodeId: any, values?: Record<string, any>) => {
      try {
        await api.resource('flow_nodes').destroy({ filterByTk: nodeId, ...values });
        refresh?.();
      } catch (err) {
        message.error(t('Failed to delete node'));
        // eslint-disable-next-line no-console
        console.error(err);
      }
    },
    [api, refresh, message, t],
  );

  /** The "referenced by other nodes" blocker — shared with v1. `candidates` is the
   *  pool to scan and `includeScopes` widens it to `$scopes` (branching path). */
  const blockedByReferences = useCallback(
    (target: any, candidates: any[], includeScopes: boolean) => {
      const using = findNodesReferencing(candidates, target, { includeScopes });
      if (!using.length) {
        return false;
      }
      modal.error({
        title: t('Can not delete'),
        content: t(
          'The result of this node has been referenced by other nodes ({{nodes}}), please remove the usage before deleting.',
          { nodes: using.map((item) => item.title).join(', ') },
        ),
      });
      return true;
    },
    [modal, t],
  );

  const requestRemove = useCallback(
    (node: any) => {
      const branches = (nodes ?? []).filter((item: any) => item.upstream === node && item.branchIndex != null);
      if (!branches.length) {
        // Leaf delete: block when another node references this node's result, else confirm and delete (mirrors v1's
        // `RemoveButton.onRemove`).
        if (blockedByReferences(node, nodes ?? [], false)) {
          return;
        }
        modal.confirm({
          title: t('Delete'),
          content: t('Are you sure you want to delete it?'),
          onOk: () => destroy(node.id),
        });
        return;
      }
      // Branching delete: open the keep-branch modal; the actual check + delete happen on confirm (over the kept-branch
      // + downstream subtree).
      setKeepBranch(null);
      setDeletingNode(node);
    },
    [nodes, modal, t, destroy, blockedByReferences],
  );

  const branchOptions = useMemo(() => {
    if (!deletingNode) {
      return [];
    }
    const instruction = getInstruction(deletingNode.type);
    const branching =
      typeof instruction?.branching === 'function'
        ? instruction.branching(deletingNode.config ?? {})
        : instruction?.branching;
    return deletingBranches.map((item: any, index: number) => {
      const option = Array.isArray(branching) ? branching.find((b: any) => b.value === item.branchIndex) ?? {} : {};
      return {
        label: option.label ? t(option.label) : t('Branch {{index}}', { index: index + 1 }),
        value: item.branchIndex,
      };
    });
  }, [deletingNode, deletingBranches, getInstruction, t]);

  const onConfirmKeepBranch = useCallback(async () => {
    if (!deletingNode) {
      return;
    }
    // Same reference guard as v1's `useRemoveNodeSubmitAction`, over the kept branch + downstream subtree, including
    // `$scopes` references.
    const branchHead =
      keepBranch != null ? deletingBranches.find((item: any) => item.branchIndex === keepBranch) : null;
    const relatedNodes = collectBranchNodes(nodes ?? [], branchHead);
    const downstreamNodes = collectBranchNodes(nodes ?? [], deletingNode.downstream);
    for (const [key, node] of downstreamNodes) {
      relatedNodes.set(key, node);
    }
    if (blockedByReferences(deletingNode, [...relatedNodes.values()], true)) {
      return;
    }
    const values = keepBranch != null ? { keepBranch } : {};
    await destroy(deletingNode.id, values);
    setDeletingNode(null);
  }, [deletingNode, keepBranch, deletingBranches, nodes, destroy, blockedByReferences]);

  const value = useMemo<RemoveNodeContextValue>(() => ({ requestRemove }), [requestRemove]);

  return (
    <RemoveNodeContext.Provider value={value}>
      {props.children}
      <Modal
        title={t('Delete node')}
        open={Boolean(deletingBranches.length)}
        onCancel={() => setDeletingNode(null)}
        onOk={onConfirmKeepBranch}
        okButtonProps={{ danger: true }}
        okText={t('Delete')}
      >
        <Radio.Group
          value={keepBranch != null ? 1 : 0}
          onChange={(e) => setKeepBranch(e.target.value === 0 ? null : deletingBranches[0]?.branchIndex ?? null)}
        >
          <Space direction="vertical">
            <Radio value={0}>{t('Delete all')}</Radio>
            <Space>
              <Radio value={1}>{t('Keep')}</Radio>
              <Select
                options={branchOptions}
                value={keepBranch ?? undefined}
                onChange={(v) => setKeepBranch(v)}
                disabled={keepBranch == null}
                style={{ minWidth: 160 }}
              />
            </Space>
          </Space>
        </Radio.Group>
      </Modal>
    </RemoveNodeContext.Provider>
  );
}
