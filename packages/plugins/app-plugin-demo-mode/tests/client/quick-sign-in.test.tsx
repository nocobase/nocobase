import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import demoMode from '../../client/index.js';
import DemoSignInPage from '../../client/pages/demo-sign-in.js';
import { safeRedirect } from '../../client/accounts.js';

it.each(['/', '/main/'])(
  'keeps normalized redirects inside the application at %s',
  (root) => {
    for (const path of [
      'https://other.example',
      '//other.example',
      '/\\other.example',
      '/\t/other.example',
      '/\n/other.example',
      '/\r/other.example',
      '/..//other.example',
      '/foo/../..//other.example',
    ]) {
      const result = safeRedirect(path, root);
      expect(result).toBe(root);
      expect(new URL(result, 'https://demo.example').origin).toBe(
        'https://demo.example',
      );
    }
    expect(safeRedirect('/tasks?state=pending#today', root)).toBe(
      `${root}tasks?state=pending#today`,
    );
  },
);

it('refuses normalized and encoded paths that escape the application base', () => {
  for (const path of [
    '/../admin',
    '/%2e%2e/admin',
    '/projects/../../admin',
    '/../../main-other',
  ])
    expect(safeRedirect(path, '/main/')).toBe('/main/');
  expect(safeRedirect('/projects/../tasks', '/main/')).toBe('/main/tasks');
});

const ann = { username: 'ann', name: 'Ann', role: '管理员' };
const bob = { username: 'bob', name: 'Bob', role: '审核人' };

/** The read-only demo `demoApiAnswer` answers as: Ann, signed in, and Bob. */
const demoApiAnswer = (call: { method: string; path: string }) => {
  if (call.method === 'GET' && call.path === 'demoMode/status')
    return { data: { mode: 'read-only' } };
  if (call.method === 'GET' && call.path === 'demoMode/accounts')
    return {
      data: [
        { ...ann, current: true },
        { ...bob, current: false },
      ],
    };
  return new Response(null, { status: 404 });
};

/** A read-only demo offering `accounts`; records each sign-in it is asked for. */
function demoApi(accounts: readonly object[], signIns: string[] = []) {
  return vi.fn(
    answerApi((call) => {
      if (call.method === 'GET' && call.path === 'demoMode/status')
        return { data: { mode: 'read-only' } };
      if (call.method === 'GET' && call.path === 'demoMode/accounts')
        return { data: accounts };
      const signIn = /^demoMode\/accounts\/([^/]+)\/signIn$/u.exec(call.path);
      if (call.method === 'POST' && signIn) {
        signIns.push(decodeURIComponent(signIn[1]!));
        return { data: { ...ann, current: true } };
      }
      return new Response(null, { status: 404 });
    }),
  );
}

describe('demo account switcher', () => {
  it('shows the current demo account and switches to another', async () => {
    const signIns: string[] = [];
    await renderWithApp(<p>page</p>, {
      plugins: [demoMode()],
      fetch: demoApi(
        [
          { ...ann, current: true },
          { ...bob, current: false },
        ],
        signIns,
      ),
      locale: 'zh-CN',
    });

    fireEvent.click(await screen.findByText('当前：Ann · 切换'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Bob/u }));
    await waitFor(() => expect(signIns).toEqual(['bob']));
    expect(screen.getByRole('menuitem', { name: /Ann/u })).toBeDisabled();
  });

  it('offers nothing when the demo has no accounts to enter', async () => {
    const fetch = demoApi([]);
    await renderWithApp(<p>page</p>, {
      plugins: [demoMode()],
      fetch,
      locale: 'zh-CN',
    });

    await waitFor(() =>
      expect(
        fetch.mock.calls.some(([request]) =>
          String((request as Request).url ?? request).includes(
            'demoMode/accounts',
          ),
        ),
      ).toBe(true),
    );
    expect(screen.queryByText('进入')).not.toBeInTheDocument();
  });
});

describe('demo sign-in page', () => {
  it('enters the account `?as=` names once', async () => {
    const signIns: string[] = [];
    await renderWithApp(<DemoSignInPage />, {
      plugins: [demoMode()],
      fetch: demoApi([{ ...ann, current: false }], signIns),
      locale: 'zh-CN',
      route: '/demo-sign-in?as=ann&redirect=/opportunities',
    });

    await waitFor(() => expect(signIns).toEqual(['ann']));
    expect(screen.getByText('正在进入…')).toBeInTheDocument();
  });

  it('lists the accounts when the named one cannot be entered', async () => {
    const signIns: string[] = [];
    await renderWithApp(<DemoSignInPage />, {
      plugins: [demoMode()],
      fetch: demoApi([{ ...bob, current: false }], signIns),
      locale: 'zh-CN',
      route: '/demo-sign-in?as=ann',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '无法进入这个演示账号。',
    );
    fireEvent.click(screen.getByRole('button', { name: /Bob/u }));
    await waitFor(() => expect(signIns).toEqual(['bob']));
  });
});

describe('demo accounts in the account menu', () => {
  it('lists the accounts in a submenu and switches to the one picked', async () => {
    const { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } =
      await import('../../client/components/ui/dropdown-menu.js');
    const { DemoAccountMenu } = await import('../../client/account-menu.js');
    const signIns: string[] = [];
    await renderWithApp(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DemoAccountMenu />
        </DropdownMenuContent>
      </DropdownMenu>,
      {
        plugins: [demoMode()],
        fetch: demoApi(
          [
            { ...ann, current: true },
            { ...bob, current: false },
          ],
          signIns,
        ),
        locale: 'zh-CN',
      },
    );
    fireEvent.click(await screen.findByText('演示账号：Ann'));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: /Bob/u }));
    await waitFor(() => expect(signIns).toEqual(['bob']));
  });

  it('keeps the corner button for visitors who have not signed in when the menu carries the switch', async () => {
    const session = (user: object | null) =>
      vi.fn(
        answerApi((call) => {
          if (call.path === 'auth/get-session') return user ? { user } : null;
          return demoApiAnswer(call);
        }),
      );
    const fetchSignedIn = session({ id: 'u1' });
    const signedIn = await renderWithApp(<p>page</p>, {
      plugins: [demoMode({ accountSwitcher: 'menu' })],
      fetch: fetchSignedIn,
      locale: 'zh-CN',
    });
    const asked = (path: string) =>
      fetchSignedIn.mock.calls.some(([request]) =>
        String((request as Request).url ?? request).includes(path),
      );
    await waitFor(() =>
      expect(asked('auth/get-session') && asked('demoMode/accounts')).toBe(
        true,
      ),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText('当前：Ann · 切换')).not.toBeInTheDocument();
    signedIn.unmount();
    await renderWithApp(<p>page</p>, {
      plugins: [demoMode({ accountSwitcher: 'menu' })],
      fetch: session(null),
      locale: 'zh-CN',
    });
    expect(await screen.findByText('当前：Ann · 切换')).toBeInTheDocument();
  });
});

it('can hide the floating entry without removing the page content', async () => {
  const paths: string[] = [];
  await renderWithApp(<p>Login form</p>, {
    plugins: [
      demoMode({ accountSwitcher: 'menu', showFloatingAccountSwitcher: false }),
    ],
    fetch: answerApi((call) => {
      paths.push(call.path);
      return demoApiAnswer(call);
    }),
    locale: 'zh-CN',
  });
  await waitFor(() => expect(paths).toContain('demoMode/status'));
  expect(screen.getByText('Login form')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(paths).not.toContain('demoMode/accounts');
});
