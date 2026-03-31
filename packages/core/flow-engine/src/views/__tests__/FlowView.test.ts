/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowViewer } from '../FlowView';

describe('FlowViewer', () => {
  const ctx: any = { t: (k: string) => k };
  const open = vi.fn();
  const types = { drawer: { open }, popover: { open }, dialog: { open }, embed: { open } } as any;

  it('delegates to concrete viewer types with type field', () => {
    const viewer = new FlowViewer(ctx, types);
    viewer.dialog({ content: 'x' });
    viewer.drawer({ content: 'x' });
    viewer.popover({ content: 'x', title: 'p' } as any);
    viewer.embed({ content: 'x' });
    expect(open).toHaveBeenCalledTimes(4);
  });

  it('throws on unknown type in open', () => {
    const viewer = new FlowViewer(ctx, { ...types, drawer: undefined } as any);
    expect(() => viewer.open({ type: 'drawer', content: 'x' } as any)).toThrow(/Unknown view type/);
  });
});
