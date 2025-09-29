/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCodeRunner } from '../hooks/useCodeRunner';

function createHostCtxWithRunner(result: any) {
  return {
    createJSRunner: (_opts?: any) => ({
      run: async () => result,
    }),
  };
}

describe('useCodeRunner', () => {
  it('logs success result', async () => {
    const hostCtx = createHostCtxWithRunner({ success: true, value: 123 });
    const { result } = renderHook(() => useCodeRunner(hostCtx, 'v1'));
    await act(async () => {
      await result.current.run('return 1');
    });
    expect(result.current.logs.some((l) => l.msg?.includes('Result: 123'))).toBe(true);
  });

  it('logs error message on failure', async () => {
    const hostCtx = createHostCtxWithRunner({ success: false, error: new Error('boom') });
    const { result } = renderHook(() => useCodeRunner(hostCtx, 'v1'));
    await act(async () => {
      await result.current.run('throw new Error("boom")');
    });
    expect(result.current.logs.some((l) => l.level === 'error' && /boom/i.test(l.msg))).toBe(true);
  });
});
