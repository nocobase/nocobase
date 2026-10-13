import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSidebarPreference } from '../../client/layouts/use-sidebar-preference';

const key = 'nocobase:sidebar:collapsed';

describe('shared sidebar preference', () => {
  beforeEach(() => localStorage.clear());

  it('shares changes across layouts and restores them after remount', () => {
    const first = renderHook(() => useSidebarPreference());
    const second = renderHook(() => useSidebarPreference());
    expect(first.result.current[0]).toBe(false);
    act(() => first.result.current[1]((value) => !value));
    expect(second.result.current[0]).toBe(true);
    expect(localStorage.getItem(key)).toBe('true');
    first.unmount();
    second.unmount();
    const restored = renderHook(() => useSidebarPreference());
    expect(restored.result.current[0]).toBe(true);
    act(() => restored.result.current[1](false));
    expect(localStorage.getItem(key)).toBe('false');
  });

  it('reads saved state and follows storage changes from another tab', () => {
    localStorage.setItem(key, 'true');
    const { result } = renderHook(() => useSidebarPreference());
    expect(result.current[0]).toBe(true);
    act(() => {
      localStorage.removeItem(key);
      window.dispatchEvent(new StorageEvent('storage', { key }));
    });
    expect(result.current[0]).toBe(false);
  });

  it('defaults to expanded for an invalid stored value', () => {
    localStorage.setItem(key, 'invalid');
    expect(renderHook(() => useSidebarPreference()).result.current[0]).toBe(
      false,
    );
  });
});
