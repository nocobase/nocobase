import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import locales from '../../client/locales/index.js';
import ForgotPasswordPage from '../../client/pages/auth/forgot-password.js';
import LoginPage from '../../client/pages/auth/login.js';
import RegisterPage from '../../client/pages/auth/register.js';
import ResetPasswordPage from '../../client/pages/auth/reset-password.js';
import { Loading } from '../../client/components/loading.js';

vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useSignUpAvailable: () => true,
}));

vi.mock('@nocobase/app-plugin-authentication/client/actions', () => ({
  usePasswordLogin: () => ({ isPending: false, submit: vi.fn() }),
  usePasswordRegistration: () => ({ isPending: false, submit: vi.fn() }),
  usePasswordReset: () => ({ isPending: false, submit: vi.fn() }),
  usePasswordResetRequest: () => ({
    isPending: false,
    isSuccess: true,
    submit: vi.fn(),
  }),
}));
async function runtime() {
  const value = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  value.registerApplicationNamespace('app', locales);
  await value.init('en-US');
  return value;
}
function renderPage(value: I18nRuntime, page: ReactElement) {
  return render(
    <I18nProvider runtime={value}>
      <MemoryRouter>{page}</MemoryRouter>
    </I18nProvider>,
  );
}
describe('authentication translations', () => {
  it('updates the login page, brand panel and visibility control on language change', async () => {
    const value = await runtime();
    renderPage(value, <LoginPage />);
    await act(() => value.changeLanguage('zh-CN'));
    expect(screen.getByRole('heading', { name: '欢迎回来' })).toBeVisible();
    expect(screen.getByLabelText('用户名或邮箱')).toBeVisible();
    expect(screen.getByRole('button', { name: '显示密码' })).toBeVisible();
    expect(screen.getByRole('link', { name: '注册' })).toBeVisible();
    expect(screen.getByText('AI 原生应用平台')).toBeVisible();
    await act(() => value.changeLanguage('en-US'));
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
  it('retranslates an existing password mismatch', async () => {
    const value = await runtime();
    const { container } = renderPage(value, <RegisterPage />);
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'one' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'two' },
    });
    fireEvent.submit(container.querySelector('form')!);
    expect(screen.getByText("Passwords don't match.")).toBeVisible();
    await act(() => value.changeLanguage('zh-CN'));
    expect(screen.getByText('两次输入的密码不一致。')).toBeVisible();
  });
  it('translates reset states and generic loading', async () => {
    const value = await runtime();
    renderPage(
      value,
      <>
        <ResetPasswordPage />
        <ForgotPasswordPage />
        <Loading />
      </>,
    );
    await act(() => value.changeLanguage('zh-CN'));
    expect(screen.getByText('此密码重置链接无效或已过期。')).toBeVisible();
    expect(screen.getByText('如果账户存在，重置链接已发送。')).toBeVisible();
    expect(screen.getByRole('status', { name: '加载中' })).toBeVisible();
  });
});
