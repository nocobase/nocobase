/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v2 variable aggregator (doc §5/§6/§9.7). Walks the current node's upstream
 * chain, calls each upstream instruction's `useVariables` (which still returns
 * the legacy `VariableOption`), and converts the aggregated tree to
 * `MetaTreeNode[]` with the core one-way adapter — the shape `VariableHybridInput`
 * consumes.
 *
 * The mature legacy field-tree logic (`getCollectionFieldOptions`) is reused
 * unchanged through `useVariables`; only the final `VariableOption → MetaTreeNode`
 * adaptation is v2-specific. A node author never touches `useVariables`.
 *
 * Mounting: node outputs hang under `$jobsMapByNodeKey.<nodeKey>` (the same root
 * the workflow server template uses), so the produced `paths` round-trip to
 * `{{$jobsMapByNodeKey.<nodeKey>.<field>}}` values.
 */

import type { MetaTreeNode } from '@nocobase/flow-engine';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useNodeContext, useFlowContext } from './contexts';
import { useAvailableUpstreams } from './Instruction';
import { adaptVariableOptionToMetaTree } from './adaptVariableOptionToMetaTree';
import { PluginWorkflowClientV2 } from '../plugin';

const NODE_RESULT_ROOT = '$jobsMapByNodeKey';

export type UseWorkflowVariableOptions = {
  types?: any[];
  fieldNames?: { label?: string; value?: string; children?: string };
  appends?: string[] | null;
  depth?: number;
};

/**
 * Build the workflow variable MetaTree for the current node's config form.
 * For now this covers the "Node result" branch (upstream node outputs); trigger
 * / scope / system / `$env` branches are added as those surfaces migrate.
 */
export function useWorkflowVariableOptions(options: UseWorkflowVariableOptions = {}): MetaTreeNode[] {
  const flowEngine = useFlowEngine();
  const plugin = flowEngine.context.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  const current = useNodeContext();
  const { workflow } = useFlowContext() ?? {};
  const upstreams = useAvailableUpstreams(current);

  const nodeResultChildren: MetaTreeNode[] = [];
  upstreams.forEach((node: any) => {
    const instruction = plugin?.getInstruction(node.type);
    const option = instruction?.useVariables?.(node, options);
    if (!option) {
      return;
    }
    // Each upstream node hangs under $jobsMapByNodeKey.<nodeKey>.
    nodeResultChildren.push(adaptVariableOptionToMetaTree(option, [NODE_RESULT_ROOT]));
  });

  if (!nodeResultChildren.length) {
    return [];
  }

  const nodeResult: MetaTreeNode = {
    name: NODE_RESULT_ROOT,
    title: flowEngine.context.t('Node result', { ns: 'workflow' }),
    type: '',
    paths: [NODE_RESULT_ROOT],
    children: nodeResultChildren,
  };

  // The current node id is referenced to keep the hook reactive to selection.
  void workflow;
  return [nodeResult];
}
