import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AppThemeProvider } from '../../client/theme/theme-provider';
import { HeaderActions } from '../../client/layouts/components/header-actions';
import { UserMenu } from '../../client/layouts/components/user-menu';

import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

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

const panels = [['Open account menu', UserMenu, 'menu']] as const;

it.each(panels)(
  'opens and closes %s on hover',
  async (label, Component, role) => {
    const user = userEvent.setup();
    await renderAuthenticatedClient(
      <AppThemeProvider>
        <Component />
      </AppThemeProvider>,
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
    await renderAuthenticatedClient(
      <AppThemeProvider>
        <Component />
      </AppThemeProvider>,
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

it('offers appearance only inside the account menu with keyboard selection', async () => {
  const user = userEvent.setup();
  await renderAuthenticatedClient(
    <AppThemeProvider>
      <HeaderActions />
    </AppThemeProvider>,
  );
  expect(
    screen.queryByRole('button', { name: 'Theme' }),
  ).not.toBeInTheDocument();
  await user.tab();
  await user.keyboard('{Enter}');
  const appearance = screen.getByRole('menuitem', { name: 'Theme' });
  appearance.focus();
  await user.keyboard('{ArrowRight}');
  expect(screen.getAllByRole('menuitemradio')).toHaveLength(5);
  await user.keyboard('{ArrowDown}{Enter}');
  expect(document.documentElement).toHaveClass('dark');
  expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await user.keyboard('{Escape}');
  expect(appearance).toHaveFocus();
  expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  await user.keyboard('{Escape}');
  expect(
    screen.getByRole('button', { name: 'Open account menu' }),
  ).toHaveFocus();
});
