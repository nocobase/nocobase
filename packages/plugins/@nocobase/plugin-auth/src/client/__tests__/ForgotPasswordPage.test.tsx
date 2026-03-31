/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuthenticator } from '../authenticator';
import { useSearchParams } from 'react-router-dom';

// 模拟认证组件和路由组件`
vi.mock('react-router-dom', () => ({
  useSearchParams: vi.fn(() => [
    {
      get: (key: string) => (key === 'name' ? 'basic' : null),
    },
  ]),
  Navigate: vi.fn(() => <div data-testid="navigate">Navigate to not-found</div>),
}));

vi.mock('../authenticator', () => ({
  useAuthenticator: vi.fn(),
}));

vi.mock('@nocobase/client', () => ({
  SchemaComponent: vi.fn(({ schema, scope }) => <div data-testid="schema-component">Schema Component</div>),
  useAPIClient: vi.fn(),
}));

vi.mock('../locale', () => ({
  useAuthTranslation: vi.fn(() => ({ t: (key: string) => key })),
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ForgotPasswordPage when reset password is enabled', () => {
    // 模拟认证器允许重置密码
    vi.mocked(useAuthenticator).mockReturnValue({
      options: {
        enableResetPassword: true,
      },
    } as any);

    render(<ForgotPasswordPage />);
    expect(screen.getByTestId('schema-component')).toBeTruthy();
  });

  it('should redirect to not-found page when reset password is disabled', () => {
    // 模拟认证器不允许重置密码
    vi.mocked(useAuthenticator).mockReturnValue({
      options: {
        enableResetPassword: false,
      },
    } as any);

    render(<ForgotPasswordPage />);
    expect(screen.getByTestId('navigate')).toBeTruthy();
  });

  it('should redirect to not-found page when authenticator is not found', () => {
    // 模拟认证器为 null
    vi.mocked(useAuthenticator).mockReturnValue(null);

    render(<ForgotPasswordPage />);
    expect(screen.getByTestId('navigate')).toBeTruthy();
  });

  it('should use authenticator name from URL parameter', () => {
    // 模拟 URL 参数中的认证器名称
    const mockName = 'custom-auth';
    vi.mocked(useSearchParams).mockReturnValue([
      {
        get: (key: string) => (key === 'name' ? mockName : null),
      },
    ] as any);

    // 模拟认证器允许重置密码
    vi.mocked(useAuthenticator).mockReturnValue({
      options: {
        enableResetPassword: true,
      },
    } as any);

    render(<ForgotPasswordPage />);

    // 验证是否使用了正确的认证器名称
    expect(useAuthenticator).toHaveBeenCalledWith(mockName);
  });
});
