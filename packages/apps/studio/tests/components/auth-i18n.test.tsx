import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import locales from '../../client/locales/index.js';
import ForgotPasswordPage from '../../client/pages/auth/forgot-password.js';
import LoginPage from '../../client/pages/auth/login.js';
import RegisterPage from '../../client/pages/auth/register.js';
import ResetPasswordPage from '../../client/pages/auth/reset-password.js';
import { Loading } from '../../client/components/loading.js';

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useClientApplication: () => ({
    config: { public: { get: (_key: string, fallback: string) => fallback } },
  }),
}));

const states = vi.hoisted(() => ({ available: true, success: false }));
beforeEach(() => {
  states.available = true;
  states.success = false;
});

vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useSignUpAvailable: () => true,
  usePasswordResetAvailable: () => states.available,
  usePasswordResetCapability: () => ({
    data: { passwordResetAvailable: true },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@nocobase/app-plugin-authentication/client/actions', () => ({
  usePasswordLogin: () => ({ isPending: false, submit: vi.fn() }),
  usePasswordRegistration: () => ({ isPending: false, submit: vi.fn() }),
  usePasswordReset: () => ({
    isPending: false,
    isSuccess: states.success,
    submit: vi.fn(),
  }),
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
function renderPage(
  value: I18nRuntime,
  page: ReactElement,
  route: string = '/',
) {
  return render(
    <I18nProvider runtime={value}>
      <MemoryRouter initialEntries={[route]}>{page}</MemoryRouter>
    </I18nProvider>,
  );
}
describe('authentication translations', () => {
  it('updates login fields, the activity panel and visibility control on language change', async () => {
    const value = await runtime();
    renderPage(value, <LoginPage />);
    await act(() => value.changeLanguage('zh-CN'));
    expect(
      screen.getByRole('heading', { level: 1, name: '登录 NocoBase Studio' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('用户名或邮箱')).toBeVisible();
    expect(screen.getByRole('button', { name: '显示密码' })).toBeVisible();
    expect(screen.getByRole('link', { name: '注册' })).toBeVisible();
    expect(
      screen.getByRole('complementary', { name: '构思，开发，上线。' }),
    ).toBeInTheDocument();
    await act(() => value.changeLanguage('en-US'));
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Sign in to NocoBase Studio',
      }),
    ).toBeInTheDocument();
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

it('shows reset success in both languages, disables the form and keeps sign-in available', async () => {
  states.success = true;
  const value = await runtime();
  renderPage(value, <ResetPasswordPage />, '/reset-password?token=test');
  expect(
    screen.getByText(
      'Your password has been reset. Sign in with your new password.',
    ),
  ).toBeVisible();
  expect(screen.getByLabelText('New password')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Reset password' })).toBeDisabled();
  expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
    'href',
    '/login',
  );
  await act(() => value.changeLanguage('zh-CN'));
  expect(screen.getByText('密码已重置，请用新密码登录')).toBeVisible();
});

it('keeps the reset entry absent on the first render and replaces a closed forgot route with login', async () => {
  states.available = false;
  const value = await runtime();
  const page = renderPage(value, <LoginPage />);
  expect(screen.queryByRole('link', { name: /forgot/i })).toBeNull();
  page.unmount();
  renderPage(
    value,
    <Routes>
      <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/login' element={<p>Closed reset returned to login</p>} />
    </Routes>,
    '/forgot-password',
  );
  expect(
    await screen.findByText('Closed reset returned to login'),
  ).toBeVisible();
  expect(screen.queryByRole('textbox')).toBeNull();
});

it('offers another request for a missing reset token', async () => {
  const value = await runtime();
  renderPage(value, <ResetPasswordPage />);
  expect(
    screen.getByRole('link', { name: 'Request another link' }),
  ).toHaveAttribute('href', '/forgot-password');
});
