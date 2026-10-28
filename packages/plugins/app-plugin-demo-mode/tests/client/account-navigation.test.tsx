import { renderDemo } from '../helpers/render-demo.js';
import { answerApi } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import demoMode from '../../client/index.js';
import { useDemoAccounts } from '../../client/accounts.js';

afterEach(() => vi.unstubAllGlobals());

function AccountAction({ redirect }: { redirect: string }) {
  const { signIn } = useDemoAccounts();
  return <button onClick={() => void signIn('bob', redirect)}>Switch</button>;
}

it.each([
  ['/projects?state=open#today', 'reload'],
  ['/projects?state=open#tomorrow', 'reload'],
  ['/projects?state=closed#today', 'assign'],
  ['/tasks', 'assign'],
] as const)(
  'loads fresh account state when switching to %s',
  async (redirect, navigation) => {
    const signIns: string[] = [];
    await renderDemo(<AccountAction redirect={redirect} />, {
      plugins: [demoMode()],
      route: '/projects?state=open#today',
      fetch: answerApi((call) => {
        if (call.method === 'GET' && call.path === 'demoMode/accounts')
          return { data: [] };
        if (
          call.method === 'POST' &&
          call.path === 'demoMode/accounts/bob/signIn'
        ) {
          signIns.push('bob');
          return { data: {} };
        }
        return new Response(null, { status: 404 });
      }),
    });
    const location = {
      href: 'https://demo.example/projects?state=open#today',
      pathname: '/projects',
      search: '?state=open',
      reload: vi.fn(),
      assign: vi.fn(),
    };
    const history = { state: { key: 'current-entry' }, replaceState: vi.fn() };
    // jsdom does not navigate between documents. Replace only the browser navigation boundary.
    vi.stubGlobal(
      'window',
      new Proxy(window, {
        get(target, property) {
          if (property === 'location') return location;
          if (property === 'history') return history;
          return Reflect.get(target, property, target);
        },
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Switch' }));
    await waitFor(() => expect(location[navigation]).toHaveBeenCalledOnce());
    expect(signIns).toEqual(['bob']);
    if (navigation === 'reload') {
      expect(history.replaceState).toHaveBeenCalledWith(
        history.state,
        '',
        redirect,
      );
      expect(location.assign).not.toHaveBeenCalled();
    } else {
      expect(location.assign).toHaveBeenCalledWith(redirect);
      expect(location.reload).not.toHaveBeenCalled();
    }
  },
);
