/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const flowEngine = vi.hoisted(() => ({
  t: vi.fn(),
  tExpr: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', () => ({
  tExpr: flowEngine.tExpr,
  useFlowEngine: () => ({
    context: {
      t: flowEngine.t,
    },
  }),
}));

import { NAMESPACE, tExpr, useT } from '../locale';

describe('plugin-acl locale helpers', () => {
  beforeEach(() => {
    flowEngine.t.mockReset();
    flowEngine.tExpr.mockReset();
  });

  it('translates with the plugin ACL namespace fallback chain', () => {
    flowEngine.t.mockReturnValue('translated');

    const t = useT();

    expect(t('Saved successfully', { count: 1 })).toBe('translated');
    expect(flowEngine.t).toHaveBeenCalledWith('Saved successfully', {
      ns: [NAMESPACE, 'acl', 'client'],
      count: 1,
    });
  });

  it('creates translation expressions with the plugin ACL namespace fallback chain', () => {
    flowEngine.tExpr.mockReturnValue('{{t("Saved successfully")}}');

    expect(tExpr('Saved successfully', { count: 1 })).toBe('{{t("Saved successfully")}}');
    expect(flowEngine.tExpr).toHaveBeenCalledWith('Saved successfully', {
      ns: [NAMESPACE, 'acl', 'client'],
      count: 1,
    });
  });
});
