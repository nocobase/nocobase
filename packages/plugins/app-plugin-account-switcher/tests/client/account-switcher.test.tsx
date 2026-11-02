import { createAppClientConfig } from '@nocobase/app-client';
import authentication from '@nocobase/app-plugin-authentication/client';
import {
  answerApi,
  renderWithApp,
  type RenderedApp,
} from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../client/components/ui/dropdown-menu.js';
import accountSwitcher from '../../client/index.js';
import { AccountSwitchMenu } from '../../client/menu.js';

const ann = { id: 'ann', name: 'Ann', email: 'ann@example.com' };
const bob = { id: 'bob', name: 'Bob', email: 'bob@example.com' };
const switched = {
  actor: ann,
  target: bob,
  expiresAt: '2099-01-01T00:00:00.000Z',
};

const reload = vi.fn();
beforeEach(() => {
  reload.mockReset();
  // Better Auth's client asks who is signed in through the global fetch.
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(Response.json({ session: { id: 's1' }, user: ann })),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());

function Header(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Account</DropdownMenuTrigger>
      <DropdownMenuContent>
        <AccountSwitchMenu />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface Call {
  readonly method: string;
  readonly path: string;
}

async function render({
  mode = 'full',
  state,
  extra,
}: {
  mode?: 'off' | 'full';
  state: { canSwitch: boolean; switched: typeof switched | null };
  extra?: (call: Call) => unknown;
}): Promise<{ calls: Call[]; rendered: RenderedApp }> {
  const calls: Call[] = [];
  const rendered = await renderWithApp(<Header />, {
    plugins: [authentication(), accountSwitcher()],
    locale: 'en-US',
    strictTranslations: false,
    fetch: answerApi((call) => {
      calls.push({ method: call.method, path: call.path });
      if (call.method === 'GET' && call.path === 'accountSwitcher/state')
        return { data: state };
      const answer = extra?.(call);
      return answer === undefined
        ? new Response(null, { status: 404 })
        : answer;
    }),
    services(app) {
      // The shared harness does not yet accept server-published configuration.
      Object.defineProperty(app.config, 'public', {
        value: createAppClientConfig({
          rawConfig: {},
          rawPublicConfig: { accountSwitcher: { mode } },
        }).public,
      });
    },
  });
  vi.stubGlobal('location', {
    href: 'http://localhost/',
    origin: 'http://localhost',
    pathname: '/',
    search: '',
    hash: '',
    reload,
  });
  return { calls, rendered };
}

const STATE_CALL = { method: 'GET', path: 'accountSwitcher/state' };

it('offers nothing to someone who cannot switch', async () => {
  const { calls } = await render({
    state: { canSwitch: false, switched: null },
  });
  await waitFor(() => expect(calls).toContainEqual(STATE_CALL));

  fireEvent.click(screen.getByText('Account'));
  await screen.findByRole('menu');
  expect(screen.queryByText('Switch account')).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
});

it('asks the server nothing while switching is off', async () => {
  const { calls } = await render({
    mode: 'off',
    state: { canSwitch: true, switched: null },
  });

  fireEvent.click(screen.getByText('Account'));
  await screen.findByRole('menu');
  expect(screen.queryByText('Switch account')).toBeNull();
  expect(calls).not.toContainEqual(STATE_CALL);
});

it('lists accounts and switches to the chosen one', async () => {
  const { calls } = await render({
    state: { canSwitch: true, switched: null },
    extra: (call) => {
      if (call.path === 'accountSwitcher/accounts')
        return {
          data: [
            { ...ann, roleTitles: ['Admin'], current: true, own: true },
            { ...bob, roleTitles: [], current: false, own: false },
          ],
          meta: { page: 1, pageSize: 20, total: 2 },
        };
      if (call.method === 'POST' && call.path === 'accountSwitcher/switches')
        return Response.json(
          { data: { canSwitch: true, switched } },
          { status: 201 },
        );
      return undefined;
    },
  });

  fireEvent.click(screen.getByText('Account'));
  fireEvent.click(await screen.findByText('Switch account'));
  const bobItem = await screen.findByRole('menuitemradio', { name: /Bob/u });
  expect(within(bobItem).getByText('bob@example.com')).toBeTruthy();
  expect(
    screen
      .getByRole('menuitemradio', { name: /Ann/u })
      .getAttribute('aria-checked'),
  ).toBe('true');

  fireEvent.click(bobItem);

  await waitFor(() => expect(reload).toHaveBeenCalledOnce());
  expect(calls).toContainEqual({
    method: 'POST',
    path: 'accountSwitcher/switches',
  });
});

it('shows who is acted as, whatever the application renders, and returns from the notice', async () => {
  const { calls } = await render({
    state: { canSwitch: true, switched },
    extra: (call) =>
      call.method === 'DELETE' &&
      call.path === 'accountSwitcher/switches/current'
        ? new Response(null, { status: 204 })
        : undefined,
  });

  const notice = await screen.findByRole('status');
  expect(within(notice).getByText('Acting as Bob')).toBeTruthy();
  fireEvent.click(
    within(notice).getByRole('button', { name: 'Return to Ann' }),
  );

  await waitFor(() => expect(reload).toHaveBeenCalledOnce());
  expect(calls).toContainEqual({
    method: 'DELETE',
    path: 'accountSwitcher/switches/current',
  });
});

it('reports a failed return and stays usable', async () => {
  const { rendered } = await render({
    state: { canSwitch: true, switched },
    extra: (call) =>
      call.method === 'DELETE'
        ? new Response(null, { status: 500 })
        : undefined,
  });

  fireEvent.click(await screen.findByRole('button', { name: 'Return to Ann' }));

  await waitFor(() =>
    expect(rendered.toasts().map((toast) => toast.title)).toContain(
      'Unable to return to your account. Please try again.',
    ),
  );
  expect(reload).not.toHaveBeenCalled();
  expect(
    screen
      .getByRole('button', { name: 'Return to Ann' })
      .getAttribute('disabled'),
  ).toBeNull();
});
