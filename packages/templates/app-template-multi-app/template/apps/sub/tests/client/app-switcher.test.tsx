import { platformAddress } from '@nocobase/app-plugin-platform-sso/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithApp } from '@nocobase/app-testing/client';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { AppSwitcher } from '../../client/layouts/components/app-switcher.js';
import installedPlugin from '@nocobase/app-plugin-platform-sso/client';
import { pluginEnglish } from './plugin-locales.js';
const enUS = await pluginEnglish(installedPlugin);
import metadata from '../../package.json' with { type: 'json' };
afterEach(() => vi.unstubAllGlobals());
async function setup(fetcher: typeof fetch) {
  vi.stubGlobal('fetch', fetcher);
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  await renderWithApp(
    <QueryClientProvider client={query}>
      <AppSwitcher />
    </QueryClientProvider>,
    {
      fetch: fetcher,
      namespace: metadata.name,
      namespaces: {
        [metadata.name]: enUS,
        '@nocobase/app-plugin-platform-sso': enUS,
      },
    },
  );
  return userEvent.setup();
}
it('loads on open, marks the current app, and links other instances through platform sign-in', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [
          {
            id: 'main',
            name: 'Current laboratory',
            url: location.origin + '/main/',
            template: 'reagents',
            templateName: 'Reagents',
          },
          {
            id: 'other',
            name: 'Other laboratory',
            url: location.origin + '/other/',
            template: 'reagents',
            templateName: 'Reagents',
          },
        ],
      }),
      { status: 200 },
    ),
  );
  const user = await setup(fetcher);
  expect(fetcher).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: /Switch application:/ }));
  expect(
    await screen.findByRole('menuitem', { name: 'Current laboratory' }),
  ).toHaveAttribute('aria-current', 'page');
  expect(
    screen.getByRole('menuitem', { name: 'Other laboratory' }),
  ).toHaveAttribute(
    'href',
    location.origin + '/other/login?auth=platform&redirect=%2F',
  );
  expect(
    screen.getByRole('menuitem', { name: 'Back to workbench' }),
  ).toHaveAttribute('href', location.origin + '/main/');
  expect((fetcher.mock.calls[0]?.[0] as Request).url).toContain(
    '/platformSso/applications',
  );
  await user.keyboard('{Escape}');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /Switch application:/ }),
    ).toHaveFocus(),
  );
});
it('closes the switcher on navigation and shows progress outside the cards', async () => {
  const user = await setup(
    vi.fn<typeof fetch>().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'other',
                name: 'Other laboratory',
                url: location.origin + '/other/',
                template: 'reagents',
                templateName: 'Reagents',
              },
              {
                id: 'main',
                name: 'Current laboratory',
                url: location.origin + '/main/',
                template: 'reagents',
                templateName: 'Reagents',
              },
            ],
          }),
        ),
    ),
  );
  const trigger = screen.getByRole('button', { name: /Switch application:/ });
  await user.click(trigger);
  const other = await screen.findByRole('menuitem', {
    name: 'Other laboratory',
  });
  other.addEventListener('click', (event) => event.preventDefault());
  fireEvent.click(other, { ctrlKey: true });
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(screen.queryByRole('progressbar')).toBeNull();
  fireEvent.click(other);
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('progressbar')).toHaveAccessibleName(
    `${enUS.sso.entering} Other laboratory`,
  );
  expect(other).toHaveTextContent('Other laboratory');
  expect(other).not.toHaveTextContent(enUS.sso.entering);
  fireEvent(window, new Event('pageshow'));
  expect(screen.queryByRole('progressbar')).toBeNull();
  await user.click(trigger);
  await user.click(
    await screen.findByRole('menuitem', { name: 'Current laboratory' }),
  );
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('progressbar')).toBeNull();
});
it('shows a platform sign-in hint instead of exposing a cached app list after session expiry', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(null, { status: 401 }));
  const user = await setup(fetcher);
  await user.click(screen.getByRole('button', { name: /Switch application:/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    enUS.switcher.signInRequired,
  );
  expect(screen.queryByRole('menuitem', { name: 'Retry' })).toBeNull();
  expect(
    screen.getByRole('menuitem', { name: 'Back to workbench' }),
  ).toBeVisible();
});
it('retries a failed request and displays the empty state', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
  const user = await setup(fetcher);
  await user.click(screen.getByRole('button', { name: /Switch application:/ }));
  await user.click(await screen.findByRole('menuitem', { name: 'Retry' }));
  expect(await screen.findByText(enUS.switcher.empty)).toBeVisible();
});
it('rejects unsafe platform addresses and preserves a configured base path', () => {
  expect(platformAddress('javascript:alert(1)')).toBeUndefined();
  expect(
    platformAddress('https://user:password@example.test/main'),
  ).toBeUndefined();
  expect(platformAddress('/platform/main?x=1')?.pathname).toBe(
    '/platform/main/',
  );
});
