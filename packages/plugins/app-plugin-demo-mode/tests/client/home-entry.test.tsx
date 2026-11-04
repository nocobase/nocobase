import { renderDemo } from '../helpers/render-demo.js';
import { answerApi } from '@nocobase/app-testing/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import {
  defineAppRoutes,
  defineClientPlugin,
} from '@nocobase/app-client/plugins';
import { Link } from 'react-router';

import demoMode from '../../client/index.js';

const business = defineClientPlugin({
  packageName: '@nocobase/test-business',
  routes: defineAppRoutes([
    {
      name: 'projects',
      path: '/projects',
      auth: 'required',
      componentLoader: async () => ({ default: () => null }),
      children: [
        {
          name: 'record',
          path: ':id',
          componentLoader: async () => ({ default: () => null }),
        },
      ],
    },
    {
      name: 'login',
      path: '/login',
      auth: 'guest',
      componentLoader: async () => ({ default: () => null }),
    },
    {
      name: 'device',
      path: '/device',
      auth: 'optional',
      componentLoader: async () => ({ default: () => null }),
    },
  ]),
});

afterEach(() => vi.unstubAllGlobals());

it.each([
  '/?view=board#today',
  '/projects?view=board#today',
  '/projects/42?view=board#today',
])(
  'enters Super Admin before rendering the protected page at %s',
  async (route) => {
    const reload = vi.fn();
    vi.stubGlobal('location', { origin: 'http://localhost', reload });
    const pending = Promise.withResolvers<unknown>();
    const calls: string[] = [];
    await renderDemo(<p>Protected page</p>, {
      plugins: [demoMode(), business()],
      server: {
        publicBasePath: '/main',
        fetch: answerApi((call) => {
          calls.push(`${call.method} ${call.path}`);
          if (
            call.method === 'POST' &&
            call.path === 'demoMode/accounts/signInDefault'
          )
            return pending.promise;
          if (call.method === 'GET' && call.path === 'auth/get-session')
            return { user: { id: 'admin' } };
          return new Response(null, { status: 404 });
        }),
      },
      route,
    });
    try {
      await waitFor(() =>
        expect(calls).toContain('POST demoMode/accounts/signInDefault'),
      );
      expect(screen.queryByText('Protected page')).not.toBeInTheDocument();
    } finally {
      await act(async () => pending.resolve({ data: { signedIn: true } }));
    }
    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(screen.queryByText('Protected page')).not.toBeInTheDocument();
    expect(
      calls.filter((call) => call === 'POST demoMode/accounts/signInDefault'),
    ).toHaveLength(1);
    expect(
      calls.filter((call) => call === 'GET auth/get-session'),
    ).toHaveLength(1);
  },
);

it('retains an existing session without reloading or repeating entry during navigation', async () => {
  const reload = vi.fn();
  vi.stubGlobal('location', { origin: 'http://localhost', reload });
  const calls: string[] = [];
  await renderDemo(
    <>
      <p>Existing account</p>
      <Link to='/login'>Login</Link>
      <Link to='/projects/42'>Project</Link>
    </>,
    {
      plugins: [demoMode(), business()],
      route: '/projects',
      fetch: answerApi((call) => {
        calls.push(`${call.method} ${call.path}`);
        if (
          call.method === 'POST' &&
          call.path === 'demoMode/accounts/signInDefault'
        )
          return { data: { signedIn: false } };
        return new Response(null, { status: 404 });
      }),
    },
  );
  expect(await screen.findByText('Existing account')).toBeVisible();
  fireEvent.click(screen.getByRole('link', { name: 'Login' }));
  fireEvent.click(screen.getByRole('link', { name: 'Project' }));
  expect(await screen.findByText('Existing account')).toBeVisible();
  expect(reload).not.toHaveBeenCalled();
  expect(
    calls.filter((call) => call === 'POST demoMode/accounts/signInDefault'),
  ).toHaveLength(1);
  expect(calls).not.toContain('GET auth/get-session');
});

it.each([false, 'failure'])(
  'opens the normal destination when sign-in returns %s',
  async (result) => {
    await renderDemo(<p>Normal home page</p>, {
      plugins: [demoMode(), business()],
      route: '/projects/42?view=board#today',
      fetch: answerApi(() => {
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
  { route: '/projects', enabled: false },
  { route: '/device', enabled: true },
  { route: '/unknown', enabled: true },
])(
  'keeps normal entry at $route when Demo Mode is $enabled',
  async ({ route, enabled }) => {
    const calls: string[] = [];
    await renderDemo(<p>Application page</p>, {
      plugins: [demoMode(), business()],
      route,
      demoModeEnabled: enabled,
      fetch: answerApi((call) => {
        calls.push(call.path);
        return { data: { enabled } };
      }),
    });
    expect(await screen.findByText('Application page')).toBeVisible();
    expect(calls).not.toContain('demoMode/status');
    expect(calls).not.toContain('demoMode/accounts/signInDefault');
  },
);

it.each(['missing', 'failure'])(
  'does not reload when the browser session is %s after successful automatic sign-in',
  async (result) => {
    const reload = vi.fn();
    vi.stubGlobal('location', { origin: 'http://localhost', reload });
    const calls: string[] = [];
    await renderDemo(<p>Normal home page</p>, {
      plugins: [demoMode()],
      fetch: answerApi((call) => {
        calls.push(`${call.method} ${call.path}`);

        if (
          call.method === 'POST' &&
          call.path === 'demoMode/accounts/signInDefault'
        )
          return { data: { signedIn: true } };
        if (call.method === 'GET' && call.path === 'auth/get-session')
          return result === 'missing'
            ? Response.json(null)
            : new Response(null, { status: 500 });
        return new Response(null, { status: 404 });
      }),
    });
    expect(await screen.findByText('Normal home page')).toBeVisible();
    expect(reload).not.toHaveBeenCalled();
    expect(
      calls.filter((call) => call === 'POST demoMode/accounts/signInDefault'),
    ).toHaveLength(1);
    expect(
      calls.filter((call) => call === 'GET auth/get-session'),
    ).toHaveLength(1);
  },
);
