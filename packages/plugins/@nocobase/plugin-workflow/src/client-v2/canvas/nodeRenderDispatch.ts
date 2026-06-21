/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Which renderer a node uses on the LEGACY canvas, across all three migratable
 * surfaces — the in-canvas card, the config drawer, and the add-time preset
 * (ADR-0003).
 *
 * The dispatch rule is the same for all three and is the key to progressive,
 * surface-by-surface migration: **a v1 artifact always wins.** During migration a
 * node's instruction carries both generations — its own legacy artifact and the
 * modern loader it inherits when the v1 instruction `extends` its v2 counterpart.
 * Keeping the legacy artifact is the opt-out signal ("this surface is not switched
 * to v2 yet"), so the legacy canvas keeps rendering it; only when a node DROPS its
 * legacy artifact (but still inherits the loader) does that one surface render via
 * v2. The three surfaces switch independently — a node can move its card to v2
 * while its drawer stays on Formily, or vice-versa.
 *
 *   card:   `Component`       ⟶ falls back to `ComponentLoader`        (this card)
 *   drawer: `fieldset`        ⟶ falls back to `FieldsetLoader`         (this drawer)
 *   preset: `presetFieldset`  ⟶ falls back to `PresetFieldsetLoader`   (this preset)
 *
 * A legacy *schema* artifact (`fieldset` / `presetFieldset`) counts only when it
 * actually has entries — an inherited-but-empty `{}` is treated as absent, so it
 * does not pin a node that meant to drop it.
 *
 * Pure decisions (no JSX, no hooks) so they are unit-testable and shared; the
 * legacy callers read the verdict and render accordingly. The modern canvas does
 * NOT use these — it always renders via the loaders (it never had the legacy
 * artifacts).
 */

type RenderableInstruction = {
  Component?: unknown;
  ComponentLoader?: unknown;
};

type ConfigurableInstruction = {
  fieldset?: unknown;
  FieldsetLoader?: unknown;
};

type PresettableInstruction = {
  presetFieldset?: unknown;
  PresetFieldsetLoader?: unknown;
};

export type LegacyNodeRenderMode =
  /** Render the legacy Formily `Component` (still on v1, or no v2 loader). */
  | 'legacy-component'
  /** Render fully via the modern `ComponentLoader` (v1 dropped its `Component`). */
  | 'modern-loader'
  /** Neither renderer — the legacy canvas falls back to its default card. */
  | 'default-card';

export type LegacyFieldsetRenderMode =
  /** Render the legacy Formily schema (`fieldset` / `presetFieldset` has entries). */
  | 'legacy-fieldset'
  /** Render via the modern loader (the legacy schema was dropped). */
  | 'modern-loader'
  /** Neither — caller applies its own no-config fallback. */
  | 'none';

export function resolveLegacyNodeRenderMode(instruction: RenderableInstruction | undefined): LegacyNodeRenderMode {
  if (typeof instruction?.Component === 'function') {
    return 'legacy-component';
  }
  if (typeof instruction?.ComponentLoader === 'function') {
    return 'modern-loader';
  }
  return 'default-card';
}

/** A legacy Formily schema map (`fieldset` / `presetFieldset`) counts as present
 *  only when it has at least one entry — an inherited empty `{}` reads as absent. */
function hasSchemaEntries(schema: unknown): boolean {
  return typeof schema === 'object' && schema !== null && Object.keys(schema as object).length > 0;
}

function resolveFieldsetMode(schema: unknown, loader: unknown): LegacyFieldsetRenderMode {
  if (hasSchemaEntries(schema)) {
    return 'legacy-fieldset';
  }
  if (typeof loader === 'function') {
    return 'modern-loader';
  }
  return 'none';
}

/** Config-drawer dispatch: legacy `fieldset` (with entries) wins, else the modern
 *  `FieldsetLoader`, else neither (caller opens its empty Formily drawer). */
export function resolveLegacyConfigRenderMode(
  instruction: ConfigurableInstruction | undefined,
): LegacyFieldsetRenderMode {
  return resolveFieldsetMode(instruction?.fieldset, instruction?.FieldsetLoader);
}

/** Add-time preset dispatch: legacy `presetFieldset` (with entries) wins, else the
 *  modern `PresetFieldsetLoader`, else neither (caller applies its preset/branch
 *  fallback). */
export function resolveLegacyPresetRenderMode(
  instruction: PresettableInstruction | undefined,
): LegacyFieldsetRenderMode {
  return resolveFieldsetMode(instruction?.presetFieldset, instruction?.PresetFieldsetLoader);
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
