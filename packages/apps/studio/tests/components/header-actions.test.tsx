import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { HeaderActions } from '../../client/layouts/components/header-actions.js';

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

it('holds the inbox and the account menu, and omits the Agent chat control from the desktop header', () => {
  render(
    <MemoryRouter>
      <HeaderActions inbox={{ kind: 'decisions', count: 3, text: '3' }} />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole('link', { name: 'inbox.headerPending' }),
  ).toHaveAttribute('href', '/inbox');
  expect(screen.getByTestId('studio-inbox-badge')).toHaveTextContent('3');
  expect(screen.getByRole('button', { name: 'Account menu' })).toBeVisible();
  expect(screen.queryByTestId('chat-header-button')).not.toBeInTheDocument();
});
