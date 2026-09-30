import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ReactNode } from 'react';
import { UserMenu } from '../../client/layouts/components/user-menu.tsx';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/app-template-hub', resources: enUS },
});

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

const { signOut, refresh, showToast } = vi.hoisted(() => ({
  signOut: vi.fn(),
  refresh: vi.fn(),
  showToast: vi.fn(),
}));
vi.mock('@nocobase/app-client', () => {
  const toaster = { show: showToast, close: vi.fn() };
  return { useToaster: () => toaster };
});
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    client: { signOut },
    session: {
      user: { id: 'operator', name: 'Operator', email: 'operator@example.com' },
    },
    isPending: false,
    refresh,
  }),
}));
vi.mock('../../client/layouts/components/language-switcher.js', () => ({
  LanguageSwitcher: () => null,
}));

describe('account menu sign out', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    refresh.mockResolvedValue(undefined);
  });
  async function signOutFromMenu() {
    render(<UserMenu />, { wrapper: I18n });
    fireEvent.click(screen.getByRole('button', { name: 'Open account menu' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
  }
  it('refreshes the server session after successful sign-out', async () => {
    signOut.mockResolvedValue({ data: { success: true }, error: null });
    await signOutFromMenu();
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(showToast).not.toHaveBeenCalled();
  });
  it('reports a rejected origin without pretending the session ended', async () => {
    signOut.mockResolvedValue({
      data: null,
      error: { status: 403, code: 'INVALID_ORIGIN' },
    });
    await signOutFromMenu();
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        type: 'error',
        title: 'Unable to sign out. Please try again.',
      }),
    );
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Open account menu' }));
    expect(
      await screen.findByRole('menuitem', { name: 'Sign out' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
  });
  it('reports network failures and allows retry', async () => {
    signOut.mockRejectedValue(new Error('Network unavailable'));
    await signOutFromMenu();
    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(refresh).not.toHaveBeenCalled();
  });
});
