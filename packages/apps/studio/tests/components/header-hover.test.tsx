import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AppThemeProvider } from '../../client/theme/theme-provider';
import { ThemeSettings } from '../../client/theme/theme-settings';
import { UserMenu } from '../../client/layouts/components/user-menu';

// Session requests belong to the authentication tests.
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    session: { user: { id: 'operator', name: 'Operator' } },
    isPending: false,
  }),
}));
// Language selection has its own integration tests with the real i18n runtime.
vi.mock('../../client/layouts/components/language-switcher.js', () => ({
  LanguageSwitcher: () => null,
}));

beforeEach(() => {
  // jsdom does not implement the media queries used by the real theme provider.
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener() {},
    removeListener() {},
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.removeAttribute('class');
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-theme');
});

const panels = [
  ['Appearance', ThemeSettings, 'dialog'],
  ['Open account menu', UserMenu, 'menu'],
] as const;

it.each(panels)(
  'opens and closes %s on hover',
  async (label, Component, role) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppThemeProvider>
          <Component />
        </AppThemeProvider>
      </MemoryRouter>,
    );
    const trigger = screen.getByRole('button', { name: label });

    await user.hover(trigger);
    const panel = screen.getByRole(role);
    expect(trigger).not.toHaveAttribute('title');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    // Supply the destination because user-event does not set relatedTarget.
    fireEvent.mouseLeave(trigger, { relatedTarget: panel });
    fireEvent.mouseEnter(panel, { relatedTarget: trigger });
    fireEvent.mouseMove(panel);
    expect(panel).toBeVisible();

    fireEvent.mouseLeave(panel, { relatedTarget: document.body });
    fireEvent.mouseMove(document.body, { clientX: 1000, clientY: 1000 });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
);

it.each(panels)(
  'opens %s by keyboard and closes with Escape',
  async (label, Component, role) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppThemeProvider>
          <Component />
        </AppThemeProvider>
      </MemoryRouter>,
    );
    const trigger = screen.getByRole('button', { name: label });

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole(role)).toBeVisible();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
);

it('switches the color mode from the account menu’s theme submenu', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AppThemeProvider>
        <UserMenu />
      </AppThemeProvider>
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('button', { name: 'Open account menu' }));
  fireEvent.click(
    await screen.findByRole('menuitem', { name: /appearance\.menu|Theme/u }),
  );
  fireEvent.click(
    await screen.findByRole('menuitemradio', {
      name: /appearance\.dark|Dark/u,
    }),
  );
  expect(document.documentElement).toHaveClass('dark');
});
