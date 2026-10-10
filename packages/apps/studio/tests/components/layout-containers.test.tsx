import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LayoutHeader } from '../../client/layouts/components/layout-header.js';
import {
  AppSidebar,
  AppSidebarProvider,
  AppSidebarToggle,
} from '../../client/layouts/components/app-sidebar.js';
import { NavigationMenu } from '../../client/layouts/components/navigation-menu.js';

vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));
vi.mock('@nocobase/app-client', () => ({
  resolveAppUrl: (url: string) => url,
}));

// `useIsMobile` reads the width; JSDOM has no matchMedia to listen with.
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  window.innerWidth = 1024;
});
it('renders arbitrary header content and native attributes without providers', () => {
  render(
    <LayoutHeader aria-label='Tools' className='justify-end'>
      <input aria-label='Search' />
    </LayoutHeader>,
  );
  expect(screen.getByRole('banner', { name: 'Tools' })).toHaveClass(
    'justify-end',
  );
  expect(screen.getByRole('textbox', { name: 'Search' })).toBeVisible();
});

function Shell() {
  const home = {
    route: {
      id: 'home',
      name: 'home',
      path: '/home',
      auth: 'required' as const,
      packageName: 'test',
      source: 'application' as const,
      navigation: { title: 'Home' },
      componentLoader: async () => ({ default: () => null }),
    },
    children: [],
  };
  return (
    <MemoryRouter>
      <AppSidebarProvider>
        <AppSidebar>
          <NavigationMenu
            items={[home]}
            label='Tools'
            selectedKey={undefined}
          />
        </AppSidebar>
        <AppSidebarToggle />
      </AppSidebarProvider>
    </MemoryRouter>
  );
}

it('switches the desktop icon mode from the header and keeps the preference', async () => {
  const user = userEvent.setup();
  const { unmount } = render(<Shell />);
  const sidebar = document.querySelector('[data-slot=sidebar]')!;
  expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await user.click(screen.getByRole('button', { name: 'Collapse navigation' }));
  expect(sidebar).toHaveAttribute('data-collapsible', 'icon');
  expect(localStorage.getItem('nocobase:sidebar:collapsed')).toBe('true');
  unmount();
  render(<Shell />);
  expect(
    screen.getByRole('button', { name: 'Expand navigation' }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(document.querySelector('[data-slot=sidebar]')).toHaveAttribute(
    'data-state',
    'collapsed',
  );
});

it('opens a sheet on a phone that closes when an entry is chosen', async () => {
  window.innerWidth = 500;
  const user = userEvent.setup();
  render(<Shell />);
  expect(screen.queryByRole('navigation', { name: 'Tools' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Open navigation' }));
  expect(
    await screen.findByRole('dialog', { name: 'Application navigation' }),
  ).toBeVisible();
  await user.click(screen.getByRole('link', { name: 'Home' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await user.click(screen.getByRole('button', { name: 'Open navigation' }));
  await user.click(
    await screen.findByRole('button', { name: 'Close navigation' }),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('leaves Ctrl/Cmd+B to the focused element instead of toggling the sidebar', async () => {
  const user = userEvent.setup();
  const bold = vi.fn();
  render(
    <>
      <Shell />
      <textarea
        aria-label='Editor'
        onKeyDown={(event) => {
          if (event.key === 'b' && (event.ctrlKey || event.metaKey)) bold();
        }}
      />
    </>,
  );
  const sidebar = document.querySelector('[data-slot=sidebar]')!;
  await user.click(screen.getByRole('textbox', { name: 'Editor' }));
  await user.keyboard('{Control>}b{/Control}');
  await user.keyboard('{Meta>}b{/Meta}');
  expect(bold).toHaveBeenCalledTimes(2);
  expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await user.click(document.body);
  await user.keyboard('{Control>}b{/Control}');
  expect(sidebar).toHaveAttribute('data-state', 'expanded');
});
