import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { HeaderActions } from '../../client/layouts/components/header-actions.js';
import { AppSidebarProvider } from '../../client/layouts/components/app-sidebar.js';
import { PhoneBar } from '../../client/layouts/components/phone-bar.js';

vi.mock('../../client/layouts/components/user-menu.js', () => ({
  UserMenu: () => <button>Account menu</button>,
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

it('keeps the account menu and omits the Agent chat control from the desktop header', () => {
  render(<HeaderActions />);

  expect(screen.getByRole('button', { name: 'Account menu' })).toBeVisible();
  expect(screen.queryByTestId('chat-header-button')).not.toBeInTheDocument();
});

it('keeps mobile page navigation and omits the Agent chat control', () => {
  render(
    <AppSidebarProvider>
      <PhoneBar>Page title</PhoneBar>
    </AppSidebarProvider>,
  );

  expect(screen.getByText('Page title')).toBeVisible();
  expect(screen.getByRole('button')).toBeVisible();
  expect(screen.queryByTestId('chat-header-button')).not.toBeInTheDocument();
});
