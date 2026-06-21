/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { aclCheckRefresh } from '../aclCheckRefresh';

const createModel = (initial?: { hidden?: boolean; forbidden?: any; props?: Record<string, any> }) => {
  const state: any = {
    hidden: initial?.hidden ?? false,
    forbidden: initial?.forbidden ?? null,
    props: { ...(initial?.props || {}) },
  };
  const model: any = {
    get hidden() {
      return state.hidden;
    },
    set hidden(v) {
      state.hidden = v;
    },
    get forbidden() {
      return state.forbidden;
    },
    set forbidden(v) {
      state.forbidden = v;
    },
    setHidden: vi.fn((v: boolean) => {
      state.hidden = v;
    }),
    setProps: vi.fn((patch: any) => {
      Object.assign(state.props, patch);
    }),
  };
  return { model, state };
};

describe('aclCheckRefresh action', () => {
  it('default strategy: clears forbidden/hidden when allowed', async () => {
    const { model, state } = createModel({
      hidden: true,
      forbidden: { actionName: 'view' },
      props: { aclDisabled: true },
    });

    const ctx: any = {
      model,
      actionName: 'view',
      dataSource: { key: 'main' },
      resourceName: 'posts',
      collectionField: { collectionName: 'posts', name: 'title' },
      resource: { getMeta: vi.fn() },
      record: { id: 1 },
      collection: { getFilterByTK: vi.fn(() => 1) },
      aclCheck: vi.fn(async () => true),
      exitAll: vi.fn(),
    };

    await aclCheckRefresh.handler(ctx, {});

    expect(state.forbidden).toBeNull();
    expect(state.hidden).toBe(false);
    expect(ctx.exitAll).not.toHaveBeenCalled();
    expect(state.props.aclDisabled).toBeUndefined();
  });

  it('default strategy: sets forbidden/hidden and exits when denied', async () => {
    const { model, state } = createModel({
      hidden: false,
      forbidden: null,
      props: { aclDisabled: true },
    });

    const ctx: any = {
      model,
      actionName: 'view',
      dataSource: { key: 'main' },
      resourceName: 'posts',
      collectionField: { collectionName: 'posts', name: 'title' },
      resource: { getMeta: vi.fn() },
      record: { id: 1 },
      collection: { getFilterByTK: vi.fn(() => 1) },
      aclCheck: vi.fn(async () => false),
      exitAll: vi.fn(),
    };

    await aclCheckRefresh.handler(ctx, {});

    expect(state.hidden).toBe(true);
    expect(state.forbidden).toEqual({ actionName: 'view' });
    expect(ctx.exitAll).toHaveBeenCalled();
  });

  it('formItem strategy: resets acl props and can restore from previous forbidden state', async () => {
    const { model, state } = createModel({
      hidden: true,
      forbidden: { actionName: 'view' },
      props: { aclDisabled: true, aclCreateDisabled: true },
    });

    const aclCheck = vi.fn(async (p: any) => {
      // update + view 都允许
      if (p.actionName === 'update') return true;
      if (p.actionName === 'view') return true;
      return true;
    });

    const ctx: any = {
      model,
      blockModel: { context: { actionName: 'update' } },
      dataSource: { key: 'main' },
      collectionField: { collectionName: 'posts', name: 'title' },
      aclCheck,
      exitAll: vi.fn(),
    };

    await aclCheckRefresh.handler(ctx, { strategy: 'formItem' });

    expect(state.forbidden).toBeNull();
    expect(state.hidden).toBe(false);
    expect(state.props.aclDisabled).toBeUndefined();
    expect(state.props.aclCreateDisabled).toBeUndefined();
    expect(ctx.exitAll).not.toHaveBeenCalled();
  });
});
