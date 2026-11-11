import { renderWithApp, answerApi } from '@nocobase/app-testing/client';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { SystemLayout } from '../../client/layouts/system-layout.js';
import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference.js';
import enUS from '../../client/locales/en-US.js';
import platformSso from '@nocobase/app-plugin-platform-sso/client';
import metadata from '../../package.json' with { type: 'json' };

vi.mock('../../client/routing/route-navigation.js', async (original) => ({
  ...(await original<
    typeof import('../../client/routing/route-navigation.js')
  >()),
  useRouteNavigation: () => ({ items: [], denied: new Set(), loading: false }),
}));
vi.mock('../../client/layouts/components/header-actions.js', () => ({
  HeaderActions: () => null,
}));

afterEach(() => vi.unstubAllGlobals());
it('shows the switcher only in the sidebar across mobile open, close and desktop resize', async () => {
  const changes = new Set<() => void>();
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: query.includes('max-width'),
    addEventListener: (_: string, listener: () => void) =>
      changes.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      changes.delete(listener),
  }));
  await renderWithApp(
    <SidebarPreferenceProvider
      value={createAppSidebarPreferenceStore('/mobile-test')}
    >
      <SystemLayout routes={[]} />
    </SidebarPreferenceProvider>,
    {
      plugins: [platformSso()],
      namespace: metadata.name,
      namespaces: { [metadata.name]: enUS },
      fetch: answerApi(() => ({ data: [] })),
    },
  );
  const switchers = () =>
    screen.queryAllByRole('button', { name: /Switch application/ });
  expect(switchers()).toHaveLength(0);
  expect(
    within(screen.getByRole('banner')).queryByRole('button', {
      name: /Switch application/,
    }),
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Open navigation' }),
  );
  const dialog = await screen.findByRole('dialog');
  expect(switchers()).toHaveLength(1);
  expect(
    within(dialog).getByRole('button', { name: /Switch application/ }),
  ).toBeVisible();
  // Check DOM as well as accessible roles: the backdrop must not merely hide a duplicate from assistive tech.
  expect(
    document.querySelectorAll('button[aria-label^="Switch application"]'),
  ).toHaveLength(1);
  await userEvent.click(
    screen.getByRole('button', { name: 'Close navigation' }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(switchers()).toHaveLength(0);
  await userEvent.click(
    screen.getByRole('button', { name: 'Open navigation' }),
  );
  await screen.findByRole('dialog');
  act(() => {
    vi.stubGlobal('innerWidth', 1024);
    changes.forEach((listener) => listener());
  });
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(switchers()).toHaveLength(1);
  expect(
    within(screen.getByRole('banner')).queryByRole('button', {
      name: /Switch application/,
    }),
  ).not.toBeInTheDocument();
  act(() => {
    vi.stubGlobal('innerWidth', 390);
    changes.forEach((listener) => listener());
  });
  expect(switchers()).toHaveLength(0);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
