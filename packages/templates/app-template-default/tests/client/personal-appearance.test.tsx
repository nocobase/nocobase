import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';

import AppearancePage from '../../client/pages/me/appearance.js';
import { AppThemeProvider } from '../../client/theme/index.js';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }));
});

it('changes the color mode and theme the account menu also offers', async () => {
  await renderAuthenticatedClient(
    <AppThemeProvider>
      <AppearancePage />
    </AppThemeProvider>,
  );
  const user = userEvent.setup();
  expect(
    screen.getByRole('heading', { level: 1, name: 'Language and appearance' }),
  ).toBeVisible();
  const mode = screen.getByRole('group', { name: 'Color mode' });
  await user.click(within(mode).getByRole('radio', { name: 'Dark' }));
  expect(within(mode).getByRole('radio', { name: 'Dark' })).toBeChecked();
  expect(document.documentElement).toHaveClass('dark');
});
