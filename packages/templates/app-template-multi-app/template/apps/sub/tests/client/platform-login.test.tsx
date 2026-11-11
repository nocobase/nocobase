import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithApp } from '@nocobase/app-testing/client';
import { createAppClientConfig } from '@nocobase/app-client';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import PlatformLogin from '../../client/pages/auth/platform-login.js';
import installedPlugin from '@nocobase/app-plugin-platform-sso/client';
import { pluginEnglish } from './plugin-locales.js';
const enUS = await pluginEnglish(installedPlugin);
import metadata from '../../package.json' with { type: 'json' };
const replace = vi.fn();
afterEach(() => {
  vi.unstubAllGlobals();
  replace.mockClear();
});
async function renderAt(
  route: string,
  enabled = true,
  appId?: string,
  platformUrl = '/main/',
) {
  vi.stubGlobal('location', { ...window.location, replace });
  return renderWithApp(
    <QueryClientProvider client={new QueryClient()}>
      <PlatformLogin local={<p>Local account form</p>} />
    </QueryClientProvider>,
    {
      route,
      namespace: metadata.name,
      namespaces: {
        [metadata.name]: enUS,
        '@nocobase/app-plugin-platform-sso': enUS,
      },
      services: (app) => {
        Object.defineProperty(app, 'config', {
          value: createAppClientConfig({
            rawConfig: { app: { title: 'Teaching lab' } },
            rawPublicConfig: {
              platformSso: { enabled, ...(appId ? { appId } : {}) },
              platform: { url: platformUrl },
            },
          }),
        });
      },
    },
  );
}
it.each(['/login', '/login?auth=platform'])(
  'starts via the server without rendering a login choice (%s)',
  async (route) => {
    await renderAt(
      route + (route.includes('?') ? '&' : '?') + 'redirect=%2Frecords',
    );
    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Choose how to sign in.')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(enUS.sso.entering);
  },
);
it.each(['auth=local', 'local=1'])(
  'preserves explicit local login (%s)',
  async (query) => {
    await renderAt('/login?' + query + '&redirect=%2Frecords');
    expect(screen.getByText('Local account form')).toBeVisible();
    expect(replace).not.toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: enUS.sso.continue }),
    ).toHaveAttribute('href', '/main/sso/start?redirect=%2Frecords');
  },
);
it('shows a deliberate signed-out state without automatically signing back in', async () => {
  await renderAt('/login?signedOut=1');
  expect(screen.getByText(enUS.sso.signedOut)).toBeVisible();
  expect(replace).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: enUS.sso.reenter })).toHaveAttribute(
    'href',
    '/main/sso/start?redirect=%2F',
  );
});
it('provides an explicit permission denial and a workbench exit', async () => {
  await renderAt('/login?ssoError=1&error=APP_ACCESS_DENIED');
  expect(screen.getByRole('alert')).toHaveTextContent(enUS.sso.denied);
  expect(replace).not.toHaveBeenCalled();
  expect(screen.queryByRole('link', { name: enUS.sso.retry })).toBeNull();
  expect(
    screen.getByRole('link', { name: enUS.switcher.back }),
  ).toHaveAttribute('href', location.origin + '/main/');
});
it('offers a retry retaining the target after a failure without looping', async () => {
  await renderAt('/login?ssoError=1&redirect=%2Frecords');
  expect(screen.getByRole('alert')).toBeVisible();
  expect(replace).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: enUS.sso.retry })).toHaveAttribute(
    'href',
    '/main/sso/start?redirect=%2Frecords',
  );
});
it('uses local login when platform SSO is not configured', async () => {
  await renderAt('/login', false);
  expect(screen.getByText('Local account form')).toBeVisible();
  expect(replace).not.toHaveBeenCalled();
});

it('explains missing membership when OAuth reports only a token error', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify({ data: [] })));
  vi.stubGlobal('fetch', fetcher);
  await renderAt('/login?ssoError=1&error=invalid_code', true, 'lab');
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(enUS.sso.denied),
  );
  expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' });
  expect(replace).not.toHaveBeenCalled();
});
it('does not mislabel an unavailable platform as missing membership', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 503 })),
  );
  await renderAt('/login?ssoError=1', true, 'lab');
  expect(screen.getByRole('alert')).toHaveTextContent(enUS.sso.failedTitle);
  expect(screen.queryByText(enUS.sso.denied)).toBeNull();
});

it('uses the configured platform entry for the workbench link', async () => {
  await renderAt('/login?signedOut=1', true, undefined, '/custom-platform/');
  expect(
    screen.getByRole('link', { name: enUS.switcher.back }),
  ).toHaveAttribute('href', location.origin + '/custom-platform/');
});
