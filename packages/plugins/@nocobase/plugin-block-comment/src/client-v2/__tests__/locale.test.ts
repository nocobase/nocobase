/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const state = vi.hoisted(() => ({
  t: vi.fn((key: string, options?: Record<string, unknown>) => ({ key, options })),
  tExpr: vi.fn((key: string, options?: Record<string, unknown>) => ({ type: 't', key, options })),
}));

vi.mock('@nocobase/flow-engine', () => ({
  tExpr: state.tExpr,
  useFlowEngine: () => ({
    context: {
      t: state.t,
    },
  }),
}));

describe('plugin-block-comment locale helpers', () => {
  beforeEach(() => {
    state.t.mockClear();
    state.tExpr.mockClear();
  });

  it('translates runtime strings in the plugin namespace', async () => {
    const { useT } = await import('../locale');
    const t = useT();

    expect(t('Comments', { count: 2 })).toEqual({
      key: 'Comments',
      options: {
        count: 2,
        ns: ['@nocobase/plugin-block-comment', 'client'],
      },
    });
  });

  it('creates translation expressions in the plugin namespace', async () => {
    const { tExpr } = await import('../locale');

    expect(tExpr('Record comments settings')).toEqual({
      type: 't',
      key: 'Record comments settings',
      options: {
        ns: ['@nocobase/plugin-block-comment', 'client'],
      },
    });
  });
});
