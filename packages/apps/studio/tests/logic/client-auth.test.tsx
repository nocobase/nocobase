import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.ts';
import LoginPage from '../../client/pages/auth/login.tsx';
import ForgotPasswordPage from '../../client/pages/auth/forgot-password.tsx';
import RegisterPage from '../../client/pages/auth/register.tsx';

const passwordLoginAction = vi.hoisted(() => ({
  error: undefined as { message: string } | undefined,
  isPending: false,
  submit: vi.fn(),
}));

const signUpAvailable = vi.hoisted(() => ({ value: true }));
const resetCapability = vi.hoisted(() => ({
  data: { passwordResetAvailable: true } as
    { passwordResetAvailable: boolean } | undefined,
  isPending: false,
  isError: false,
  refetch: vi.fn(),
}));
const passwordResetRequest = vi.hoisted(() => ({
  isPending: false,
  isSuccess: false,
  submit: vi.fn(),
}));

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useClientApplication: () => ({
    config: { public: { get: (_key: string, fallback: string) => fallback } },
  }),
}));

vi.mock('@nocobase/app-plugin-authentication/client/actions', () => ({
  usePasswordLogin: () => passwordLoginAction,
  usePasswordRegistration: () => ({ isPending: false, submit: vi.fn() }),
  usePasswordResetRequest: () => passwordResetRequest,
}));

vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useSignUpAvailable: () => signUpAvailable.value,
  usePasswordResetCapability: () => resetCapability,
}));

const runtime = await createTestI18nRuntime({
  application: { namespace: 'app', resources: enUS },
});

function renderAt(path: string, page: ReactElement) {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={page} path={path} />
          <Route element={<p>Login route</p>} path='/login' />
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}

describe('Studio authentication pages', () => {
  it('wires the login form to the plugin authentication action', async () => {
    passwordLoginAction.submit.mockClear();
    renderAt('/', <LoginPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Sign in to NocoBase Studio',
      }),
    ).toBeVisible();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Username or email'), {
      target: { value: 'alice' },
    });
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'password' } });

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordLoginAction.submit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(passwordLoginAction.submit).toHaveBeenCalledWith({
        identifier: 'alice',
        password: 'password',
      });
    });
    expect(
      screen.getByRole('link', { name: 'Forgot password?' }),
    ).toHaveAttribute('href', '/forgot-password');
  });

  it('puts the activity timeline beside the form on wide screens, and the version below it', () => {
    renderAt('/', <LoginPage />);
    const panel = screen.getByRole('complementary', {
      name: 'Plan. Build. Ship.',
    });
    expect(panel).toHaveClass('hidden', 'xl:block');
    expect(panel).toHaveTextContent('Your 24/7 AI agent team, at work.');
    expect(panel).toHaveTextContent('Frontend Agent');
    expect(screen.getByText('NocoBase Studio · v0.0.0')).toBeVisible();
  });

  it('shows the action error', () => {
    passwordLoginAction.error = { message: 'Invalid username or password.' };
    renderAt('/', <LoginPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Invalid username or password.',
    );
    passwordLoginAction.error = undefined;
  });

  it('offers sign-up only while the server accepts it', () => {
    signUpAvailable.value = false;
    const { unmount } = renderAt('/', <LoginPage />);
    expect(
      screen.queryByRole('link', { name: 'Sign up' }),
    ).not.toBeInTheDocument();
    unmount();

    signUpAvailable.value = true;
    renderAt('/', <LoginPage />);
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('hides password recovery when the server has not configured it', () => {
    resetCapability.data = { passwordResetAvailable: false };
    renderAt('/', <LoginPage />);
    expect(
      screen.queryByRole('link', { name: 'Forgot password?' }),
    ).not.toBeInTheDocument();
    resetCapability.data = { passwordResetAvailable: true };
  });

  it('shows the administrator contact message on direct access while recovery is disabled', () => {
    resetCapability.data = { passwordResetAvailable: false };
    renderAt('/forgot-password', <ForgotPasswordPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Self-service password reset is not enabled',
    );
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    resetCapability.data = { passwordResetAvailable: true };
  });

  it('shows a loading state and retries a failed capability request', () => {
    resetCapability.data = undefined;
    resetCapability.isPending = true;
    resetCapability.isError = false;
    const { rerender } = renderAt('/forgot-password', <ForgotPasswordPage />);
    expect(screen.getByLabelText('Loading')).toBeVisible();

    resetCapability.isPending = false;
    resetCapability.isError = true;
    rerender(
      <TestI18nProvider runtime={runtime}>
        <MemoryRouter initialEntries={['/forgot-password']}>
          <Routes>
            <Route element={<ForgotPasswordPage />} path='/forgot-password' />
          </Routes>
        </MemoryRouter>
      </TestI18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(resetCapability.refetch).toHaveBeenCalled();
    resetCapability.data = { passwordResetAvailable: true };
    resetCapability.isPending = false;
    resetCapability.isError = false;
  });

  it('keeps the reset request form usable when the capability is available', async () => {
    resetCapability.data = { passwordResetAvailable: true };
    resetCapability.isPending = false;
    resetCapability.isError = false;
    passwordResetRequest.submit.mockClear();
    renderAt('/forgot-password', <ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'person@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => {
      expect(passwordResetRequest.submit).toHaveBeenCalledWith({
        email: 'person@example.com',
      });
    });
  });

  it('sends a visitor back to sign-in while sign-up is off', () => {
    signUpAvailable.value = false;
    renderAt('/register', <RegisterPage />);
    expect(screen.getByText('Login route')).toBeVisible();
    signUpAvailable.value = true;
  });
});
