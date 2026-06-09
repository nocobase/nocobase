/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v2 workflow variable aggregator (doc §5/§6/§9.7). Same multi-scope shape as
 * v1's `useWorkflowVariableOptions` (`client/variable.tsx`): each scope
 * contributes one top-level `MetaTreeNode` and the results are concatenated and
 * filtered. The modern variable inputs (`WorkflowVariableInput` for the
 * expression field, `TypedVariableInput` for calculation operands) consume the
 * produced `MetaTreeNode[]` directly.
 *
 * Scopes, mirroring the v1 panel (局域变量 / 节点数据 / 触发器变量 / 系统变量 /
 * 变量和密钥):
 *   - `$jobsMapByNodeKey` (Node result)  — **live**: upstream node outputs, via
 *     each upstream instruction's `useVariables` + the core `VariableOption →
 *     MetaTreeNode` adapter. Round-trips to `{{$jobsMapByNodeKey.<nodeKey>.…}}`.
 *   - `$env` (Variables and secrets)     — **live**: global, registered by the
 *     environment-variables plugin via `flowEngine.context.defineProperty`,
 *     read from `getPropertyMetaTree()`. Independent of any node/trigger
 *     migration. Serialized as `{{$env.x.y}}` (no inner spaces, workflow style).
 *   - `$context` (Trigger variables)     — **stub**: lit when v2 triggers
 *     implement `useVariables`.
 *   - `$system` (System variables)       — **stub**: lit when the v2 plugin
 *     gains a `systemVariables` registry.
 *   - `$scopes` (Scope variables)        — **stub**: lit when branch nodes
 *     (loop / parallel) migrate and implement `useScopeVariables`.
 *
 * The mature legacy field-tree logic (`getCollectionFieldOptions`) is reused
 * unchanged through `useVariables`; only the final `VariableOption → MetaTreeNode`
 * adaptation is v2-specific. A node author never touches `useVariables`.
 */

import React from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useNodeContext } from './contexts';
import { useAvailableUpstreams } from './Instruction';
import { adaptVariableOptionToMetaTree } from './adaptVariableOptionToMetaTree';
import { PluginWorkflowClientV2 } from '../plugin';
import { NAMESPACE } from '../locale';

const NODE_RESULT_ROOT = '$jobsMapByNodeKey';
const ENV_ROOT = '$env';
const SYSTEM_ROOT = '$system';

export type UseWorkflowVariableOptions = {
  types?: any[];
  fieldNames?: { label?: string; value?: string; children?: string };
  appends?: string[] | null;
  depth?: number;
};

/**
 * "Node result" (`$jobsMapByNodeKey`) — upstream node outputs. Walks the current
 * node's upstream chain, calls each upstream instruction's `useVariables`, and
 * adapts the aggregated tree. Returns null when no upstream contributes.
 */
function useNodeResultScope(options: UseWorkflowVariableOptions): MetaTreeNode | null {
  const flowEngine = useFlowEngine();
  const plugin = flowEngine.context.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  const current = useNodeContext();
  const upstreams = useAvailableUpstreams(current);

  const children: MetaTreeNode[] = [];
  upstreams.forEach((node: any) => {
    const instruction = plugin?.getInstruction(node.type);
    const option = instruction?.useVariables?.(node, options);
    if (!option) {
      return;
    }
    // Each upstream node hangs under $jobsMapByNodeKey.<nodeKey>.
    children.push(adaptVariableOptionToMetaTree(option, [NODE_RESULT_ROOT]));
  });

  if (!children.length) {
    return null;
  }

  return {
    name: NODE_RESULT_ROOT,
    title: flowEngine.context.t('Node result', { ns: 'workflow' }),
    type: '',
    paths: [NODE_RESULT_ROOT],
    children,
  };
}

/**
 * "Variables and secrets" (`$env`) — global environment variables registered by
 * the environment-variables plugin. Read from the global property meta tree and
 * re-rooted so paths serialize as `{{$env.x.y}}`. Returns null when no env
 * variables are defined (the env plugin is absent / empty).
 */
function useEnvScope(): MetaTreeNode | null {
  const flowEngine = useFlowEngine();
  const tree = flowEngine.context.getPropertyMetaTree?.() ?? [];
  const env = tree.find((node) => node.name === ENV_ROOT);
  // The env plugin registers `$env` with an **async** meta factory, so its
  // `children` is a lazy `() => Promise<MetaTreeNode[]>` thunk (not an array)
  // on the synchronous tree. Return the node as-is — the downstream pickers
  // (`FlowContextSelector` / `TypedVariableInput` loadData) resolve the thunk
  // when the user expands it. (Requiring `children` to be an array here is what
  // previously dropped the whole `$env` branch.)
  return env ?? null;
}

/**
 * Trigger / Scope scope stubs. These two panels exist in v1 but their v2 data
 * sources are not built yet (v2 triggers have no `useVariables`, and branch
 * nodes that contribute `$scopes` are not migrated). Each returns null today;
 * lighting one up later is filling in the body, not restructuring the
 * aggregator. (`$system` is now live — see `useSystemScope`.)
 */
function useTriggerScope(): MetaTreeNode | null {
  // TODO: lit when v2 triggers implement `useVariables` (`$context`).
  return null;
}

function useSystemScope(): MetaTreeNode | null {
  const flowEngine = useFlowEngine();
  const plugin = flowEngine.context.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  const t = (key: string) => flowEngine.context.t(key, { ns: NAMESPACE });
  const vars = Array.from(plugin?.systemVariables?.getValues?.() ?? []);
  if (!vars.length) {
    return null;
  }
  const children: MetaTreeNode[] = vars.map((item) => ({
    name: item.key,
    // Render a `?` tooltip icon next to the label when the variable carries one
    // (Instance ID / Snowflake ID), mirroring v1's JSX system-variable labels.
    title: item.tooltip ? (
      <span>
        <span style={{ marginRight: '0.5em' }}>{t(item.label)}</span>
        <Tooltip title={t(item.tooltip)}>
          <QuestionCircleOutlined />
        </Tooltip>
      </span>
    ) : (
      t(item.label)
    ),
    type: '',
    paths: [SYSTEM_ROOT, item.key],
  }));
  return {
    name: SYSTEM_ROOT,
    title: t('System variables'),
    type: '',
    paths: [SYSTEM_ROOT],
    children,
  };
}

function useScopeVariablesScope(): MetaTreeNode | null {
  // TODO: lit when branch nodes (loop / parallel) migrate and implement
  // `useScopeVariables` (`$scopes`).
  return null;
}

/**
 * Build the workflow variable MetaTree for the current node's config form.
 * Aggregates every scope in v1's display order, dropping the ones that
 * contribute nothing.
 */
export function useWorkflowVariableOptions(options: UseWorkflowVariableOptions = {}): MetaTreeNode[] {
  const scopeVars = useScopeVariablesScope();
  const nodeResult = useNodeResultScope(options);
  const trigger = useTriggerScope();
  const system = useSystemScope();
  const env = useEnvScope();

  return [scopeVars, nodeResult, trigger, system, env].filter(Boolean) as MetaTreeNode[];
}
