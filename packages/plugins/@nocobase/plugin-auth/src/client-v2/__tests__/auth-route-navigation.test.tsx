/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import BasicSignInForm from '../forms/BasicSignInForm';
import BasicSignUpForm from '../forms/BasicSignUpForm';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

const authenticator = {
  name: 'basic',
  authType: 'Email/Password',
  authTypeTitle: 'Password',
  options: {
    allowSignUp: true,
    enableResetPassword: true,
    signupForm: [],
  },
};

const routePaths: Record<string, string> = {
  'auth.signin': '/settings/signin',
  'auth.signup': '/settings/signup',
  'auth.forgotPassword': '/settings/forgot-password',
  'auth.resetPassword': '/settings/reset-password',
};

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    useApp: () => ({
      router: {
        get: (name: string) => ({ path: routePaths[name] }),
      },
      apiClient: {
        auth: {
          checkResetToken: vi.fn(() => new Promise(() => undefined)),
          lostPassword: vi.fn().mockResolvedValue(undefined),
          resetPassword: vi.fn().mockResolvedValue(undefined),
          signUp: vi.fn().mockResolvedValue(undefined),
        },
      },
    }),
    usePlugin: () => ({
      isScopedAuthRoute: (pathname: string) => pathname === '/customer/signin' || pathname === '/customer/signup',
      getAuthRoutePath: (pathname: string, name: 'auth.signin' | 'auth.signup') => {
        if (pathname === '/customer/signin' || pathname === '/customer/signup') {
          return name === 'auth.signin' ? '/customer/signin' : '/customer/signup';
        }
        return routePaths[name];
      },
    }),
  };
});

vi.mock('../authenticator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../authenticator')>();
  return {
    ...actual,
    useAuthenticator: () => authenticator,
  };
});

vi.mock('../hooks', () => ({
  useDocumentTitle: vi.fn(),
  useSignIn: () => ({ run: vi.fn() }),
}));

vi.mock('../locale', () => ({
  useAuthTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('plugin-auth route-aware navigation', () => {
  it('uses the registered Settings routes from the basic sign-in form', () => {
    render(
      <MemoryRouter initialEntries={['/settings/signin?redirect=%2Fsettings%2Fsecurity']}>
        <BasicSignInForm authenticator={authenticator} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/settings/signup?name=basic',
    );
    expect(screen.getByRole('link', { name: 'Forgot password' })).toHaveAttribute(
      'href',
      '/settings/forgot-password?name=basic',
    );
  });

  it('returns from sign-up to the registered Settings signin route', () => {
    render(
      <MemoryRouter initialEntries={['/settings/signup?name=basic&redirect=%2Fsettings%2Fsecurity']}>
        <BasicSignUpForm authenticatorName="basic" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Log in with an existing account' })).toHaveAttribute(
      'href',
      '/settings/signin',
    );
  });

  it('keeps the Portal scope and redirect when navigating from sign-in to sign-up', () => {
    render(
      <MemoryRouter initialEntries={['/customer/signin?redirect=%2Fv%2Fcustomer%2Forders']}>
        <BasicSignInForm authenticator={authenticator} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/customer/signup?name=basic&redirect=%2Fv%2Fcustomer%2Forders',
    );
  });

  it('returns from Portal sign-up to the scoped signin route with the original redirect', () => {
    render(
      <MemoryRouter initialEntries={['/customer/signup?name=basic&redirect=%2Fv%2Fcustomer%2Forders']}>
        <BasicSignUpForm authenticatorName="basic" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Log in with an existing account' })).toHaveAttribute(
      'href',
      '/customer/signin?redirect=%2Fv%2Fcustomer%2Forders',
    );
  });

  it('keeps the sub-app basename when navigating between scoped Portal auth routes', () => {
    render(
      <MemoryRouter
        basename="/v/apps/sub-app"
        initialEntries={['/v/apps/sub-app/customer/signin?redirect=%2Fv%2Fapps%2Fsub-app%2Fcustomer%2Forders']}
      >
        <BasicSignInForm authenticator={authenticator} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/v/apps/sub-app/customer/signup?name=basic&redirect=%2Fv%2Fapps%2Fsub-app%2Fcustomer%2Forders',
    );
  });

  it('returns from scoped Portal sign-up inside the current sub-app basename', () => {
    render(
      <MemoryRouter
        basename="/v/apps/sub-app"
        initialEntries={['/v/apps/sub-app/customer/signup?redirect=%2Fv%2Fapps%2Fsub-app%2Fcustomer']}
      >
        <BasicSignUpForm authenticatorName="basic" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Log in with an existing account' })).toHaveAttribute(
      'href',
      '/v/apps/sub-app/customer/signin?redirect=%2Fv%2Fapps%2Fsub-app%2Fcustomer',
    );
  });

  it('returns from forgot-password to the registered Settings signin route', () => {
    render(
      <MemoryRouter initialEntries={['/settings/forgot-password?name=basic']}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Back to login' })).toHaveAttribute('href', '/settings/signin');
  });

  it('returns from reset-password to the registered Settings signin route', () => {
    render(
      <MemoryRouter initialEntries={['/settings/reset-password?name=basic&resetToken=token']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Go to login' })).toHaveAttribute('href', '/settings/signin');
  });
});
