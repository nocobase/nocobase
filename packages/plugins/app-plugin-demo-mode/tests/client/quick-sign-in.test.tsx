import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import demoMode from '../../client/index.js';
import DemoSignInPage from '../../client/pages/demo-sign-in.js';

const ann = { username: 'ann', name: 'Ann', role: '管理员' };
const bob = { username: 'bob', name: 'Bob', role: '审核人' };

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
