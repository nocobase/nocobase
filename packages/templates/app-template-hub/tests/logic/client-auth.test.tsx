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
import RegisterPage from '../../client/pages/auth/register.tsx';

const passwordLoginAction = vi.hoisted(() => ({
  error: undefined as { message: string } | undefined,
  isPending: false,
  submit: vi.fn(),
}));

const signUpAvailable = vi.hoisted(() => ({ value: true }));

vi.mock('@nocobase/app-plugin-authentication/client/actions', () => ({
  usePasswordLogin: () => passwordLoginAction,
  usePasswordRegistration: () => ({ isPending: false, submit: vi.fn() }),
}));

vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useSignUpAvailable: () => signUpAvailable.value,
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

describe('application authentication pages', () => {
  it('wires the login form to the plugin authentication action', async () => {
    passwordLoginAction.submit.mockClear();
    renderAt('/', <LoginPage />);

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
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

  it('puts the brand panel beside the form on wide screens', () => {
    renderAt('/', <LoginPage />);
    const panel = screen.getByRole('complementary', {
      name: 'About this application',
    });
    expect(panel).toHaveClass('hidden', 'xl:block');
    expect(panel).toHaveTextContent('AI-native application platform');
    expect(panel).toHaveTextContent('AI-native frontend');
    expect(panel).toHaveTextContent('NocoBase foundation');
    expect(panel).toHaveTextContent('Freedom above. Confidence below.');
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

  it('sends a visitor back to sign-in while sign-up is off', () => {
    signUpAvailable.value = false;
    renderAt('/register', <RegisterPage />);
    expect(screen.getByText('Login route')).toBeVisible();
    signUpAvailable.value = true;
  });
});
