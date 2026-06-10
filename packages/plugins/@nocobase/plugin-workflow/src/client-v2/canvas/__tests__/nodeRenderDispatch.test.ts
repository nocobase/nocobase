/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Pins the legacy-canvas card-render dispatch (ADR-0003): a v1 `Component` is the
 * opt-out signal (stay on Formily), an inherited `ComponentLoader` alone switches
 * the card to v2, and neither falls back to the default card.
 */

import { describe, expect, it } from 'vitest';
import { nodeTypeClassName, resolveLegacyNodeRenderMode } from '../nodeRenderDispatch';

describe('resolveLegacyNodeRenderMode', () => {
  it('prefers the legacy Component when present (opt-out of v2 card)', () => {
    const Component = () => null;
    const ComponentLoader = () => Promise.resolve({ default: () => null });
    // Even with an inherited loader, an own Component keeps the node on Formily.
    expect(resolveLegacyNodeRenderMode({ Component, ComponentLoader })).toBe('legacy-component');
    expect(resolveLegacyNodeRenderMode({ Component })).toBe('legacy-component');
  });

  it('renders via ComponentLoader when there is no Component (full v2 card)', () => {
    const ComponentLoader = () => Promise.resolve({ default: () => null });
    expect(resolveLegacyNodeRenderMode({ ComponentLoader })).toBe('modern-loader');
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

describe('nodeTypeClassName', () => {
  it('produces the stable `workflow-node-type-<type>` card hook (matches the live next DOM)', () => {
    expect(nodeTypeClassName('calculation')).toBe('workflow-node-type-calculation');
    expect(nodeTypeClassName('condition')).toBe('workflow-node-type-condition');
  });
});
