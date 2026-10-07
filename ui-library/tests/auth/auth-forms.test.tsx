import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PasswordLoginForm } from '../../registry/auth/auth-forms/password-login-form';
import { PasswordRegistrationForm } from '../../registry/auth/auth-forms/password-registration-form';
import { PasswordResetForm } from '../../registry/auth/auth-forms/password-reset-form';
import { PasswordResetRequestForm } from '../../registry/auth/auth-forms/password-reset-request-form';

describe('auth forms', () => {
  it('submits the login values and toggles the password visibility', () => {
    const onSubmit = vi.fn();
    render(
      <PasswordLoginForm
        footer={<a href='/register'>Sign up</a>}
        forgotPasswordLink={<a href='/forgot'>Forgot password?</a>}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText('Username or email'), {
      target: { value: ' alice ' },
    });
    const password = screen.getByLabelText('Password');
    fireEvent.change(password, { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSubmit).toHaveBeenCalledWith({
      identifier: 'alice',
      password: 'secret',
    });
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Forgot password?' }),
    ).toBeVisible();
  });

  it('tabs from the identifier to the password before the forgot-password link', () => {
    const { container } = render(
      <PasswordLoginForm
        forgotPasswordLink={<a href='/forgot'>Forgot password?</a>}
        onSubmit={() => undefined}
      />,
    );
    // Tab order follows document order here, since nothing sets a positive tabIndex.
    const tabbable = [
      ...container.querySelectorAll<HTMLElement>('a[href], button, input'),
    ].filter(
      (element) => element.tabIndex >= 0 && !element.hasAttribute('disabled'),
    );
    const identifier = screen.getByLabelText('Username or email');
    const password = screen.getByLabelText('Password');
    const forgot = screen.getByRole('link', { name: 'Forgot password?' });
    expect(tabbable[tabbable.indexOf(identifier) + 1]).toBe(password);
    expect(tabbable.indexOf(forgot)).toBeGreaterThan(
      tabbable.indexOf(password),
    );
  });

  it('renders the states and labels it is given', () => {
    render(
      <PasswordLoginForm
        error='Invalid credentials.'
        fieldErrors={{ identifier: 'Unknown user.' }}
        labels={{ submitting: 'Wait…' }}
        onSubmit={() => undefined}
        submitting
      />,
    );
    expect(
      screen.getByText('Invalid credentials.').closest('[role="alert"]'),
    ).not.toBeNull();
    expect(screen.getByLabelText('Username or email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByText('Unknown user.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Wait…' })).toBeDisabled();
  });

  it('checks the confirmation before submitting a registration', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <PasswordRegistrationForm onSubmit={onSubmit} />,
    );
    for (const [label, value] of [
      ['Name', 'Alice Chen'],
      ['Username', 'alice'],
      ['Email', 'alice@example.com'],
      ['Password', 'one'],
      ['Confirm password', 'two'],
    ]) {
      fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Passwords don't match.")).toBeVisible();
    // The message comes from the labels on every render, so a translated label replaces a message already shown.
    rerender(
      <PasswordRegistrationForm
        labels={{ passwordMismatch: 'Mismatch.' }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText('Mismatch.')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'one' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'alice@example.com',
      name: 'Alice Chen',
      password: 'one',
      username: 'alice',
    });
  });

  it('shows the reset request success and disables a reset without a token', () => {
    render(
      <>
        <PasswordResetRequestForm onSubmit={() => undefined} success />
        <PasswordResetForm
          disabled
          error='This password reset link is invalid or has expired.'
          onSubmit={() => undefined}
        />
      </>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'If the account exists, a reset link has been sent.',
    );
    expect(screen.getByLabelText('New password')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Reset password' }),
    ).toBeDisabled();
  });
});
