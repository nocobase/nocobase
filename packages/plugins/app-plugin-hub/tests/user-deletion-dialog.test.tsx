import { fireEvent, render, screen } from '@testing-library/react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDeleteDialog } from '../../app-plugin-users/client/pages/users-page.js';
import enUS from '../../app-plugin-users/client/locales/en-US.js';
// The Spinner primitive names itself with the application's `status.loading`, as it does in an application.
const runtime = await createTestI18nRuntime({
  application: { namespace: 'app', resources: { 'status.loading': 'Loading' } },
  namespaces: { '@nocobase/app-plugin-users': enUS },
});
function I18n({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime} namespace='@nocobase/app-plugin-users'>
      {children}
    </TestI18nProvider>
  );
}
const user = {
  id: 'target',
  name: 'Test user',
  email: 'test@example.com',
  emailVerified: false,
  disabledAt: null,
  createdAt: '',
  updatedAt: '',
  roleScopes: {},
};
describe('Delete user confirmation', () => {
  it('describes credential revocation and waits for explicit confirmation', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDeleteDialog
        user={user}
        busy={false}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
      { wrapper: I18n },
    );
    expect(
      screen.getByText(
        /All sessions and API Keys of Test user will be revoked/,
      ),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete user' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
  it('prevents duplicate confirmation while deletion is pending', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDeleteDialog
        user={user}
        busy
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
      { wrapper: I18n },
    );
    // The pending button also carries the spinner's label in its name.
    const confirm = screen.getByRole('button', { name: /Delete user$/ });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
