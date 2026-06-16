/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The shared branch context (ADR-0003 layer 2) is a single instance serving both
 * canvases — v1 re-exports it from here. Its provider value differs by canvas: the
 * legacy canvas's `Branch` sets `{ branchIndex, addable, syncOnly }`, the modern
 * canvas's `{ branchIndex, addable }` (no `syncOnly`). These pins assert the hooks
 * read both shapes correctly, and that the absent-provider default (`null`) is
 * handled — the contract every consumer relies on via `?.`.
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { BranchContext, useBranchContext, useBranchIndex, useBranchSyncOnly } from '../BranchContext';

function wrapper(value: any) {
  return ({ children }: { children: React.ReactNode }) => (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

describe('BranchContext — shared by both canvases', () => {
  it('reads the legacy-canvas value shape ({ branchIndex, addable, syncOnly })', () => {
    const value = { branchIndex: 1, addable: false, syncOnly: true };
    const wrap = wrapper(value);
    expect(renderHook(() => useBranchContext(), { wrapper: wrap }).result.current).toBe(value);
    expect(renderHook(() => useBranchIndex(), { wrapper: wrap }).result.current).toBe(1);
    expect(renderHook(() => useBranchSyncOnly(), { wrapper: wrap }).result.current).toBe(true);
  });

  it('reads the modern-canvas value shape ({ branchIndex, addable }) — syncOnly defaults to false', () => {
    const wrap = wrapper({ branchIndex: 0, addable: true });
    expect(renderHook(() => useBranchIndex(), { wrapper: wrap }).result.current).toBe(0);
    // `syncOnly` is optional; absent → false (the modern canvas never sets it).
    expect(renderHook(() => useBranchSyncOnly(), { wrapper: wrap }).result.current).toBe(false);
  });

  it('falls back to null/defaults with no provider (the `?.` contract consumers rely on)', () => {
    expect(renderHook(() => useBranchContext()).result.current).toBeNull();
    expect(renderHook(() => useBranchIndex()).result.current).toBeNull();
    expect(renderHook(() => useBranchSyncOnly()).result.current).toBe(false);
  });
});
