/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Modern canvas remove-node flow (doc §9.6), a native-antd rewrite of v1's
 * Formily `RemoveNodeContext`. A leaf node deletes after a confirm; a branching
 * node (one with child branches) opens a "keep which branch" modal before
 * deleting. Deletes via `flow_nodes.destroy` and refreshes.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { App, Modal, Radio, Select, Space } from 'antd';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useFlowContext } from './contexts';
import { useT } from '../locale';
import { PluginWorkflowClientV2 } from '../plugin';

type RemoveNodeContextValue = {
  requestRemove: (node: any) => void;
};

const RemoveNodeContext = createContext<RemoveNodeContextValue | null>(null);

export function useRemoveNodeContext() {
  return useContext(RemoveNodeContext);
}

export function RemoveNodeContextProvider(props: { children: React.ReactNode }) {
  const flowEngine = useFlowEngine();
  const t = useT();
  const { modal, message } = App.useApp();
  const plugin = flowEngine.context.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  const { nodes, refresh } = useFlowContext() ?? {};

  const [deletingNode, setDeletingNode] = useState<any>(null);
  const [keepBranch, setKeepBranch] = useState<number | null>(null);

  const deletingBranches = useMemo(
    () => (nodes ?? []).filter((item: any) => item.upstream === deletingNode && item.branchIndex != null),
    [nodes, deletingNode],
  );

  const destroy = useCallback(
    async (nodeId: any, values?: Record<string, any>) => {
      try {
        await flowEngine.context.api.resource('flow_nodes').destroy({ filterByTk: nodeId, ...values });
        refresh?.();
      } catch (err) {
        message.error(t('Failed to delete node'));
        // eslint-disable-next-line no-console
        console.error(err);
      }
    },
    [flowEngine, refresh, message, t],
  );

  const requestRemove = useCallback(
    (node: any) => {
      const branches = (nodes ?? []).filter((item: any) => item.upstream === node && item.branchIndex != null);
      if (!branches.length) {
        modal.confirm({
          title: t('Delete'),
          content: t('Are you sure you want to delete it?'),
          onOk: () => destroy(node.id),
        });
        return;
      }
      setKeepBranch(null);
      setDeletingNode(node);
    },
    [nodes, modal, t, destroy],
  );

  const branchOptions = useMemo(() => {
    if (!deletingNode) {
      return [];
    }
    const instruction = plugin?.getInstruction(deletingNode.type);
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
  }, [deletingNode, deletingBranches, plugin, t]);

  const onConfirmKeepBranch = useCallback(async () => {
    if (!deletingNode) {
      return;
    }
    const values = keepBranch != null ? { keepBranch } : {};
    await destroy(deletingNode.id, values);
    setDeletingNode(null);
  }, [deletingNode, keepBranch, destroy]);

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
