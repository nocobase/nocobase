/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ACLContext } from '../acl';
import { useCurrentRoles } from '../nocobase-buildin-plugin';

type AclContextValue = React.ContextType<typeof ACLContext>;

function makeAclValue(allowAnonymous: boolean): AclContextValue {
  return {
    loading: false,
    data: {
      data: { allowAnonymous },
      meta: {},
    },
    refresh: async () => undefined,
  };
}

function makeEngineWithUser(user: { roles?: Array<{ name: string; title?: string }> } | null): FlowEngine {
  const engine = new FlowEngine();
  if (user != null) {
    engine.context.defineProperty('user', { value: user });
  }
  return engine;
}

function makeWrapper(opts: { engine: FlowEngine; acl: AclContextValue }) {
  const Wrapper: React.FC = ({ children }) => (
    <FlowEngineProvider engine={opts.engine}>
      <ACLContext.Provider value={opts.acl}>{children}</ACLContext.Provider>
    </FlowEngineProvider>
  );
  return Wrapper;
}

describe('useCurrentRoles', () => {
  it('returns roles from flowEngine.context.user, dropping the synthetic __union__ entry', () => {
    // `__union__` is a server-side marker for the merged-roles pseudo role and
    // must never appear in user-facing role pickers — guards against a regression
    // that broke role assignment in API Keys / SwitchRole pages.
    const wrapper = makeWrapper({
      engine: makeEngineWithUser({
        roles: [
          { name: '__union__', title: 'Union' },
          { name: 'root', title: 'Root' },
          { name: 'member', title: 'Member' },
        ],
      }),
      acl: makeAclValue(false),
    });
    const { result } = renderHook(() => useCurrentRoles(), { wrapper });
    expect(result.current).toEqual([
      { name: 'root', title: 'Root' },
      { name: 'member', title: 'Member' },
    ]);
  });

  it('appends an anonymous role when ACL allowAnonymous is true', () => {
    const wrapper = makeWrapper({
      engine: makeEngineWithUser({ roles: [{ name: 'root', title: 'Root' }] }),
      acl: makeAclValue(true),
    });
    const { result } = renderHook(() => useCurrentRoles(), { wrapper });
    expect(result.current).toEqual([
      { name: 'root', title: 'Root' },
      { name: 'anonymous', title: 'Anonymous' },
    ]);
  });

  it('compiles {{t(...)}} templates in role.title via flowEngine.context.t', () => {
    const engine = makeEngineWithUser({ roles: [{ name: 'admin', title: '{{t("Admin")}}' }] });
    engine.context.defineProperty('t', { value: () => 'Compiled Title' });
    const wrapper = makeWrapper({ engine, acl: makeAclValue(false) });
    const { result } = renderHook(() => useCurrentRoles(), { wrapper });
    expect(result.current).toEqual([{ name: 'admin', title: 'Compiled Title' }]);
  });

  it('returns an empty array when no user has been written to engine.context', () => {
    const wrapper = makeWrapper({ engine: makeEngineWithUser(null), acl: makeAclValue(false) });
    const { result } = renderHook(() => useCurrentRoles(), { wrapper });
    expect(result.current).toEqual([]);
  });

  it('returns just anonymous when no user is set but allowAnonymous is true', () => {
    const wrapper = makeWrapper({ engine: makeEngineWithUser(null), acl: makeAclValue(true) });
    const { result } = renderHook(() => useCurrentRoles(), { wrapper });
    expect(result.current).toEqual([{ name: 'anonymous', title: 'Anonymous' }]);
  });
});
