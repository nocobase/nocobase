import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthMethods } from '../../registry/auth/auth-methods/auth-methods';

const icon = <svg />;

describe('AuthMethods', () => {
  it('renders a single method without tabs', () => {
    render(
      <AuthMethods
        methods={[
          { content: <p>Password form</p>, id: 'password', label: 'Password' },
        ]}
      />,
    );
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByText('Password form')).toBeVisible();
  });

  it('switches between methods with tabs', () => {
    render(
      <AuthMethods
        labels={{ methods: 'Methods' }}
        methods={[
          { content: <p>Password form</p>, id: 'password', label: 'Password' },
          { content: <p>LDAP form</p>, id: 'ldap', label: 'LDAP' },
        ]}
      />,
    );
    expect(screen.getByRole('tablist', { name: 'Methods' })).toBeVisible();
    fireEvent.click(screen.getByRole('tab', { name: 'LDAP' }));
    expect(screen.getByRole('tab', { name: 'LDAP' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('LDAP form');
  });

  it('lists providers as full buttons, and as named icon buttons from three on', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <AuthMethods
        methods={[{ content: <p>Form</p>, id: 'password', label: 'Password' }]}
        providers={[
          { icon, id: 'google', label: 'Google', onClick },
          { icon, id: 'github', label: 'GitHub', onClick },
        ]}
      />,
    );
    expect(screen.getByText('Or continue with')).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Continue with Google' }),
    );
    expect(onClick).toHaveBeenCalledOnce();

    rerender(
      <AuthMethods
        providers={[
          { icon, id: 'google', label: 'Google' },
          { icon, id: 'github', label: 'GitHub' },
          { href: '/sso', icon, id: 'oidc', label: 'SSO' },
        ]}
      />,
    );
    expect(screen.queryByText('Or continue with')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Continue with SSO' }),
    ).toHaveAttribute('href', '/sso');
    expect(screen.queryByText('Continue with GitHub')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue with GitHub' }),
    ).toBeVisible();
  });
});
