// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationProvider } from '../../client/authorization-provider.js';

const auth = vi.hoisted(() => ({
  session: null as { user: { id: string }; session: { id: string } } | null,
  isPending: false,
}));
const authz = vi.hoisted(() => ({ resetSession: vi.fn() }));
vi.mock('@nocobase/app-client', () => ({ useService: () => authz }));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => auth,
}));

describe('authorization session preparation', () => {
  beforeEach(() => {
    auth.session = null;
    auth.isPending = false;
    authz.resetSession.mockClear();
  });
  const form = (
    <AuthorizationProvider>
      <input aria-label='Draft' defaultValue='original' />
    </AuthorizationProvider>
  );

  it('waits for the initial session before mounting children', () => {
    auth.isPending = true;
    const view = render(form);
    expect(screen.queryByLabelText('Draft')).not.toBeInTheDocument();
    auth.isPending = false;
    view.rerender(
      <AuthorizationProvider>
        <input aria-label='Draft' />
      </AuthorizationProvider>,
    );
    expect(screen.getByLabelText('Draft')).toBeVisible();
  });

  it('retains anonymous form state while refreshing and resets it when identity changes', () => {
    const view = render(form);
    fireEvent.change(screen.getByLabelText('Draft'), {
      target: { value: 'unsaved' },
    });
    auth.isPending = true;
    view.rerender(
      <AuthorizationProvider>
        <input aria-label='Draft' defaultValue='original' />
      </AuthorizationProvider>,
    );
    expect(screen.getByLabelText('Draft')).toHaveValue('unsaved');
    auth.isPending = false;
    view.rerender(
      <AuthorizationProvider>
        <input aria-label='Draft' defaultValue='original' />
      </AuthorizationProvider>,
    );
    expect(screen.getByLabelText('Draft')).toHaveValue('unsaved');
    auth.session = { user: { id: 'new-user' }, session: { id: 'new-session' } };
    view.rerender(
      <AuthorizationProvider>
        <input aria-label='Draft' defaultValue='original' />
      </AuthorizationProvider>,
    );
    expect(screen.getByLabelText('Draft')).toHaveValue('original');
    expect(authz.resetSession).toHaveBeenCalledTimes(2);
  });

  it('gates signed-in content during refresh', () => {
    auth.session = { user: { id: 'user' }, session: { id: 'session' } };
    const view = render(form);
    expect(screen.getByLabelText('Draft')).toBeVisible();
    auth.isPending = true;
    view.rerender(
      <AuthorizationProvider>
        <input aria-label='Draft' />
      </AuthorizationProvider>,
    );
    expect(screen.queryByLabelText('Draft')).not.toBeInTheDocument();
  });
});
