/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useRedirect } from '../hooks';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('plugin-auth client-v2 useRedirect', () => {
  const originalLocation = globalThis.window.location;

  beforeEach(() => {
    navigateMock.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  function wrap(initialEntries: string[]) {
    return ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    );
  }

  it('should navigate to default next when no redirect param is present', () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    });

    const { result } = renderHook(() => useRedirect('/admin'), {
      wrapper: wrap(['/signin']),
    });
    result.current();

    expect(navigateMock).toHaveBeenCalledWith('/admin', { replace: true });
    expect(replace).not.toHaveBeenCalled();
  });

  it('should hard-redirect with window.location.replace when redirect param is set', () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    });

    const { result } = renderHook(() => useRedirect('/admin'), {
      wrapper: wrap(['/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2Fxyz']),
    });
    result.current();

    expect(replace).toHaveBeenCalledWith('/nocobase/v2/admin/xyz');
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
