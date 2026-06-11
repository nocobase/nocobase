/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  navigate: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@nocobase/client', () => ({
  SchemaSettingsItem: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  useCurrentUserContext: () => ({
    mutate: mocks.mutate,
  }),
  useNavigateNoUpdate: () => mocks.navigate,
  useAPIClient: () => ({
    auth: {
      signOut: mocks.signOut,
    },
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (text: string) => text,
  }),
}));

describe('SignOut', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        href: '',
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('navigates to signin after signing out without mutating the current page context', async () => {
    mocks.signOut.mockResolvedValue({
      data: {
        data: {},
      },
    });
    const { SignOut } = await import('../SignOut');

    render(<SignOut />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
      expect(mocks.navigate).toHaveBeenCalledWith('/signin?redirect=', { replace: true });
    });
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('uses server redirect after signing out when provided', async () => {
    mocks.signOut.mockResolvedValue({
      data: {
        data: {
          redirect: '/custom-signout',
        },
      },
    });
    const { SignOut } = await import('../SignOut');

    render(<SignOut />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('/custom-signout');
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
