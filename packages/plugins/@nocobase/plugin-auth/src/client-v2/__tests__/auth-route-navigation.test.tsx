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
      <MemoryRouter initialEntries={['/settings/signin']}>
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
      <MemoryRouter initialEntries={['/settings/signup?name=basic']}>
        <BasicSignUpForm authenticatorName="basic" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Log in with an existing account' })).toHaveAttribute(
      'href',
      '/settings/signin',
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
