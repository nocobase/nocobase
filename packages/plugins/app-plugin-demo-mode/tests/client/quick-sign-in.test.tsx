import { renderDemo } from '../helpers/render-demo.js';
import { answerApi } from '@nocobase/app-testing/client';
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

/** A demo offering `accounts`; records each sign-in it is asked for. */
function demoApi(accounts: readonly object[], signIns: string[] = []) {
  return vi.fn(
    answerApi((call) => {
      if (call.method === 'GET' && call.path === 'demoMode/accounts')
        return { data: accounts };
      if (
        call.method === 'POST' &&
        call.path === 'demoMode/accounts/signInDefault'
      )
        return { data: { signedIn: false } };
      const signIn = /^demoMode\/accounts\/([^/]+)\/signIn$/u.exec(call.path);
      if (call.method === 'POST' && signIn) {
        signIns.push(decodeURIComponent(signIn[1]!));
        return { data: { ...ann, current: true } };
      }
      return new Response(null, { status: 404 });
    }),
  );
}

describe('demo sign-in page', () => {
  it('enters the account `?as=` names once', async () => {
    const signIns: string[] = [];
    await renderDemo(<DemoSignInPage />, {
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
    await renderDemo(<DemoSignInPage />, {
      plugins: [demoMode()],
      fetch: demoApi([{ ...bob, current: false }], signIns),
      locale: 'zh-CN',
      route: '/demo-sign-in?as=ann',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '无法进入这个账号。',
    );
    fireEvent.click(screen.getByRole('button', { name: /Bob/u }));
    await waitFor(() => expect(signIns).toEqual(['bob']));
  });
});
