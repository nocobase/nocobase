import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import demoMode from '../../client/index.js';

afterEach(() => vi.unstubAllGlobals());

it('enters Super Admin before rendering the home page and preserves the application URL', async () => {
  const replace = vi.fn();
  vi.stubGlobal('location', { origin: 'http://localhost', replace });
  let complete!: (value: unknown) => void;
  const session = new Promise((resolve) => {
    complete = resolve;
  });
  const calls: string[] = [];
  await renderWithApp(<p>Protected home page</p>, {
    plugins: [demoMode({ showFloatingAccountSwitcher: false })],
    server: {
      publicBasePath: '/main',
      fetch: answerApi((call) => {
        calls.push(`${call.method} ${call.path}`);
        if (call.path === 'demoMode/status') return { data: { enabled: true } };
        if (call.path === 'demoMode/accounts/signInDefault') return session;
        return new Response(null, { status: 404 });
      }),
    },
    route: '/?view=board#today',
  });
  await waitFor(() =>
    expect(calls).toContain('POST demoMode/accounts/signInDefault'),
  );
  expect(screen.queryByText('Protected home page')).not.toBeInTheDocument();
  complete({ data: { signedIn: true } });
  await waitFor(() =>
    expect(replace).toHaveBeenCalledWith('/main?view=board#today'),
  );
  expect(screen.queryByText('Protected home page')).not.toBeInTheDocument();
  expect(
    calls.filter((call) => call === 'POST demoMode/accounts/signInDefault'),
  ).toHaveLength(1);
});

it.each([false, 'failure'])(
  'opens the normal home page when sign-in returns %s',
  async (result) => {
    await renderWithApp(<p>Normal home page</p>, {
      plugins: [demoMode({ showFloatingAccountSwitcher: false })],
      fetch: answerApi((call) => {
        if (call.path === 'demoMode/status') return { data: { enabled: true } };
        if (result === 'failure') return new Response(null, { status: 500 });
        return { data: { signedIn: result } };
      }),
    });
    expect(await screen.findByText('Normal home page')).toBeVisible();
  },
);

it.each([
  { route: '/', enabled: false },
  { route: '/login', enabled: true },
  { route: '/demo-sign-in?as=ann', enabled: true },
  { route: '/projects', enabled: true },
])(
  'keeps normal entry at $route when Demo Mode is $enabled',
  async ({ route, enabled }) => {
    const calls: string[] = [];
    await renderWithApp(<p>Application page</p>, {
      plugins: [demoMode({ showFloatingAccountSwitcher: false })],
      route,
      fetch: answerApi((call) => {
        calls.push(call.path);
        return { data: { enabled } };
      }),
    });
    expect(await screen.findByText('Application page')).toBeVisible();
    await waitFor(() => expect(calls).toContain('demoMode/status'));
    expect(calls).not.toContain('demoMode/accounts/signInDefault');
  },
);
