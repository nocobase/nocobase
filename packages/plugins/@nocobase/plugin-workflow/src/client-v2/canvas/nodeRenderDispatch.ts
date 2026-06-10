/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Which in-canvas renderer a node uses on the LEGACY canvas (ADR-0003).
 *
 * A node's instruction can carry both renderers during migration: the legacy
 * Formily `Component` and the modern `ComponentLoader` (inherited when the v1
 * instruction `extends` its v2 counterpart). The presence of a v1 `Component` is
 * the opt-out signal — it means "this node is not switching its card to v2 yet",
 * so the legacy canvas keeps rendering `Component`. Only when a node drops its
 * `Component` (but still inherits `ComponentLoader`) does its card render fully
 * via v2 — the card-layer mirror of the drawer-layer `FieldsetLoader` dispatch.
 *
 * Pure decision (no JSX, no hooks) so it is unit-testable and shared; the legacy
 * `Node` reads the verdict and renders accordingly. The modern canvas does NOT
 * use this — it always renders via `ComponentLoader` (it never had a `Component`).
 */

type RenderableInstruction = {
  Component?: unknown;
  ComponentLoader?: unknown;
};

export type LegacyNodeRenderMode =
  /** Render the legacy Formily `Component` (still on v1, or no v2 loader). */
  | 'legacy-component'
  /** Render fully via the modern `ComponentLoader` (v1 dropped its `Component`). */
  | 'modern-loader'
  /** Neither renderer — the legacy canvas falls back to its default card. */
  | 'default-card';

export function resolveLegacyNodeRenderMode(instruction: RenderableInstruction | undefined): LegacyNodeRenderMode {
  if (typeof instruction?.Component === 'function') {
    return 'legacy-component';
  }
  if (typeof instruction?.ComponentLoader === 'function') {
    return 'modern-loader';
  }
  return 'default-card';
}

/**
 * The stable `workflow-node-type-<type>` hook applied to a node's inner card
 * (`nodeClass`), matching the live `next` DOM. It carries no CSS of its own — it
 * lets external code, tests, and debugging target a node by type. Shared so every
 * card stamps it identically regardless of which renderer (Formily `Component`,
 * the v2 default card, or a v2 `ComponentLoader`) draws the node.
 */
export function nodeTypeClassName(type: string | undefined): string {
  return `workflow-node-type-${type}`;
}
