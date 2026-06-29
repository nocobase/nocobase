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
 *   - `$context` (Trigger variables)     — trigger outputs from
 *     `useVariables`, plus the legacy workflow-title context path used by
 *     saved trigger task titles.
 *   - `$system` (System variables)       — **stub**: lit when the v2 plugin
 *     gains a `systemVariables` registry.
 *   - `$scopes` (Scope variables)        — **stub**: lit when branch nodes
 *     (loop / parallel) migrate and implement `useScopeVariables`.
 *
 * The mature legacy field-tree logic (`getCollectionFieldOptions`) is reused
 * unchanged through `useVariables`; only the final `VariableOption → MetaTreeNode`
 * adaptation is v2-specific. A node author never touches `useVariables`.
 */

import React, { useMemo } from 'react';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useCurrentWorkflowContext, useNodeContext, useWorkflowVariableSourceContext } from './contexts';
import { useAvailableUpstreams, useUpstreamScopes, type Instruction } from './Instruction';
import { adaptVariableOptionToMetaTree, adaptVariableOptionsToMetaTree } from './adaptVariableOptionToMetaTree';
import { NAMESPACE } from '../locale';

const NODE_RESULT_ROOT = '$jobsMapByNodeKey';
const ENV_ROOT = '$env';
const SYSTEM_ROOT = '$system';
const TRIGGER_ROOT = '$context';
const SCOPES_ROOT = '$scopes';
const LEGACY_FLOW_CONTEXT_ROOT = 'useFlowContext()';

/**
 * A system variable as held by either runtime's `systemVariables` registry.
 * v2 stores `{ key, label(string template) }`; v1 stores
 * `{ key, label(string OR already-rendered JSX), value }` (the JSX bakes in a
 * tooltip icon). `useSystemScope` reduces either to a plain string title and stores
 * optional tooltip text under the existing `MetaTreeNode.options` bag.
 */
type SystemVariableLike = { key: string; label: React.ReactNode; tooltip?: React.ReactNode };

/**
 * Coerce a React node to plain text for use as a `MetaTreeNode.title` (which is a
 * string). v1 system-variable labels are JSX (`<span>Instance ID</span><Tooltip/>`);
 * recursively collect their text so the picker shows "Instance ID" rather than
 * `[object Object]`. Strings/numbers pass through; non-text nodes (the tooltip
 * icon) contribute nothing.
 */
function reactNodeToPlainText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(reactNodeToPlainText).join('');
  }
  if (React.isValidElement(node)) {
    return reactNodeToPlainText((node.props as { children?: React.ReactNode })?.children);
  }
  return '';
}

function extractTooltipFromReactNode(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') {
    return '';
  }
  if (Array.isArray(node)) {
    return node.map(extractTooltipFromReactNode).find(Boolean) ?? '';
  }
  if (!React.isValidElement(node)) {
    return '';
  }

  const props = node.props as { children?: React.ReactNode; title?: React.ReactNode };
  if (props.title != null && typeof node.type !== 'string') {
    return reactNodeToPlainText(props.title);
  }

  return extractTooltipFromReactNode(props.children);
}

/**
 * A trigger as held by either runtime's `triggers` registry. v1 stores a
 * `Trigger` instance carrying a `useVariables(config, options)` hook; v2 stores
 * a plain options object with no `useVariables` (so only the workflow-title
 * fallback is available until the trigger variable migration reaches v2).
 */
type TriggerLike = { useVariables?(config: any, options?: any): any[] | null | undefined };

/**
 * The minimal slice of the workflow client plugin that this aggregator needs —
 * the registries shared by BOTH runtimes (v1 `PluginWorkflowClient` and v2
 * `PluginWorkflowClientV2`). Resolved at runtime via the neutral `'workflow'`
 * package alias (`pm.get('workflow')`), so the same hook feeds the variable tree
 * in either client. Kept structural (not a concrete plugin class) so client-v2
 * never imports from the v1 client and the back-imported v1 canvas stays
 * runtime-agnostic.
 */
type WorkflowVariablePlugin = {
  instructions: { get(type: string): Instruction | undefined };
  systemVariables: { getValues(): Iterable<SystemVariableLike> };
  triggers: { get(type: string): TriggerLike | undefined };
};

/** Resolve the current runtime's workflow client plugin via the neutral
 *  `'workflow'` alias — v1's `PluginWorkflowClient` or v2's
 *  `PluginWorkflowClientV2`, whichever this runtime loaded. */
function useWorkflowPlugin(): WorkflowVariablePlugin | undefined {
  const flowEngine = useFlowEngine();
  return flowEngine.context.app.pm.get('workflow') as WorkflowVariablePlugin | undefined;
}

function prefixMetaTreeNodePaths(node: MetaTreeNode, prefix: string[]): MetaTreeNode {
  const { children } = node;
  const nextNode: MetaTreeNode = {
    ...node,
    paths: [...prefix, ...(node.paths ?? [String(node.name ?? '')])],
  };

  if (Array.isArray(children)) {
    nextNode.children = children.map((child) => prefixMetaTreeNodePaths(child, prefix));
  } else if (typeof children === 'function') {
    nextNode.children = async () => {
      const loaded = await children();
      return loaded.map((child) => prefixMetaTreeNodePaths(child, prefix));
    };
  }

  return nextNode;
}

function isMetaTreeNodeArray(value: unknown): value is MetaTreeNode[] {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && 'paths' in item);
}

function createDisabledWorkflowRoot(name: string, title: string): MetaTreeNode {
  return {
    name,
    title,
    type: '',
    paths: [name],
    disabled: true,
  };
}

export type UseWorkflowVariableOptions = {
  types?: any[];
  fieldNames?: { label?: string; value?: string; children?: string };
  appends?: string[] | null;
  depth?: number;
  /**
   * Include the `$scopes` root. Scope providers (loop / parallel) building
   * their own local variables must disable this when they call back into the
   * workflow aggregator, otherwise the scope chain recursively nests itself.
   */
  includeScopes?: boolean;
};

/**
 * "Node result" (`$jobsMapByNodeKey`) — upstream node outputs. Walks the current
 * node's upstream chain, calls each upstream instruction's `useVariables`, and
 * adapts the aggregated tree. Returns null when no upstream contributes.
 */
function useNodeResultScope(options: UseWorkflowVariableOptions): MetaTreeNode | null {
  const flowEngine = useFlowEngine();
  const plugin = useWorkflowPlugin();
  const current = useNodeContext();
  const upstreams = useAvailableUpstreams(current);

  const children: MetaTreeNode[] = [];
  upstreams.forEach((node: any) => {
    const instruction = plugin?.instructions?.get(node.type);
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
  // The environment-variables plugin registers `$env` on the flow-engine context (`defineProperty('$env', …)`) in BOTH
  // runtimes — v2 in `client-v2/plugin.tsx`, v1 in `client/index.tsx` via the shared `registerEnvProperty` (so it
  // resolves from the config drawer, which mounts detached from v1's React tree). It shows up in the property meta tree
  // with an **async** `children` thunk; return that node as-is — the downstream pickers resolve the thunk on expand
  // (the result is cached by the flow-engine context, so it is fetched only once). Returns null when the env plugin is
  // absent.
  const tree = flowEngine.context.getPropertyMetaTree?.() ?? [];
  const env = tree.find((node) => node.name === ENV_ROOT);
  return env ?? null;
}

function createLegacyWorkflowTitleNode(t: (key: string) => string): MetaTreeNode {
  return {
    name: 'workflow',
    title: t('Workflow'),
    type: '',
    paths: [LEGACY_FLOW_CONTEXT_ROOT, 'workflow'],
    children: [
      {
        name: 'title',
        title: t('Workflow title'),
        type: 'string',
        paths: [LEGACY_FLOW_CONTEXT_ROOT, 'workflow', 'title'],
      },
    ],
  };
}

function appendLegacyWorkflowTitleNode(children: MetaTreeNode[], t: (key: string) => string): MetaTreeNode[] {
  const workflowNode = children.find((node) => node.name === 'workflow');
  if (!workflowNode) {
    return [...children, createLegacyWorkflowTitleNode(t)];
  }
  const workflowChildren = workflowNode.children;
  const legacyWorkflowTitleChildren = createLegacyWorkflowTitleNode(t).children;
  if (!Array.isArray(workflowChildren) || !Array.isArray(legacyWorkflowTitleChildren)) {
    return children;
  }
  const hasTitle = workflowChildren.some((node) => node.name === 'title');
  if (hasTitle) {
    return children;
  }
  return children.map((node) =>
    node === workflowNode
      ? {
          ...node,
          children: [...workflowChildren, ...legacyWorkflowTitleChildren],
        }
      : node,
  );
}

/**
 * "Trigger variables" (`$context`) — the workflow trigger's output. Resolves the
 * current workflow (threaded into the config drawer via `CurrentWorkflowContext`,
 * since the drawer renders at the React root, outside the canvas `FlowContext`),
 * looks up its trigger, and calls the trigger's `useVariables(config, options)`.
 * Also exposes the legacy `useFlowContext().workflow.title` path so saved
 * trigger task titles render as a readable token instead of raw `{{...}}`.
 *
 * Runtime-neutral, mirroring `useNodeResultScope`: a v1 trigger
 * (`PluginWorkflowClient.triggers`) implements `useVariables` so the scope lights
 * up; a v2 trigger may have no `useVariables`, but still gets the workflow-title
 * fallback while a workflow is in context. Returns null when no workflow is in
 * context.
 */
function useTriggerScope(options: UseWorkflowVariableOptions): MetaTreeNode | null {
  const flowEngine = useFlowEngine();
  const plugin = useWorkflowPlugin();
  const variableSourceWorkflow = useWorkflowVariableSourceContext();
  const currentWorkflow = useCurrentWorkflowContext();
  const workflow = variableSourceWorkflow ?? currentWorkflow;
  const t = (key: string) => flowEngine.context.t(key, { ns: NAMESPACE });
  if (!workflow) {
    return null;
  }
  const trigger = workflow?.type ? plugin?.triggers?.get(workflow.type) : undefined;
  const subOptions = trigger?.useVariables?.(workflow?.config, options);
  const list = Array.isArray(subOptions) ? subOptions.filter(Boolean) : [];
  const children = appendLegacyWorkflowTitleNode(adaptVariableOptionsToMetaTree(list, [TRIGGER_ROOT]), t);
  return {
    name: TRIGGER_ROOT,
    title: t('Trigger variables'),
    type: '',
    paths: [TRIGGER_ROOT],
    children,
  };
}

function useSystemScope(): MetaTreeNode | null {
  const flowEngine = useFlowEngine();
  const plugin = useWorkflowPlugin();
  const t = (key: string) => flowEngine.context.t(key, { ns: NAMESPACE });
  const vars: SystemVariableLike[] = plugin ? Array.from(plugin.systemVariables.getValues()) : [];
  if (!vars.length) {
    return null;
  }
  const children: MetaTreeNode[] = vars.map((item) => {
    // `MetaTreeNode.title` is a plain string (the cascader label). v2 labels are `{{t("…")}}` templates → translate
    // them; v1 labels may be already-rendered JSX — coerce to a plain string for the title (the picker renders
    // strings).
    const label = typeof item.label === 'string' ? t(item.label) : reactNodeToPlainText(item.label);
    const rawTooltip = item.tooltip ?? extractTooltipFromReactNode(item.label);
    const tooltip =
      typeof rawTooltip === 'string' || typeof rawTooltip === 'number'
        ? t(String(rawTooltip))
        : reactNodeToPlainText(rawTooltip);
    return {
      name: item.key,
      title: label,
      type: '',
      paths: [SYSTEM_ROOT, item.key],
      ...(tooltip ? { options: { tooltip } } : {}),
    };
  });
  return {
    name: SYSTEM_ROOT,
    title: t('System variables'),
    type: '',
    paths: [SYSTEM_ROOT],
    children,
  };
}

/**
 * "Scope variables" (`$scopes`) — variables contributed by the branch nodes the
 * current node is nested inside (loop / parallel). Walks the upstream branching
 * scopes (`useUpstreamScopes`) and calls each scope node's `useScopeVariables`.
 * Mirrors v1's `scopeOptions` (`client/variable.tsx`): one child per scope node,
 * whose own children are that node's scope variables.
 *
 * No node implements `useScopeVariables` yet (v1 or v2), so this is wiring-only
 * today — it produces nothing until a branch node (loop / parallel) is migrated
 * and implements it. Returns null when no scope contributes.
 */
function useScopeVariablesScope(options: UseWorkflowVariableOptions): MetaTreeNode | null {
  const flowEngine = useFlowEngine();
  const plugin = useWorkflowPlugin();
  const current = useNodeContext();
  const scopes = useUpstreamScopes(current);

  if (options.includeScopes === false) {
    return null;
  }

  const children: MetaTreeNode[] = [];
  scopes.forEach((node: any) => {
    const instruction = plugin?.instructions?.get(node.type);
    const subOptions = instruction?.useScopeVariables?.(node, { ...options, includeScopes: false });
    if (!subOptions) {
      return;
    }
    if (isMetaTreeNodeArray(subOptions)) {
      children.push({
        name: node.key,
        title: node.title ?? `#${node.id}`,
        type: '',
        paths: [SCOPES_ROOT, node.key],
        children: subOptions.map((item) => prefixMetaTreeNodePaths(item, [SCOPES_ROOT, node.key])),
      });
      return;
    }
    // Each scope node hangs under $scopes.<nodeKey>, its variables beneath it.
    children.push(
      adaptVariableOptionToMetaTree(
        {
          key: node.key,
          value: node.key,
          label: node.title ?? `#${node.id}`,
          children: subOptions,
        },
        [SCOPES_ROOT],
      ),
    );
  });

  if (!children.length) {
    return null;
  }
  return {
    name: SCOPES_ROOT,
    title: flowEngine.context.t('Scope variables', { ns: NAMESPACE }),
    type: '',
    paths: [SCOPES_ROOT],
    children,
  };
}

/**
 * Build the workflow variable MetaTree for the current node's config form.
 * Aggregates every scope in v1's display order, dropping the ones that
 * contribute nothing.
 *
 * The result is **referentially stable** across re-renders for the same inputs
 * (memoized on the current node + upstream/scope node keys + workflow id). This
 * is load-bearing for lazy relation expansion: `TypedVariableInput.loadData`
 * resolves a node's children and mutates them onto the meta node in place, then
 * forces a re-render — if this hook returned a brand-new tree each render, that
 * mutated (resolved) child list would be discarded and the cascader column would
 * spin forever. Memoizing keeps the same tree objects alive so the resolved
 * children survive the re-render.
 */
export function useWorkflowVariableOptions(options: UseWorkflowVariableOptions = {}): MetaTreeNode[] {
  const flowEngine = useFlowEngine();
  const scopeVars = useScopeVariablesScope(options);
  const nodeResult = useNodeResultScope(options);
  const trigger = useTriggerScope(options);
  const system = useSystemScope();
  const env = useEnvScope();

  const current = useNodeContext();
  const variableSourceWorkflow = useWorkflowVariableSourceContext();
  const currentWorkflow = useCurrentWorkflowContext();
  const workflow = variableSourceWorkflow ?? currentWorkflow;
  // A signature that changes only when the variable tree's *structure* could change — the current node, its upstream
  // chain (node-result), its branching scopes, and the workflow (trigger). Lazy children resolved into the tree by the
  // picker are NOT part of this key, so they persist until the structure itself changes.
  const upstreamKeys = useAvailableUpstreams(current)
    .map((n: any) => n.key)
    .join(',');
  const scopeKeys = useUpstreamScopes(current)
    .map((n: any) => n.key)
    .join(',');
  const signature = `${current?.key ?? ''}|${upstreamKeys}|${options.includeScopes === false ? '' : scopeKeys}|${
    workflow?.id ?? ''
  }|${workflow?.type ?? ''}|${options.includeScopes === false ? 'no-scopes' : 'with-scopes'}`;

  return useMemo(() => {
    const roots: Array<MetaTreeNode | null> = [
      options.includeScopes === false
        ? null
        : scopeVars ??
          createDisabledWorkflowRoot(SCOPES_ROOT, flowEngine.context.t('Scope variables', { ns: NAMESPACE })),
      nodeResult ??
        createDisabledWorkflowRoot(NODE_RESULT_ROOT, flowEngine.context.t('Node result', { ns: 'workflow' })),
      trigger,
      system,
      env,
    ];

    return roots.filter(Boolean) as MetaTreeNode[];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on the structural `signature`; including fresh scope objects would defeat the memo and reintroduce the lazy-load spinner bug.
  }, [signature]);
}
