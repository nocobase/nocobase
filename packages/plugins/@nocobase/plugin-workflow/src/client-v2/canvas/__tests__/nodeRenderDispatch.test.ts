/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Pins the legacy-canvas render dispatch across all three migratable surfaces
 * (ADR-0003). The rule is uniform and v1-first: a legacy artifact (`Component` /
 * `fieldset` / `presetFieldset`) is the opt-out signal that keeps that one surface
 * on Formily; only dropping it lets the inherited loader switch that surface to
 * v2. The surfaces dispatch independently, so a node can migrate its card, drawer,
 * and preset one at a time.
 */

import { describe, expect, it } from 'vitest';
import {
  nodeTypeClassName,
  resolveLegacyNodeRenderMode,
  resolveLegacyConfigRenderMode,
  resolveLegacyPresetRenderMode,
} from '../nodeRenderDispatch';

const loader = () => Promise.resolve({ default: () => null });

describe('resolveLegacyNodeRenderMode', () => {
  it('prefers the legacy Component when present (opt-out of v2 card)', () => {
    const Component = () => null;
    // Even with an inherited loader, an own Component keeps the node on Formily.
    expect(resolveLegacyNodeRenderMode({ Component, ComponentLoader: loader })).toBe('legacy-component');
    expect(resolveLegacyNodeRenderMode({ Component })).toBe('legacy-component');
  });

  it('renders via ComponentLoader when there is no Component (full v2 card)', () => {
    expect(resolveLegacyNodeRenderMode({ ComponentLoader: loader })).toBe('modern-loader');
  });

  it('falls back to the default card when neither renderer is defined', () => {
    expect(resolveLegacyNodeRenderMode({})).toBe('default-card');
    expect(resolveLegacyNodeRenderMode(undefined)).toBe('default-card');
  });

  it('ignores non-function values (defensive against bad registry data)', () => {
    expect(resolveLegacyNodeRenderMode({ Component: true as unknown })).toBe('default-card');
    expect(resolveLegacyNodeRenderMode({ ComponentLoader: {} as unknown })).toBe('default-card');
  });
});

describe('resolveLegacyConfigRenderMode', () => {
  it('prefers the legacy fieldset when it has entries (opt-out of v2 drawer)', () => {
    const fieldset = { engine: { type: 'string' } };
    // Even with an inherited loader, a non-empty own fieldset keeps the Formily drawer.
    expect(resolveLegacyConfigRenderMode({ fieldset, FieldsetLoader: loader })).toBe('legacy-fieldset');
    expect(resolveLegacyConfigRenderMode({ fieldset })).toBe('legacy-fieldset');
  });

  it('treats an inherited-but-empty fieldset as absent (a dropped fieldset → v2)', () => {
    // The node dropped its fieldset but still inherits `{}` from the base class.
    expect(resolveLegacyConfigRenderMode({ fieldset: {}, FieldsetLoader: loader })).toBe('modern-loader');
  });

  it('renders via FieldsetLoader when there is no legacy fieldset (v2 drawer)', () => {
    expect(resolveLegacyConfigRenderMode({ FieldsetLoader: loader })).toBe('modern-loader');
  });

  it('returns none when neither side configures the node', () => {
    expect(resolveLegacyConfigRenderMode({})).toBe('none');
    expect(resolveLegacyConfigRenderMode({ fieldset: {} })).toBe('none');
    expect(resolveLegacyConfigRenderMode(undefined)).toBe('none');
  });
});

describe('resolveLegacyPresetRenderMode', () => {
  it('prefers the legacy presetFieldset when it has entries (opt-out of v2 preset dialog)', () => {
    const presetFieldset = { rejectOnFalse: { type: 'boolean' } };
    expect(resolveLegacyPresetRenderMode({ presetFieldset, PresetFieldsetLoader: loader })).toBe('legacy-fieldset');
    expect(resolveLegacyPresetRenderMode({ presetFieldset })).toBe('legacy-fieldset');
  });

  it('treats an inherited-but-empty presetFieldset as absent (a dropped preset → v2)', () => {
    expect(resolveLegacyPresetRenderMode({ presetFieldset: {}, PresetFieldsetLoader: loader })).toBe('modern-loader');
  });

  it('renders via PresetFieldsetLoader when there is no legacy presetFieldset', () => {
    expect(resolveLegacyPresetRenderMode({ PresetFieldsetLoader: loader })).toBe('modern-loader');
  });

  it('returns none when neither side defines a preset (caller applies branch fallback)', () => {
    expect(resolveLegacyPresetRenderMode({})).toBe('none');
    expect(resolveLegacyPresetRenderMode(undefined)).toBe('none');
  });
});

describe('nodeTypeClassName', () => {
  it('produces the stable `workflow-node-type-<type>` card hook (matches the live next DOM)', () => {
    expect(nodeTypeClassName('calculation')).toBe('workflow-node-type-calculation');
    expect(nodeTypeClassName('condition')).toBe('workflow-node-type-condition');
  });
});
