/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { getOrCreateMarkdownRegistry, MarkdownRegistry, type MarkdownEngine } from '../Markdown';

const createEngine = (name: string): MarkdownEngine => ({
  name,
  Editor: (props) => <div data-engine={name}>editor:{props.value}</div>,
  Preview: (props) => <div data-engine={name}>preview:{props.value}</div>,
});

describe('MarkdownRegistry', () => {
  it('registers engines and returns the default engine', () => {
    const registry = new MarkdownRegistry();
    const vditor = createEngine('vditor');
    const other = createEngine('other');

    registry.register(vditor);
    registry.register(other);

    expect(registry.getEngine('vditor')).toBe(vditor);
    expect(registry.getDefaultEngine()).toBe(vditor);
    expect(registry.getEngineNames()).toEqual(['vditor', 'other']);
  });

  it('can switch the default engine', () => {
    const registry = new MarkdownRegistry();
    const vditor = createEngine('vditor');
    const other = createEngine('other');

    registry.register(vditor);
    registry.register(other, { default: true });

    expect(registry.getDefaultEngine()).toBe(other);

    registry.setDefaultEngine('vditor');

    expect(registry.getDefaultEngine()).toBe(vditor);
  });

  it('renders and edits through engine components', () => {
    const registry = new MarkdownRegistry();
    registry.register(createEngine('vditor'));

    const preview = registry.render('# Hello');
    const editor = registry.edit({ value: '# Hello' });

    expect(React.isValidElement(preview)).toBe(true);
    expect(React.isValidElement(editor)).toBe(true);
    expect((preview as React.ReactElement).props.value).toBe('# Hello');
    expect((editor as React.ReactElement).props.value).toBe('# Hello');
  });

  it('can render through a named engine', () => {
    const registry = new MarkdownRegistry();
    registry.register(createEngine('vditor'));
    registry.register(createEngine('other'));

    const preview = registry.render('# Hello', { engine: 'other' });

    expect((preview as React.ReactElement).props['data-engine']).toBeUndefined();
    expect((preview as React.ReactElement).type).toBe(registry.getEngine('other')?.Preview);
  });

  it('returns a visible error when no engine is registered', () => {
    const registry = new MarkdownRegistry();
    const preview = registry.render('# Hello');

    expect(React.isValidElement(preview)).toBe(true);
    expect((preview as React.ReactElement).type).toBe('pre');
  });

  it('gets or creates a stable registry on a flow context-like object', () => {
    const ctx: {
      markdown?: MarkdownRegistry;
      defineProperty: (key: string, options: { get?: () => MarkdownRegistry }) => void;
    } = {
      defineProperty(key, options) {
        Object.defineProperty(this, key, {
          configurable: true,
          get: options.get,
        });
      },
    };

    const first = getOrCreateMarkdownRegistry(ctx);
    const second = getOrCreateMarkdownRegistry(ctx);

    expect(second).toBe(first);
  });
});
