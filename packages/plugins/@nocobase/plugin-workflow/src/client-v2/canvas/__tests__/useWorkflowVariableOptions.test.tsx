/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Proves the variable aggregator is **runtime-neutral** (ADR-0003 layer 1): it
 * resolves the workflow plugin via the neutral `'workflow'` alias and reads the
 * `instructions` / `systemVariables` registries that BOTH the v1
 * (`PluginWorkflowClient`) and v2 (`PluginWorkflowClientV2`) plugins expose — so
 * the same hook feeds the variable tree when the v1 canvas back-imports it.
 *
 * The hook previously hard-coded `pm.get(PluginWorkflowClientV2)`, which is
 * `undefined` in the v1 runtime → empty tree. These tests feed a v1-SHAPED plugin
 * (including a v1-style system variable whose label is already-rendered JSX, not a
 * `{{t}}` template) and assert the `$jobsMapByNodeKey` + `$system` scopes are
 * produced.
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Controlled doubles, hoisted so the vi.mock factories can close over them.
const holder = vi.hoisted(() => ({
  engine: null as any,
  currentNode: null as any,
  workflow: null as any,
}));

// The aggregator reads the engine via `useFlowEngine()`; everything it needs (`context.app.pm.get`, `context.t`,
// `context.getPropertyMetaTree`, `context.app.getGlobalVar`) hangs off the engine we inject here. Keep the rest of
// flow-engine real (MetaTreeNode etc).
vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useFlowEngine: () => holder.engine };
});

// `useNodeContext()` returns the current node (with a live `upstream` chain); `useCurrentWorkflowContext()` returns the
// workflow threaded into the drawer. `useAvailableUpstreams` / `useUpstreamScopes` are the real pure traversals.
vi.mock('../contexts', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useNodeContext: () => holder.currentNode,
    useCurrentWorkflowContext: () => holder.workflow,
  };
});

import { useWorkflowVariableOptions } from '../useWorkflowVariableOptions';

/**
 * Build a v1-shaped plugin: `instructions` + `systemVariables` + `triggers`
 * Registry-likes. `triggers.get(type)` returns a trigger with a `useVariables`
 * (v1 shape — v2 triggers have none).
 */
function makeV1ShapedPlugin() {
  const instructions = new Map<string, any>();
  // An upstream "calculation" node that contributes a single result variable — its `useVariables` returns the legacy
  // `VariableOption` shape the adapter eats.
  instructions.set('calculation', {
    useVariables: (node: any) => ({
      value: node.key,
      label: node.title,
      children: [{ value: 'result', label: 'Result' }],
    }),
  });

  // v1-style system variables: `now` is a plain string label; `instanceId` carries an already-rendered JSX label (with
  // tooltip inlined) — NOT a `{{t}}` template.
  const systemVariables = [
    { key: 'now', label: 'System time', value: 'now' },
    { key: 'instanceId', label: <span data-testid="v1-jsx-label">Instance ID</span>, value: 'instanceId' },
  ];

  // A v1-style trigger: `useVariables(config, options)` returns a VariableOption[] (the trigger's `data` output tree).
  const triggers = new Map<string, any>();
  triggers.set('collection', {
    useVariables: () => [{ value: 'data', label: 'Trigger data', children: [{ value: 'title', label: 'Title' }] }],
  });

  return {
    instructions: { get: (type: string) => instructions.get(type) },
    systemVariables: { getValues: () => systemVariables },
    triggers: { get: (type: string) => triggers.get(type) },
  };
}

function setupEngine(plugin: any, { propertyTree = [] as any[] } = {}) {
  holder.engine = {
    context: {
      t: (key: string) => key,
      getPropertyMetaTree: () => propertyTree,
      app: {
        pm: { get: (name: string) => (name === 'workflow' ? plugin : undefined) },
      },
    },
  };
}

describe('useWorkflowVariableOptions — runtime-neutral resolution', () => {
  beforeEach(() => {
    holder.workflow = null;
  });

  it('resolves the workflow plugin via the neutral "workflow" alias and reads its registries', () => {
    setupEngine(makeV1ShapedPlugin());
    holder.currentNode = {
      key: 'n2',
      type: 'condition',
      upstream: { key: 'n1', type: 'calculation', title: 'Calc 1', upstream: null },
    };

    const { result } = renderHook(() => useWorkflowVariableOptions());
    const roots = result.current.map((node) => node.name);

    // Node-result scope: upstream calculation node hangs under $jobsMapByNodeKey.
    expect(roots).toContain('$jobsMapByNodeKey');
    const nodeResult = result.current.find((n) => n.name === '$jobsMapByNodeKey');
    expect(nodeResult?.children?.map((c: any) => c.name)).toContain('n1');

    // System scope: from the v1-shaped systemVariables registry.
    expect(roots).toContain('$system');
    const system = result.current.find((n) => n.name === '$system');
    expect(system?.children?.map((c: any) => c.name)).toEqual(['now', 'instanceId']);
  });

  it('lights up the trigger scope ($context) from the workflow trigger useVariables', () => {
    setupEngine(makeV1ShapedPlugin());
    holder.currentNode = { key: 'n1', type: 'condition', upstream: null };
    // Workflow threaded into the drawer via CurrentWorkflowContext.
    holder.workflow = { id: 7, type: 'collection', config: { collection: 'posts' } };

    const { result } = renderHook(() => useWorkflowVariableOptions());
    const trigger = result.current.find((n) => n.name === '$context');
    expect(trigger).toBeTruthy();
    // The trigger's `data` output sits under $context, its fields beneath.
    expect(trigger?.children?.map((c: any) => c.name)).toContain('data');
  });

  it('omits the trigger scope when no workflow is in context (drawer without workflow)', () => {
    setupEngine(makeV1ShapedPlugin());
    holder.currentNode = { key: 'n1', type: 'condition', upstream: null };
    holder.workflow = null;

    const { result } = renderHook(() => useWorkflowVariableOptions());
    expect(result.current.find((n) => n.name === '$context')).toBeUndefined();
  });

  it('exposes $env from the flow-engine property tree (registered in both runtimes)', () => {
    // The env plugin registers `$env` on `flowEngine.context` in BOTH runtimes (v1 via the shared
    // `registerEnvProperty`, v2 in its own plugin) — a lazy `children` thunk that resolves once and is cached. The
    // aggregator returns that node as-is, so it works from the detached config drawer.
    const envChildren = async () => [];
    setupEngine(makeV1ShapedPlugin(), {
      propertyTree: [{ name: '$env', type: 'object', children: envChildren }],
    });
    holder.currentNode = { key: 'n1', type: 'condition', upstream: null };

    const { result } = renderHook(() => useWorkflowVariableOptions());
    const env = result.current.find((n) => n.name === '$env');
    // Returned verbatim (lazy children preserved for on-expand resolution).
    expect(env?.children).toBe(envChildren);
  });

  it('omits $env when it is absent from the property tree (env plugin not loaded)', () => {
    setupEngine(makeV1ShapedPlugin(), { propertyTree: [] });
    holder.currentNode = { key: 'n1', type: 'condition', upstream: null };

    const { result } = renderHook(() => useWorkflowVariableOptions());
    expect(result.current.find((n) => n.name === '$env')).toBeUndefined();
  });

  it('returns a referentially stable tree across re-renders for the same inputs', () => {
    setupEngine(makeV1ShapedPlugin());
    holder.currentNode = {
      key: 'n2',
      type: 'condition',
      upstream: { key: 'n1', type: 'calculation', title: 'Calc 1', upstream: null },
    };

    const { result, rerender } = renderHook(() => useWorkflowVariableOptions());
    const first = result.current;
    rerender();
    // Same tree object — load-bearing so lazily-resolved relation children (mutated onto the meta nodes by the picker)
    // survive a re-render instead of being discarded (the infinite-spinner bug).
    expect(result.current).toBe(first);
  });

  it('returns an empty tree when no workflow plugin is registered (no crash)', () => {
    // The pre-fix failure mode: `pm.get` returns undefined in the "wrong" runtime.
    setupEngine(undefined);
    holder.currentNode = { key: 'n1', type: 'condition', upstream: null };

    const { result } = renderHook(() => useWorkflowVariableOptions());
    // No upstreams, no system vars, no env → empty (not a throw).
    expect(result.current).toEqual([]);
  });

  it('coerces a v1 JSX system-variable label to plain-text title (MetaTreeNode.title is a string)', () => {
    setupEngine(makeV1ShapedPlugin());
    holder.currentNode = { key: 'n1', type: 'condition', upstream: null };

    const { result } = renderHook(() => useWorkflowVariableOptions());
    const system = result.current.find((n) => n.name === '$system');
    const instanceId = system?.children?.find((c: any) => c.name === 'instanceId');
    // `MetaTreeNode.title` is a string, so the v1 `<span>Instance ID</span>` label is reduced to its text ("Instance
    // ID"), not kept as a React element.
    expect(typeof instanceId?.title).toBe('string');
    expect(instanceId?.title).toBe('Instance ID');
    // A plain-string v2-style label is translated through `t` (identity in tests).
    const now = system?.children?.find((c: any) => c.name === 'now');
    expect(now?.title).toBe('System time');
  });
});
