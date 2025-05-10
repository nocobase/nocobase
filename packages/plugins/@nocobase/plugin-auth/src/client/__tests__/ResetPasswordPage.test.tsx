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
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuthenticator } from '../authenticator';
import { useSearchParams } from 'react-router-dom';
import { useAPIClient } from '@nocobase/client';

// 模拟认证组件和路由组件
vi.mock('react-router-dom', () => ({
  useSearchParams: vi.fn(() => [
    {
      get: (key: string) => {
        if (key === 'name') return 'basic';
        if (key === 'resetToken') return 'valid-token';
        return null;
      },
    },
  ]),
  Navigate: vi.fn(() => <div data-testid="navigate">Navigate to not-found</div>),
}));

vi.mock('../authenticator', () => ({
  useAuthenticator: vi.fn(),
}));

vi.mock('@nocobase/client', () => ({
  SchemaComponent: vi.fn(({ schema, scope }) => <div data-testid="schema-component">Schema Component</div>),
  useAPIClient: vi.fn(() => ({
    auth: {
      checkResetToken: vi.fn().mockResolvedValue(true),
    },
  })),
  useNavigateNoUpdate: vi.fn(() => vi.fn()),
}));

vi.mock('../locale', () => ({
  useAuthTranslation: vi.fn(() => ({ t: (key: string) => key })),
}));

vi.mock('antd', () => ({
  Button: vi.fn(({ children, ...props }) => <button {...props}>{children}</button>),
  Result: vi.fn(({ title, extra }) => (
    <div data-testid="result">
      <div>{title}</div>
      <div>{extra}</div>
    </div>
  )),
  message: {
    success: vi.fn(),
  },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ResetPasswordPage when reset password is enabled and token is valid', async () => {
    // 模拟认证器允许重置密码
    vi.mocked(useAuthenticator).mockReturnValue({
      options: {
        enableResetPassword: true,
      },
    } as any);

    // 模拟有效的重置令牌
    vi.mocked(useSearchParams).mockReturnValue([
      {
        get: (key: string) => {
          if (key === 'name') return 'basic';
          if (key === 'resetToken') return 'valid-token';
          return null;
        },
      },
    ] as any);

    render(<ResetPasswordPage />);

    // 等待异步操作完成
    await vi.waitFor(() => {
      expect(screen.getByTestId('schema-component')).toBeTruthy();
    });
  });

  it('should redirect to not-found page when reset password is disabled', async () => {
    // 模拟认证器不允许重置密码
    vi.mocked(useAuthenticator).mockReturnValue({
      options: {
        enableResetPassword: false,
      },
    } as any);

    render(<ResetPasswordPage />);

    // 直接测试导航组件的渲染，无需等待
    expect(screen.getByTestId('navigate')).toBeTruthy();
  });

  it('should redirect to not-found page when authenticator is not found', async () => {
    // 模拟认证器为 null
    vi.mocked(useAuthenticator).mockReturnValue(null);

    render(<ResetPasswordPage />);
    expect(screen.getByTestId('navigate')).toBeTruthy();
  });

  it('should show expired token message when token is invalid', async () => {
    // 模拟认证器允许重置密码
    vi.mocked(useAuthenticator).mockReturnValue({
      options: {
        enableResetPassword: true,
      },
    } as any);

    // 模拟过期或无效的令牌
    vi.mocked(useAPIClient).mockReturnValue({
      auth: {
        checkResetToken: vi.fn().mockRejectedValue(new Error('Token expired')),
      },
    } as any);

    render(<ResetPasswordPage />);

    // 等待异步操作完成
    await vi.waitFor(() => {
      expect(screen.getByTestId('result')).toBeTruthy();
    });
  });

  it('should use authenticator name from URL parameter', async () => {
    // 模拟 URL 参数中的认证器名称
    const mockName = 'custom-auth';
    vi.mocked(useSearchParams).mockReturnValue([
      {
        get: (key: string) => {
          if (key === 'name') return mockName;
          if (key === 'resetToken') return 'valid-token';
          return null;
        },
      },
    ] as any);

    // 模拟认证器允许重置密码
    vi.mocked(useAuthenticator).mockReturnValue({
      options: {
        enableResetPassword: true,
      },
    } as any);

    render(<ResetPasswordPage />);

    // 验证是否使用了正确的认证器名称
    expect(useAuthenticator).toHaveBeenCalledWith(mockName);
  });
});
