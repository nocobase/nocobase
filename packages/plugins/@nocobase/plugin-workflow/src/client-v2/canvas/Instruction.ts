/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The `Instruction` base class — the workflow node extension contract — and its
 * pure logic hooks, relocated to client-v2 so a single definition serves both
 * canvases (ADR-0002 as amended by ADR-0003, doc §2).
 *
 * Only the data/type parts move here. The legacy Formily *rendering*
 * (`Node`, `NodeDefaultView`, the `SchemaComponent` config drawer) stays in
 * `src/client/nodes/index.tsx`. v1 re-exports this class + the pure hooks from
 * here via the allowed `v1 → v2` import direction, so the ~16 node files that
 * `extends Instruction` from the `./nodes` barrel are unchanged.
 *
 * Iron-rule notes:
 *  - `ISchema` is a **type-only** import from `@formily/react` (erased at build,
 *    zero runtime — explicitly allowed; see the migration skill).
 *  - `SchemaInitializerItemType` (the legacy `useInitializers` return type) is
 *    NOT imported from `@nocobase/client` (forbidden). It is typed structurally
 *    as `unknown` here — the modern canvas never calls `useInitializers` (it
 *    uses `getCreateModelMenuItem`), and v1 callers cast as needed.
 */

import type { ComponentType } from 'react';
import type { ISchema } from '@formily/react';
import type { SubModelItem } from '@nocobase/flow-engine';
import type { UseVariableOptions, VariableOption } from './collectionFieldOptions';

/** `() => Promise<{ default: Component }>` loader, matching the trigger `*Loader` convention (doc §9.5). */
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;

export type NodeAvailableContext = {
  /** The workflow client plugin instance (v1 `WorkflowPlugin` / v2 `PluginWorkflowClientV2`). */
  engine: any;
  workflow: object;
  upstream: object;
  branchIndex: number;
  syncOnly?: boolean;
};

type Config = Record<string, any>;

type Options = { label: string; value: any }[];

export type TempAssociationSource = {
  collection: string;
  nodeId: string | number;
  nodeKey: string;
  nodeType: 'workflow' | 'node';
};

export abstract class Instruction {
  title: string;
  type: string;
  group: string;
  description?: string;
  icon?: JSX.Element;
  async?: boolean;
  /**
   * @deprecated migrate to `presetFieldset` instead
   */
  options?: { label: string; value: any; key: string }[];

  // —— legacy config UI (Formily; pass-through data the modern canvas never
  //    interprets — only the legacy canvas renders it) ——
  fieldset: Record<string, ISchema>;
  /**
   * @experimental
   */
  presetFieldset?: Record<string, ISchema>;
  /**
   * @experimental
   */
  view?: ISchema;
  scope?: Record<string, any>;
  components?: Record<string, any>;
  /** Legacy in-canvas node render (Formily canvas). */
  Component?(props): JSX.Element;

  // —— modern canvas extension points (loaders; doc §9.5) ——
  /** Modern in-canvas node render (branch nodes self-render nested `<Branch>`).
   *  Absent → the modern canvas uses its default card. */
  ComponentLoader?: LoaderOf<{ data: any }>;
  /** Modern config-drawer form. Absent → the drawer shows a "not yet migrated"
   *  placeholder (never a Formily fallback). */
  FieldsetLoader?: LoaderOf;
  /** Modern add-time preset form (v1 `presetFieldset`). */
  PresetFieldsetLoader?: LoaderOf;

  /**
   * To presentation if the instruction is creating a branch
   * @experimental
   */
  branching?: boolean | Options | ((config: Config) => boolean | Options);

  /**
   * @experimental
   */
  createDefaultConfig?(): Config {
    return {};
  }
  useVariables?(node, options?: UseVariableOptions): VariableOption;
  useScopeVariables?(node, options?): VariableOption[];
  /** Legacy block initializer (v1 Schema Initializer). Return type is the
   *  legacy `SchemaInitializerItemType`, kept structural to avoid importing
   *  `@nocobase/client` into client-v2; v1 callers cast as needed. */
  useInitializers?(node): unknown | null;
  /**
   * @experimental
   */
  isAvailable?(ctx: NodeAvailableContext): boolean;
  end?: boolean | ((node) => boolean);
  testable?: boolean;
  /**
   * 2.0 — v2-native block-creation menu item (the `useInitializers` counterpart).
   */
  getCreateModelMenuItem?({ node, workflow }): SubModelItem | null;
  /**
   * @experimental
   */
  useTempAssociationSource?(node): TempAssociationSource | null;
}

/**
 * @experimental
 * Walk the upstream chain of a node (exclusive of the node itself), optionally
 * filtered. Pure linked-list traversal — no hooks, despite the `use*` name kept
 * for v1 call-site compatibility.
 */
export function useAvailableUpstreams(node, filter?) {
  const stack: any[] = [];
  if (!node) {
    return [];
  }
  for (let current = node.upstream; current; current = current.upstream) {
    if (typeof filter !== 'function' || filter(current)) {
      stack.push(current);
    }
  }

  return stack;
}

/**
 * @experimental
 * Collect the upstream branching scopes for a node (upstreams that open a
 * branch the node sits inside). Pure traversal.
 */
export function useUpstreamScopes(node) {
  const stack: any[] = [];

  for (let current = node; current; current = current.upstream) {
    if (current.upstream && current.branchIndex != null) {
      stack.push(current.upstream);
    }
  }

  return stack;
}

export { NodeContext, useNodeContext } from './contexts';
