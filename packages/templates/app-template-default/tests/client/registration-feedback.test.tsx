import {
  AuthenticationProvider,
  GuestAuthentication,
  authenticationClientToken,
} from '@nocobase/app-plugin-authentication/client';
import { authorizationClientToken } from '@nocobase/app-plugin-authorization/client';
import { reactProviders } from '@nocobase/app-plugin-authorization/client/react-providers';
import { renderWithApp } from '@nocobase/app-testing/client';
import { act, fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import RegisterPage from '../../client/pages/auth/register.js';

const AuthorizationProvider = reactProviders[0]!.component;

async function renderRegistration(signedIn = false, locale = 'en-US') {
  let registered = false;
  const refresh = Promise.withResolvers<void>();
  const email = vi.fn(async () => {
    registered = true;
    return { token: null, user: { id: 'untrusted-id' } };
  });
  const getSession = vi.fn(async () => {
    if (registered) await refresh.promise;
    return {
      data:
        registered && signedIn
          ? { user: { id: 'real-user' }, session: { id: 'real-session' } }
          : null,
    };
  });
  const view = await renderWithApp(
    <AuthenticationProvider>
      <AuthorizationProvider>
        <Routes>
          <Route
            path='/register'
            element={
              <GuestAuthentication>
                <RegisterPage />
              </GuestAuthentication>
            }
          />
          <Route path='/' element={<p>Signed-in home</p>} />
        </Routes>
      </AuthorizationProvider>
    </AuthenticationProvider>,
    {
      route: '/register',
      locale,
      namespace: 'registration-test',
      namespaces: { 'registration-test': locale === 'en-US' ? enUS : zhCN },
      services: (app) => {
        app.container.instance(authorizationClientToken, {
          resetSession: vi.fn(),
        });
        app.container.instance(authenticationClientToken, {
          getSession,
          signUp: { email },
        });
      },
    },
  );
  await screen.findByRole('heading', {
    name: locale === 'en-US' ? 'Create an account' : '创建账户',
  });
  return { ...view, refresh, email };
}

function submitForm(container: HTMLElement, locale = 'en-US') {
  const labels =
    locale === 'en-US'
      ? ['Name', 'Username', 'Email', 'Password', 'Confirm password']
      : ['姓名', '用户名', '邮箱', '密码', '确认密码'];
  const values = [
    'Person',
    'person',
    'person@example.test',
    'test-password',
    'test-password',
  ];
  labels.forEach((label, index) =>
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: values[index] },
    }),
  );
  fireEvent.submit(container.querySelector('form')!);
}

describe('registration feedback with the real session provider and guest guard', () => {
  it.each(['en-US', 'zh-CN'])(
    'keeps accepted unsigned-in feedback after session refresh in %s',
    async (locale) => {
      const { container, refresh, email } = await renderRegistration(
        false,
        locale,
      );
      submitForm(container, locale);
      try {
        await vi.waitFor(() => expect(email).toHaveBeenCalledOnce());
        expect(container.querySelector('form')).toBeInTheDocument();
      } finally {
        await act(async () => {
          refresh.resolve();
        });
      }
      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent(
        locale === 'en-US'
          ? 'the new details will not take effect'
          : '新填写的信息不会生效',
      );
      expect(container.querySelector('form')).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', {
          name: locale === 'en-US' ? 'Sign in' : '登录',
        }),
      ).toHaveAttribute('href', '/login');
      expect(
        screen.getByRole('link', {
          name: locale === 'en-US' ? 'Forgot password?' : '忘记密码？',
        }),
      ).toHaveAttribute('href', '/forgot-password');
      expect(status).not.toHaveTextContent(
        /account (?:created|has been created)|email (?:sent|has been sent)|账户已创建|邮件已发送/i,
      );
    },
  );

  it('uses the refreshed session to leave the guest page', async () => {
    const { container, refresh } = await renderRegistration(true);
    submitForm(container);
    await act(async () => {
      refresh.resolve();
    });
    expect(await screen.findByText('Signed-in home')).toBeVisible();
    expect(
      screen.queryByText('Registration request submitted'),
    ).not.toBeInTheDocument();
  });
});
