import { AppThemeProvider } from '../../client/theme/index.js';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

import { UserMenu } from '../../client/layouts/components/user-menu.js';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

// jsdom has no media queries; the real account menu includes the theme provider.
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener() {},
    removeListener() {},
  }));
});

it('uses CJK name endings in the avatar while retaining the full account name and picture', async () => {
  const view = await renderAuthenticatedClient(
    <AppThemeProvider>
      <UserMenu />
    </AppThemeProvider>,
  );
  const user = userEvent.setup();
  const trigger = screen.getByRole('button', { name: 'Open account menu' });
  await user.tab();
  for (const [name, expected] of [
    ['周建国', '建国'],
    ['欧阳娜娜', '娜娜'],
    ['李雷', '李雷'],
    ['周 建国', '建国'],
    ['Li Lei', 'LL'],
    ['周', '周'],
  ] as const) {
    await act(async () => {
      const response = await view.identity().client.updateUser({ name });
      expect(response.error).toBeNull();
      await view.identity().refresh();
    });
    expect(trigger).toHaveTextContent(expected);
    await user.keyboard('{Enter}');
    expect(
      within(screen.getByRole('menu')).getByText(name, { exact: true }),
    ).toBeVisible();
    await user.keyboard('{Escape}');
  }
  await act(async () => {
    const response = await view.identity().client.updateUser({ name: '' });
    expect(response.error).toBeNull();
    await view.identity().refresh();
  });
  expect(trigger).toHaveTextContent(view.session.user.email[0]!.toUpperCase());
  await act(async () => {
    const response = await view
      .identity()
      .client.updateUser({ image: 'https://example.test/avatar.png' });
    expect(response.error).toBeNull();
    await view.identity().refresh();
  });
  expect(trigger.querySelector('img')).toHaveAttribute(
    'src',
    'https://example.test/avatar.png',
  );
  expect(trigger).not.toHaveTextContent('周');
});

function Location(): ReactElement {
  return <output aria-label='Location'>{useLocation().pathname}</output>;
}

it('opens personal settings from the first account menu entry', async () => {
  await renderAuthenticatedClient(
    <AppThemeProvider>
      <UserMenu />
      <Location />
    </AppThemeProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Open account menu' }));
  const [first] = within(await screen.findByRole('menu')).getAllByRole(
    'menuitem',
  );
  expect(first).toHaveTextContent('Personal settings');
  // The menu ignores the pointer while it opens; click once it takes clicks, as a person would.
  await waitFor(() => expect(takesPointer(first!)).toBe(true));
  await user.click(first!);
  expect(
    await screen.findByRole('status', { name: 'Location' }),
  ).toHaveTextContent('/me');
});

/**
 * Whether the pointer reaches `element`: the nearest of it and its ancestors that declares `pointer-events` decides, the
 * way user-event checks before a click.
 */
function takesPointer(element: Element): boolean {
  for (let node: Element | null = element; node; node = node.parentElement) {
    const value = (node as HTMLElement).style?.pointerEvents;
    if (value) return value !== 'none';
  }
  return true;
}
