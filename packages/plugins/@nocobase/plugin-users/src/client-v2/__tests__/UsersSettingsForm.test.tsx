/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import UsersSettingsForm from '../pages/UsersSettingsForm';

const { getSystemSettings, updateSystemSettings, success } = vi.hoisted(() => ({
  getSystemSettings: vi.fn(),
  updateSystemSettings: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      resource: () => ({
        getSystemSettings,
        updateSystemSettings,
      }),
    },
    message: {
      success,
    },
  }),
}));

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

describe('UsersSettingsForm', () => {
  const originalLocation = globalThis.window.location;

  beforeEach(() => {
    getSystemSettings.mockResolvedValue({
      data: {
        data: {
          enableEditProfile: false,
          enableChangePassword: true,
        },
      },
    });
    updateSystemSettings.mockReset();
    success.mockReset();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: vi.fn(),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.clearAllMocks();
  });

  it('loads system settings and submits normalized checkbox values', async () => {
    render(<UsersSettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('Allow edit profile')).not.toBeChecked();
    });
    expect(screen.getByLabelText('Allow change password')).toBeChecked();

    fireEvent.click(screen.getByLabelText('Allow edit profile'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateSystemSettings).toHaveBeenCalledWith({
        values: {
          enableEditProfile: true,
          enableChangePassword: true,
        },
      });
    });
    expect(success).toHaveBeenCalledWith('Saved successfully');
    expect(globalThis.window.location.reload).toHaveBeenCalled();
  });
});
