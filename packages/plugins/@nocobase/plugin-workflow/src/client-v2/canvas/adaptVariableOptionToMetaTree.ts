/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Single, core, one-way adapter `VariableOption → MetaTreeNode` (ADR-0003,
 * migration doc §6). The modern canvas reuses the mature legacy field-tree
 * logic (`getCollectionFieldOptions`, which returns `VariableOption`) unchanged,
 * and converts its aggregated upstream variables to the flow-engine
 * `MetaTreeNode` shape with this adapter just before feeding `VariableHybridInput`.
 *
 * Pure, side-effect-free, React-context-free — so it is independently unit
 * testable and the whole suite is deletable in one move when the legacy
 * field-tree logic is finally rewritten to produce `MetaTreeNode` natively.
 *
 * The modern consumers (`FlowContextSelector` cascader, `VariableHybridInput.walk`,
 * `VariableTag`) read exactly 7 `MetaTreeNode` fields; this adapter maps:
 *   title          ← label                (reactNode preserved; walk plain-texts it)
 *   name           ← value (or label)     direct, with name fallback
 *   children        ← children / loadChildren → () => Promise<MetaTreeNode[]>
 *   disabled        ← disabled            direct
 *   disabledReason  ← (v1 has none)       left undefined
 *   type/interface  ← field.type/.interface (only used by custom render)
 *   paths           ← (no v1 counterpart) constructed here, accumulated down
 *                                          the recursion (incl. lazy children).
 *
 * The v1-only keys (`field`/`types`/`appends`/`depth`) are captured in the
 * `loadChildren` closure and never surface on the produced `MetaTreeNode`.
 */

import type { MetaTreeNode } from '@nocobase/flow-engine';
import type { VariableOption } from './collectionFieldOptions';

type LoadChildren = (option: VariableOption) => void;

/**
 * @param option   a single VariableOption (as produced by getCollectionFieldOptions
 *                 / useWorkflowVariableOptions).
 * @param parentPaths  the path array accumulated from the root down to (but not
 *                 including) this node. Top-level callers pass `[]` (or a custom
 *                 root prefix, e.g. `['$jobsMapByNodeKey', nodeKey]`).
 */
export function adaptVariableOptionToMetaTree(option: VariableOption, parentPaths: string[] = []): MetaTreeNode {
  const name = String(option.value ?? option.label ?? '');
  const paths = [...parentPaths, name];

  const node: MetaTreeNode = {
    name,
    title: (option.label as string) ?? name,
    type: option.field?.type ?? '',
    paths,
  };

  if (option.field?.interface != null) {
    node.interface = option.field.interface;
  }
  if (option.disabled != null) {
    node.disabled = option.disabled;
  }

  // children: a static array maps recursively; a v1 `loadChildren` thunk (which mutates the option in place) becomes a
  // flow-engine lazy `() => Promise<...>`.
  if (Array.isArray(option.children)) {
    node.children = option.children.map((child) => adaptVariableOptionToMetaTree(child, paths));
  } else if (typeof (option.loadChildren as LoadChildren | null | undefined) === 'function') {
    const loadChildren = option.loadChildren as LoadChildren;
    node.children = async () => {
      // v1 loadChildren mutates `option`: sets `option.children`, clears `option.loadChildren`, may set
      // `isLeaf`/`disabled`. The v1-only keys it reads (`field`/`types`/`appends`/`depth`) live on `option` — captured
      // by this closure, never copied onto the MetaTreeNode.
      loadChildren(option);
      const loaded = Array.isArray(option.children) ? option.children : [];
      return loaded.map((child) => adaptVariableOptionToMetaTree(child, paths));
    };
  }

  return node;
}

/**
 * Adapt a list of top-level options (e.g. one aggregated variable scope) under
 * an optional root path prefix.
 */
export function adaptVariableOptionsToMetaTree(options: VariableOption[], rootPaths: string[] = []): MetaTreeNode[] {
  return options.map((option) => adaptVariableOptionToMetaTree(option, rootPaths));
}
