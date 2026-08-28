/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 side of the shared branch context (ADR-0003 layer 2). `client/BranchContext`
 * now re-exports the single instance from client-v2. This pins the load-bearing
 * guarantee: a value provided through the v1-imported `BranchContext` is read by
 * the v1-imported hooks — i.e. both import paths resolve to ONE context object
 * (if the re-export accidentally created a second context, providers and
 * consumers would silently miss each other). Also checks the v1-only `syncOnly`
 * field round-trips through the shared definition.
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
// v1 import paths (the re-export wrapper).
import { BranchContext, useBranchContext, useBranchIndex, useBranchSyncOnly } from '../BranchContext';
// The original definition in client-v2.
import { BranchContext as SharedBranchContext } from '../../client-v2/canvas/BranchContext';

describe('v1 BranchContext — re-exports the shared instance', () => {
  it('is the very same context object as client-v2 (not a second instance)', () => {
    expect(BranchContext).toBe(SharedBranchContext);
  });

  it('reads a value provided through the v1 import, including the v1-only syncOnly', () => {
    const value = { branchIndex: 1, addable: false, syncOnly: true };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
    );
    expect(renderHook(() => useBranchContext(), { wrapper }).result.current).toBe(value);
    expect(renderHook(() => useBranchIndex(), { wrapper }).result.current).toBe(1);
    expect(renderHook(() => useBranchSyncOnly(), { wrapper }).result.current).toBe(true);
  });
});
